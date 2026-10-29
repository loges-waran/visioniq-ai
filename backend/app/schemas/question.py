from typing import List, Optional
from pydantic import BaseModel, Field


class QuestionRequest(BaseModel):
    question: str = Field(..., min_length=3, description="The extracted or entered question text")
    options: Optional[List[str]] = Field(default_factory=list, description="List of multiple-choice answer options (if any)")
    subject: Optional[str] = Field("General", description="Subject or domain e.g. Computer Science, Math, General")
    language: Optional[str] = Field("English", description="Target response language e.g. English, Tamil")
    client_timestamp: Optional[float] = Field(None, description="Timestamp from frontend in epoch ms")
    raw_ocr_text: Optional[str] = Field(None, description="Original unparsed OCR text for context")


class QuestionAnswerResponse(BaseModel):
    question_id: str
    question: str
    options: List[str] = Field(default_factory=list)
    answer: str
    selected_option: Optional[str] = None  # e.g., 'A', 'B', 'C', 'D'
    explanation: str
    status: str = "answered"  # 'answered', 'needs_verification', 'unclear', 'error'
    confidence_label: str = "High confidence"  # 'High confidence', 'Needs verification', 'Question unclear'
    needs_verification: bool = False
    generation_time_ms: float = 0.0
    provider: str = "openai"  # 'openai' or 'mock_engine'
    created_at: str


class VerificationRequest(BaseModel):
    question: str = Field(..., min_length=3)
    options: Optional[List[str]] = Field(default_factory=list)
    proposed_answer: str = Field(..., min_length=1)
    proposed_option: Optional[str] = None


class VerificationResponse(BaseModel):
    is_verified: bool
    confidence_label: str
    verification_notes: str
    verified_option: Optional[str] = None


class HistoryItem(BaseModel):
    id: str
    question: str
    options: List[str]
    answer: str
    selected_option: Optional[str]
    explanation: str
    confidence_label: str
    created_at: str


class HistoryListResponse(BaseModel):
    items: List[HistoryItem]
    total: int


class HealthResponse(BaseModel):
    status: str
    ai_configured: bool
    model: str
    history_enabled: bool
    version: str
