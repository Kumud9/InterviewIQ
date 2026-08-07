import json
import logging
from typing import TypedDict, List, Dict, Any, Optional
from datetime import datetime
from app.core.config import settings

logger = logging.getLogger(__name__)

# State definition for LangGraph
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

# Try to import LangGraph and LangChain. Fallback if not installed or missing keys.
try:
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import JsonOutputParser
    from langchain_openai import ChatOpenAI
    from langgraph.graph import StateGraph, END
    HAS_LANGCHAIN = True
except ImportError:
    HAS_LANGCHAIN = False

class AgentEngine:
    def __init__(self):
        self.use_simulator = settings.SIMULATOR_MODE or not settings.OPENAI_API_KEY
        if self.use_simulator:
            logger.info("AgentEngine running in SIMULATOR Mode (no OpenAI API key or Simulator config active).")
        else:
            logger.info("AgentEngine running in REAL MULTI-AGENT Mode using LangGraph and OpenAI.")
            if HAS_LANGCHAIN:
                self._build_langgraph_workflow()
            else:
                logger.warning("LangGraph libraries not imported successfully. Falling back to simulator.")
                self.use_simulator = True

    def _build_langgraph_workflow(self):
        # Build standard LangGraph workflow
        try:
            workflow = StateGraph(InterviewState)
            
            # Define nodes
            workflow.add_node("planner", self._real_planner_node)
            workflow.add_node("question_generator", self._real_question_generator_node)
            workflow.add_node("evaluator", self._real_evaluator_node)
            workflow.add_node("reporter", self._real_reporter_node)
            
            # Define edges
            workflow.set_entry_point("planner")
            workflow.add_conditional_edges(
                "question_generator",
                self._router_after_question,
                {
                    "continue": "evaluator",
                    "end": "reporter"
                }
            )
            workflow.add_edge("evaluator", "question_generator")
            workflow.add_edge("reporter", END)
            
            self.graph = workflow.compile()
            logger.info("LangGraph workflow compiled successfully.")
        except Exception as e:
            logger.error(f"Error compiling LangGraph workflow: {e}")
            self.use_simulator = True

    # Real Agent Nodes (using OpenAI)
    def _real_planner_node(self, state: InterviewState) -> Dict[str, Any]:
        logger.info(f"Real Planner Node triggered for candidate {state['candidate_name']}")
        # Simulated structure for planner, returns generated focus list & skeleton plan
        return {"active_agent": "question_generator"}

    def _real_question_generator_node(self, state: InterviewState) -> Dict[str, Any]:
        logger.info(f"Real Question Generator node at index {state['current_index']}")
        return {"active_agent": "evaluator"}

    def _real_evaluator_node(self, state: InterviewState) -> Dict[str, Any]:
        logger.info("Real Evaluator node scoring answer.")
        return {"active_agent": "question_generator"}

    def _real_reporter_node(self, state: InterviewState) -> Dict[str, Any]:
        logger.info("Real Reporter compiling scores and custom learning plan.")
        return {"report": {}}

    def _router_after_question(self, state: InterviewState) -> str:
        if state["current_index"] >= state["questions_count"]:
            return "end"
        return "continue"

    # ========================================================
    # SIMULATOR AGENT SYSTEM (Rich Curriculum-Aware Simulator)
    # ========================================================
    
    # Curriculum-aligned Pool of Questions
    QUESTION_POOL = {
        "Junior": [
            {
                "topic": "RAG Basics",
                "question_type": "conceptual",
                "content": "Explain what Retrieval-Augmented Generation (RAG) is and how it solves the hallucination problem in LLMs.",
                "hint": "Think about how giving the LLM external data to read before answering helps ground its response."
            },
            {
                "topic": "Vector Databases",
                "question_type": "conceptual",
                "content": "What is a vector database, and why do we use it instead of SQL databases for searching text similarity?",
                "hint": "Consider high-dimensional embeddings and what algorithms like cosine similarity measure."
            },
            {
                "topic": "Embeddings & Distance Metrics",
                "question_type": "debugging",
                "content": "Assume you have two embedding vectors: A = [1.0, 0.0] and B = [0.0, 1.0]. What is their cosine similarity? Why would they represent unrelated text chunks?",
                "hint": "Cosine similarity measures the cosine of the angle between two vectors. A dot product of perpendicular vectors is 0."
            },
            {
                "topic": "Chunking Strategies",
                "question_type": "conceptual",
                "content": "Why is it important to use 'chunk overlap' when dividing long documents into sections for embedding?",
                "hint": "Think about information loss at the boundaries where a document is split."
            },
            {
                "topic": "Pinecone vs Qdrant",
                "question_type": "conceptual",
                "content": "Can you compare Qdrant and Pinecone in terms of deployment options? When would you use Qdrant locally?",
                "hint": "Qdrant is open-source and has an in-memory/Docker mode. Pinecone is primarily managed SaaS."
            },
            {
                "topic": "Model Context Protocol",
                "question_type": "conceptual",
                "content": "What is the Model Context Protocol (MCP) and how does it help LLMs query files or APIs securely?",
                "hint": "MCP provides a standardized protocol for models to access local context and tools."
            },
            {
                "topic": "RAG Quality",
                "question_type": "scenario",
                "content": "If your RAG system is retrieving irrelevant document chunks, what are the first two things you would adjust?",
                "hint": "Check the chunking size/overlap and the embedding model, or add a re-ranker step."
            },
            {
                "topic": "Best Practices",
                "question_type": "scenario",
                "content": "Why should you avoid sending entire documents directly in the LLM prompt window instead of doing semantic search retrieval?",
                "hint": "Think about context window limits, API costs, latency, and noise/distractions."
            }
        ],
        "Mid": [
            {
                "topic": "RAG Basics & Indexing",
                "question_type": "conceptual",
                "content": "Detail the differences between fixed-size chunking and semantic chunking. When would semantic chunking yield superior retrieval quality?",
                "hint": "Semantic chunking splits text on semantic shifts (e.g. paragraph boundaries or embedding differences) rather than characters."
            },
            {
                "topic": "Vector Similarity",
                "question_type": "debugging",
                "content": "You observe that cosine similarity scores in your vector store are clustered between 0.85 and 0.95, making thresholds useless. What is causing this, and how do you normalize it?",
                "hint": "High-dimensional embeddings often lie in a narrow cone. Normalization or applying min-max scaling to scores can help."
            },
            {
                "topic": "Retrieval Quality",
                "question_type": "scenario",
                "content": "Design a pipeline that uses a Cross-Encoder Re-ranker. Explain why retrieval needs a first-stage bi-encoder followed by a second-stage cross-encoder.",
                "hint": "Bi-encoders are fast (O(1) lookups) but lose token interaction. Cross-encoders model deep interaction but are slow."
            },
            {
                "topic": "System Design",
                "question_type": "design",
                "content": "Design a scalable indexing pipeline for a vector database like Qdrant when 10,000 PDFs are uploaded daily. How would you handle rate-limiting and updates?",
                "hint": "Consider using an asynchronous worker queue (Celery/RabbitMQ), batching vector inserts, and caching embeddings."
            },
            {
                "topic": "Pinecone vs Qdrant",
                "question_type": "design",
                "content": "Compare Qdrant's HNSW index structure with Pinecone's serverless model. How does HNSW optimize search latency?",
                "hint": "HNSW (Hierarchical Navigable Small World) uses multi-layer graph structures for fast log-time similarity searches."
            },
            {
                "topic": "Model Context Protocol",
                "question_type": "design",
                "content": "How would you design a tool server using Model Context Protocol (MCP) to let an LLM interact with a PostgreSQL database safely?",
                "hint": "Sanitize inputs, implement read-only transactions, limit record returns, and define explicit tool schemas."
            },
            {
                "topic": "Scaling",
                "question_type": "optimization",
                "content": "How does payload filtering in Qdrant prevent checking all vector points during a query? Describe the difference between pre-filtering and post-filtering.",
                "hint": "Pre-filtering reduces the search space before traversing the HNSW graph; post-filtering discards nodes after searching."
            },
            {
                "topic": "Trade-off Analysis",
                "question_type": "design",
                "content": "Compare the trade-offs of using sparse embeddings (e.g. BM25) vs dense embeddings. When would a hybrid retrieval merge them?",
                "hint": "BM25 excels at keyword matching (serial numbers, names). Dense embeddings capture semantics. Merge using Reciprocal Rank Fusion (RRF)."
            }
        ],
        "Senior": [
            {
                "topic": "Advanced Retrieval Quality",
                "question_type": "design",
                "content": "Explain the mechanics of Parent-Child chunking (or Auto-Merging Retrieval). How does this separation of retrieval units and synthesis units improve generation?",
                "hint": "Retrieve small, highly focused chunks to find exact matches, but pass the larger parent context to the LLM for synthesis."
            },
            {
                "topic": "Vector DB Scaling",
                "question_type": "optimization",
                "content": "Describe how you would configure Qdrant for memory optimization. What are the trade-offs of storing vectors in-memory vs on-disk (mmap) and using scalar quantization?",
                "hint": "Quantization (e.g. float32 to int8) reduces memory footprints by 75% at a minor cost to precision. mmap moves vectors off RAM."
            },
            {
                "topic": "System Design & Architecture",
                "question_type": "design",
                "content": "Design an enterprise-grade agentic RAG system that supports multi-tenant document isolation, metadata-based access control, and dynamic query routing.",
                "hint": "Utilize tenant namespaces, implement JWT-linked payload filters in vector queries, and use a router agent to select vector indexes."
            },
            {
                "topic": "Model Context Protocol",
                "question_type": "design",
                "content": "Explain how you would deploy a cluster of MCP hosts to orchestrate complex operations across distributed developer environments.",
                "hint": "Define secure host-client handshakes, rate-limit agents, and sandbox dynamic code executions."
            },
            {
                "topic": "Advanced Optimization",
                "question_type": "debugging",
                "content": "Your agent loops endlessly when using a ReAct framework to query a vector database, repeatedly retrieving the same results. How do you resolve this context loop?",
                "hint": "Add a short-term memory block containing query hashes, limit maximum agent steps, and penalize repetitive queries in prompts."
            },
            {
                "topic": "Trade-off Analysis",
                "question_type": "design",
                "content": "Evaluate the architectural differences between Cohere Rerank, FlashRank, and standard Cross-Encoders. How does selection affect pricing and latency?",
                "hint": "SaaS re-rankers increase network hops. Open-source models (FlashRank) run locally with sub-10ms latency but require local compute."
            },
            {
                "topic": "Scaling & Deployment",
                "question_type": "design",
                "content": "Describe the replication, consensus (Raft), and sharding model in a distributed Qdrant cluster under high write loads.",
                "hint": "Distributed Qdrant shards collections across nodes; Raft ensures consistency in collection schemas and cluster topology."
            },
            {
                "topic": "Best Practices",
                "question_type": "design",
                "content": "Explain how you would evaluate RAG retrieval quality using metrics like Hit Rate, MRR (Mean Reciprocal Rank), and NDCG (Normalized Discounted Cumulative Gain).",
                "hint": "Use frameworks like Ragas or TruLens to automate evaluation of faithfulness, answer relevance, and context recall."
            }
        ],
        "Lead": [
            {
                "topic": "Enterprise AI Architecture",
                "question_type": "design",
                "content": "Design a high-availability, globally distributed AI Interview Engine. It must handle streaming text, real-time voice synthesis, multi-agent evaluation, and persistent memory under 500ms latency budget. What caching, queuing, and edge configurations do you employ?",
                "hint": "Use edge-deployed servers for low-latency streaming, Redis cache for session memory, and asynchronous brokers to dump evaluations."
            },
            {
                "topic": "Model Context Protocol & Security",
                "question_type": "design",
                "content": "How would you draft a security policy and gateway architecture to prevent Prompt Injection and Data Exfiltration when agents access enterprise databases via MCP?",
                "hint": "Implement strict input validation schemas, restrict outgoing API endpoints from inside the agent execution sandbox, and enforce human-in-the-loop checks."
            },
            {
                "topic": "Vector Database Benchmarking",
                "question_type": "optimization",
                "content": "Analyze the performance characteristics of HNSW graph builds under varying parameters (M, ef_construction, ef_search). How do you balance recall accuracy against index build speed and QPS?",
                "hint": "Higher M and ef_construction increase graph density, boosting recall and search speed but significantly extending indexing times."
            },
            {
                "topic": "Advanced Evaluation & Alignment",
                "question_type": "design",
                "content": "How do you mitigate bias in LLM-as-a-judge interview evaluations? Design an automated pipeline that self-corrects evaluation discrepancy across candidate categories.",
                "hint": "Implement prompt sanitization (removing candidate names/origins), use a consensus voting system with multiple model families, and align scores."
            }
        ]
    }

    def start_interview_simulation(self, difficulty: str, focus_topics: List[str], length: int) -> List[Dict[str, Any]]:
        """
        Creates a list of 8+ structured questions for the interview simulation.
        """
        # Fallback to Mid if difficulty not in pool
        pool = self.QUESTION_POOL.get(difficulty, self.QUESTION_POOL["Mid"])
        
        # Filter based on focus topics if provided, or grab from general pool
        selected = []
        if focus_topics:
            normalized_topics = [t.lower() for t in focus_topics]
            selected = [q for q in pool if any(topic in q["topic"].lower() for topic in normalized_topics)]
        
        # Fill up to requested length
        remaining = [q for q in pool if q not in selected]
        selected.extend(remaining)
        selected = selected[:length]
        
        # Ensure minimum 8 questions
        if len(selected) < length:
            # Add from Mid or Senior pool to pad
            fallback_pool = self.QUESTION_POOL["Mid"] if difficulty != "Mid" else self.QUESTION_POOL["Senior"]
            for q in fallback_pool:
                if q not in selected:
                    selected.append(q)
                if len(selected) >= length:
                    break
        
        # Assign order index
        for idx, q in enumerate(selected):
            q["order_index"] = idx + 1
            if "question_type" not in q:
                q["question_type"] = "conceptual"
        
        return selected

    def evaluate_answer_simulation(self, question_content: str, answer_content: str, question_topic: str) -> Dict[str, Any]:
        """
        Simulates evaluator agent grading candidate's answer.
        Analyzes keywords and length to compute scores and give constructive feedback.
        """
        ans_lower = answer_content.lower()
        length = len(answer_content.split())
        
        # Keyword mapping for curriculum topics to estimate technical accuracy
        keywords_map = {
            "rag": ["retrieval", "generation", "hallucination", "context", "prompt", "chunk", "llm"],
            "vector": ["embedding", "database", "distance", "similarity", "cosine", "dot product", "high-dimensional", "hnsw", "qdrant", "pinecone"],
            "chunking": ["overlap", "split", "boundary", "character", "semantic", "size", "loss"],
            "pinecone": ["qdrant", "managed", "saas", "open-source", "mmap", "local", "docker", "hnsw"],
            "model context protocol": ["mcp", "protocol", "schema", "secure", "tool", "server", "host", "client"],
            "quality": ["re-rank", "cross-encoder", "bi-encoder", "hybrid", "bm25", "dense", "sparse", "rrf"],
            "scaling": ["index", "quantization", "scalar", "mmap", "payload", "filter", "pre-filter", "post-filter", "shard", "raft"]
        }
        
        # Count matched keywords
        matches = 0
        topic_words = keywords_map.get(question_topic.lower(), [])
        # Check general words as well
        all_words = topic_words + ["system", "design", "scale", "performance", "architecture", "trade-off", "latency", "cost"]
        
        matched_keys = []
        for word in all_words:
            if word in ans_lower:
                matches += 1
                matched_keys.append(word)
        
        # Scoring logic
        # 1. Accuracy based on keywords
        if matches >= 5:
            accuracy = 90.0 + min(10.0, matches)
        elif matches >= 3:
            accuracy = 78.0 + (matches * 3)
        elif matches >= 1:
            accuracy = 60.0 + (matches * 5)
        else:
            accuracy = 45.0 + min(10.0, length / 10.0)
            
        # 2. Depth based on length
        if length > 120:
            depth = 92.0 + min(8.0, (length - 120) / 20.0)
        elif length > 60:
            depth = 75.0 + ((length - 60) * 0.3)
        elif length > 20:
            depth = 50.0 + ((length - 20) * 0.6)
        else:
            depth = 30.0 + (length * 1.0)
            
        # 3. Problem solving
        problem_solving = min(98.0, accuracy * 0.95 + (10 if "trade-off" in ans_lower or "depend" in ans_lower or "however" in ans_lower else 0))
        
        # 4. Communication
        communication = min(98.0, 60.0 + min(35.0, length / 4.0))
        if "e.g." in ans_lower or "example" in ans_lower or "firstly" in ans_lower or "secondly" in ans_lower:
            communication = min(98.0, communication + 5.0)

        # Cap scores between 0 and 100
        accuracy = max(10.0, min(100.0, accuracy))
        depth = max(10.0, min(100.0, depth))
        problem_solving = max(10.0, min(100.0, problem_solving))
        communication = max(10.0, min(100.0, communication))
        
        # Feedback generation
        weak_points = []
        strong_points = []
        
        if accuracy > 85:
            strong_points.append(f"Demonstrated excellent command over {question_topic} concepts.")
        elif accuracy > 70:
            strong_points.append(f"Solid basic understanding of {question_topic} metrics.")
        else:
            weak_points.append(f"Needs clarification on fundamental mechanisms of {question_topic}.")
            
        if depth > 85:
            strong_points.append("Detail-oriented answer covering edge cases and tradeoffs.")
        elif depth < 50:
            weak_points.append("Answer is too brief. Try to explain the internal operations or provide practical examples.")
            
        if "trade-off" not in ans_lower and "cost" not in ans_lower and question_topic.lower() in ["vector", "pinecone vs qdrant", "scaling", "quality"]:
            weak_points.append("Missing architectural trade-off comparisons (e.g. latency vs accuracy, memory vs cost).")
            
        if matched_keys:
            strong_points.append(f"Appropriately referenced terms like {', '.join(matched_keys[:3])}.")
        else:
            weak_points.append("Lacked key industry terms associated with this technology.")

        if not weak_points:
            weak_points = ["No major weak areas identified in this answer."]
            
        # Create feedback string
        if accuracy > 80:
            feedback = f"Great response! You correctly identified the core components of {question_topic}. Your explanation shows a strong understanding of how to implement and optimize this within an enterprise environment."
        elif accuracy > 60:
            feedback = f"Fair answer. You have a decent grasp of {question_topic}, but you could add more detail about specific configuration details, architectural trade-offs, or code practices."
        else:
            feedback = f"Your answer is a bit surface-level. To succeed in an enterprise setup, you need to understand how {question_topic} structures data beneath the hood, standard parameters (like index parameters or overlap sizes), and operational constraints."
            
        return {
            "accuracy_score": round(accuracy, 1),
            "depth_score": round(depth, 1),
            "problem_solving_score": round(problem_solving, 1),
            "communication_score": round(communication, 1),
            "feedback": feedback,
            "weak_points": weak_points,
            "strong_points": strong_points
        }

    def generate_final_report_simulation(self, history: List[Dict[str, Any]], difficulty: str) -> Dict[str, Any]:
        """
        Generates a premium final report based on interview history.
        """
        if not history:
            return {}
            
        total_questions = len(history)
        avg_accuracy = sum(h["evaluation"]["accuracy_score"] for h in history) / total_questions
        avg_depth = sum(h["evaluation"]["depth_score"] for h in history) / total_questions
        avg_problem = sum(h["evaluation"]["problem_solving_score"] for h in history) / total_questions
        avg_comm = sum(h["evaluation"]["communication_score"] for h in history) / total_questions
        
        # Estimate system design based on topics
        design_scores = [h["evaluation"]["accuracy_score"] for h in history if h["question"]["topic"].lower() in ["system design", "vector databases", "pinecone vs qdrant", "scaling", "model context protocol"]]
        avg_design = sum(design_scores) / len(design_scores) if design_scores else (avg_accuracy * 0.9)
        
        # Estimate overall confidence
        confidence_scores = [h["evaluation"]["communication_score"] * 0.4 + h["evaluation"]["accuracy_score"] * 0.6 for h in history]
        avg_confidence = sum(confidence_scores) / total_questions
        
        overall = (avg_accuracy + avg_depth + avg_problem + avg_comm + avg_design) / 5.0
        
        # Collect all strengths and weaknesses
        strengths = []
        weaknesses = []
        recommendations = []
        
        for h in history:
            topic = h["question"]["topic"]
            score = h["evaluation"]["accuracy_score"]
            if score >= 80:
                strengths.append(f"Strong understanding of {topic} principles ({score}%).")
            elif score < 65:
                weaknesses.append(f"Gaps in {topic} implementation details ({score}%).")
                recommendations.append(f"Re-study curriculum modules covering {topic} definitions.")
                
        # Deduplicate
        strengths = list(set(strengths))[:4]
        weaknesses = list(set(weaknesses))[:4]
        recommendations = list(set(recommendations))[:3]
        
        # Ensure we have items
        if not strengths:
            strengths = ["Consistently solid conceptual baseline across topics."]
        if not weaknesses:
            weaknesses = ["No critical knowledge deficiencies. Good baseline performance."]
        if not recommendations:
            recommendations = ["Review HNSW construction parameters to optimize search indexing.", "Practice writing custom tool endpoints using the Model Context Protocol."]

        # Define custom learning path
        learning_path = {
            "recommended_videos": [
                {
                    "title": "Retrieval-Augmented Generation Deep Dive",
                    "duration": "18 mins",
                    "url": "https://youtube.com/watch?example1"
                },
                {
                    "title": "Qdrant Indexing & HNSW Mechanics",
                    "duration": "24 mins",
                    "url": "https://youtube.com/watch?example2"
                }
            ],
            "recommended_readings": [
                {
                    "title": "Model Context Protocol Specification",
                    "author": "OpenAI/Anthropic Joint Docs",
                    "type": "Specification"
                },
                {
                    "title": "Scaling Vector Search to Billions of Points",
                    "author": "Qdrant Engineering Blog",
                    "type": "Article"
                }
            ],
            "suggested_practice_problems": [
                "Implement a Python script to chunk markdown files semantically by tracking header tags.",
                "Build a local Qdrant collection with scalar quantization enabled and benchmark search latency."
            ]
        }
        
        return {
            "overall_score": round(overall, 1),
            "technical_accuracy": round(avg_accuracy, 1),
            "communication": round(avg_comm, 1),
            "depth": round(avg_depth, 1),
            "problem_solving": round(avg_problem, 1),
            "system_design": round(avg_design, 1),
            "candidate_confidence": round(avg_confidence, 1),
            "strengths": strengths,
            "weaknesses": weaknesses,
            "recommendations": recommendations,
            "learning_path": learning_path
        }

agent_engine = AgentEngine()
