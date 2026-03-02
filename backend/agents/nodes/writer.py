from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from agents.state import ResearchState
from config import settings

def writer_node(state: ResearchState) -> dict:
    print(f"--- WRITER NODE: Domain {state['domain']} ---")
    
    if state.get("error"):
        print("Error detected in state, writer skipping or handling error...")
        # A robust implementation might try to write a partial report if there's enough data
        
    llm = ChatAnthropic(model="claude-3-sonnet-20240229", temperature=0.2, api_key=settings.anthropic_api_key)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a professional intelligence report writer. Generate a structured {domain} intelligence report based on the analysis provided. 
Use the exact section template for the {domain} domain. Be specific, cite data points, avoid filler. Output clean Markdown only without any preamble or concluding remarks."""),
        ("user", "Query: {query}\n\nAnalysis:\n{analysis}")
    ])
    
    chain = prompt | StrOutputParser()
    
    try:
        report = chain.invoke({
            "domain": state["domain"],
            "query": state["query"],
            "analysis": state["analysis"]
        })
        return {"final_report": report}
    except Exception as e:
        return {"error": f"Writer failed: {str(e)}"}
