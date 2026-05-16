from enum import Enum

from pydantic import BaseModel, Field


class Language(str, Enum):
    python = "python"
    c = "c"
    cpp = "cpp"
    java = "java"


class RunRequest(BaseModel):
    language: Language
    code: str = Field(..., min_length=1, max_length=100_000)
    stdin: str = Field(default="", max_length=20_000)
    timeout_seconds: float = Field(default=5.0, ge=0.5, le=15.0)


class RunResponse(BaseModel):
    language: Language
    status: str
    stdout: str
    stderr: str
    compile_stdout: str = ""
    compile_stderr: str = ""
    exit_code: int | None = None
    timed_out: bool = False
    duration_ms: int


class LanguageStatus(BaseModel):
    language: Language
    available: bool
    tools: dict[str, str | None]


class HealthResponse(BaseModel):
    ok: bool
    languages: list[LanguageStatus]
