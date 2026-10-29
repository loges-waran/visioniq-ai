from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.database.database import init_db
from backend.app.api.routes import router as main_router
from backend.app.api.history import router as history_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema
    await init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="VisionIQ AI - Real-Time Camera-Based Question Detection & AI Answering Platform Backend",
    lifespan=lifespan
)

# CORS configuration
origins = settings.cors_origins
# Also allow local dev environments
origins.extend([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
])
# Remove duplicates
origins = list(set([o for o in origins if o]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers under /api
app.include_router(main_router, prefix=settings.API_PREFIX)
app.include_router(history_router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "tagline": "See the Question. Understand the Answer.",
        "status": "online",
        "api_docs": "/docs"
    }
