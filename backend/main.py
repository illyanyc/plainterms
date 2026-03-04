import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.analyze import router as analyze_router
from routers.auth import router as auth_router
from routers.billing import router as billing_router
from utils.cache import analysis_cache, reputation_cache
from services.user_store import user_store

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    analysis_cache.cleanup()
    reputation_cache.cleanup()


app = FastAPI(
    title="PlainTerms API",
    version="1.0.0",
    description="Backend API for PlainTerms Chrome Extension",
    lifespan=lifespan,
)

cors_origins = os.environ.get("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(auth_router)
app.include_router(billing_router)


@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
