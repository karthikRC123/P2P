"""Paper2Impact AI — FastAPI Application."""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import papers, scoring, decisions, proposals, approvals


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    print("🚀 Paper2Impact AI starting up...")
    
    # Create required directories
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)

    # Initialize database
    init_db()
    print("✅ Database initialized.")
    
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "gsk_your_api_key_here":
        print("⚠️  WARNING: GROQ_API_KEY is not set. AI scoring will use fallback heuristics.")
    else:
        print("✅ Groq API key configured.")

    print("✅ Paper2Impact AI is ready!")
    
    yield
    
    # Shutdown
    print("👋 Paper2Impact AI shutting down.")


app = FastAPI(
    title="Paper2Impact AI",
    description="Transform research papers into validated product opportunities.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(papers.router)
app.include_router(scoring.router)
app.include_router(decisions.router)
app.include_router(proposals.router)
app.include_router(approvals.router)


@app.get("/")
def root():
    """Health check endpoint."""
    return {
        "app": "Paper2Impact AI",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/api/health")
def health_check():
    """API health check."""
    return {"status": "healthy"}
