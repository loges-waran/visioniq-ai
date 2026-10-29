import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest.mark.asyncio
async def test_history_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # First clear history
        del_res = await client.delete("/api/history")
        assert del_res.status_code == 200

        # Ask a question to trigger history insertion
        ans_res = await client.post("/api/questions/answer", json={
            "question": "What is the capital of France?",
            "options": ["Paris", "Berlin", "Rome"]
        })
        assert ans_res.status_code == 200

        # Retrieve history
        hist_res = await client.get("/api/history")
        assert hist_res.status_code == 200
        data = hist_res.json()
        assert data["total"] >= 1
        assert any("France" in item["question"] for item in data["items"])

        # Clear history again
        clear_res = await client.delete("/api/history")
        assert clear_res.status_code == 200

        # Verify empty
        hist_empty = await client.get("/api/history")
        assert hist_empty.json()["total"] == 0
