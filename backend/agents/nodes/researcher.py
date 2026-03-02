"""
Researcher Agent Node — Hardened.

Gathers raw data from web using search and scraping tools.
Includes:
- Concurrent execution with asyncio.gather
- Per-task timeout (15s search, 20s scrape)
- Retry with exponential backoff on 429/5xx errors
- Graceful degradation on partial failures
"""
import asyncio
import time
from typing import Dict, Any, List

from agents.state import ResearchState
from tools.search import tavily_search
from tools.scraper import scrape_url


MAX_RETRIES = 2
BASE_DELAY = 1.0  # seconds


async def _retry_with_backoff(coro_factory, retries=MAX_RETRIES):
    """Execute an async function with exponential backoff on failure."""
    for attempt in range(retries + 1):
        try:
            return await coro_factory()
        except Exception as e:
            error_str = str(e)
            is_retryable = any(code in error_str for code in ["429", "500", "502", "503", "504"])

            if attempt < retries and is_retryable:
                delay = BASE_DELAY * (2 ** attempt)
                print(f"    [Retry] Attempt {attempt + 1} failed ({error_str[:80]}), retrying in {delay}s...")
                await asyncio.sleep(delay)
            else:
                raise


async def _search_with_timeout(task: str, timeout: float = 15.0) -> Dict[str, Any]:
    """Run a search with timeout and retry."""
    async def _do():
        return await asyncio.wait_for(tavily_search(task, num_results=3), timeout=timeout)

    try:
        return await _retry_with_backoff(_do)
    except asyncio.TimeoutError:
        return {"error": f"Search timed out after {timeout}s for: {task[:50]}"}
    except Exception as e:
        return {"error": f"Search failed for '{task[:50]}': {str(e)[:100]}"}


async def _scrape_with_timeout(url: str, timeout: float = 20.0) -> Dict[str, Any]:
    """Run a scrape with timeout and retry."""
    async def _do():
        return await asyncio.wait_for(scrape_url(url), timeout=timeout)

    try:
        return await _retry_with_backoff(_do)
    except asyncio.TimeoutError:
        return {"error": f"Scrape timed out after {timeout}s for: {url[:50]}"}
    except Exception as e:
        return {"error": f"Scrape failed for '{url[:50]}': {str(e)[:100]}"}


async def researcher_node(state: ResearchState) -> dict:
    """Gather raw data from web using search and scraping tools.

    This node uses tools (Tavily + Firecrawl) — no LLM call needed.
    Hardened with timeouts, retries, and graceful degradation.
    """
    start_time = time.time()
    print(f"--- RESEARCHER NODE: Domain {state['domain']} ---")

    if state.get("error"):
        print("  Error detected in state, researcher continuing with caution...")

    sub_tasks = state.get("sub_tasks", [])
    if not sub_tasks:
        sub_tasks = [state["query"]]  # Fallback to original query

    all_search_results = []
    scraped_contents = []

    # ---- Phase 1: Concurrent searches with timeout ----
    print(f"  [Researcher] Searching {len(sub_tasks[:5])} sub-tasks...")
    search_tasks = [_search_with_timeout(task) for task in sub_tasks[:5]]
    search_responses = await asyncio.gather(*search_tasks, return_exceptions=True)

    urls_to_scrape = []
    errors = []

    for i, response in enumerate(search_responses):
        if isinstance(response, Exception):
            errors.append(f"Search task {i}: {str(response)[:100]}")
            continue
        if isinstance(response, dict):
            if "error" in response:
                errors.append(response["error"])
                continue
            if "results" in response:
                all_search_results.extend(response["results"])
                # Extract top URL from each search response to scrape
                if response["results"]:
                    urls_to_scrape.append(response["results"][0].get("url"))

    print(f"  [Researcher] Got {len(all_search_results)} search results, {len(errors)} errors")

    # ---- Phase 2: Concurrent scrapes with timeout ----
    urls_to_scrape = list(set(url for url in urls_to_scrape if url))[:3]

    if urls_to_scrape:
        print(f"  [Researcher] Scraping {len(urls_to_scrape)} URLs...")
        scrape_tasks = [_scrape_with_timeout(url) for url in urls_to_scrape]
        scrape_responses = await asyncio.gather(*scrape_tasks, return_exceptions=True)

        for response in scrape_responses:
            if isinstance(response, Exception):
                errors.append(f"Scrape: {str(response)[:100]}")
                continue
            if isinstance(response, dict):
                if "error" in response:
                    errors.append(response["error"])
                    continue
                if "content" in response:
                    scraped_contents.append(response["content"])

    # ---- Metadata ----
    elapsed = time.time() - start_time
    metadata = state.get("metadata", {})
    metadata["search_count"] = len(all_search_results)
    metadata["scrape_count"] = len(scraped_contents)
    metadata["unique_sources"] = len(set(r.get("url", "") for r in all_search_results))
    metadata["researcher_errors"] = errors
    metadata["researcher_elapsed_s"] = round(elapsed, 2)

    print(f"  [Researcher] Done in {elapsed:.1f}s — {len(all_search_results)} results, {len(scraped_contents)} scrapes")

    result = {
        "search_results": all_search_results,
        "scraped_content": scraped_contents,
        "metadata": metadata,
    }

    # Set error flag only if ALL searches failed
    if not all_search_results and not scraped_contents:
        result["error"] = f"Researcher: all searches/scrapes failed. Errors: {'; '.join(errors[:3])}"

    return result
