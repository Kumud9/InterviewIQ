import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, candidates, curriculum, interview, analytics

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Create database tables automatically on startup
logger.info("Initializing database tables...")
Base.metadata.create_all(bind=engine)
logger.info("Database tables initialized successfully.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise AI Interview Platform API",
    version="1.0"
)

# Set CORS middleware (essential for Next.js communication)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify front-end domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(candidates.router, prefix=f"{settings.API_V1_STR}/candidates", tags=["Candidates"])
app.include_router(curriculum.router, prefix=f"{settings.API_V1_STR}/curriculum", tags=["Curriculum"])
app.include_router(interview.router, prefix=f"{settings.API_V1_STR}/interview", tags=["Interviews"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": "1.0",
        "mode": "Simulator" if settings.SIMULATOR_MODE or not settings.OPENAI_API_KEY else "Real LLM Agents"
    }
