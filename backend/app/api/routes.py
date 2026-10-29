import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.schemas.question import (
    HealthResponse,
    QuestionRequest,
    QuestionAnswerResponse,
    VerificationRequest,
    VerificationResponse,
)
from backend.app.services.ai_service import ai_service
from backend.app.services.verifier_service import verifier_service
from backend.app.database.database import get_db
from backend.app.database.models import QuestionHistoryModel

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health and configuration check. Never exposes API keys or secrets."""
    return HealthResponse(
        status="healthy",
        ai_configured=settings.is_ai_configured,
        model=settings.OPENAI_MODEL,
        history_enabled=settings.ENABLE_HISTORY_BY_DEFAULT,
        version=settings.VERSION,
    )


@router.post("/questions/answer", response_model=QuestionAnswerResponse)
async def answer_question(req: QuestionRequest, db: AsyncSession = Depends(get_db)):
    """Accept structured question and options, query AI model, and return validated answer."""
    if not req.question or len(req.question.strip()) < 3:
        raise HTTPException(status_code=400, detail="Question text is too short or missing.")

    response = await ai_service.answer_question(req)

    # Optional: perform immediate sanity check
    if response.selected_option and req.options:
        verify_check = verifier_service.verify_answer(
            VerificationRequest(
                question=req.question,
                options=req.options,
                proposed_answer=response.answer,
                proposed_option=response.selected_option
            )
        )
        if not verify_check.is_verified:
            response.needs_verification = True
            response.confidence_label = verify_check.confidence_label

    # Save to history if enabled
    if settings.ENABLE_HISTORY_BY_DEFAULT:
        try:
            history_entry = QuestionHistoryModel(
                id=response.question_id,
                question=response.question,
                answer=response.answer,
                selected_option=response.selected_option,
                explanation=response.explanation,
                confidence_label=response.confidence_label,
                needs_verification=response.needs_verification,
                generation_time_ms=response.generation_time_ms,
                provider=response.provider
            )
            history_entry.options = response.options
            db.add(history_entry)
            await db.commit()
        except Exception:
            # History write failure should not block answering
            await db.rollback()

    return response


@router.post("/questions/answer-image", response_model=QuestionAnswerResponse)
async def answer_question_from_image(
    file: UploadFile = File(...),
    language: str = Form("English"),
    db: AsyncSession = Depends(get_db)
):
    """
    Accept an explicitly submitted image frame, process via vision model,
    and return extracted question and structured answer.
    Does not persist the raw image to disk.
    """
    # Validate mime type
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Must be JPEG, PNG, or WebP."
        )

    # Validate file size
    contents = await file.read()
    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Image size exceeds limit of {settings.MAX_IMAGE_SIZE_MB}MB."
        )

    # Base64 encode for API transmission
    b64_str = base64.b64encode(contents).decode("utf-8")

    response = await ai_service.answer_image(
        image_base64=b64_str,
        mime_type=file.content_type,
        language=language
    )

    if settings.ENABLE_HISTORY_BY_DEFAULT and response.status == "answered":
        try:
            history_entry = QuestionHistoryModel(
                id=response.question_id,
                question=response.question,
                answer=response.answer,
                selected_option=response.selected_option,
                explanation=response.explanation,
                confidence_label=response.confidence_label,
                needs_verification=response.needs_verification,
                generation_time_ms=response.generation_time_ms,
                provider=response.provider
            )
            history_entry.options = response.options
            db.add(history_entry)
            await db.commit()
        except Exception:
            await db.rollback()

    return response


@router.post("/questions/verify", response_model=VerificationResponse)
async def verify_question(req: VerificationRequest):
    """
    Perform independent validation check on an answer without re-running the full model.
    """
    return verifier_service.verify_answer(req)
