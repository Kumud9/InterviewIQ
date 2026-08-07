from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.db import models, schemas

router = APIRouter()

@router.post("/register", response_model=schemas.Token)
def register(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Register a new user and automatically create their Candidate profile.
    """
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    hashed_password = security.get_password_hash(user_in.password)
    db_user = models.User(
        email=user_in.email,
        hashed_password=hashed_password,
        role=user_in.role or "candidate"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Auto-create Candidate Profile
    db_candidate = models.Candidate(
        user_id=db_user.id,
        name=user_in.name,
        skills="[]",
        learning_journey="[]"
    )
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    
    access_token = security.create_access_token(subject=db_user.email)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "email": db_user.email,
        "role": db_user.role,
        "candidate_id": db_candidate.id,
        "candidate_name": db_candidate.name
    }

@router.post("/login", response_model=schemas.Token)
def login(
    user_in: schemas.UserLogin,
    db: Session = Depends(get_db)
) -> Any:
    """
    Login with email and password (JSON format).
    """
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not user or not security.verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
        
    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
    candidate_id = candidate.id if candidate else None
    candidate_name = candidate.name if candidate else None
    
    access_token = security.create_access_token(subject=user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "email": user.email,
        "role": user.role,
        "candidate_id": candidate_id,
        "candidate_name": candidate_name
    }

@router.post("/login/oauth", response_model=schemas.Token)
def login_oauth(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    OAuth2 compatible token login, for docs UI/third party tools.
    """
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
        
    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
    candidate_id = candidate.id if candidate else None
    candidate_name = candidate.name if candidate else None
    
    access_token = security.create_access_token(subject=user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "email": user.email,
        "role": user.role,
        "candidate_id": candidate_id,
        "candidate_name": candidate_name
    }
