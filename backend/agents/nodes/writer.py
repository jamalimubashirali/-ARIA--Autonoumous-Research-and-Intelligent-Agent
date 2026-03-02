"""
Writer Agent Node.

Generates the final structured intelligence report using domain-specific templates.
On the first pass, writes from analysis data.
On subsequent passes (after Reviewer rejection), incorporates feedback to improve.
"""
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from agents.state import ResearchState
from models import get_llm, TIER_HEAVY

# Domain-specific section templates
DOMAIN_TEMPLATES = {
    "sales": """## Executive Summary
## Company Overview
## Products & Services
## Target Market & Positioning
## Leadership & Key Personnel
## Recent News & Developments
## Competitive Landscape
## Recommended Talking Points""",

    "finance": """## Executive Summary
## Financial Performance Overview
## Revenue & Profitability Analysis
## Balance Sheet & Liquidity
## Market Position & Valuation
## Risk Factors
## Analyst Consensus & Price Targets
## Investment Thesis""",

    "healthcare": """## Executive Summary
## Therapeutic Area Overview
## Mechanism of Action
## Clinical Trial Data & Results
## Regulatory Status & Approvals
## Competitive Landscape
## Market Opportunity
## Key Opinion Leader Sentiment""",

    "legal": """## Executive Summary
## Legal Framework & Statutory Basis
## Key Provisions & Requirements
## Relevant Case Law & Precedents
## Compliance Obligations
## Enforcement & Penalties
## Practical Implications
## Recommended Actions""",

    "sports": """## Executive Summary
## Player / Team Profile
## Performance Statistics
## Tactical Analysis & Playing Style
## Injury History & Fitness
## Contract & Transfer Status
## Scouting Assessment
## Comparison with Peers""",
}


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
    template = DOMAIN_TEMPLATES.get(domain, DOMAIN_TEMPLATES["sales"])

    # Check if this is a revision (Reviewer rejected previous version)
    reviewer_decision = state.get("reviewer_decision")
    is_revision = reviewer_decision and reviewer_decision.get("verdict") == "reject"

    if is_revision:
        # Revision prompt — incorporate feedback
        feedback = reviewer_decision.get("feedback", "")
        previous_report = state.get("final_report", "")

        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a professional intelligence report writer revising a report based on editorial feedback.

You MUST use the following section structure for a {domain} report:
{template}

REVISION INSTRUCTIONS:
- The Reviewer has rejected your previous draft with specific feedback below.
- Address EVERY point raised in the feedback.
- Keep the parts that were good; only improve what was criticized.
- Maintain the same structure and formatting.
- Output clean Markdown only."""),
            ("user", """Query: {query}

Analysis Data:
{analysis}

Previous Draft:
{previous_report}

Reviewer Feedback (MUST ADDRESS):
{feedback}""")
        ])

        try:
            chain = prompt | llm | StrOutputParser()
            report = chain.invoke({
                "domain": domain,
                "template": template,
                "query": state["query"],
                "analysis": state.get("analysis", "No analysis available."),
                "previous_report": previous_report[:15000],
                "feedback": feedback,
            })
            return {"final_report": report, "writer_iterations": iteration}
        except Exception as e:
            return {"error": f"Writer revision failed: {str(e)}", "writer_iterations": iteration}

    else:
        # First draft prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a professional intelligence report writer. Generate a structured {domain} intelligence report based on the analysis provided.

You MUST use the following section structure for a {domain} report:
{template}

Rules:
- Be specific and data-driven — cite numbers, dates, and percentages where available.
- Each section should contain substantive content, not filler.
- Attribute key claims to their sources where possible.
- Use Markdown formatting: headers, bullet points, bold for emphasis.
- Output clean Markdown only, no preamble or concluding remarks.
- If data for a section is unavailable, write "Insufficient data available for this section." """),
            ("user", "Query: {query}\n\nAnalysis:\n{analysis}")
        ])

        chain = prompt | llm | StrOutputParser()

        try:
            report = chain.invoke({
                "domain": domain,
                "template": template,
                "query": state["query"],
                "analysis": state.get("analysis", "No analysis available.")
            })
            return {"final_report": report, "writer_iterations": iteration}
        except Exception as e:
            return {"error": f"Writer failed: {str(e)}", "writer_iterations": iteration}
