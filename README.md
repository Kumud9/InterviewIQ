# InterviewIQ AI

**Practice Smarter. Interview Better.**

InterviewIQ AI is an enterprise-grade AI Interview Platform designed to simulate high-fidelity technical interviews. The engine leverages a multi-agent orchestration architecture to dynamically adjust questions, probe candidates with follow-ups, and compile category scores based on the candidate's learning journey.

---

## Folder Structure

```
/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (auth, candidate, curriculum, live session, analytics)
│   │   ├── core/         # Settings configuration, database connection, JWT security helpers
│   │   ├── db/           # SQLAlchemy models and Pydantic schemas
│   │   ├── agents/       # LangGraph multi-agent planning & grading engine
│   │   ├── services/     # Vector DB (Qdrant), Cache (Redis), and fallback decorators
│   │   └── main.py       # Uvicorn FastAPI server bootstrapper
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env              # Backend configuration parameters
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js App Router (pages: landing, login, dashboard, interview, admin)
│   │   ├── components/   # UI elements and animations
│   │   └── lib/          # API HTTP client helper
│   ├── Dockerfile
│   └── package.json      # Frontend package configuration
├── docker-compose.yml    # Unified container orchestrator
└── start_locally.ps1     # One-click Windows PowerShell local environment launcher
```

---

## Installation & Running

### Method 1: Local Script Launcher (Fastest)

Ensure you have Node.js (v24+) and Python (3.13+) installed on your machine.

1. Open PowerShell in the root directory.
2. Execute the launcher script:
   ```powershell
   .\start_locally.ps1
   ```
3. Open your browser:
   - Frontend: `http://localhost:3000`
   - Backend OpenAPI Docs: `http://localhost:8000/docs`

*Note: For testing all pages instantly without signup details, click the **Demo Mode (Skip Auth Signup)** button on the Login page.*

### Method 2: Docker Compose

1. Build and boot up all containers:
   ```bash
   docker-compose up --build
   ```
2. Open `http://localhost:3000` in your browser.

---

## Multi-Agent Architecture

The platform implements a collaborative node graph using **LangGraph**:
1. **Profile Analyzer**: Syncs curriculum targets and candidates' CV metrics.
2. **Planner Agent**: Generates custom technical question structures.
3. **Retriever**: Queries vector similarity indices (Qdrant) for facts.
4. **Question Generator & Context Manager**: Maintains dialogue state and tracks streaming output text.
5. **Answer Evaluator**: Computes accuracy, depth, problem-solving, and communication grades.
6. **Report Generator**: Recommends learning paths, practice problems, and reviews.

---

## Simulator Mode Fallback

To support immediate verification without requiring external SaaS keys (such as OpenAI billing setup), the platform includes a curriculum-aware simulator mode enabled by default (`SIMULATOR_MODE=true` in `backend/.env`). 

To run with real live models:
1. Edit `backend/.env`
2. Set `SIMULATOR_MODE=false`
3. Provide your `OPENAI_API_KEY`

---

## Unified Evaluation API Endpoint

For external verification engines, the platform exposes a single, unified endpoint that maintains state across calls using a `sessionId`.

### Specification

- **Endpoint:** `POST /api/interview`
- **Authentication:** None required

#### 1. Start Session Payload
```json
POST /api/interview
{
  "sessionId": "abc-123",
  "candidate": {
    "member": {
      "id": "CAND-001",
      "name": "Sarah Johnson",
      "jobRole": "Senior Data Engineer",
      "yearsExperience": 9,
      "education": "MS Computer Science",
      "status": "COMPLETED"
    },
    "missions": [
      { "day": 7, "title": "Embeddings Explained", "passed": true, "attempts": 1 }
    ],
    "signals": { "commitDays": 28, "missionsCompleted": 30, "missionsFirstTry": 20 }
  }
}
```
**Response:**
```json
{
  "reply": "Welcome. Let's begin your interview.",
  "done": false
}
```

#### 2. Chat Turn Payload
```json
POST /api/interview
{
  "sessionId": "abc-123",
  "message": "Candidate's response to the active question..."
}
```
**Response (Middle Turns):**
```json
{
  "reply": "Next adaptive question content...",
  "done": false
}
```

**Response (Final Turn):**
```json
{
  "reply": "Interview completed.",
  "done": true,
  "feedback": {
    "summary": "Overall evaluation scoring breakdown...",
    "strengths": ["Actionable strength points..."],
    "gaps": ["Identified knowledge gaps..."],
    "next": ["Recommended learning steps..."]
  }
}
```

