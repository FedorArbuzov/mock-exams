from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")

    endpoint_url: str | None = Field(default="http://localhost:4566", validation_alias="AWS_ENDPOINT_URL")
    region: str = Field(default="us-east-1", validation_alias="AWS_DEFAULT_REGION")
    access_key: str = Field(default="test", validation_alias="AWS_ACCESS_KEY_ID")
    secret_key: str = Field(default="test", validation_alias="AWS_SECRET_ACCESS_KEY")
    shop_bucket: str = Field(default="shop-uploads", validation_alias="SHOP_BUCKET")
    shop_table: str = Field(default="shop-items", validation_alias="SHOP_TABLE")
    shop_queue: str = Field(default="shop-events", validation_alias="SHOP_QUEUE")


settings = Settings()
