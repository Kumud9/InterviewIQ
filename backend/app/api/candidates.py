import json
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.db import models, schemas

router = APIRouter()

@router.get("", response_model=List[schemas.CandidateResponse])
def get_candidates(
    db: Session = Depends(get_db)
) -> Any:
    """
    Get all candidates (No authentication required).
    """
    candidates = db.query(models.Candidate).all()
    
    response = []
    for cand in candidates:
        skills_list = json.loads(cand.skills) if isinstance(cand.skills, str) else cand.skills
        journey_list = json.loads(cand.learning_journey) if isinstance(cand.learning_journey, str) else cand.learning_journey
        response.append(
            schemas.CandidateResponse(
                id=cand.id,
                user_id=cand.user_id,
                name=cand.name,
                resume_url=cand.resume_url,
                skills=skills_list,
                learning_journey=journey_list,
                created_at=cand.created_at
            )
        )
    return response

@router.get("/me", response_model=schemas.CandidateResponse)
def get_my_candidate_profile(
    current_candidate: models.Candidate = Depends(deps.get_current_candidate)
) -> Any:
    """
    Get profile for current logged-in candidate.
    """
    skills_list = json.loads(current_candidate.skills) if isinstance(current_candidate.skills, str) else current_candidate.skills
    journey_list = json.loads(current_candidate.learning_journey) if isinstance(current_candidate.learning_journey, str) else current_candidate.learning_journey
    
    return schemas.CandidateResponse(
        id=current_candidate.id,
        user_id=current_candidate.user_id,
        name=current_candidate.name,
        resume_url=current_candidate.resume_url,
        skills=skills_list,
        learning_journey=journey_list,
        created_at=current_candidate.created_at
    )

@router.get("/{candidate_id}", response_model=schemas.CandidateResponse)
def get_candidate_by_id(
    candidate_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get candidate profile by id (No authentication required).
    """
    cand = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
            
    skills_list = json.loads(cand.skills) if isinstance(cand.skills, str) else cand.skills
    journey_list = json.loads(cand.learning_journey) if isinstance(cand.learning_journey, str) else cand.learning_journey
    
    return schemas.CandidateResponse(
        id=cand.id,
        user_id=cand.user_id,
        name=cand.name,
        resume_url=cand.resume_url,
        skills=skills_list,
        journey_list=journey_list,
        created_at=cand.created_at
    )

@router.put("/me", response_model=schemas.CandidateResponse)
def update_candidate_profile(
    profile_in: schemas.CandidateBase,
    db: Session = Depends(get_db),
    current_candidate: models.Candidate = Depends(deps.get_current_candidate)
) -> Any:
    """
    Update candidate's own skills and profile parameters.
    """
    current_candidate.name = profile_in.name
    current_candidate.resume_url = profile_in.resume_url
    current_candidate.skills = json.dumps(profile_in.skills)
    current_candidate.learning_journey = json.dumps(profile_in.learning_journey)
    
    db.add(current_candidate)
    db.commit()
    db.refresh(current_candidate)
    
    skills_list = json.loads(current_candidate.skills) if isinstance(current_candidate.skills, str) else current_candidate.skills
    journey_list = json.loads(current_candidate.learning_journey) if isinstance(current_candidate.learning_journey, str) else current_candidate.learning_journey
    
    return schemas.CandidateResponse(
        id=current_candidate.id,
        user_id=current_candidate.user_id,
        name=current_candidate.name,
        resume_url=current_candidate.resume_url,
        skills=skills_list,
        learning_journey=journey_list,
        created_at=current_candidate.created_at
    )
