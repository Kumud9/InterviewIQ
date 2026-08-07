from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="candidate")  # "candidate" or "admin"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    candidate = relationship("Candidate", back_populates="user", uselist=False)

class Candidate(Base):
    __tablename__ = "candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    name = Column(String, nullable=False)
    resume_url = Column(String, nullable=True)
    skills = Column(Text, default="[]")  # JSON array
    learning_journey = Column(Text, default="[]")  # JSON array of curriculum days/topics completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="candidate")
    interviews = relationship("Interview", back_populates="candidate", cascade="all, delete-orphan")

class Curriculum(Base):
    __tablename__ = "curriculums"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    modules = Column(Text, nullable=False)  # JSON representation of all modules and objectives
    version = Column(String, default="1.0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    interviews = relationship("Interview", back_populates="curriculum")

class Interview(Base):
    __tablename__ = "interviews"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    curriculum_id = Column(Integer, ForeignKey("curriculums.id"), nullable=True)
    status = Column(String, default="in_progress")  # "in_progress", "completed"
    difficulty = Column(String, default="Mid")  # "Junior", "Mid", "Senior", "Lead"
    focus_topics = Column(Text, default="[]")  # JSON array of focus strings
    ai_model = Column(String, default="gpt-4o-mini")
    interview_length = Column(Integer, default=8)
    average_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    candidate = relationship("Candidate", back_populates="interviews")
    curriculum = relationship("Curriculum", back_populates="interviews")
    questions = relationship("Question", back_populates="interview", cascade="all, delete-orphan", order_by="Question.order_index")
    feedback_report = relationship("FeedbackReport", back_populates="interview", uselist=False, cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=False)
    content = Column(Text, nullable=False)
    topic = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    order_index = Column(Integer, nullable=False)
    question_type = Column(String, nullable=False)  # "conceptual", "scenario", "debug", "design"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    interview = relationship("Interview", back_populates="questions")
    answer = relationship("Answer", back_populates="question", uselist=False, cascade="all, delete-orphan")
    evaluation = relationship("Evaluation", back_populates="question", uselist=False, cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"
    
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), unique=True, nullable=False)
    content = Column(Text, nullable=False)
    audio_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    question = relationship("Question", back_populates="answer")

class Evaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), unique=True, nullable=False)
    accuracy_score = Column(Float, nullable=False)  # 0 to 100
    communication_score = Column(Float, nullable=False)  # 0 to 100
    depth_score = Column(Float, nullable=False)  # 0 to 100
    problem_solving_score = Column(Float, nullable=False)  # 0 to 100
    feedback = Column(Text, nullable=False)
    weak_points = Column(Text, default="[]")  # JSON string
    strong_points = Column(Text, default="[]")  # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    question = relationship("Question", back_populates="evaluation")

class FeedbackReport(Base):
    __tablename__ = "feedback_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"), unique=True, nullable=False)
    overall_score = Column(Float, nullable=False)  # 0 to 100
    technical_accuracy = Column(Float, nullable=False)
    communication = Column(Float, nullable=False)
    depth = Column(Float, nullable=False)
    problem_solving = Column(Float, nullable=False)
    system_design = Column(Float, nullable=False)
    candidate_confidence = Column(Float, nullable=False)  # Overall confidence level estimated
    strengths = Column(Text, default="[]")  # JSON array
    weaknesses = Column(Text, default="[]")  # JSON array
    recommendations = Column(Text, default="[]")  # JSON array
    learning_path = Column(Text, default="{}")  # JSON object containing recommended videos, docs, and problems
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    interview = relationship("Interview", back_populates="feedback_report")
