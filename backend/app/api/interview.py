import json
import os
from app.core.config import settings
from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.db import models, schemas
from app.agents.engine import agent_engine

router = APIRouter()

def helper_serialize_question(q: models.Question) -> Dict[str, Any]:
    ans = None
    ev = None
    if q.answer:
        ans = {
            "id": q.answer.id,
            "content": q.answer.content,
            "audio_url": q.answer.audio_url,
            "created_at": q.answer.created_at
        }
    if q.evaluation:
        ev = {
            "id": q.evaluation.id,
            "accuracy_score": q.evaluation.accuracy_score,
            "communication_score": q.evaluation.communication_score,
            "depth_score": q.evaluation.depth_score,
            "problem_solving_score": q.evaluation.problem_solving_score,
            "feedback": q.evaluation.feedback,
            "weak_points": json.loads(q.evaluation.weak_points) if isinstance(q.evaluation.weak_points, str) else q.evaluation.weak_points,
            "strong_points": json.loads(q.evaluation.strong_points) if isinstance(q.evaluation.strong_points, str) else q.evaluation.strong_points
        }
    return {
        "id": q.id,
        "content": q.content,
        "topic": q.topic,
        "difficulty": q.difficulty,
        "order_index": q.order_index,
        "question_type": q.question_type,
        "answer": ans,
        "evaluation": ev
    }

def helper_serialize_report(rep: models.FeedbackReport) -> Dict[str, Any]:
    if not rep:
        return None
    return {
        "id": rep.id,
        "interview_id": rep.interview_id,
        "overall_score": rep.overall_score,
        "technical_accuracy": rep.technical_accuracy,
        "communication": rep.communication,
        "depth": rep.depth,
        "problem_solving": rep.problem_solving,
        "system_design": rep.system_design,
        "candidate_confidence": rep.candidate_confidence,
        "strengths": json.loads(rep.strengths) if isinstance(rep.strengths, str) else rep.strengths,
        "weaknesses": json.loads(rep.weaknesses) if isinstance(rep.weaknesses, str) else rep.weaknesses,
        "recommendations": json.loads(rep.recommendations) if isinstance(rep.recommendations, str) else rep.recommendations,
        "learning_path": json.loads(rep.learning_path) if isinstance(rep.learning_path, str) else rep.learning_path,
        "created_at": rep.created_at
    }

def helper_serialize_interview(interview: models.Interview) -> Dict[str, Any]:
    questions = [helper_serialize_question(q) for q in interview.questions]
    report = helper_serialize_report(interview.feedback_report)
    focus = json.loads(interview.focus_topics) if isinstance(interview.focus_topics, str) else interview.focus_topics
    
    return {
        "id": interview.id,
        "candidate_id": interview.candidate_id,
        "curriculum_id": interview.curriculum_id,
        "status": interview.status,
        "difficulty": interview.difficulty,
        "focus_topics": focus,
        "ai_model": interview.ai_model,
        "interview_length": interview.interview_length,
        "average_score": interview.average_score,
        "created_at": interview.created_at,
        "questions": questions,
        "feedback_report": report
    }

@router.post("/start")
def start_interview(
    req: schemas.InterviewStartRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Initialize a new interview session and pre-populate questions list.
    """
    # Verify candidate exists
    candidate = db.query(models.Candidate).filter(models.Candidate.id == req.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # Load candidate profile
    skills_list = json.loads(candidate.skills) if isinstance(candidate.skills, str) else candidate.skills or []
    learning_list = json.loads(candidate.learning_journey) if isinstance(candidate.learning_journey, str) else candidate.learning_journey or []
    candidate_profile = {
        "name": candidate.name,
        "skills": skills_list,
        "learning_journey": learning_list
    }
        
    # Generate questions using Gemini
    questions_list = agent_engine.start_interview_simulation(
        req.difficulty, 
        req.focus_topics, 
        req.interview_length,
        candidate_profile=candidate_profile
    )
    
    # Save interview
    db_interview = models.Interview(
        candidate_id=req.candidate_id,
        curriculum_id=req.curriculum_id,
        status="in_progress",
        difficulty=req.difficulty,
        focus_topics=json.dumps(req.focus_topics),
        ai_model=req.ai_model,
        interview_length=req.interview_length
    )
    db.add(db_interview)
    db.commit()
    db.refresh(db_interview)
    
    # Save planned questions
    for q in questions_list:
        db_question = models.Question(
            interview_id=db_interview.id,
            content=q["content"],
            topic=q["topic"],
            difficulty=req.difficulty,
            order_index=q["order_index"],
            question_type=q["question_type"]
        )
        db.add(db_question)
    
    db.commit()
    db.refresh(db_interview)
    
    return helper_serialize_interview(db_interview)

@router.post("/answer")
def submit_answer(
    req: schemas.AnswerSubmitRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Submit an answer to a question. Evaluates answer dynamically and reports next question.
    """
    interview = db.query(models.Interview).filter(models.Interview.id == req.interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found.")
        
    question = db.query(models.Question).filter(
        models.Question.id == req.question_id, 
        models.Question.interview_id == req.interview_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found in this interview session.")
        
    # Check if already answered
    if question.answer:
        raise HTTPException(status_code=400, detail="This question has already been answered.")
        
    # Save Answer
    db_answer = models.Answer(
        question_id=req.question_id,
        content=req.content,
        audio_url=req.audio_url
    )
    db.add(db_answer)
    db.commit()
    
    # Load candidate profile
    candidate = db.query(models.Candidate).filter(models.Candidate.id == interview.candidate_id).first()
    skills_list = json.loads(candidate.skills) if isinstance(candidate.skills, str) else candidate.skills or []
    learning_list = json.loads(candidate.learning_journey) if isinstance(candidate.learning_journey, str) else candidate.learning_journey or []
    candidate_profile = {
        "name": candidate.name,
        "skills": skills_list,
        "learning_journey": learning_list
    }
    
    # Load history of previously answered questions (excluding current one)
    history_list = []
    answered_questions = db.query(models.Question).filter(
        models.Question.interview_id == interview.id,
        models.Question.answer != None,
        models.Question.id != question.id
    ).order_by(models.Question.order_index).all()
    
    for q in answered_questions:
        ans_text = q.answer.content if q.answer else ""
        ev_data = {
            "accuracy_score": q.evaluation.accuracy_score if q.evaluation else 0.0,
            "depth_score": q.evaluation.depth_score if q.evaluation else 0.0,
            "problem_solving_score": q.evaluation.problem_solving_score if q.evaluation else 0.0,
            "communication_score": q.evaluation.communication_score if q.evaluation else 0.0,
            "feedback": q.evaluation.feedback if q.evaluation else ""
        }
        history_list.append({
            "question": {
                "content": q.content,
                "topic": q.topic,
                "difficulty": q.difficulty,
                "order_index": q.order_index
            },
            "answer": {
                "content": ans_text
            },
            "evaluation": ev_data
        })
        
    # Evaluate Answer using Gemini
    evaluation_result = agent_engine.evaluate_answer_simulation(
        question_content=question.content, 
        answer_content=req.content, 
        question_topic=question.topic,
        candidate_profile=candidate_profile,
        history=history_list
    )
    
    db_eval = models.Evaluation(
        question_id=req.question_id,
        accuracy_score=evaluation_result["accuracy_score"],
        communication_score=evaluation_result["communication_score"],
        depth_score=evaluation_result["depth_score"],
        problem_solving_score=evaluation_result["problem_solving_score"],
        feedback=evaluation_result["feedback"],
        weak_points=json.dumps(evaluation_result["weak_points"]),
        strong_points=json.dumps(evaluation_result["strong_points"])
    )
    db.add(db_eval)
    db.commit()
    
    # Check if we should end interview (all questions answered)
    db.refresh(interview)
    answered_count = db.query(models.Question).join(models.Answer).filter(
        models.Question.interview_id == interview.id
    ).count()
    
    next_question = None
    if answered_count >= len(interview.questions):
        # Trigger end of interview & report generation
        interview.status = "completed"
        db.commit()
        
        # Build final report history list (including current question and evaluation)
        full_history = []
        for q in interview.questions:
            ans_text = q.answer.content if q.answer else ""
            ev_ser = {
                "accuracy_score": q.evaluation.accuracy_score if q.evaluation else 0.0,
                "depth_score": q.evaluation.depth_score if q.evaluation else 0.0,
                "problem_solving_score": q.evaluation.problem_solving_score if q.evaluation else 0.0,
                "communication_score": q.evaluation.communication_score if q.evaluation else 0.0,
                "feedback": q.evaluation.feedback if q.evaluation else ""
            }
            full_history.append({
                "question": {"content": q.content, "topic": q.topic},
                "answer": {"content": ans_text},
                "evaluation": ev_ser
            })
            
        report_data = agent_engine.generate_final_report_simulation(full_history, interview.difficulty)
        
        db_report = models.FeedbackReport(
            interview_id=interview.id,
            overall_score=report_data["overall_score"],
            technical_accuracy=report_data["technical_accuracy"],
            communication=report_data["communication"],
            depth=report_data["depth"],
            problem_solving=report_data["problem_solving"],
            system_design=report_data["system_design"],
            candidate_confidence=report_data["candidate_confidence"],
            strengths=json.dumps(report_data["strengths"]),
            weaknesses=json.dumps(report_data["weaknesses"]),
            recommendations=json.dumps(report_data["recommendations"]),
            learning_path=json.dumps(report_data["learning_path"])
        )
        db.add(db_report)
        
        # Update interview average score
        interview.average_score = report_data["overall_score"]
        db.commit()
    else:
        # Load next unanswered question based on order index
        next_question_model = db.query(models.Question).filter(
            models.Question.interview_id == interview.id,
            models.Question.order_index == question.order_index + 1
        ).first()
        if next_question_model:
            # We want to dynamically update the next question's content before returning it!
            full_history_so_far = history_list.copy()
            full_history_so_far.append({
                "question": {
                    "content": question.content,
                    "topic": question.topic,
                    "difficulty": question.difficulty,
                    "order_index": question.order_index
                },
                "answer": {
                    "content": req.content
                },
                "evaluation": {
                    "accuracy_score": evaluation_result["accuracy_score"],
                    "depth_score": evaluation_result["depth_score"],
                    "problem_solving_score": evaluation_result["problem_solving_score"],
                    "communication_score": evaluation_result["communication_score"],
                    "feedback": evaluation_result["feedback"]
                }
            })
            
            focus = json.loads(interview.focus_topics) if isinstance(interview.focus_topics, str) else interview.focus_topics or []
            
            # Generate adaptive next question
            q_refinement = agent_engine.generate_adaptive_question(
                candidate_profile=candidate_profile,
                history=full_history_so_far,
                next_question_index=next_question_model.order_index,
                total_questions=len(interview.questions),
                focus_topics=focus
            )
            if q_refinement and "reply" in q_refinement:
                next_question_model.content = q_refinement["reply"]
                next_question_model.topic = q_refinement["topic"]
                if "question_type" in q_refinement:
                    next_question_model.question_type = q_refinement["question_type"]
                db.commit()
                db.refresh(next_question_model)
                
            next_question = helper_serialize_question(next_question_model)
            
    db.refresh(interview)
    
    return {
        "evaluation": {
            "id": db_eval.id,
            "accuracy_score": db_eval.accuracy_score,
            "communication_score": db_eval.communication_score,
            "depth_score": db_eval.depth_score,
            "problem_solving_score": db_eval.problem_solving_score,
            "feedback": db_eval.feedback,
            "weak_points": evaluation_result["weak_points"],
            "strong_points": evaluation_result["strong_points"]
        },
        "next_question": next_question,
        "is_finished": interview.status == "completed"
    }

@router.post("/{interview_id}/end")
def end_interview_forcefully(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    End the interview session early, compile the report based on answered questions.
    """
    interview = db.query(models.Interview).filter(models.Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    if interview.status == "completed":
        return helper_serialize_interview(interview)
        
    interview.status = "completed"
    db.commit()
    
    # Fetch answered questions
    answered_questions = [q for q in interview.questions if q.evaluation]
    
    if not answered_questions:
        # If no questions answered, give zero report
        report_data = {
            "overall_score": 0.0,
            "technical_accuracy": 0.0,
            "communication": 0.0,
            "depth": 0.0,
            "problem_solving": 0.0,
            "system_design": 0.0,
            "candidate_confidence": 0.0,
            "strengths": ["Interview ended early without answers."],
            "weaknesses": ["No data available to estimate weaknesses."],
            "recommendations": ["Re-take the practice interview and answer all questions."],
            "learning_path": {}
        }
    else:
        history_list = []
        for q in answered_questions:
            q_ser = {
                "content": q.content,
                "topic": q.topic
            }
            ev_ser = {
                "accuracy_score": q.evaluation.accuracy_score,
                "depth_score": q.evaluation.depth_score,
                "problem_solving_score": q.evaluation.problem_solving_score,
                "communication_score": q.evaluation.communication_score,
                "feedback": q.evaluation.feedback
            }
            history_list.append({
                "question": q_ser,
                "answer": {"content": q.answer.content if q.answer else ""},
                "evaluation": ev_ser
            })
            
        report_data = agent_engine.generate_final_report_simulation(history_list, interview.difficulty)
        
    db_report = models.FeedbackReport(
        interview_id=interview.id,
        overall_score=report_data["overall_score"],
        technical_accuracy=report_data["technical_accuracy"],
        communication=report_data["communication"],
        depth=report_data["depth"],
        problem_solving=report_data["problem_solving"],
        system_design=report_data["system_design"],
        candidate_confidence=report_data["candidate_confidence"],
        strengths=json.dumps(report_data["strengths"]),
        weaknesses=json.dumps(report_data["weaknesses"]),
        recommendations=json.dumps(report_data["recommendations"]),
        learning_path=json.dumps(report_data["learning_path"])
    )
    db.add(db_report)
    interview.average_score = report_data["overall_score"]
    db.commit()
    db.refresh(interview)
    
    return helper_serialize_interview(interview)


@router.get("/{interview_id}")
def get_interview_session(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get full details of a specific interview session.
    """
    interview = db.query(models.Interview).filter(models.Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found.")
        
    return helper_serialize_interview(interview)


# =====================================================================
# Unified API Spec Endpoints & Schemas (POST /api/interview)
# =====================================================================
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class CandidateMember(BaseModel):
    id: str
    name: str
    jobRole: str
    yearsExperience: float
    education: str
    status: str

class CandidateMission(BaseModel):
    day: int
    title: str
    passed: Optional[bool] = False
    attempts: Optional[int] = None
    skipped: Optional[bool] = False

class CandidateSignals(BaseModel):
    commitDays: int
    missionsCompleted: int
    missionsFirstTry: int

class CandidatePayload(BaseModel):
    member: CandidateMember
    missions: List[CandidateMission]
    signals: CandidateSignals

class InterviewAPIRequest(BaseModel):
    sessionId: str
    candidate: Optional[CandidatePayload] = None
    message: Optional[str] = None


# Global in-memory session mapping for /api/interview
SESSION_STATE: Dict[str, Any] = {}

def get_curriculum_day_obj(day_num: int) -> Dict[str, Any]:
    curr = agent_engine._load_curriculum_file()
    if curr and "days" in curr:
        for d in curr["days"]:
            if d["day"] == day_num:
                return d
    return {"day": day_num, "title": f"Day {day_num}", "objectives": ["Understand concepts"], "tools": []}

@router.post("")
@router.post("/")
def handle_unified_interview_endpoint(
    req: InterviewAPIRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Exposes a unified interview agent endpoint for external verification.
    """
    session_id = req.sessionId
    
    # 1. Start Interview (candidate details provided)
    if req.candidate is not None:
        years = req.candidate.member.yearsExperience
        if years >= 12:
            difficulty = "Lead"
        elif years >= 6:
            difficulty = "Senior"
        elif years >= 2:
            difficulty = "Mid"
        else:
            difficulty = "Junior"
            
        # Initialize session state
        SESSION_STATE[session_id] = {
            "candidate": req.candidate.model_dump(),
            "difficulty": difficulty,
            "current_question_index": 0,
            "history": []
        }
        
        return {
            "reply": "Welcome. Let's begin your interview.",
            "done": False
        }
        
    # 2. Conversation Turn
    if session_id not in SESSION_STATE:
        raise HTTPException(
            status_code=404,
            detail=f"Interview session {session_id} not found. Please start by providing candidate details."
        )
        
    state = SESSION_STATE[session_id]
    user_msg = req.message or ""
    current_idx = state["current_question_index"]
    candidate = state["candidate"]
    
    # Define day mapping for 6 different curriculum days (7, 8, 12, 16, 22, 23)
    days_sequence = [7, 8, 12, 16, 22, 23]
    
    # Check if Gemini API key is configured
    api_key_set = bool(settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY"))
    
    # Initial greeting turn (no evaluation) -> Ask Question 1
    if current_idx == 0:
        # Target first day in sequence: Day 7
        d_obj = get_curriculum_day_obj(7)
        if api_key_set:
            try:
                q_data = agent_engine.generate_question_gemini(
                    candidate=candidate,
                    history=[],
                    next_day=7,
                    next_day_title=d_obj["title"],
                    next_day_objectives=d_obj["objectives"],
                    is_followup=False
                )
                reply_text = q_data["reply"]
                topic_name = q_data["topic"]
            except Exception:
                api_key_set = False
                
        if not api_key_set:
            reply_text = f"Let's begin your technical interview with Day 7, '{d_obj['title']}'. Based on your experience with {', '.join(d_obj.get('tools', []))}, can you explain: {d_obj['objectives'][0]}?"
            topic_name = d_obj["title"]
            
        state["active_question"] = {
            "content": reply_text,
            "topic": topic_name,
            "day": 7,
            "is_followup": False
        }
        state["current_question_index"] = 1
        
        return {
            "reply": reply_text,
            "done": False
        }
        
    # Process turn response -> Evaluate answer
    active_q = state["active_question"]
    
    if api_key_set:
        try:
            evaluation = agent_engine.evaluate_answer_gemini(
                active_q["content"],
                user_msg,
                active_q["topic"]
            )
        except Exception:
            evaluation = agent_engine.evaluate_answer_simulation(
                active_q["content"],
                user_msg,
                active_q["topic"]
            )
    else:
        evaluation = agent_engine.evaluate_answer_simulation(
            active_q["content"],
            user_msg,
            active_q["topic"]
        )
        
    state["history"].append({
        "question": active_q,
        "answer": {"content": user_msg},
        "evaluation": evaluation
    })
    
    # We want exactly 8 questions.
    # Questions map:
    # Q1: Day 7 (index 1)
    # Q2: Follow-up to Q1 (index 2)
    # Q3: Day 8 (index 3)
    # Q4: Follow-up to Q3 (index 4)
    # Q5: Day 12 (index 5)
    # Q6: Day 16 (index 6)
    # Q7: Day 22 (index 7)
    # Q8: Day 23 (index 8)
    
    if current_idx < 8:
        next_idx = current_idx + 1 # Turn index we are about to ask
        
        # Decide if next turn is a follow-up
        is_next_followup = False
        target_day = 7
        
        if next_idx == 2:
            is_next_followup = True
            target_day = 7
        elif next_idx == 3:
            target_day = 8
        elif next_idx == 4:
            is_next_followup = True
            target_day = 8
        elif next_idx == 5:
            target_day = 12
        elif next_idx == 6:
            target_day = 16
        elif next_idx == 7:
            target_day = 22
        elif next_idx == 8:
            target_day = 23
            
        d_obj = get_curriculum_day_obj(target_day)
        
        if api_key_set:
            try:
                q_data = agent_engine.generate_question_gemini(
                    candidate=candidate,
                    history=state["history"],
                    next_day=target_day,
                    next_day_title=d_obj["title"],
                    next_day_objectives=d_obj["objectives"],
                    is_followup=is_next_followup,
                    previous_answer=user_msg
                )
                reply_text = q_data["reply"]
                topic_name = q_data["topic"]
            except Exception:
                # Fallback template
                api_key_set = False
                
        if not api_key_set:
            # Fallback custom template generator
            topic_name = d_obj["title"]
            if is_next_followup:
                topic_name = "Follow-up"
                if target_day == 7:
                    # Q2 Follow-up to Q1
                    if "dimension" in user_msg.lower() or "vector" in user_msg.lower() or "similarity" in user_msg.lower():
                        reply_text = f"You mentioned vectors and similarity metrics in your explanation of '{d_obj['title']}'. When deploying a large-scale collection, how does vector search latency scale with dimension size, and what indices help optimize this?"
                    else:
                        reply_text = f"You discussed embeddings. Can you explain the difference in accuracy and speed between using a bi-encoder vs a cross-encoder model to compute semantic similarity?"
                else:
                    # Q4 Follow-up to Q3 (Day 8)
                    if "rag" in user_msg.lower() or "retrieval" in user_msg.lower():
                        reply_text = f"You highlighted the retrieval aspect of '{d_obj['title']}'. If the retrieved context contains too much noise or is irrelevant, how would you tune chunk size, overlap, or re-ranking steps?"
                    else:
                        reply_text = f"You discussed vector storage. How does index quantization (like scalar quantization) help with memory capacity, and what are the trade-offs on search accuracy?"
            else:
                reply_text = f"Moving on to Day {target_day}, '{d_obj['title']}'. Focusing on {', '.join(d_obj.get('tools', []))}, can you discuss: {d_obj['objectives'][0]}?"
                
        state["active_question"] = {
            "content": reply_text,
            "topic": topic_name,
            "day": target_day,
            "is_followup": is_next_followup
        }
        state["current_question_index"] = next_idx
        
        return {
            "reply": reply_text,
            "done": False
        }
    else:
        # Compile evaluation report after 8 questions completed
        if api_key_set:
            try:
                report = agent_engine.generate_final_report_gemini(
                    state["history"],
                    state["difficulty"]
                )
            except Exception:
                report = agent_engine.generate_final_report_simulation(
                    state["history"],
                    state["difficulty"]
                )
        else:
            report = agent_engine.generate_final_report_simulation(
                state["history"],
                state["difficulty"]
            )
            
        summary_text = (
            f"Interview complete. The candidate demonstrated an overall score of {report.get('overall_score', 0)}%. "
            f"Technical accuracy: {report.get('technical_accuracy', 0)}%, Depth: {report.get('depth', 0)}%, "
            f"Problem solving: {report.get('problem_solving', 0)}%, Communication: {report.get('communication', 0)}%."
        )
        
        # Clean up session state
        SESSION_STATE.pop(session_id, None)
        
        return {
            "reply": "Interview completed.",
            "done": True,
            "feedback": {
                "summary": summary_text,
                "strengths": report.get("strengths", []),
                "gaps": report.get("weaknesses", []),
                "next": report.get("recommendations", [])
            }
        }

