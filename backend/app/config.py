from pathlib import Path
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    openai_api_key: str = ""
    openai_model: str = "gpt-6-astra"
    hyper3d_api_key: str = ""
    data_dir: Path = Path(".data")
    allowed_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    cad_job_timeout_seconds: int = Field(default=120, ge=1, le=600)
    model_job_timeout_seconds: int = Field(default=180, ge=1, le=600)
    lookup_job_timeout_seconds: int = Field(default=75, ge=10, le=180)
    dimension_estimate_timeout_seconds: int = Field(default=60, ge=10, le=180)
    rodin_wait_deadline_seconds: int = Field(default=900, ge=1, le=3600)
    lookup_source_limit: int = Field(default=3, ge=1, le=5)
    max_tool_rounds: int = Field(default=8, ge=1, le=16)
    max_candidate_attempts: int = Field(default=2, ge=1, le=4)
    max_output_tokens: int = Field(default=6000, ge=256, le=16000)
    max_upload_bytes: int = Field(default=12 * 1024 * 1024, ge=1)
    max_model_calls_per_job: int = Field(default=12, ge=1, le=30)
    max_visual_jobs_per_project: int = Field(default=12, ge=1, le=100)

    @field_validator("allowed_origins")
    @classmethod
    def exact_origins(cls, origins):
        from urllib.parse import urlparse

        for origin in origins:
            u = urlparse(origin)
            if u.scheme not in ("http", "https") or not u.netloc or u.path or "*" in origin:
                raise ValueError("CORS requires exact HTTP origins, without paths or wildcards")
        return origins
