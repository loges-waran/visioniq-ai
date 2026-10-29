import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest.mark.asyncio
async def test_answer_mcq_question():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "question": "Which data structure follows the LIFO principle?",
            "options": [
                "A) Queue",
                "B) Stack",
                "C) Tree",
                "D) Graph"
            ],
            "subject": "Computer Science",
            "language": "English"
        }
        response = await client.post("/api/questions/answer", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "question_id" in data
        assert data["question"] == payload["question"]
        assert len(data["options"]) == 4
        assert "Stack" in data["answer"]
        assert data["selected_option"] == "B"
        assert len(data["explanation"]) > 10
        assert data["confidence_label"] in ["High confidence", "Needs verification", "Question unclear"]


@pytest.mark.asyncio
async def test_answer_math_question():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "question": "What is 15 * 4?",
            "options": ["A) 50", "B) 60", "C) 70", "D) 80"],
            "subject": "Mathematics"
        }
        response = await client.post("/api/questions/answer", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "60" in data["answer"]
        assert data["selected_option"] == "B"


@pytest.mark.asyncio
async def test_answer_validation_error():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Too short or empty question
        response = await client.post("/api/questions/answer", json={"question": ""})
        assert response.status_code == 422  # Pydantic validation error


@pytest.mark.asyncio
async def test_answer_question_without_options():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "question": "What is the capital of France?",
            "options": [],
            "subject": "Geography"
        }
        response = await client.post("/api/questions/answer", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "Paris" in data["answer"]
