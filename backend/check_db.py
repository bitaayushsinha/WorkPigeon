import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    c = AsyncIOMotorClient("mongodb://localhost:27017")
    db = c["workpigeon"]
    users = await db["users"].find({}).to_list(100)
    if not users:
        print("NO USERS IN DATABASE")
    for u in users:
        print("email:", u.get("email"), "| role:", u.get("role"), "| has_hash:", bool(u.get("password_hash")))
    c.close()

asyncio.run(check())
