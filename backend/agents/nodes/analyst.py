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


class RetryVote(BaseModel):
    should_retry: bool = Field(description="True if we should try rewriting and querying the vector database again. False if we should skip directly to web search.")
    reason: str = Field(description="Brief reason for the vote")


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


def _build_retry_vote_chain():
    """Votes whether to rewrite the query or skip directly to web search."""
    llm = get_llm(tier=TIER_LIGHT, temperature=0)

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a research director. The user query produced mostly irrelevant results from our internal vector database.
Based on the query and domain, vote whether rewriting the query and trying the internal database again is likely to succeed, OR if we should immediately skip to external web search because the topic is likely not in the database.
Vote True to retry the internal database. Vote False to skip to web search."""),
        ("user", "Query: {query}\nDomain: {domain}")
    ])

    return prompt | llm.with_structured_output(RetryVote)


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


def _build_extractor_chain():
    """Extracts high-value, specific details from raw source content to prevent context overflow."""
    llm = get_llm(tier=TIER_LIGHT, temperature=0.1)
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert research extraction engine. Your job is to extract the most critical facts, frameworks, metrics, and nuanced insights from the provided source document that are highly relevant to the user's overall query.

Rules:
- MUST retain the Source URL at the very top of your output.
- Preserve exact numbers, dates, and direct quotes where valuable.
- Extract complete names of frameworks or methodologies, along with their definitions.
- Write in detailed bullet points or short paragraphs.
- Do NOT write a high-level, generic summary. We need granular depth.
- Be overwhelmingly exhaustive. Extract every single relevant data point, controversy, timeline, or metric. Do not truncate useful details.
- If the document contains absolutely nothing relevant to the query, output ONLY 'NO_RELEVANT_INFO'."""),
        ("user", "Query: {query}\n\nSource Content:\n{document}")
    ])
    return prompt | llm



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
- Extensively incorporate rich details, frameworks, methodologies, and actionable insights found within the scraped content.
- Do NOT merely summarize heavily; retain the depth, nuance, and specific examples provided in the source material (e.g., specific metrics, named frameworks, quotes, or deep-dive details).
- Produce a massive, exhaustive dossier. Do not worry about length. Over-index on providing every single piece of evidence, statistic, and quote found in the scraped deep-dives.
- Be extremely thorough — the Writer node depends entirely on your analysis to write the final rich report. Do not leave out valuable information."""),
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
        # Set to 1 to prioritize quality/stability over quickness and avoid 429s on free/S0 tiers.
        grade_sem = asyncio.Semaphore(1)

        async def _grade_chunk(chunk, q):
            async with grade_sem:
                # Introduce a generic delay to prevent rapid RPM/TPM bursting on S0 tiers
                await asyncio.sleep(1.5)
                for attempt in range(4):
                    try:
                        grade = await grading_chain.ainvoke({
                            "query": q,
                            "chunk": chunk["content"][:2000],
                        })
                        p, c = extract_tokens(grade)
                        get_token_tracker().add(p, c)
                        return grade
                    except Exception as e:
                        if attempt == 3:
                            print(f"  [CRAG] Grading failed permanently for chunk: {e}")
                            return ChunkGrade(relevant=True, reason="Grading failed, assumed relevant")
                        delay = 4 * (attempt + 1)  # 4s, 8s, 12s backoff
                        print(f"  [CRAG] Grading rate limit/error (attempt {attempt+1}): {e}. Retrying in {delay}s...")
                        await asyncio.sleep(delay)

        grades = await asyncio.gather(*[_grade_chunk(chunk, query) for chunk in retrieved])

        relevant_chunks = [
            chunk for chunk, grade in zip(retrieved, grades) if grade.relevant
        ]
        irrelevant_count = len(retrieved) - len(relevant_chunks)
        print(f"  [CRAG] Graded: {len(relevant_chunks)} relevant, {irrelevant_count} irrelevant")

        # ---- Step 3: Rewrite query if >50% irrelevant ----
        has_web_data = len(state.get("search_results", [])) > 0 or len(state.get("scraped_content", [])) > 0
        
        if irrelevant_count > len(retrieved) / 2:
            if has_web_data:
                print("  [CRAG] Step 3: >50% irrelevant, but sufficient web search data already exists. Skipping vector retry to save costs/time.")
            else:
                print("  [CRAG] Step 3: >50% irrelevant - checking if vector retry is viable...")
                vote_chain = _build_retry_vote_chain()
                is_viable = True
                try:
                    vote = vote_chain.invoke({"query": query, "domain": domain})
                    p, c = extract_tokens(vote)
                    get_token_tracker().add(p, c)
                    is_viable = vote.should_retry
                    print(f"  [CRAG] Vector retry vote: {vote.should_retry} ({vote.reason})")
                except Exception as e:
                    print(f"  [CRAG] Vote failed, defaulting to retry: {e}")

                if is_viable:
                    print("  [CRAG] Rewriting query...")
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
                else:
                    print("  [CRAG] Skipping vector retry due to negative vote.")

    # ---- Step 4: Check if more research is needed ----
    research_iterations = state.get("research_iterations", 1)
    extra_search_results: list[dict] = []
    extra_scraped: list[str] = []
    extra_sources: list[dict] = []
    
    has_web_data = len(state.get("search_results", [])) > 0 or len(state.get("scraped_content", [])) > 0
    
    if len(relevant_chunks) < 2 and not has_web_data:
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
        try:
            web_results = await tavily_search.ainvoke({"query": query, "num_results": 5})
            if isinstance(web_results, dict) and "results" in web_results:
                extra_search_results = web_results["results"]
                print(f"  [CRAG] Fetched {len(extra_search_results)} web fallback results")
                # Also extract raw_content into scraped_content and populate sources
                for r in extra_search_results:
                    url = r.get("url", "")
                    title = r.get("title", "Untitled")
                    raw = r.get("raw_content") or r.get("content", "")
                    if url:
                        extra_sources.append({"title": title, "url": url})
                    if raw and len(raw.strip()) > 100:
                        extra_scraped.append(f"Source URL: {url}\n\nContent:\n{str(raw)}")
                print(f"  [CRAG] Extracted {len(extra_scraped)} scraped pages, {len(extra_sources)} sources from web fallback")
        except Exception as e:
            print(f"  [CRAG] Web fallback failed: {e}")

    # ---- Step 4.5: Context Compression / Map-Reduce Extraction ----
    scraped_content_list = state.get("scraped_content", []) + extra_scraped
    extracted_scrapes = []

    if scraped_content_list:
        print(f"  [CRAG] Step 4.5: Extracting high-value signal from {len(scraped_content_list)} raw sources...")
        extractor_chain = _build_extractor_chain()
        # Set to 1 to prioritize quality/stability over quickness and avoid 429s.
        ext_sem = asyncio.Semaphore(1)
        
        async def _extract_doc(doc_text):
            async with ext_sem:
                await asyncio.sleep(1.5)
                for attempt in range(4):
                    try:
                        # chunk to max ~35k chars to prevent light model overflow
                        res = await extractor_chain.ainvoke({
                            "query": query,
                            "document": doc_text[:35000]
                        })
                        p, c = extract_tokens(res)
                        get_token_tracker().add(p, c)
                        return res.content
                    except Exception as e:
                        if attempt == 3:
                            print(f"  [CRAG] Extractor failed permanently: {e}")
                            # fallback to basic truncation
                            return doc_text[:3000]
                        delay = 4 * (attempt + 1)
                        print(f"  [CRAG] Extractor rate limit/error (attempt {attempt+1}): {e}. Retrying in {delay}s...")
                        await asyncio.sleep(delay)
                    
        extracted_results = await asyncio.gather(*[_extract_doc(doc) for doc in scraped_content_list])
        
        for extracted in extracted_results:
            if "NO_RELEVANT_INFO" not in extracted:
                extracted_scrapes.append(extracted)

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

    scrape_context = "\n---\n".join(extracted_scrapes)

    synthesis_chain = _build_synthesis_chain()
    try:
        analysis_msg = synthesis_chain.invoke({
            "query": query,
            "rag_context": rag_context[:30000],
            "search_context": search_context[:30000],
            "scrape_context": scrape_context[:100000],
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
        # Merge fallback scraped_content and sources 
        if extra_scraped:
            result["scraped_content"] = state.get("scraped_content", []) + extra_scraped
        if extra_sources:
            result["sources"] = state.get("sources", []) + extra_sources
        return result
    except Exception as e:
        return {"error": f"Analyst synthesis failed: {str(e)}"}
