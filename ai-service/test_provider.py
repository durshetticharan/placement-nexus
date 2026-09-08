import asyncio, os  
from dotenv import load_dotenv; load_dotenv()  
from app.providers import GeminiProvider  
async def main():  
    p = GeminiProvider()  
    res = await p.generate('', 'Reply with exactly: PLACEMENT_NEXUS_GEMINI_OK')  
    print('DIRECT GEMINI: PASS', res)  
asyncio.run(main())  
