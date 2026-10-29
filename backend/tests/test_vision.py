import io
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest.mark.asyncio
async def test_vision_invalid_mime():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        file_content = b"fake-text-file"
        files = {"file": ("test.txt", file_content, "text/plain")}
        res = await client.post("/api/questions/answer-image", files=files)
        assert res.status_code == 400
        assert "Unsupported file type" in res.json()["detail"]


@pytest.mark.asyncio
async def test_vision_valid_image():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1x1 dummy jpeg byte stream
        dummy_jpeg = (
            b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb"
            b"\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r"
            b"\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $."
            b"' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01"
            b"\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01"
            b"\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b"
            b"\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
        )
        files = {"file": ("test.jpg", dummy_jpeg, "image/jpeg")}
        res = await client.post("/api/questions/answer-image", files=files)
        assert res.status_code == 200
        data = res.json()
        assert "question_id" in data
        assert "answer" in data
        assert data["status"] in ["answered", "unclear"]
