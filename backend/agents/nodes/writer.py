"""
Writer Agent Node.

Generates the final structured intelligence report using domain-specific templates.
On the first pass, writes from analysis data.
On subsequent passes (after Reviewer rejection), incorporates feedback to improve.
"""
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from agents.state import ResearchState
from models import get_llm, TIER_HEAVY, get_token_tracker, extract_tokens


def _format_sources_for_writer(state: ResearchState) -> str:
    """Extract a numbered source list from search results for the writer to cite."""
    sources = state.get("sources", [])
    if not sources:
        # Fallback: extract from search_results
        sources = [
            {"title": r.get("title", "Untitled"), "url": r.get("url", "")}
            for r in state.get("search_results", [])
            if r.get("url")
        ]

    if not sources:
        return "No sources available."

    # Deduplicate by URL
    seen = set()
    unique = []
    for s in sources:
        url = s.get("url", "")
        if url and url not in seen:
            seen.add(url)
            unique.append(s)

    lines = []
    for i, s in enumerate(unique[:20], 1):
        title = s.get("title", "Untitled")
        url = s.get("url", "")
        lines.append(f"[{i}] {title} — {url}")

    return "\n".join(lines)


def writer_node(state: ResearchState) -> dict:
    """Generate the final structured intelligence report.

    Uses the HEAVY model (Llama-3.3-70B) with domain-specific templates.
    On retry (after Reviewer rejection), incorporates feedback.
    """
    iteration = state.get("writer_iterations", 0) + 1
    print(f"--- WRITER NODE: Domain {state['domain']}, Iteration {iteration} ---")

    if state.get("error"):
        print("Error detected in state, writer attempting partial report...")

    llm = get_llm(tier=TIER_HEAVY, temperature=0.2)

    domain = state["domain"]
    source_list = _format_sources_for_writer(state)

    # Check if this is a revision (Reviewer rejected previous version)
    reviewer_decision = state.get("reviewer_decision")
    is_revision = reviewer_decision and reviewer_decision.get("verdict") == "reject"

    if is_revision:
        template = "Maintain the exact section structure established in the Previous Draft."
    else:
        # Dynamically generate the report outline
        template_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert report structurer. Generate a Markdown outline (headers only) for a professional intelligence report.
The report is about the topic: {domain}.

Rules:
- Generate ONLY a list of markdown headers. 
- Do NOT generate ANY content under the headers.
- MUST start with a single H1 header (`#`) containing a highly specific, compelling, and descriptive title for the report based on the analysis.
- Include '## Executive Summary' as the second header and '## Conclusions & Recommendations' at the end.
- Create 6-10 H2 headers (`##`) highly tailored to the specifics of the query and analysis below, allowing for an exhaustive and deeply detailed report.
- Include H3 subheaders (`###`) where appropriate to organize granular details, frameworks, and methodologies found in the analysis."""),
            ("user", "Query: {query}\n\nAnalysis summary: {analysis}")
        ])
        try:
            template_chain = template_prompt | get_llm(temperature=0.1)
            t_msg = template_chain.invoke({
                "domain": domain, 
                "query": state["query"],
                "analysis": state.get("analysis", "")[:10000]
            })
            p, c = extract_tokens(t_msg)
            get_token_tracker().add(p, c)
            template = t_msg.content.strip()
        except Exception as e:
            print(f"[Writer] Failed to generate dynamic template: {e}")
            template = "# Intelligence Report\n## Executive Summary\n## Background\n## Findings\n## Analysis\n## Conclusions & Recommendations"

    if is_revision:
        # Revision prompt — incorporate feedback
        feedback = reviewer_decision.get("feedback", "")
        previous_report = state.get("final_report", "")

        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a professional intelligence report writer revising a massive, comprehensive data-driven report based on editorial feedback.

You MUST use the following section structure for a {domain} report:
{template}

REVISION INSTRUCTIONS:
- The Reviewer has rejected your previous draft with specific feedback below.
- Address EVERY point raised in the feedback.
- Keep the parts that were good; only improve what was criticized.
- Maintain the same structure and formatting.
- Be overwhelmingly exhaustive. Weave in all frameworks, methodologies, specific metrics, named quotes, and actionable insights detailed in the analysis. Output a massive amount of text. Do not compress or summarize the analysis; instead, expand on every single detail it provides.
- Deeply explain every metric, study, or claim. Use rich vocabulary and authoritative tone.
- CRITICAL: You MUST cite sources inline using the format [Source: Title](URL).
- Use the numbered source list provided to add proper citations.
- Output clean Markdown only."""),
            ("user", """Query: {query}

Analysis Data:
{analysis}

Available Sources:
{source_list}

Previous Draft:
{previous_report}

Reviewer Feedback (MUST ADDRESS):
{feedback}""")
        ])

        try:
            chain = prompt | llm
            ai_msg = chain.invoke({
                "domain": domain,
                "template": template,
                "query": state["query"],
                "analysis": state.get("analysis", "No analysis available."),
                "source_list": source_list,
                "previous_report": previous_report[:50000],
                "feedback": feedback,
            })
            p, c = extract_tokens(ai_msg)
            get_token_tracker().add(p, c)
            report = ai_msg.content
            return {"final_report": report, "writer_iterations": iteration}
        except Exception as e:
            return {"error": f"Writer revision failed: {str(e)}", "writer_iterations": iteration}

    else:
        # First draft prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a professional intelligence report writer. Generate a MASSIVE, highly structured, and data-rich {domain} intelligence report based on the exhaustive analysis provided.

You MUST use the following section structure for a {domain} report:
{template}

Rules:
- Be overwhelmingly exhaustive. Your goal is to produce a very long, highly detailed document. Do not compress or summarize the analysis; instead, expand on every single detail it provides.
- Weave in all frameworks, methodologies, specific metrics, named quotes, controversies, and actionable insights detailed in the analysis. Do not leave out *any* crucial depth.
- Each section should contain multiple substantive, long-form paragraphs. Explain concepts and findings deeply, providing context.
- Use bullet points or tables where appropriate to present complex data or comparisons clearly.
- CRITICAL: You MUST cite your sources inline throughout the report.
  Use this format: [Source: Title](URL)
  Example: According to a recent study [Source: Wearable Tech in Sports](https://example.com/study), injury rates decreased by 30%.
- Use the numbered source list provided to find the correct URLs for citations.
- Every major claim, framework, or data point MUST have a source citation.
- Use Markdown formatting: headers, bullet points, bold for emphasis.
- Output clean Markdown only, no preamble or concluding remarks.
- If data for a section is unavailable, write "Insufficient data available for this section." """),
            ("user", """Query: {query}

Analysis:
{analysis}

Available Sources for Citation:
{source_list}""")
        ])

        chain = prompt | llm

        try:
            ai_msg = chain.invoke({
                "domain": domain,
                "template": template,
                "query": state["query"],
                "analysis": state.get("analysis", "No analysis available."),
                "source_list": source_list,
            })
            p, c = extract_tokens(ai_msg)
            get_token_tracker().add(p, c)
            report = ai_msg.content
            return {"final_report": report, "writer_iterations": iteration}
        except Exception as e:
            return {"error": f"Writer failed: {str(e)}", "writer_iterations": iteration}
