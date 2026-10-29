from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, desc

from backend.app.database.database import get_db
from backend.app.database.models import QuestionHistoryModel
from backend.app.schemas.question import HistoryListResponse, HistoryItem
from backend.app.core.config import settings

router = APIRouter(prefix="/history", tags=["History"])


@router.get("", response_model=HistoryListResponse)
async def get_history(
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve saved question history if history is enabled."""
    if not settings.ENABLE_HISTORY_BY_DEFAULT:
        return HistoryListResponse(items=[], total=0)

    stmt = (
        select(QuestionHistoryModel)
        .order_by(desc(QuestionHistoryModel.created_at))
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    items = [
        HistoryItem(
            id=row.id,
            question=row.question,
            options=row.options,
            answer=row.answer,
            selected_option=row.selected_option,
            explanation=row.explanation,
            confidence_label=row.confidence_label,
            created_at=row.created_at.isoformat() if row.created_at else ""
        )
        for row in rows
    ]

    count_stmt = select(QuestionHistoryModel)
    total_res = await db.execute(count_stmt)
    total = len(total_res.scalars().all())

    return HistoryListResponse(items=items, total=total)


@router.delete("")
async def clear_history(db: AsyncSession = Depends(get_db)):
    """Clear all saved question history when requested."""
    stmt = delete(QuestionHistoryModel)
    await db.execute(stmt)
    await db.commit()
    return {"status": "success", "message": "Question history cleared successfully."}
