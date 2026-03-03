import asyncio
import json
from db.session import AsyncSessionLocal
from api.routes import stream_agent, ResearchRequest
from api.reports import get_or_create_user

async def main():
    async with AsyncSessionLocal() as db:
        user = await get_or_create_user("test_memory_user_1", db)
        
        request = ResearchRequest(
            query="What is the future impact of solid state batteries on EV stocks?", 
            domain="finance"
        )
        
        print("=== RUN 1 (Should execute full pipeline) ===")
        async for event in stream_agent(request, user, db):
            print(event.strip()[:200]) # Print first 200 chars to avoid flooding terminal
            
        print("\n=== RUN 2 (Should skip pipeline -> memory -> writer) ===")
        async for event in stream_agent(request, user, db):
            print(event.strip()[:200])

if __name__ == "__main__":
    asyncio.run(main())
