"""Application configuration."""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Source
    bb_catalog_url: str = "https://mapua.blackboard.com/webapps/blackboard/execute/viewCatalog"
    bb_term_id: str = "_758_1"

    # Sync
    sync_interval_minutes: int = 60
    sync_max_retries: int = 3
    sync_backoff_base_seconds: int = 30
    sync_timeout_seconds: int = 60

    # Database
    database_url: str = "sqlite:///./catalog.db"

    # Security
    admin_api_key: str = "change-me-in-production"

    # Logging
    log_level: str = "INFO"


settings = Settings()