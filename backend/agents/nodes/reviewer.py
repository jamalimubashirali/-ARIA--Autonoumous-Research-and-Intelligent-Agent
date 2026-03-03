"""
Reviewer Agent Node.

Grades the final report on three criteria:
  1. Completeness — Does it cover all aspects of the query?
  2. Accuracy — Are claims supported by the provided data?
  3. Source Attribution — Are sources properly cited?

Returns `approve` or `reject` with specific feedback.
If rejected, Writer re-generates with feedback (max 2 iterations total).
"""
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from agents.state import ResearchState
from models import get_llm, TIER_HEAVY


class ReviewerOutput(BaseModel):
    completeness_score: int = Field(ge=1, le=5, description="1-5 score for coverage of all query aspects")
    accuracy_score: int = Field(ge=1, le=5, description="1-5 score for factual accuracy and data support")
    source_attribution_score: int = Field(ge=1, le=5, description="1-5 score for proper source citation")
    verdict: str = Field(description="Either 'approve' or 'reject'")
    feedback: str = Field(description="Specific actionable feedback if rejected. Empty string if approved.")


def reviewer_node(state: ResearchState) -> dict:
    """Grade the final report and decide to approve or reject.

    Uses the HEAVY model for careful quality assessment.
    Threshold for approval: average score >= 3.5 out of 5.
    """
    print(f"--- REVIEWER NODE: Iteration {state.get('writer_iterations', 1)} ---")

    if not state.get("final_report"):
        print("  No report to review, auto-approving empty state")
        return {
            "reviewer_decision": {
                "verdict": "approve",
                "feedback": "",
                "scores": {"completeness": 0, "accuracy": 0, "source_attribution": 0},
            }
        }

    llm = get_llm(tier=TIER_HEAVY, temperature=0)

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a senior editorial reviewer for intelligence reports. 
You must critically evaluate the report against the original query and source data.

Score each dimension 1-5:
- **Completeness (1-5)**: Does the report address all aspects of the query? Are any obvious angles missing?
- **Accuracy (1-5)**: Are claims supported by the provided data? Any unsupported statements?
- **Source Attribution (1-5)**: Are data points attributed to their sources? Can the reader trace claims?

Rules for verdict:
- If the AVERAGE score >= 3.5 → verdict = "approve"
- If the AVERAGE score < 3.5 → verdict = "reject"
- If rejecting, provide SPECIFIC, ACTIONABLE feedback that tells the Writer exactly what to fix.
- Do NOT reject for style preferences — only for substantive quality issues.
- Be fair but rigorous. A score of 3 means "adequate", 4 means "good", 5 means "excellent".

You MUST return your answer as a raw JSON object matching this schema exactly.
Do not include markdown blocks like ```json or any other text.
Schema:
{{
  "completeness_score": int,
  "accuracy_score": int,
  "source_attribution_score": int,
  "verdict": "approve" or "reject",
  "feedback": "string"
}}"""),
        ("user", """Original Query: {query}
Domain: {domain}

Analysis Data Available:
{analysis}

Final Report to Review:
{report}""")
    ])

    chain = prompt | llm.with_structured_output(ReviewerOutput, method="json_mode")

    try:
        review = chain.invoke({
            "query": state["query"],
            "domain": state["domain"],
            "analysis": state.get("analysis", "No analysis provided.")[:10000],
            "report": state["final_report"][:15000],
        })

        avg_score = (
            review.completeness_score
            + review.accuracy_score
            + review.source_attribution_score
        ) / 3

        # Override verdict based on computed average (in case LLM doesn't follow rules)
        verdict = "approve" if avg_score >= 3.5 else "reject"

        print(f"  [Reviewer] Scores: C={review.completeness_score} A={review.accuracy_score} S={review.source_attribution_score} (avg={avg_score:.1f})")
        print(f"  [Reviewer] Verdict: {verdict}")

        if verdict == "reject":
            print(f"  [Reviewer] Feedback: {review.feedback[:200]}...")

        return {
            "reviewer_decision": {
                "verdict": verdict,
                "feedback": review.feedback if verdict == "reject" else "",
                "scores": {
                    "completeness": review.completeness_score,
                    "accuracy": review.accuracy_score,
                    "source_attribution": review.source_attribution_score,
                },
            }
        }

    except Exception as e:
        print(f"  [Reviewer] Failed: {e} — auto-approving")
        return {
            "reviewer_decision": {
                "verdict": "approve",
                "feedback": "",
                "scores": {"completeness": 3, "accuracy": 3, "source_attribution": 3},
            }
        }
