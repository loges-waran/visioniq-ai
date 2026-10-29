import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "VisionIQ AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # AI Engine Configuration
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_BASE_URL: Optional[str] = None
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./visioniq.db"
    ENABLE_HISTORY_BY_DEFAULT: bool = True
    
    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    ADDITIONAL_ORIGINS: List[str] = ["http://127.0.0.1:5173", "http://localhost:3000"]
    
    # Limits & Timeouts
    REQUEST_TIMEOUT_SECONDS: float = 25.0
    MAX_IMAGE_SIZE_MB: int = 10
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def is_ai_configured(self) -> bool:
        return bool(
            self.OPENAI_API_KEY 
            and self.OPENAI_API_KEY.strip() 
            and not self.OPENAI_API_KEY.startswith("your_")
            and len(self.OPENAI_API_KEY) > 10
        )

    @property
    def cors_origins(self) -> List[str]:
        origins = [self.FRONTEND_ORIGIN.strip()]
        for o in self.ADDITIONAL_ORIGINS:
            if o and o not in origins:
                origins.append(o)
        return origins


settings = Settings()
