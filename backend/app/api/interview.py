import json
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
        
    # Generate simulator questions
    questions_list = agent_engine.start_interview_simulation(
        req.difficulty, 
        req.focus_topics, 
        req.interview_length
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
    
    # Evaluate Answer using agent engine
    evaluation_result = agent_engine.evaluate_answer_simulation(
        question.content, 
        req.content, 
        question.topic
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
        
        # Build final report
        history_list = []
        for q in interview.questions:
            q_ser = {
                "content": q.content,
                "topic": q.topic
            }
            ev_ser = {
                "accuracy_score": q.evaluation.accuracy_score,
                "depth_score": q.evaluation.depth_score,
                "problem_solving_score": q.evaluation.problem_solving_score,
                "communication_score": q.evaluation.communication_score
            }
            history_list.append({"question": q_ser, "evaluation": ev_ser})
            
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
                "communication_score": q.evaluation.communication_score
            }
            history_list.append({"question": q_ser, "evaluation": ev_ser})
            
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
