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

# Automatically seed database from JSON files on startup
def seed_db():
    from app.core.database import SessionLocal
    from app.db import models
    from app.core import security
    import json
    import os
    
    db = SessionLocal()
    try:
        # 1. Seed Curriculum
        existing_cur = db.query(models.Curriculum).first()
        if not existing_cur:
            logger.info("Seeding default curriculum from file...")
            path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "curriculum.json")
            if not os.path.exists(path):
                path = "/data/curriculum.json"
            if os.path.exists(path):
                with open(path, "r", encoding="utf-8") as f:
                    curr_data = json.load(f)
                db_cur = models.Curriculum(
                    name=curr_data.get("cohort", "Enterprise AI Engineering Path"),
                    version="1.0",
                    modules=json.dumps(curr_data.get("modules", []))
                )
                db.add(db_cur)
                db.commit()
                logger.info("Curriculum successfully seeded.")
            else:
                logger.warning(f"curriculum.json not found at {path} for seeding.")
                
        # 2. Seed Candidates and Users
        existing_cand = db.query(models.Candidate).first()
        if not existing_cand:
            logger.info("Seeding default candidates and users from file...")
            path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "candidates.json")
            if not os.path.exists(path):
                path = "/data/candidates.json"
            if os.path.exists(path):
                with open(path, "r", encoding="utf-8") as f:
                    cand_data = json.load(f)
                candidates_list = cand_data.get("candidates", [])
                
                for idx, c in enumerate(candidates_list):
                    member = c.get("member", {})
                    name = member.get("name", "Unknown")
                    email = f"candidate{idx+1}@stripe.com" if idx == 0 else f"candidate-{idx+1}@example.com"
                    
                    # Create User
                    hashed_pw = security.get_password_hash("password123")
                    db_user = models.User(
                        email=email,
                        hashed_password=hashed_pw,
                        role="candidate"
                    )
                    db.add(db_user)
                    db.commit()
                    db.refresh(db_user)
                    
                    # Create Candidate
                    skills = [member.get("jobRole", ""), member.get("education", "")]
                    learning_journey = [f"Day {m.get('day')}: {m.get('title')}" for m in c.get("missions", []) if m.get("passed")]
                    db_candidate = models.Candidate(
                        id=idx + 1,
                        user_id=db_user.id,
                        name=name,
                        skills=json.dumps(skills),
                        learning_journey=json.dumps(learning_journey)
                    )
                    db.add(db_candidate)
                    db.commit()
                logger.info("Candidates and users successfully seeded.")
            else:
                logger.warning(f"candidates.json not found at {path} for seeding.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()

seed_db()

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
