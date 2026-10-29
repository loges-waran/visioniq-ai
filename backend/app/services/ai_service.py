import json
import re
import time
import uuid
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timezone

from openai import AsyncOpenAI, APIError, APITimeoutError, RateLimitError, AuthenticationError
from backend.app.core.config import settings
from backend.app.schemas.question import QuestionRequest, QuestionAnswerResponse


class AIService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        self.client = None
        if settings.is_ai_configured:
            self.client = AsyncOpenAI(
                api_key=self.api_key,
                base_url=settings.OPENAI_BASE_URL or None,
                timeout=settings.REQUEST_TIMEOUT_SECONDS
            )

    async def answer_question(self, req: QuestionRequest) -> QuestionAnswerResponse:
        start_time = time.perf_counter()
        q_id = f"q-{uuid.uuid4().hex[:10]}"

        # If real OpenAI is configured, call OpenAI
        if self.client and settings.is_ai_configured:
            try:
                res = await self._call_openai(req, q_id)
                res.generation_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
                return res
            except AuthenticationError as e:
                # Fallback to mock mode with warning if auth fails
                return self._build_error_or_mock_response(
                    req, q_id, start_time,
                    error_msg=f"OpenAI Authentication Failed: Check OPENAI_API_KEY. {str(e)}",
                    fallback_to_mock=True
                )
            except RateLimitError as e:
                return self._build_error_or_mock_response(
                    req, q_id, start_time,
                    error_msg=f"OpenAI Rate Limit Exceeded: {str(e)}",
                    fallback_to_mock=True
                )
            except APITimeoutError:
                return QuestionAnswerResponse(
                    question_id=q_id,
                    question=req.question,
                    options=req.options or [],
                    answer="Request timed out while waiting for AI response.",
                    selected_option=None,
                    explanation="The upstream AI service took too long to respond. Please check your connection or retry.",
                    status="error",
                    confidence_label="Needs verification",
                    needs_verification=True,
                    generation_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                    provider="openai_error",
                    created_at=datetime.now(timezone.utc).isoformat()
                )
            except Exception as e:
                return self._build_error_or_mock_response(
                    req, q_id, start_time,
                    error_msg=f"OpenAI API Error: {str(e)}",
                    fallback_to_mock=True
                )

        # Standalone Mock Mode for local testing/development without paid keys
        mock_res = self._solve_with_mock_engine(req, q_id)
        mock_res.generation_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return mock_res

    async def answer_image(
        self,
        image_base64: str,
        mime_type: str = "image/jpeg",
        language: str = "English"
    ) -> QuestionAnswerResponse:
        """Vision model processing for direct image inspection."""
        start_time = time.perf_counter()
        q_id = f"img-{uuid.uuid4().hex[:10]}"

        if not self.client or not settings.is_ai_configured:
            # Fallback mock for image testing
            return QuestionAnswerResponse(
                question_id=q_id,
                question="[Mock Vision] Detected question from uploaded frame: Which data structure follows LIFO?",
                options=["A) Queue", "B) Stack", "C) Tree", "D) Graph"],
                answer="Stack",
                selected_option="B",
                explanation="[Mock Vision Mode] The vision engine identified a question on screen. A Stack follows Last In, First Out.",
                status="answered",
                confidence_label="High confidence",
                needs_verification=False,
                generation_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                provider="mock_engine",
                created_at=datetime.now(timezone.utc).isoformat()
            )

        system_prompt = (
            "You are an expert exam, academic, and technical question solver. "
            "Examine the provided image carefully to locate any question text and multiple-choice options. "
            "Output valid JSON ONLY with the following schema:\n"
            "{\n"
            '  "question": "The extracted question text",\n'
            '  "options": ["A) ...", "B) ...", ...],\n'
            '  "selected_option": "A" or "B" or "C" or "D" or null,\n'
            '  "answer": "Concise answer text",\n'
            '  "explanation": "Brief reasoning explaining why this option is correct",\n'
            '  "confidence_label": "High confidence" | "Needs verification" | "Question unclear",\n'
            '  "needs_verification": false | true\n'
            "}"
        )

        user_content = [
            {
                "type": "text",
                "text": f"Extract and answer the question in this image. Language requested: {language}."
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{mime_type};base64,{image_base64}"
                }
            }
        ]

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                temperature=0.2,
                max_tokens=600,
                response_format={"type": "json_object"}
            )
            raw = response.choices[0].message.content or "{}"
            data = json.loads(raw)

            return QuestionAnswerResponse(
                question_id=q_id,
                question=data.get("question", "Question from image"),
                options=data.get("options", []),
                answer=data.get("answer", "Answer identified"),
                selected_option=data.get("selected_option"),
                explanation=data.get("explanation", ""),
                status="answered" if data.get("answer") else "unclear",
                confidence_label=data.get("confidence_label", "High confidence"),
                needs_verification=data.get("needs_verification", False),
                generation_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                provider="openai",
                created_at=datetime.now(timezone.utc).isoformat()
            )
        except Exception as e:
            return QuestionAnswerResponse(
                question_id=q_id,
                question="Image processing failed",
                options=[],
                answer="Unable to process image",
                selected_option=None,
                explanation=f"Error communicating with vision model: {str(e)}",
                status="error",
                confidence_label="Needs verification",
                needs_verification=True,
                generation_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                provider="openai_error",
                created_at=datetime.now(timezone.utc).isoformat()
            )

    async def _call_openai(self, req: QuestionRequest, q_id: str) -> QuestionAnswerResponse:
        system_prompt = (
            "You are a rigorous, academic, and technical question-solving AI. "
            "Analyze the given question and available options carefully. "
            "Solve independently, verify step-by-step, and return the most accurate answer. "
            "If the question is multiple-choice, identify the exact option letter (e.g. 'A', 'B', 'C', 'D'). "
            "If the question is incomplete, ambiguous, or unanswerable, explicitly declare it and set "
            "confidence_label to 'Question unclear' or 'Needs verification'.\n"
            "Return ONLY a JSON object matching this schema:\n"
            "{\n"
            '  "answer": "Exact answer text or formula",\n'
            '  "selected_option": "A" or "B" or "C" or "D" or null,\n'
            '  "explanation": "Brief, precise explanation (2-4 sentences)",\n'
            '  "confidence_label": "High confidence" | "Needs verification" | "Question unclear",\n'
            '  "needs_verification": false | true\n'
            "}"
        )

        options_str = "\n".join([f"- {opt}" for opt in (req.options or [])])
        prompt_content = f"Question: {req.question}\n\n"
        if options_str:
            prompt_content += f"Options:\n{options_str}\n\n"
        prompt_content += f"Subject Domain: {req.subject or 'General'}\n"
        prompt_content += f"Preferred Explanation Language: {req.language or 'English'}\n"

        if req.raw_ocr_text:
            prompt_content += f"\nContext/Raw OCR:\n{req.raw_ocr_text[:400]}"

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt_content}
            ],
            temperature=0.1,
            max_tokens=400,
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content or "{}"
        try:
            data = json.loads(content)
        except json.JSONDecodeError:
            # Fallback regex parsing if JSON malformed
            data = self._salvage_json(content)

        return QuestionAnswerResponse(
            question_id=q_id,
            question=req.question,
            options=req.options or [],
            answer=data.get("answer", "Answer could not be extracted"),
            selected_option=data.get("selected_option"),
            explanation=data.get("explanation", "Reasoning provided by AI model."),
            status="answered" if data.get("answer") else "unclear",
            confidence_label=data.get("confidence_label", "High confidence"),
            needs_verification=bool(data.get("needs_verification", False)),
            generation_time_ms=0.0,
            provider="openai",
            created_at=datetime.now(timezone.utc).isoformat()
        )

    def _salvage_json(self, raw: str) -> Dict[str, Any]:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                pass
        return {
            "answer": "Answer processed",
            "selected_option": None,
            "explanation": raw[:200],
            "confidence_label": "Needs verification",
            "needs_verification": True
        }

    def _build_error_or_mock_response(
        self,
        req: QuestionRequest,
        q_id: str,
        start_time: float,
        error_msg: str,
        fallback_to_mock: bool = True
    ) -> QuestionAnswerResponse:
        if fallback_to_mock:
            # Fall back to mock with notice
            mock_res = self._solve_with_mock_engine(req, q_id)
            mock_res.explanation = f"[Mock Mode - {error_msg}] {mock_res.explanation}"
            mock_res.generation_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            mock_res.provider = "mock_engine (fallback)"
            return mock_res
        return QuestionAnswerResponse(
            question_id=q_id,
            question=req.question,
            options=req.options or [],
            answer="Error obtaining AI response",
            selected_option=None,
            explanation=error_msg,
            status="error",
            confidence_label="Needs verification",
            needs_verification=True,
            generation_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
            provider="error",
            created_at=datetime.now(timezone.utc).isoformat()
        )

    def _solve_with_mock_engine(self, req: QuestionRequest, q_id: str) -> QuestionAnswerResponse:
        """Deterministic intelligent mock engine for testing and local dev without API keys."""
        text = req.question.lower()
        options = req.options or []

        # Knowledge heuristics
        rules = [
            (
                ["lifo", "last in"],
                "Stack",
                "A Stack is a linear data structure that operates under the LIFO (Last In, First Out) principle where insertions and deletions happen at the top.",
                "High confidence"
            ),
            (
                ["fifo", "first in"],
                "Queue",
                "A Queue adheres to the FIFO (First In, First Out) principle where elements are enqueued at the rear and dequeued from the front.",
                "High confidence"
            ),
            (
                ["binary search", "time complexity"],
                "O(log n)",
                "Binary search repeatedly divides the search interval in half on sorted collections, yielding logarithmic time complexity O(log n).",
                "High confidence"
            ),
            (
                ["constant time", "hash table", "hash map"],
                "O(1)",
                "Average case lookup, insertion, and deletion in a well-balanced hash map operate in O(1) constant time.",
                "High confidence"
            ),
            (
                ["capital of france"],
                "Paris",
                "Paris has been the capital and economic center of France since the Middle Ages.",
                "High confidence"
            ),
            (
                ["http", "protocol", "port 80"],
                "HTTP",
                "Standard unencrypted Hypertext Transfer Protocol (HTTP) traffic runs over default TCP port 80.",
                "High confidence"
            ),
            (
                ["https", "port 443"],
                "HTTPS",
                "HTTPS operates with TLS/SSL encryption by default on port 443.",
                "High confidence"
            ),
            (
                ["speed of light", "vacuum"],
                "299,792,458 m/s",
                "The speed of light in vacuum is defined exactly as 299,792,458 meters per second.",
                "High confidence"
            ),
            (
                ["primary colors", "light", "rgb"],
                "Red, Green, Blue",
                "In additive color theory for electronic screens and light, Red, Green, and Blue are the primary components.",
                "High confidence"
            )
        ]

        # Match heuristics
        for keywords, ans_text, explanation, confidence in rules:
            if any(k in text for k in keywords):
                matched_option_key = self._find_matching_option(ans_text, options)
                return QuestionAnswerResponse(
                    question_id=q_id,
                    question=req.question,
                    options=options,
                    answer=ans_text,
                    selected_option=matched_option_key,
                    explanation=f"[Mock Mode] {explanation}",
                    status="answered",
                    confidence_label=confidence,
                    needs_verification=False,
                    provider="mock_engine",
                    created_at=datetime.now(timezone.utc).isoformat()
                )

        # Math expression heuristic (e.g. 15 * 4, 12 + 25)
        math_match = re.search(r"(\d+)\s*([\+\-\*\/])\s*(\d+)", text)
        if math_match:
            try:
                a = int(math_match.group(1))
                op = math_match.group(2)
                b = int(math_match.group(3))
                val = {"+": a + b, "-": a - b, "*": a * b, "/": round(a / b, 2) if b != 0 else 0}[op]
                val_str = str(val)
                matched_opt = self._find_matching_option(val_str, options)
                return QuestionAnswerResponse(
                    question_id=q_id,
                    question=req.question,
                    options=options,
                    answer=val_str,
                    selected_option=matched_opt,
                    explanation=f"[Mock Mode] Deterministic math evaluation: {a} {op} {b} = {val}.",
                    status="answered",
                    confidence_label="High confidence",
                    needs_verification=False,
                    provider="mock_engine",
                    created_at=datetime.now(timezone.utc).isoformat()
                )
            except Exception:
                pass

        # If options are given, choose option B or most relevant option
        if options:
            selected_idx = 1 if len(options) > 1 else 0
            opt_letter = chr(65 + selected_idx)
            chosen_opt = options[selected_idx]
            cleaned_opt_val = re.sub(r"^[A-Da-d][\.\)\:\s]+", "", chosen_opt).strip()
            return QuestionAnswerResponse(
                question_id=q_id,
                question=req.question,
                options=options,
                answer=cleaned_opt_val or chosen_opt,
                selected_option=opt_letter,
                explanation=f"[Mock Engine] Identified Option {opt_letter} as the best supported answer for this question structure.",
                status="answered",
                confidence_label="Needs verification",
                needs_verification=True,
                provider="mock_engine",
                created_at=datetime.now(timezone.utc).isoformat()
            )

        # General question fallback
        return QuestionAnswerResponse(
            question_id=q_id,
            question=req.question,
            options=[],
            answer="Answer requires active AI key or additional context",
            selected_option=None,
            explanation="[Mock Engine] Question received and parsed successfully. Configure OPENAI_API_KEY in backend/.env for full multimodal reasoning.",
            status="unclear" if len(req.question.split()) < 4 else "answered",
            confidence_label="Needs verification",
            needs_verification=True,
            provider="mock_engine",
            created_at=datetime.now(timezone.utc).isoformat()
        )

    def _find_matching_option(self, target: str, options: List[str]) -> Optional[str]:
        target_clean = target.lower().strip()
        for i, opt in enumerate(options):
            cleaned = re.sub(r"^[A-Da-d][\.\)\:\s]+", "", opt).lower().strip()
            if target_clean in cleaned or cleaned in target_clean:
                # Option letter A, B, C, D
                letter_match = re.match(r"^([A-Da-d])[\.\)\:\s]", opt)
                if letter_match:
                    return letter_match.group(1).upper()
                return chr(65 + i)
        return chr(65 + 1) if len(options) > 1 else ("A" if options else None)


ai_service = AIService()
