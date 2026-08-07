import json
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.db import models, schemas

router = APIRouter()

DEFAULT_CURRICULUM = {
    "name": "Enterprise AI Engineering Path",
    "version": "1.0",
    "modules": [
        {
            "id": "module_1",
            "name": "RAG Basics & Document Indexing",
            "objectives": [
                "Understand the mechanics of Retrieval-Augmented Generation.",
                "Implement chunking strategies (fixed, overlapping, semantic).",
                "Parse and clean raw document structures."
            ]
        },
        {
            "id": "module_2",
            "name": "Vector Databases & Embeddings",
            "objectives": [
                "Configure and query vector similarity indices.",
                "Understand vector distance metrics (Cosine, Euclidean).",
                "Compare Pinecone, Qdrant, and local vector stores."
            ]
        },
        {
            "id": "module_3",
            "name": "Retrieval Optimization",
            "objectives": [
                "Implement Hybrid Search (Dense + Sparse).",
                "Add Cross-Encoder Re-ranking to first-stage retrieval.",
                "Tune chunk size and overlap parameters based on recall."
            ]
        },
        {
            "id": "module_4",
            "name": "Model Context Protocol & Deployments",
            "objectives": [
                "Configure secure Model Context Protocol (MCP) host servers.",
                "Implement agentic tool call schemas and error handling.",
                "Deploy production-ready scalable vector indexes."
            ]
        }
    ]
}

def seed_default_curriculum(db: Session) -> models.Curriculum:
    existing = db.query(models.Curriculum).first()
    if existing:
        return existing
        
    db_curriculum = models.Curriculum(
        name=DEFAULT_CURRICULUM["name"],
        version=DEFAULT_CURRICULUM["version"],
        modules=json.dumps(DEFAULT_CURRICULUM["modules"])
    )
    db.add(db_curriculum)
    db.commit()
    db.refresh(db_curriculum)
    return db_curriculum

@router.get("", response_model=List[schemas.CurriculumResponse])
def get_curriculums(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get all curriculums. Automatically seeds a default one if empty.
    """
    curriculums = db.query(models.Curriculum).all()
    if not curriculums:
        default_cur = seed_default_curriculum(db)
        curriculums = [default_cur]
        
    # Convert modules JSON string to list for schema serialization
    response = []
    for cur in curriculums:
        modules_list = json.loads(cur.modules) if isinstance(cur.modules, str) else cur.modules
        response.append(
            schemas.CurriculumResponse(
                id=cur.id,
                name=cur.name,
                modules=modules_list,
                version=cur.version,
                created_at=cur.created_at
            )
        )
    return response

@router.post("/upload", response_model=schemas.CurriculumResponse)
def upload_curriculum(
    curriculum_in: schemas.CurriculumCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin)
) -> Any:
    """
    Upload a new curriculum JSON (Admin only).
    """
    db_curriculum = models.Curriculum(
        name=curriculum_in.name,
        version=curriculum_in.version or "1.0",
        modules=json.dumps(curriculum_in.modules)
    )
    db.add(db_curriculum)
    db.commit()
    db.refresh(db_curriculum)
    
    modules_list = json.loads(db_curriculum.modules) if isinstance(db_curriculum.modules, str) else db_curriculum.modules
    return schemas.CurriculumResponse(
        id=db_curriculum.id,
        name=db_curriculum.name,
        modules=modules_list,
        version=db_curriculum.version,
        created_at=db_curriculum.created_at
    )
