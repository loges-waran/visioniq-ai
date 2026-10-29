import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Float, Boolean
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class QuestionHistoryModel(Base):
    __tablename__ = "question_history"

    id = Column(String(64), primary_key=True, index=True)
    question = Column(Text, nullable=False)
    options_json = Column(Text, nullable=False, default="[]")
    answer = Column(Text, nullable=False)
    selected_option = Column(String(8), nullable=True)
    explanation = Column(Text, nullable=False)
    confidence_label = Column(String(32), nullable=False, default="High confidence")
    needs_verification = Column(Boolean, default=False)
    generation_time_ms = Column(Float, default=0.0)
    provider = Column(String(32), default="openai")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def options(self):
        try:
            return json.loads(self.options_json)
        except Exception:
            return []

    @options.setter
    def options(self, val):
        self.options_json = json.dumps(val or [])
