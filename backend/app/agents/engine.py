import os
import json
import logging
import time
from typing import TypedDict, List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.core.config import settings

logger = logging.getLogger(__name__)

# State definition for LangGraph (kept for structure if needed)
class InterviewState(TypedDict):
    candidate_id: int
    candidate_name: str
    skills: List[str]
    curriculum: List[Dict[str, Any]]
    difficulty: str
    focus_topics: List[str]
    questions_count: int
    current_index: int
    history: List[Dict[str, Any]]  # List of {"question": str, "answer": str, "evaluation": dict}
    active_agent: str
    report: Optional[Dict[str, Any]]

# Import new google-genai SDK
try:
    from google import genai
    from google.genai import types
    from google.genai.errors import APIError
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

# Try importing LangGraph/LangChain just to maintain compatibility if other files expect HAS_LANGCHAIN
try:
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import JsonOutputParser
    from langchain_openai import ChatOpenAI
    from langgraph.graph import StateGraph, END
    HAS_LANGCHAIN = True
except ImportError:
    HAS_LANGCHAIN = False


# ========================================================
# Pydantic Schemas for Gemini Structured JSON Outputs
# ========================================================

class PlannedQuestion(BaseModel):
    topic: str = Field(description="The topic name matching or inspired by a curriculum day's title.")
    question_type: str = Field(description="One of: conceptual, scenario, debugging, design.")
    content: str = Field(description="The actual question text, technical and tailored to candidate's background.")
    curriculum_day: int = Field(description="The curriculum day number this question aligns with.")
    order_index: int = Field(description="The sequential number of the question in the interview.")

class PlannedInterview(BaseModel):
    questions: List[PlannedQuestion]

class GeneratedQuestionSchema(BaseModel):
    reply: str = Field(description="The question content. Make it conversational, engaging, and precise.")
    topic: str = Field(description="The topic of this question.")
    reason: str = Field(description="A brief explanation of why this question and difficulty level were selected.")
    question_type: str = Field(description="One of: conceptual, scenario, debugging, design.")

class EvaluationSchema(BaseModel):
    accuracy_score: float = Field(description="Score from 0 to 100 representing technical correctness.")
    depth_score: float = Field(description="Score from 0 to 100 representing detail and understanding of trade-offs.")
    problem_solving_score: float = Field(description="Score from 0 to 100 representing logical reasoning.")
    communication_score: float = Field(description="Score from 0 to 100 representing structural clarity.")
    feedback: str = Field(description="Constructive professional feedback paragraph for the candidate.")
    weak_points: List[str] = Field(description="Specific weak spots, knowledge gaps, or misconceptions.")
    strong_points: List[str] = Field(description="Key concepts and terminology correctly addressed by candidate.")

class VideoRecommendation(BaseModel):
    title: str = Field(description="Title of the educational video.")
    duration: str = Field(description="Duration estimate (e.g. 15m).")
    url: str = Field(description="YouTube or educational link.")

class ReadingRecommendation(BaseModel):
    title: str = Field(description="Title of article or paper.")
    author: str = Field(description="Author or organization name.")
    type: str = Field(description="Type: Article, Paper, or Documentation.")

class LearningPathSchema(BaseModel):
    recommended_videos: List[VideoRecommendation]
    recommended_readings: List[ReadingRecommendation]
    suggested_practice_problems: List[str]

class FinalReportSchema(BaseModel):
    overall_score: float = Field(description="Weighted overall score out of 100.")
    technical_accuracy: float = Field(description="Average technical accuracy score.")
    communication: float = Field(description="Average communication score.")
    depth: float = Field(description="Average depth score.")
    problem_solving: float = Field(description="Average problem solving score.")
    system_design: float = Field(description="Estimate of system design capabilities (0 to 100).")
    candidate_confidence: float = Field(description="Estimate of candidate confidence level based on responses (0 to 100).")
    strengths: List[str] = Field(description="Top 3-4 strengths identified in the interview.")
    weaknesses: List[str] = Field(description="Top 3-4 gaps or weaknesses identified.")
    recommendations: List[str] = Field(description="Actionable recommendations for improvement.")
    learning_path: LearningPathSchema


# ========================================================
# Helper for Rate Limit Handling (Exponential Backoff)
# ========================================================

def call_gemini_with_retry(client: Any, model: str, contents: str, response_schema: Any, retries: int = 6, delay: float = 2.0) -> Any:
    for i in range(retries):
        try:
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema,
                    temperature=0.7,
                )
            )
            return response.parsed
        except Exception as e:
            err_msg = str(e).lower()
            
            # Check if it is a daily limit quota error
            is_daily_limit = (
                "requestsperday" in err_msg or
                "requests_per_day" in err_msg or
                "requests per day" in err_msg
            )
            
            if is_daily_limit:
                logger.error(f"Gemini API daily quota exceeded: {e}. Failing immediately to trigger fallback.")
                raise e
                
            is_retryable = (
                "429" in err_msg or 
                "resource_exhausted" in err_msg or 
                "rate limit" in err_msg or 
                "quota" in err_msg or 
                "temporarily unavailable" in err_msg or
                "503" in err_msg
            )
            if is_retryable and i < retries - 1:
                # Try to parse exact retry delay from the error message (e.g., "Please retry in 46.147094837s")
                wait_seconds = delay
                if "please retry in " in err_msg:
                    try:
                        parts = err_msg.split("please retry in ")
                        if len(parts) > 1:
                            sec_str = parts[1].split("s")[0].strip()
                            # Add 1.5 seconds safety margin
                            wait_seconds = float(sec_str) + 1.5
                    except Exception:
                        pass
                
                logger.warning(f"Gemini API rate limit/transient error (retry {i+1}/{retries}): {e}. Retrying in {wait_seconds}s...")
                time.sleep(wait_seconds)
                # Only double delay if we didn't parse a custom wait time, or keep adjusting it
                if wait_seconds == delay:
                    delay *= 2
            else:
                logger.error(f"Gemini API call failed permanently: {e}")
                raise e




# ========================================================
# AgentEngine implementation
# ========================================================

class AgentEngine:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        if self.api_key:
            try:
                from google import genai
                # Initialize GenAI Client using SDK
                self.client = genai.Client(api_key=self.api_key)
                self.use_gemini = True
                logger.info("AgentEngine: Successfully initialized google-genai client.")
            except ImportError:
                self.use_gemini = False
                logger.warning("google-genai package not found. Falling back to simulator mode.")
        else:
            self.use_gemini = False
            logger.warning("GEMINI_API_KEY is not set. Falling back to simulator mode.")

        # Real multi-agent mode defaults to false unless OpenAI key is available or LangGraph is compiled
        self.use_simulator = settings.SIMULATOR_MODE or not self.use_gemini
        
        if self.use_simulator:
            logger.info("AgentEngine running in SIMULATOR Mode (Simulator configs or no Gemini key present).")
        else:
            logger.info("AgentEngine running in REAL mode using Gemini.")

    def _build_langgraph_workflow(self):
        # Kept for architectural compatibility, fell back to real nodes if langgraph used
        pass

    def _load_curriculum_file(self) -> Optional[Dict[str, Any]]:
        import os
        import json
        path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "curriculum.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return None

    def _load_candidates_file(self) -> Optional[Dict[str, Any]]:
        import os
        import json
        path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "candidates.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return None

    # ========================================================
    # QUESTION PLANNING & GENERATION
    # ========================================================

    def start_interview_simulation(self, difficulty: str, focus_topics: List[str], length: int, candidate_profile: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Dynamically plans questions using Gemini based on curriculum and candidate profile, or uses default fallback list.
        """
        curriculum = self._load_curriculum_file()
        
        # fallback lists defined to guarantee safety
        default_days = [7, 8, 12, 16, 22, 23]
        
        if not self.use_gemini:
            # Fallback simulator logic (as originally written)
            logger.info("Simulator: Pre-generating standard curriculum-aligned question list.")
            if not curriculum or "days" not in curriculum:
                return [{"id": 1, "content": "Explain RAG Basics.", "topic": "RAG", "difficulty": difficulty, "order_index": 1, "question_type": "conceptual"}]
            
            days_list = curriculum["days"]
            selected_days = []
            for num in default_days:
                day_obj = next((d for d in days_list if d["day"] == num), None)
                if day_obj:
                    selected_days.append(day_obj)
            for d in days_list:
                if len(selected_days) >= 6:
                    break
                if d not in selected_days:
                    selected_days.append(d)
            
            questions = []
            # Fill questions up to length
            for idx in range(length):
                day_obj = selected_days[idx % len(selected_days)]
                day_num = day_obj["day"]
                title = day_obj["title"]
                obj = day_obj["objectives"][0] if day_obj["objectives"] else "Understand tools."
                
                is_followup = idx in [1, 3] # Make Q2 and Q4 follow-ups
                if is_followup:
                    questions.append({
                        "id": idx + 1,
                        "content": f"FOLLOW_UP_Q{idx+1}",
                        "topic": "Follow-up",
                        "difficulty": difficulty,
                        "order_index": idx + 1,
                        "question_type": "scenario",
                        "curriculum_day": day_num
                    })
                else:
                    questions.append({
                        "id": idx + 1,
                        "content": f"Let's discuss Day {day_num}, '{title}'. How do you achieve or explain: {obj}?",
                        "topic": title,
                        "difficulty": difficulty,
                        "order_index": idx + 1,
                        "question_type": "conceptual",
                        "curriculum_day": day_num
                    })
            return questions

        # GEMINI REAL CALL
        logger.info(f"Gemini: Planning customized interview of length {length} for candidate profile.")
        curr_text = ""
        if curriculum and "days" in curriculum:
            days_summary = []
            for d in curriculum["days"]:
                days_summary.append({
                    "day": d["day"],
                    "title": d["title"],
                    "objectives": d["objectives"],
                    "tools": d.get("tools", [])
                })
            curr_text = json.dumps(days_summary, indent=2)
            
        profile_text = json.dumps(candidate_profile, indent=2) if candidate_profile else "No candidate profile provided."
        
        prompt = f"""You are planning an AI engineering technical interview.
Candidate Profile:
{profile_text}

Target Difficulty: {difficulty}
Focus Topics: {', '.join(focus_topics) if focus_topics else 'General curriculum sequence'}
Total Interview Length: {length} questions

Curriculum Days & Objectives:
{curr_text}

Your task:
Plan exactly {length} distinct questions. 
Assign each question to a specific day from the curriculum. The sequence should cover the focus topics first (if any), then proceed through the curriculum days (e.g., embeddings, vector databases, RAG, agentic AI, evaluation).
Ensure the questions target the specified curriculum day objectives and use the tools listed.
Do NOT hardcode standard generic questions. Make each question technical, practical, and appropriate for a candidate with this profile (matching experience level and skills).
Ensure the questions have an order_index from 1 to {length}.

Return a list of planned questions using the requested JSON schema.
"""
        try:
            from google.genai import types
            planned: PlannedInterview = call_gemini_with_retry(
                client=self.client,
                model=settings.GEMINI_MODEL,
                contents=prompt,
                response_schema=PlannedInterview,
                retries=3
            )
            
            questions = []
            for i, q in enumerate(planned.questions):
                questions.append({
                    "id": i + 1,
                    "content": q.content,
                    "topic": q.topic,
                    "difficulty": difficulty,
                    "order_index": q.order_index if q.order_index else i + 1,
                    "question_type": q.question_type if q.question_type else "conceptual",
                    "curriculum_day": q.curriculum_day
                })
            return questions
        except Exception as e:
            if self.use_gemini:
                logger.error(f"Gemini failed planning interview questions: {e}. Raising exception.")
                raise RuntimeError(f"Gemini API failure during question planning: {e}")
            logger.error(f"Gemini failed planning interview questions: {e}. Falling back to default curriculum sequence.")
            # Default sequence fallback
            return self.start_interview_simulation(difficulty, focus_topics, length, candidate_profile=None)

    # ========================================================
    # ADAPTIVE QUESTION & FOLLOW-UP GENERATOR
    # ========================================================

    def generate_adaptive_question(
        self,
        candidate_profile: dict,
        history: List[Dict[str, Any]],
        next_question_index: int,
        total_questions: int,
        focus_topics: List[str]
    ) -> Dict[str, Any]:
        """
        Dynamically refines or generates the next question using Gemini to adapt difficulty and context.
        """
        if not self.use_gemini:
            return {}
            
        curriculum = self._load_curriculum_file()
        days_sequence = [7, 8, 12, 16, 22, 23]
        target_day = 7
        if next_question_index == 2:
            target_day = 7
        elif next_question_index == 3:
            target_day = 8
        elif next_question_index == 4:
            target_day = 8
        elif next_question_index == 5:
            target_day = 12
        elif next_question_index == 6:
            target_day = 16
        elif next_question_index == 7:
            target_day = 22
        elif next_question_index == 8:
            target_day = 23
        else:
            seq_idx = (next_question_index - 1) % len(days_sequence)
            target_day = days_sequence[seq_idx]
            
        d_obj = {"day": target_day, "title": f"Day {target_day}", "objectives": ["Understand concepts"], "tools": []}
        if curriculum and "days" in curriculum:
            d_obj = next((d for d in curriculum["days"] if d["day"] == target_day), d_obj)
            
        is_followup = next_question_index in [2, 4]
        
        history_str = ""
        for turn in history:
            history_str += f"Q: {turn['question']['content']}\nA: {turn['answer']['content']}\n"
            if 'evaluation' in turn:
                history_str += f"Accuracy Score: {turn['evaluation'].get('accuracy_score', 0)}/100, Feedback: {turn['evaluation'].get('feedback', '')}\n"
            history_str += "\n"
            
        prompt = f"""You are the Question Generator agent in an AI Interview platform.
Candidate Profile:
{json.dumps(candidate_profile, indent=2)}

Focus Topics: {', '.join(focus_topics) if focus_topics else 'General curriculum sequence'}

Interview State:
Current Question Index: {next_question_index} of {total_questions}
Target Day: Day {target_day} - {d_obj.get('title')}
Target Objectives: {', '.join(d_obj.get('objectives', []))}
Target Tools: {', '.join(d_obj.get('tools', []))}

Conversation History so far:
{history_str}
"""

        if is_followup:
            prompt += f"""Your task:
Generate a genuine follow-up question probing their previous answer.
- Assess how they answered. If they did well, ask a deeper architecture/trade-off question. If they struggled, ask a clarifying or foundational question to assess their baseline.
- Keep the tone highly conversational.
- Target the same topic (Day {target_day}).
"""
        else:
            prompt += f"""Your task:
Generate a new technical question targeting Day {target_day} topic and objectives.
- Adjust difficulty based on history: if they have high scores (>80 avg), make it challenging. If they are struggling (<60 avg), make it supportive and conceptual.
- Do NOT repeat questions.
"""

        prompt += """
Return a structured JSON output matching the GeneratedQuestionSchema.
"""
        try:
            q_data: GeneratedQuestionSchema = call_gemini_with_retry(
                client=self.client,
                model=settings.GEMINI_MODEL,
                contents=prompt,
                response_schema=GeneratedQuestionSchema,
                retries=3
            )
            return {
                "reply": q_data.reply,
                "topic": q_data.topic,
                "reason": q_data.reason,
                "question_type": q_data.question_type
            }
        except Exception as e:
            if self.use_gemini:
                logger.error(f"Gemini failed generating adaptive question: {e}. Raising exception.")
                raise RuntimeError(f"Gemini API failure during adaptive question generation: {e}")
            logger.error(f"Gemini failed generating adaptive question: {e}")
            return {}

    # ========================================================
    # ANSWER EVALUATION
    # ========================================================

    def evaluate_answer_simulation(self, question_content: str, answer_content: str, question_topic: str, candidate_profile: Optional[dict] = None, history: Optional[list] = None) -> Dict[str, Any]:
        """
        Evaluates answer using Gemini if available, otherwise falls back to keyword matching.
        """
        if not self.use_gemini:
            # Fallback simulator evaluator (originally written)
            ans_lower = answer_content.lower()
            length = len(answer_content.split())
            matches = []
            keywords = ["vector", "embedding", "distance", "similarity", "qdrant", "pinecone", "chunk", "prompt", "llm", "memory", "agent", "mcp", "tool"]
            for kw in keywords:
                if kw in ans_lower:
                    matches.append(kw)
            accuracy = 50.0 + min(40.0, len(matches) * 10.0)
            depth = 40.0 + min(50.0, length * 1.5)
            problem_solving = min(98.0, accuracy * 0.9 + 8.0)
            communication = min(98.0, 50.0 + min(45.0, length * 0.8))
            
            weak_points = []
            strong_points = []
            if len(matches) >= 3:
                strong_points.append(f"Correctly referenced key terminology: {', '.join(matches[:3])}.")
            else:
                weak_points.append("Response lacked details or specific terms related to the curriculum topic.")
            if length < 15:
                weak_points.append("Answer is too brief. Elaborate on the architectural considerations or specific tools.")
            else:
                strong_points.append("Response provided decent conceptual depth and explanation of concepts.")
            feedback = f"Your answer scored {round(accuracy, 1)}% in accuracy. To improve, discuss trade-offs in production."
            return {
                "accuracy_score": round(accuracy, 1),
                "depth_score": round(depth, 1),
                "problem_solving_score": round(problem_solving, 1),
                "communication_score": round(communication, 1),
                "feedback": feedback,
                "weak_points": weak_points if weak_points else ["No major weak areas identified."],
                "strong_points": strong_points if strong_points else ["Demonstrated general compliance."]
            }

        # GEMINI CALL
        profile_str = json.dumps(candidate_profile, indent=2) if candidate_profile else "Not provided"
        history_str = ""
        if history:
            for turn in history:
                q_text = turn.get("question", {}).get("content", "")
                a_text = turn.get("answer", {}).get("content", "")
                history_str += f"Q: {q_text}\nA: {a_text}\n\n"
                
        prompt = f"""You are the Answer Evaluator agent in an AI Interview platform.
Candidate Profile:
{profile_str}

Context History:
{history_str}

Grade the candidate's response to the technical question:
Question: "{question_content}"
Topic: {question_topic}
Candidate Answer: "{answer_content}"

Your task:
Assess their answer and calculate four scores out of 100:
1. Accuracy: Technical correctness of the concepts.
2. Depth: Comprehensiveness, including details and trade-offs.
3. Problem Solving: Rationale and logical soundness.
4. Communication: Structure and clarity of explanation.

Provide constructive feedback highlighting:
- Strengths and specific terms correctly referenced.
- Weak points and specific misconceptions.
- Targeted recommendations.

Return a structured JSON output matching the EvaluationSchema.
"""
        try:
            ev_data: EvaluationSchema = call_gemini_with_retry(
                client=self.client,
                model=settings.GEMINI_MODEL,
                contents=prompt,
                response_schema=EvaluationSchema,
                retries=3
            )
            return {
                "accuracy_score": ev_data.accuracy_score,
                "depth_score": ev_data.depth_score,
                "problem_solving_score": ev_data.problem_solving_score,
                "communication_score": ev_data.communication_score,
                "feedback": ev_data.feedback,
                "weak_points": ev_data.weak_points,
                "strong_points": ev_data.strong_points
            }
        except Exception as e:
            if self.use_gemini:
                logger.error(f"Gemini answer evaluation failed: {e}. Raising exception.")
                raise RuntimeError(f"Gemini API failure during evaluation: {e}")
            logger.error(f"Gemini answer evaluation failed: {e}. Falling back to simulation evaluator.")
            return self.evaluate_answer_simulation(question_content, answer_content, question_topic)

    # ========================================================
    # FEEDBACK REPORT GENERATOR
    # ========================================================

    def generate_final_report_simulation(self, history: List[Dict[str, Any]], difficulty: str) -> Dict[str, Any]:
        """
        Generates final report from actual history.
        """
        if not self.use_gemini:
            # Fallback simulator reporter (originally written)
            if not history:
                return {}
            total = len(history)
            avg_acc = sum(h["evaluation"]["accuracy_score"] for h in history) / total
            avg_depth = sum(h["evaluation"]["depth_score"] for h in history) / total
            avg_prob = sum(h["evaluation"]["problem_solving_score"] for h in history) / total
            avg_comm = sum(h["evaluation"]["communication_score"] for h in history) / total
            overall = (avg_acc + avg_depth + avg_prob + avg_comm) / 4.0
            
            return {
                "overall_score": round(overall, 1),
                "technical_accuracy": round(avg_acc, 1),
                "communication": round(avg_comm, 1),
                "depth": round(avg_depth, 1),
                "problem_solving": round(avg_prob, 1),
                "system_design": round(overall * 0.9, 1),
                "candidate_confidence": round(avg_comm * 0.95, 1),
                "strengths": ["Consistently solid conceptual baseline."],
                "weaknesses": ["Gaps in implementation detail."],
                "recommendations": ["Review HNSW construction parameters."],
                "learning_path": {
                    "recommended_videos": [
                        {"title": "Deep Dive into Vector Similarity Search", "duration": "15m", "url": "https://youtube.com/watch?1"},
                    ],
                    "recommended_readings": [
                        {"title": "Introduction to Retrieval-Augmented Generation", "author": "AI Engineering Team", "type": "Article"},
                    ],
                    "suggested_practice_problems": [
                        "Write a Python script to chunk markdown files semantically.",
                    ]
                }
            }

        # GEMINI CALL
        history_str = ""
        for turn in history:
            q_text = turn.get("question", {}).get("content", "")
            ans_text = turn.get("answer", {}).get("content", "") if isinstance(turn.get("answer"), dict) else turn.get("answer", "")
            eval_data = turn.get("evaluation", {})
            history_str += f"Q: {q_text}\nA: {ans_text}\n"
            history_str += f"Scores: Accuracy={eval_data.get('accuracy_score', 0)}%, Depth={eval_data.get('depth_score', 0)}%, Comm={eval_data.get('communication_score', 0)}%\n"
            history_str += f"Feedback: {eval_data.get('feedback', '')}\n\n"
            
        prompt = f"""You are the Report Generator agent. Compile a premium candidate feedback report based on this interview history:
{history_str}

Target Difficulty: {difficulty}

Your task:
Compute average overall and skill-specific scores (0 to 100):
- overall_score
- technical_accuracy
- communication
- depth
- problem_solving
- system_design
- candidate_confidence

Provide lists of strengths, weaknesses, and concrete recommendations.
Also suggest a personalized learning path with:
- recommended_videos: [ {{"title": "...", "duration": "...", "url": "..."}} ]
- recommended_readings: [ {{"title": "...", "author": "...", "type": "..."}} ]
- suggested_practice_problems: list of strings

Return a structured JSON output matching the FinalReportSchema.
"""
        try:
            report_data: FinalReportSchema = call_gemini_with_retry(
                client=self.client,
                model=settings.GEMINI_MODEL,
                contents=prompt,
                response_schema=FinalReportSchema,
                retries=3
            )
            return report_data.model_dump()
        except Exception as e:
            if self.use_gemini:
                logger.error(f"Gemini feedback report generation failed: {e}. Raising exception.")
                raise RuntimeError(f"Gemini API failure during report generation: {e}")
            logger.error(f"Gemini feedback report generation failed: {e}. Falling back to simulation report.")
            return self.generate_final_report_simulation(history, difficulty)


    # ========================================================
    # Gemini Unified API Compatibility Stubs
    # ========================================================

    def generate_question_gemini(
        self,
        candidate: dict,
        history: list,
        next_day: int,
        next_day_title: str,
        next_day_objectives: list,
        is_followup: bool = False,
        previous_answer: str = ""
    ) -> dict:
        """
        Unified API endpoint question generator. Passes all context to Gemini.
        """
        if not self.use_gemini:
            # Fallback simple dict matching signature
            return {
                "reply": f"Let's move on. Can you explain {next_day_title} and objectives?",
                "topic": next_day_title,
                "reason": "Fallback question generator"
            }
            
        history_str = ""
        for i, turn in enumerate(history):
            ans_text = turn.get("answer", {}).get("content", "") if isinstance(turn.get("answer"), dict) else turn.get("answer", "")
            history_str += f"Q: {turn['question']['content']}\nA: {ans_text}\n\n"
            
        prompt = f"""You are conducting a realistic, personalized technical interview for the role of {candidate.get('member', {}).get('jobRole', 'AI Engineer')}.
The candidate's name is {candidate.get('member', {}).get('name', 'Candidate')}.
Their experience level is {candidate.get('member', {}).get('yearsExperience', 2.0)} years.

Curriculum Context for this turn:
Day: {next_day}
Topic: {next_day_title}
Objectives: {', '.join(next_day_objectives)}

Conversation History so far:
{history_str}
"""

        if is_followup:
            prompt += f"""The previous question was: "{history[-1]['question']['content']}"
The candidate's previous response was: "{previous_answer}"

Your task:
Generate a genuine follow-up question probing their previous answer.
- If the answer was strong, ask a deeper architecture/trade-off question.
- If it was weak/surface-level, ask a clarification or a foundational question.
- Keep it highly conversational.
"""
        else:
            prompt += f"""Your task:
Generate a new technical question targeting the curriculum day's topic and objectives.
- Match their experience level ({candidate.get('member', {}).get('yearsExperience', 2.0)} years).
"""

        prompt += """
Return a structured JSON output matching the GeneratedQuestionSchema.
"""
        try:
            q_data: GeneratedQuestionSchema = call_gemini_with_retry(
                client=self.client,
                model=settings.GEMINI_MODEL,
                contents=prompt,
                response_schema=GeneratedQuestionSchema,
                retries=3
            )
            return {
                "reply": q_data.reply,
                "topic": q_data.topic,
                "reason": q_data.reason
            }
        except Exception as e:
            logger.error(f"Unified generate_question_gemini failed: {e}")
            return {
                "reply": f"Let's move on. Can you explain {next_day_title} and objectives?",
                "topic": next_day_title,
                "reason": "Error fallback"
            }

    def evaluate_answer_gemini(self, question_content: str, answer_content: str, question_topic: str) -> dict:
        """
        Unified API endpoint answer evaluator.
        """
        return self.evaluate_answer_simulation(question_content, answer_content, question_topic)

    def generate_final_report_gemini(self, history: list, difficulty: str) -> dict:
        """
        Unified API endpoint report generator.
        """
        return self.generate_final_report_simulation(history, difficulty)


agent_engine = AgentEngine()
