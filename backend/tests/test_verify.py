import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest.mark.asyncio
async def test_verify_valid_option():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "question": "Which data structure follows the LIFO principle?",
            "options": ["Queue", "Stack", "Tree", "Graph"],
            "proposed_answer": "Stack",
            "proposed_option": "B"
        }
        response = await client.post("/api/questions/verify", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["is_verified"] is True
        assert data["confidence_label"] == "High confidence"


@pytest.mark.asyncio
async def test_verify_invalid_option():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "question": "Which data structure follows the LIFO principle?",
            "options": ["Queue", "Stack"],
            "proposed_answer": "Stack",
            "proposed_option": "Z"  # Option Z does not exist
        }
        response = await client.post("/api/questions/verify", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["is_verified"] is False
        assert data["confidence_label"] == "Needs verification"


@pytest.mark.asyncio
async def test_verify_math_sanity():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Correct math
        response = await client.post("/api/questions/verify", json={
            "question": "Evaluate 25 + 75",
            "options": ["50", "100"],
            "proposed_answer": "100",
            "proposed_option": "B"
        })
        assert response.json()["is_verified"] is True

        # Incorrect math answer
        response_bad = await client.post("/api/questions/verify", json={
            "question": "Evaluate 25 + 75",
            "options": ["50", "999"],
            "proposed_answer": "999",
            "proposed_option": "B"
        })
        assert response_bad.json()["is_verified"] is False
