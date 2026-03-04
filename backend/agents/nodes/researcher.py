import asyncio
import time
from typing import Dict, Any, List

from agents.state import ResearchState
from tools.search import tavily_search
from tools.scraper import scrape_url
from models import get_llm, TIER_HEAVY, get_token_tracker


async def researcher_node(state: ResearchState) -> dict:
    """Gather raw data from web using manual tool execution.
    """
    start_time = time.time()
    print(f"--- RESEARCHER NODE: Domain {state['domain']} ---")

    sub_tasks = state.get("sub_tasks", [])
    if not sub_tasks:
        sub_tasks = [state["query"]]

    all_search_results = []
    scraped_contents = []
    sources = []
    errors = []
    
    # We execute sub_tasks concurrently
    semaphore = asyncio.Semaphore(3)
    seen_urls = set()
    
    async def process_sub_task(task: str):
        async with semaphore:
            try:
                # 1. Search
                search_data = await tavily_search.ainvoke({"query": task, "num_results": 3})
                if "error" in search_data:
                    errors.append(search_data["error"])
                    return None
                    
                results = search_data.get("results", [])
                best_urls = []
                
                for r in results:
                    all_search_results.append(r)
                    url = r.get("url", "")
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        sources.append({"title": r.get("title", "Untitled"), "url": url})
                        # Grabbing top 1 link to scrape per sub-task to avoid overload
                        if len(best_urls) < 1:
                            best_urls.append((url, r))  # carry the result too for fallback
                            
                # 2. Scrape the best URLs (Firecrawl preferred, Tavily raw_content as fallback)
                task_scrapes = []
                for url, search_result in best_urls:
                    scrape_data = await scrape_url.ainvoke({"url": url})
                    if "error" not in scrape_data and scrape_data.get("content"):
                        task_scrapes.append(f"Source URL: {url}\n\nContent:\n{scrape_data.get('content', '')}")
                    else:
                        # Firecrawl unavailable/failed — use Tavily raw_content as fallback
                        raw = search_result.get("raw_content") or search_result.get("content", "")
                        if raw:
                            task_scrapes.append(f"Source URL: {url}\n\nContent (Tavily):\n{str(raw)[:5000]}")
                        
                scraped_contents.extend(task_scrapes)
                return True
            except Exception as e:
                errors.append(f"Error processing '{task[:30]}...': {str(e)}")
                return None

    print(f"  [Researcher] Starting parallel search & scrape for {len(sub_tasks[:5])} sub-tasks...")
    tasks_coros = [process_sub_task(task) for task in sub_tasks[:5]]
    await asyncio.gather(*tasks_coros)
    
    elapsed = time.time() - start_time
    metadata = state.get("metadata", {})
    metadata["search_count"] = len(all_search_results)
    metadata["scrape_count"] = len(scraped_contents)
    metadata["unique_sources"] = len(sources)
    metadata["researcher_errors"] = errors
    metadata["researcher_elapsed_s"] = round(elapsed, 2)
    
    print(f"  [Researcher] Done in {elapsed:.1f}s - Found {len(sources)} sources, scraped {len(scraped_contents)} pages")
    
    result = {
        "search_results": all_search_results,
        "scraped_content": scraped_contents,
        "sources": sources,
        "metadata": metadata,
    }

    if not scraped_contents and not all_search_results:
        result["error"] = f"Researcher: Search and scrape totally failed. Errors: {'; '.join(errors[:3])}"

    return result
