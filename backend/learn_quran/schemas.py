from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


WordStatus = Literal["correct", "minor_issue", "incorrect"]
ScoreSource = Literal["mock", "model"]


class WordResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    wordIndex: int = Field(ge=0)
    expectedText: str = Field(min_length=1)
    heardText: Optional[str] = None
    status: WordStatus


class ScoreResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    attemptId: str
    surahId: int = Field(ge=1, le=114)
    ayahId: int = Field(ge=1)
    overallScore: int = Field(ge=0, le=100)
    wordResults: list[WordResult]
    source: ScoreSource
    disclaimer: str
    transcript: Optional[str] = None
    modelName: Optional[str] = None
    modelRevision: Optional[str] = None
    scorerVersion: Optional[str] = None
    processingTimeMs: Optional[int] = Field(default=None, ge=0)
