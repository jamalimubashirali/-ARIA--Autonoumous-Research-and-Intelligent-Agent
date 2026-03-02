from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from agents.state import ResearchState
from config import settings

def analyst_node(state: ResearchState) -> dict:
    print(f"--- ANALYST NODE: Domain {state['domain']} ---")
    
    if state.get("error"):
        print("Error detected in state, analyst skipping or handling error...")
        
    llm = ChatAnthropic(model="claude-3-sonnet-20240229", temperature=0, api_key=settings.anthropic_api_key)
    
    # Format gathered data
    search_context = "\n".join([f"Source ({res.get('url')}): {res.get('content')}" for res in state.get("search_results", [])])
    scrape_context = "\n---\n".join(state.get("scraped_content", []))
    
    # In a full production system, we would also query Supabase pgvector here (RAG)
    rag_context = state.get("rag_context", "No historical context found.")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert analyst. Your job is to synthesize raw research data into a coherent, comprehensive analysis block.
Do not write the final report. Instead, provide a detailed summary of facts, numbers, key points, and insights extracted from the provided data.
Group related information together. Ensure all key metrics and important claims are retained."""),
        ("user", "Query: {query}\n\nSearch Results:\n{search_context}\n\nScraped Deep-dives:\n{scrape_context}\n\nHistorical Context:\n{rag_context}")
    ])
    
    chain = prompt | StrOutputParser()
    
    try:
        analysis = chain.invoke({
            "query": state["query"],
            "search_context": search_context[:15000], # Guardrails on length
            "scrape_context": scrape_context[:30000],
            "rag_context": rag_context
        })
        return {"analysis": analysis}
    except Exception as e:
        return {"error": f"Analyst failed: {str(e)}"}
