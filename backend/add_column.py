import asyncio
from sqlalchemy import text
from db.session import AsyncSessionLocal

async def main():
    async with AsyncSessionLocal() as db:
        await db.execute(text("ALTER TABLE reports ADD COLUMN IF NOT EXISTS query_embedding vector(1536)"))
        await db.commit()
        print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
