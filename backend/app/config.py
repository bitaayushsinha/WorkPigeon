from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongo_uri: str = "mongodb://localhost:27017"
    db_name: str = "workpigeon"
    frontend_url: str = "http://localhost:3000"
    openrouter_api_key: str = ""
    secret_key: str = "change-me-in-production-32-chars"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
