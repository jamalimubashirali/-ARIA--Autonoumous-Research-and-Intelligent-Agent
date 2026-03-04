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
                print(f"  [Researcher] Searching: '{task[:60]}...'")
                search_data = await tavily_search.ainvoke({"query": task, "num_results": 5})
                if "error" in search_data:
                    errors.append(f"Search error for '{task[:30]}...': {search_data['error']}")
                    print(f"  [Researcher] Search error: {search_data['error']}")
                    return None
                    
                results = search_data.get("results", [])
                if not results:
                    errors.append(f"No results for '{task[:30]}...'")
                    print(f"  [Researcher] No results returned for task")
                    return None
                
                best_urls = []
                
                for r in results:
                    all_search_results.append(r)
                    url = r.get("url", "")
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        sources.append({"title": r.get("title", "Untitled"), "url": url})
                        # Grab top 2 links to scrape per sub-task for better coverage
                        if len(best_urls) < 2:
                            best_urls.append((url, r))
                            
                # 2. Extract content from the best URLs
                task_scrapes = []
                for url, search_result in best_urls:
                    # First try Tavily's raw_content (free, already available)
                    raw = search_result.get("raw_content") or ""
                    
                    if raw and len(raw.strip()) > 200:
                        # Use Tavily's raw_content directly
                        task_scrapes.append(f"Source URL: {url}\n\nContent:\n{str(raw)}")
                        print(f"  [Researcher] Got raw_content from Tavily for: {url[:60]}...")
                    else:
                        # Fallback: try Firecrawl scraper for deep content
                        print(f"  [Researcher] No raw_content from Tavily, trying Firecrawl for: {url[:60]}...")
                        try:
                            scrape_result = await scrape_url.ainvoke({"url": url})
                            if "error" not in scrape_result and scrape_result.get("content"):
                                content = scrape_result["content"]
                                task_scrapes.append(f"Source URL: {url}\n\nContent:\n{content}")
                                print(f"  [Researcher] Got content from Firecrawl ({len(content)} chars)")
                            else:
                                # Last resort: use the search snippet
                                snippet = search_result.get("content", "")
                                if snippet:
                                    task_scrapes.append(f"Source URL: {url}\n\nContent (snippet):\n{snippet}")
                                    print(f"  [Researcher] Using search snippet fallback for: {url[:60]}...")
                                err_msg = scrape_result.get("error", "No content returned")
                                print(f"  [Researcher] Firecrawl failed: {err_msg}")
                        except Exception as scrape_err:
                            # Use search snippet as final fallback
                            snippet = search_result.get("content", "")
                            if snippet:
                                task_scrapes.append(f"Source URL: {url}\n\nContent (snippet):\n{snippet}")
                            print(f"  [Researcher] Scrape exception, using snippet: {scrape_err}")
                        
                scraped_contents.extend(task_scrapes)
                return True
            except Exception as e:
                error_msg = f"Error processing '{task[:30]}...': {str(e)}"
                errors.append(error_msg)
                print(f"  [Researcher] {error_msg}")
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
    
    if errors:
        print(f"  [Researcher] Warnings: {'; '.join(errors[:3])}")
    
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
