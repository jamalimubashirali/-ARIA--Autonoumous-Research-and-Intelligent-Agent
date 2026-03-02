from langgraph.graph import StateGraph, END
from typing import TypedDict

from agents.state import ResearchState
from agents.nodes.planner import planner_node
from agents.nodes.researcher import researcher_node
from agents.nodes.analyst import analyst_node
from agents.nodes.writer import writer_node

def create_research_graph() -> StateGraph:
    # Define the graph
    workflow = StateGraph(ResearchState)
    
    # Add nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("researcher", researcher_node)
    workflow.add_node("analyst", analyst_node)
    workflow.add_node("writer", writer_node)
    
    # Add edges
    workflow.set_entry_point("planner")
    workflow.add_edge("planner", "researcher")
    workflow.add_edge("researcher", "analyst")
    workflow.add_edge("analyst", "writer")
    workflow.add_edge("writer", END)
    
    # Compile the graph
    app = workflow.compile()
    
    return app

research_graph = create_research_graph()
