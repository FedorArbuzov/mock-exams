import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")

    database_url: str = "postgresql+psycopg://course:course@localhost:5433/shop"
    async_database_url: str = "postgresql+asyncpg://course:course@localhost:5433/shop"
    echo_sql: bool = False


settings = Settings()

if url := os.environ.get("DATABASE_URL"):
    settings.database_url = url
if url := os.environ.get("ASYNC_DATABASE_URL"):
    settings.async_database_url = url
if os.environ.get("ECHO_SQL", "").lower() in ("1", "true"):
    settings.echo_sql = True
