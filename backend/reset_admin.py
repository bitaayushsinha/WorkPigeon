"""Reset admin user with a fresh password hash."""
import asyncio
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient

async def reset():
    c = AsyncIOMotorClient("mongodb://localhost:27017")
    db = c["workpigeon"]

    password = "admin123"
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    # Verify the hash works before saving
    assert bcrypt.checkpw(password.encode(), hashed.encode()), "Hash verification failed!"

    await db["users"].delete_many({"email": "admin@workpigeon.dev"})
    await db["users"].insert_one({
        "name": "WorkPigeon Admin",
        "email": "admin@workpigeon.dev",
        "password_hash": hashed,
        "role": "admin",
        "skills": [],
        "current_workload": 0.0,
        "performance_history": [],
        "ai_efficiency_score": 50.0,
        "active_session": None,
        "commits_today": 0,
    })

    # Verify it's there
    user = await db["users"].find_one({"email": "admin@workpigeon.dev"})
    stored_hash = user["password_hash"]
    verify = bcrypt.checkpw(password.encode(), stored_hash.encode())
    print("Admin recreated.")
    print("Email:    admin@workpigeon.dev")
    print("Password: admin123")
    print("Hash verify:", verify)
    c.close()

asyncio.run(reset())
