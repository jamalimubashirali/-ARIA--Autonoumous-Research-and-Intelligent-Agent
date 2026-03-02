import httpx
from typing import Dict, Any
from config import settings

async def scrape_url(url: str, formats: list = ["markdown"]) -> Dict[str, Any]:
    if not settings.firecrawl_api_key:
        return {"error": "Firecrawl API key not configured."}
        
    api_url = "https://api.firecrawl.dev/v1/scrape"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.firecrawl_api_key}"
    }
    payload = {
        "url": url,
        "formats": formats
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(api_url, json=payload, headers=headers, timeout=15.0)
            response.raise_for_status()
            data = response.json()
            
            # Firecrawl returns data in 'data' object
            result_data = data.get("data", {})
            markdown_content = result_data.get("markdown", "")
            
            return {
                "content": markdown_content[:10000],  # Truncate to limit token context
                "metadata": result_data.get("metadata", {})
            }
        except Exception as e:
            return {"error": f"Firecrawl scrape failed for {url}: {str(e)}"}
