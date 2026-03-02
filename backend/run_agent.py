import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from agents.graph import research_graph

async def main():
    print("====================================")
    print("ARIA Local Testing Script")
    print("====================================")
    
    query = input("Enter research query: ") or "Research Stripe for an enterprise sales call"
    domain = input("Enter domain (sales/finance/healthcare/legal/sports): ") or "sales"
    
    print("\nStarting ARIA Agent...")
    initial_state = {
        "query": query,
        "domain": domain,
        "sub_tasks": [],
        "search_results": [],
        "scraped_content": [],
        "metadata": {"source": "local_testing"}
    }
    
    # In LangGraph 0.0.x, we iterate over the stream
    try:
        async for output in research_graph.astream(initial_state):
            for node_name, state_update in output.items():
                print(f"\n[Completed Node: {node_name}]")
                if "error" in state_update and state_update["error"]:
                    print(f"Error: {state_update['error']}")
                elif node_name == "planner":
                    print(f"Sub-tasks: {state_update.get('sub_tasks')}")
                elif node_name == "writer":
                    print("\nFinal Report Generated:")
                    print("====================================")
                    print(state_update.get("final_report", "No report generated."))
                    print("====================================")
    except Exception as e:
        print(f"Graph execution failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
