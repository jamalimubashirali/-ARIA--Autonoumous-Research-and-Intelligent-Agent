"""
Corrective RAG Analyst Node.

Implements the CRAG (Corrective Retrieval-Augmented Generation) pattern:
  1. Retrieve top-k chunks from pgvector
  2. Grade each chunk for relevance (LLM binary grading)
  3. If >50% irrelevant → rewrite the query → re-retrieve
  4. If still insufficient → fallback to supplementary web search
  5. Synthesize ONLY graded-relevant chunks into analysis
"""
import asyncio
from typing import List

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain.output_parsers import OutputFixingParser
from pydantic import BaseModel, Field

from agents.state import ResearchState
from models import get_llm, TIER_HEAVY, TIER_LIGHT, get_token_tracker, extract_tokens
from tools.vector import vector_search
from tools.search import tavily_search


# ---------------------------------------------------------------------------
# Pydantic schemas for structured output
# ---------------------------------------------------------------------------
class ChunkGrade(BaseModel):
    relevant: bool = Field(description="True if the chunk is relevant to the query")
    reason: str = Field(description="Brief reason for the grade")


class QueryRewrite(BaseModel):
    rewritten_query: str = Field(description="Improved query for better retrieval")


class MissingQueries(BaseModel):
    queries: List[str] = Field(description="2-3 highly specific search queries to find the missing information")


# ---------------------------------------------------------------------------
# Sub-chains
# ---------------------------------------------------------------------------
def _build_grading_chain():
    """Binary relevance grader — grades each retrieved chunk."""
    llm = get_llm(tier=TIER_LIGHT, temperature=0)

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a relevance grader. Given a user query and a retrieved document chunk, determine if the chunk contains information relevant to answering the query.

Rules:
- A chunk is RELEVANT if it contains facts, data, or context that helps answer the query.
- A chunk is IRRELEVANT if it is off-topic, too vague, or about a different subject.
- Be strict — only mark as relevant if it genuinely contributes useful information."""),
        ("user", "Query: {query}\n\nChunk:\n{chunk}")
    ])

    return prompt | llm.with_structured_output(ChunkGrade)


def _build_rewrite_chain():
    """Query rewriter — produces a better query when retrieval quality is low."""
    llm = get_llm(tier=TIER_LIGHT, temperature=0.3)

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a query optimizer. The original query retrieved mostly irrelevant results from a knowledge base.

Rewrite the query to be more specific and likely to retrieve relevant information.
- Add domain-specific terminology
- Be more precise about what information is needed
- Keep the core intent unchanged"""),
        ("user", "Original query: {query}\nDomain: {domain}\nIrrelevant chunks received: {irrelevant_count}/{total_count}")
    ])

    return prompt | llm.with_structured_output(QueryRewrite)


def _build_missing_queries_chain():
    """Generates specific sub-tasks when previous research failed to find relevant data."""
    llm = get_llm(tier=TIER_LIGHT, temperature=0.3)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a research director. The current research attempts failed to find sufficient relevant information for the user's query.
Generate 2-3 highly specific, targeted search queries to instruct the Web Researcher agent to find the missing data.
Focus on extracting the most critical missing concepts."""),
        ("user", "User Query: {query}\nDomain: {domain}")
    ])
    
    base_chain = prompt | llm.with_structured_output(MissingQueries)
    return base_chain



def _build_synthesis_chain():
    """Synthesize relevant chunks + search data into analysis."""
    llm = get_llm(tier=TIER_HEAVY, temperature=0)

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert analyst. Synthesize the provided research data into a coherent, comprehensive analysis block.

You have TWO data sources:
1. **Historical Context** — Previously generated report chunks from our knowledge base (high trust)
2. **Live Research** — Fresh search results and scraped content (verify against historical if possible)

Rules:
- Group related information under clear sub-headings.
- Retain ALL key metrics, financial figures, and important claims.
- Flag any contradictions between sources.
- Note the recency and reliability of each data point.
- Prioritize historical context where it is recent and relevant.
- Be thorough — the Writer node depends entirely on your analysis."""),
        ("user", """Query: {query}

Historical Context (RAG):
{rag_context}

Live Search Results:
{search_context}

Scraped Deep-dives:
{scrape_context}""")
    ])

    return prompt | llm


# ---------------------------------------------------------------------------
# Main CRAG node
# ---------------------------------------------------------------------------
async def analyst_node(state: ResearchState) -> dict:
    """Corrective RAG Analyst — retrieve, grade, rewrite, synthesize.

    Uses LIGHT model for grading/rewriting, HEAVY model for synthesis.
    """
    print(f"--- ANALYST NODE (CRAG): Domain {state['domain']} ---")

    if state.get("error"):
        print("Error detected in state, analyst attempting partial analysis...")

    query = state["query"]
    domain = state["domain"]
    rag_query_rewrites = 0
    rag_web_fallback = False
    relevant_chunks = []

    # ---- Step 1: Retrieve from pgvector ----
    print("  [CRAG] Step 1: Retrieving from vector store...")
    retrieved = await vector_search(query, domain, limit=8)
    print(f"  [CRAG] Retrieved {len(retrieved)} chunks")

    # ---- Step 2: Grade each chunk concurrently (no sequential sleeps) ----
    if retrieved:
        print("  [CRAG] Step 2: Grading retrieved chunks concurrently...")
        grading_chain = _build_grading_chain()

        # Semaphore limits concurrent LLM calls to avoid rate limit bursts
        grade_sem = asyncio.Semaphore(3)

        async def _grade_chunk(chunk, q):
            async with grade_sem:
                try:
                    grade = await grading_chain.ainvoke({
                        "query": q,
                        "chunk": chunk["content"][:2000],
                    })
                    p, c = extract_tokens(grade)
                    get_token_tracker().add(p, c)
                    return grade
                except Exception as e:
                    print(f"  [CRAG] Grading failed for chunk: {e}")
                    return ChunkGrade(relevant=True, reason="Grading failed, assumed relevant")

        grades = await asyncio.gather(*[_grade_chunk(chunk, query) for chunk in retrieved])

        relevant_chunks = [
            chunk for chunk, grade in zip(retrieved, grades) if grade.relevant
        ]
        irrelevant_count = len(retrieved) - len(relevant_chunks)
        print(f"  [CRAG] Graded: {len(relevant_chunks)} relevant, {irrelevant_count} irrelevant")

        # ---- Step 3: Rewrite query if >50% irrelevant ----
        if irrelevant_count > len(retrieved) / 2:
            print("  [CRAG] Step 3: >50% irrelevant - rewriting query...")
            rewrite_chain = _build_rewrite_chain()

            try:
                rewrite = rewrite_chain.invoke({
                    "query": query,
                    "domain": domain,
                    "irrelevant_count": irrelevant_count,
                    "total_count": len(retrieved),
                })
                p, c = extract_tokens(rewrite)
                get_token_tracker().add(p, c)
                rewritten_query = rewrite.rewritten_query
                rag_query_rewrites = 1
                print(f"  [CRAG] Rewritten query: '{rewritten_query}'")

                # Re-retrieve with improved query
                re_retrieved = await vector_search(rewritten_query, domain, limit=8)
                print(f"  [CRAG] Re-retrieved {len(re_retrieved)} chunks")

                # Filter out duplicates before re-grading
                seen_ids = {rc["id"] for rc in relevant_chunks}
                new_chunks = [c for c in re_retrieved if c["id"] not in seen_ids]

                if new_chunks:
                    new_grades = await asyncio.gather(*[_grade_chunk(chunk, rewritten_query) for chunk in new_chunks])
                    relevant_chunks += [c for c, g in zip(new_chunks, new_grades) if g.relevant]

                print(f"  [CRAG] After rewrite: {len(relevant_chunks)} total relevant chunks")

            except Exception as e:
                print(f"  [CRAG] Query rewrite failed: {e}")

    # ---- Step 4: Check if more research is needed ----
    research_iterations = state.get("research_iterations", 1)
    if len(relevant_chunks) < 2:
        # If we haven't hit the max iterations, trigger backward routing to Researcher
        if research_iterations < 2:
            print(f"  [CRAG] Step 4: Insufficient results. Triggering backward loop to Researcher (iteration {research_iterations}/2)...")
            missing_chain = _build_missing_queries_chain()
            try:
                res = missing_chain.invoke({"query": query, "domain": domain})
                p, c = extract_tokens(res)
                get_token_tracker().add(p, c)
                new_queries = res.queries
                
                print(f"  [CRAG] Generated {len(new_queries)} new specific sub-tasks for Researcher loop.")
                
                sub_tasks = state.get("sub_tasks", [])
                sub_tasks.extend(new_queries)
                
                return {
                    "sub_tasks": sub_tasks,
                    "missing_information": new_queries,
                    "routing_target": "researcher",
                    "research_iterations": research_iterations + 1
                }
            except Exception as e:
                # LLM output was malformed JSON, and simple retry failed. Use an LLM-based output fixing parser as fallback.
                print(f"  [CRAG] Standard parsed failed, attempting LLM Output Fixer for MissingQueries: {e}")
                from langchain.output_parsers import PydanticOutputParser
                from langchain.output_parsers import OutputFixingParser
                parser = PydanticOutputParser(pydantic_object=MissingQueries)
                fixer = OutputFixingParser.from_llm(parser=parser, llm=get_llm(tier=TIER_LIGHT, temperature=0))
                
                # We need the raw text to fix it, so we request without structured output
                raw_llm = get_llm(tier=TIER_LIGHT, temperature=0.3)
                raw_prompt = ChatPromptTemplate.from_messages([
                    ("system", "You are a research director. Generate 2-3 highly specific search queries. Output ONLY valid JSON matching this schema: " + parser.get_format_instructions()),
                    ("user", "User Query: {query}\nDomain: {domain}")
                ])
                try:
                    raw_res = (raw_prompt | raw_llm).invoke({"query": query, "domain": domain})
                    fixed_res = fixer.parse(raw_res.content)
                    new_queries = fixed_res.queries
                    
                    print(f"  [CRAG] Successfully fixed JSON, generated {len(new_queries)} sub-tasks.")
                    sub_tasks = state.get("sub_tasks", [])
                    sub_tasks.extend(new_queries)
                    return {
                        "sub_tasks": sub_tasks,
                        "missing_information": new_queries,
                        "routing_target": "researcher",
                        "research_iterations": research_iterations + 1
                    }
                except Exception as fix_e:
                    print(f"  [CRAG] OutputFixingParser also failed, falling back to inline search: {fix_e}")
                    # Fallthrough to web_search
        
        # Max iterations reached or query generation failed, rely on inline web fallback
        print("  [CRAG] Step 4: Insufficient results (max iterations reached). Triggering inline web search fallback...")
        rag_web_fallback = True
        extra_search_results: list[dict] = []
        try:
            web_results = await tavily_search.ainvoke({"query": query, "num_results": 5})
            if isinstance(web_results, dict) and "results" in web_results:
                # Return as extra results to be merged by LangGraph state, NOT direct mutation
                extra_search_results = web_results["results"]
                print(f"  [CRAG] Fetched {len(extra_search_results)} web fallback results")
        except Exception as e:
            print(f"  [CRAG] Web fallback failed: {e}")

    # ---- Step 5: Synthesize ----
    print("  [CRAG] Step 5: Synthesizing analysis...")

    # Format RAG context
    rag_context = "\n\n---\n\n".join([
        f"[Similarity: {c.get('similarity', 'N/A'):.3f}] {c['content']}"
        for c in relevant_chunks
    ]) if relevant_chunks else "No relevant historical context found."

    # Format search context
    search_context = "\n".join([
        f"Source ({res.get('url')}): {res.get('content', '')[:2000]}"
        for res in state.get("search_results", [])
    ])

    scrape_context = "\n---\n".join(state.get("scraped_content", []))

    synthesis_chain = _build_synthesis_chain()
    try:
        analysis_msg = synthesis_chain.invoke({
            "query": query,
            "rag_context": rag_context[:15000],
            "search_context": search_context[:15000],
            "scrape_context": scrape_context[:30000],
        })
        p, c = extract_tokens(analysis_msg)
        get_token_tracker().add(p, c)
        analysis = analysis_msg.content

        # Update metadata
        metadata = state.get("metadata", {})
        metadata["rag_chunks_retrieved"] = len(retrieved) if retrieved else 0
        metadata["rag_chunks_relevant"] = len(relevant_chunks)
        metadata["rag_query_rewrites"] = rag_query_rewrites
        metadata["rag_web_fallback"] = rag_web_fallback

        result = {
            "analysis": analysis,
            "rag_context": rag_context,
            "rag_query_rewrites": rag_query_rewrites,
            "rag_web_fallback": rag_web_fallback,
            "metadata": metadata,
            "routing_target": "writer"
        }
        # Merge fallback web results properly via state return (no direct mutation)
        if extra_search_results:
            result["search_results"] = state.get("search_results", []) + extra_search_results
        return result
    except Exception as e:
        return {"error": f"Analyst synthesis failed: {str(e)}"}
