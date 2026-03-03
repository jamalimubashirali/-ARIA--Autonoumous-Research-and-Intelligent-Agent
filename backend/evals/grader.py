import os
import json
from pydantic import BaseModel, Field
from typing import List

from models import get_llm, TIER_HEAVY

class EvaluationScore(BaseModel):
    completeness_score: float = Field(description="Score from 1.0 to 5.0 based on whether the report contains the expected facts.")
    narrative_flow_score: float = Field(description="Score from 1.0 to 5.0 on how well-written and readable the report is.")
    citation_density_score: float = Field(description="Score from 1.0 to 5.0 on how well sources are referenced and integrated into the text.")
    missing_facts: List[str] = Field(description="A list of the expected facts that were NOT found in the report. Empty if all found.")
    justification: str = Field(description="Brief justification for the assigned scores.")

def evaluate_report(query: str, expected_facts: List[str], report_text: str) -> EvaluationScore:
    """Uses LLM-As-A-Judge to score a generated report against expected facts."""
    
    llm = get_llm(tier=TIER_HEAVY, temperature=0.0).with_structured_output(EvaluationScore)
    
    facts_str = "\n".join([f"- {fact}" for fact in expected_facts])
    
    prompt = f"""You are an impartial, expert human evaluator grading an automated research report.

USER QUERY: {query}

EXPECTED FACTS THAT MUST BE PRESENT:
{facts_str}

RESEACH REPORT:
{report_text}

Rate this report on the following criteria:
1. Completeness Score (1-5): Did the report answer the query specifically and include the expected facts?
2. Narrative Flow Score (1-5): Is the report structured well? Is it easy to read?
3. Citation Density Score (1-5): Does the report make good use of citations and specific references?

Be highly critical. If an expected fact is missing, the completeness score must be penalized severely.
List any expected facts that are entirely missing from the report.
"""
    
    try:
        # Since we use ChatOpenAI, we can pass messages
        result = llm.invoke([{"role": "user", "content": prompt}])
        return result
    except Exception as e:
        print(f"Error during evaluation: {e}")
        # Return a zero-score object if it fails
        return EvaluationScore(
            completeness_score=0.0,
            narrative_flow_score=0.0,
            citation_density_score=0.0,
            missing_facts=expected_facts,
            justification=f"Evaluation failed: {str(e)}"
        )
