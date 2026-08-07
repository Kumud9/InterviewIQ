from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    email: str
    role: str
    candidate_id: Optional[int] = None
    candidate_name: Optional[str] = None

class TokenData(BaseModel):
    email: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    name: str  # For creating the candidate record simultaneously
    role: Optional[str] = "candidate"

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Candidate Schemas
class CandidateBase(BaseModel):
    name: str
    resume_url: Optional[str] = None
    skills: List[str] = []
    learning_journey: List[str] = []

class CandidateCreate(CandidateBase):
    user_id: int

class CandidateResponse(BaseModel):
    id: int
    user_id: int
    name: str
    resume_url: Optional[str] = None
    skills: List[str] = []
    learning_journey: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True

# Curriculum Schemas
class CurriculumBase(BaseModel):
    name: str
    modules: List[Dict[str, Any]]
    version: Optional[str] = "1.0"

class CurriculumCreate(CurriculumBase):
    pass

class CurriculumResponse(BaseModel):
    id: int
    name: str
    modules: List[Dict[str, Any]]
    version: str
    created_at: datetime

    class Config:
        from_attributes = True

# Interview Schemas
class InterviewStartRequest(BaseModel):
    candidate_id: int
    curriculum_id: Optional[int] = None
    difficulty: str = "Mid"  # "Junior", "Mid", "Senior", "Lead"
    focus_topics: List[str] = []
    ai_model: str = "gpt-4o-mini"
    interview_length: int = 8

class AnswerSubmitRequest(BaseModel):
    interview_id: int
    question_id: int
    content: str
    audio_url: Optional[str] = None

# Question & Answer Schemas
class AnswerResponse(BaseModel):
    id: int
    content: str
    audio_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class EvaluationResponse(BaseModel):
    id: int
    accuracy_score: float
    communication_score: float
    depth_score: float
    problem_solving_score: float
    feedback: str
    weak_points: List[str]
    strong_points: List[str]

    class Config:
        from_attributes = True

class QuestionResponse(BaseModel):
    id: int
    content: str
    topic: str
    difficulty: str
    order_index: int
    question_type: str
    answer: Optional[AnswerResponse] = None
    evaluation: Optional[EvaluationResponse] = None

    class Config:
        from_attributes = True

class FeedbackReportResponse(BaseModel):
    id: int
    interview_id: int
    overall_score: float
    technical_accuracy: float
    communication: float
    depth: float
    problem_solving: float
    system_design: float
    candidate_confidence: float
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    learning_path: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class InterviewResponse(BaseModel):
    id: int
    candidate_id: int
    curriculum_id: Optional[int]
    status: str
    difficulty: str
    focus_topics: List[str]
    ai_model: str
    interview_length: int
    average_score: Optional[float] = None
    created_at: datetime
    questions: List[QuestionResponse] = []
    feedback_report: Optional[FeedbackReportResponse] = None

    class Config:
        from_attributes = True

# Analytics Schemas
class OrgAnalytics(BaseModel):
    total_interviews: int
    average_score: float
    completion_rate: float
    weak_topics: List[Dict[str, Any]]
    strong_topics: List[Dict[str, Any]]
    skill_rankings: List[Dict[str, Any]]
    daily_activity: List[Dict[str, Any]]
    interview_heatmap: List[Dict[str, Any]]
