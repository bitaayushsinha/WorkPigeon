"""
create_admin.py — Create the initial admin user via Beanie (correct field mapping)
Run: python create_admin.py
"""
import asyncio
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import settings
from app.models.user import User


async def main():
    client = AsyncIOMotorClient(settings.mongo_uri)
    await init_beanie(
        database=client[settings.db_name],
        document_models=[User],
    )

    # Remove any stale admin
    existing = await User.find_one(User.email == "admin@workpigeon.dev")
    if existing:
        await existing.delete()
        print("Removed old admin.")

    password = "admin123"
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    # Sanity-check the hash before saving
    assert bcrypt.checkpw(password.encode(), hashed.encode()), "Hash check failed!"

    admin = User(
        name="WorkPigeon Admin",
        email="admin@workpigeon.dev",
        password_hash=hashed,
        role="admin",            # <-- explicit Beanie field
    )
    await admin.insert()

    # Read back and confirm
    saved = await User.find_one(User.email == "admin@workpigeon.dev")
    assert saved is not None, "Admin not found after insert!"
    assert saved.role == "admin", f"Role mismatch: got '{saved.role}'"
    assert bcrypt.checkpw(password.encode(), saved.password_hash.encode()), "Hash mismatch on read-back!"

    print("Admin created successfully via Beanie.")
    print(f"  Email:    admin@workpigeon.dev")
    print(f"  Password: admin123")
    print(f"  Role:     {saved.role}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
