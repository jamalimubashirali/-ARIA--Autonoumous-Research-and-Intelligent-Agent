import asyncio
from typing import Dict, Any

from agents.state import ResearchState
from tools.search import tavily_search
from tools.scraper import scrape_url

async def researcher_node(state: ResearchState) -> dict:
    print(f"--- RESEARCHER NODE: Domain {state['domain']} ---")
    
    if state.get("error"):
        print("Error detected in state, researcher skipping or handling error...")
        
    sub_tasks = state.get("sub_tasks", [])
    if not sub_tasks:
        sub_tasks = [state["query"]] # Fallback to original query
        
    all_search_results = []
    scraped_contents = []
    
    # Execute searches for all subtasks concurrently
    search_tasks = [tavily_search(task, num_results=2) for task in sub_tasks[:3]] # limit to top 3 tasks
    search_responses = await asyncio.gather(*search_tasks, return_exceptions=True)
    
    urls_to_scrape = []
    
    for response in search_responses:
        if isinstance(response, dict) and "results" in response:
            all_search_results.extend(response["results"])
            # Extract top URL from each search response to scrape
            if response["results"]:
                urls_to_scrape.append(response["results"][0].get("url"))
                
    # Deduplicate URLs
    urls_to_scrape = list(set(urls_to_scrape))[:3] # Max 3 scrapes per run
    
    # Execute scrapes concurrently
    scrape_tasks = [scrape_url(url) for url in urls_to_scrape]
    scrape_responses = await asyncio.gather(*scrape_tasks, return_exceptions=True)
    
    for response in scrape_responses:
         if isinstance(response, dict) and "content" in response:
             scraped_contents.append(response["content"])
             
    # Format metadata correctly to not blow up context
    metadata = state.get("metadata", {})
    metadata["search_count"] = len(all_search_results)
    metadata["scrape_count"] = len(scraped_contents)
             
    return {
        "search_results": all_search_results,
        "scraped_content": scraped_contents,
        "metadata": metadata
    }
