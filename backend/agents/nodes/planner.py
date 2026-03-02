from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List

from agents.state import ResearchState
from config import settings

class PlannerOutput(BaseModel):
    sub_tasks: List[str] = Field(description="3-5 specific search sub-tasks that together will produce a comprehensive intelligence report.")

def planner_node(state: ResearchState) -> dict:
    print(f"--- PLANNER NODE: Domain {state['domain']} ---")
    llm = ChatAnthropic(model="claude-3-sonnet-20240229", temperature=0, api_key=settings.anthropic_api_key)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert research planner. Given a research query and domain, decompose it into 3-5 specific search sub-tasks that together will produce a comprehensive intelligence report.
Rules: 
(1) Each sub-task should target a different information source. 
(2) Order tasks from broad to specific. 
(3) Consider the domain when prioritising angles. 
(4) Output ONLY a JSON array of strings."""),
        ("user", "Domain: {domain}\nQuery: {query}")
    ])
    
    chain = prompt | llm.with_structured_output(PlannerOutput)
    
    try:
        result = chain.invoke({"domain": state["domain"], "query": state["query"]})
        return {"sub_tasks": result.sub_tasks}
    except Exception as e:
        return {"error": f"Planner failed: {str(e)}"}
