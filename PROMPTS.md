# AI Development Prompts

This document maps the actual developer-agent prompts, system queries, and debugging interactions used to implement the AI Interview Agent features, Gemini integrations, unified specs, fallbacks, and UI styling during the cohort technical hackathon.

---

## Project Architecture Initialization

**Prompt Context:**
> "Inspect the existing backend architecture. Install the official Google GenAI Python SDK. Load GEMINI_API_KEY securely from environment variables. Replace any mock QUESTION_POOL/fake AI responses with real Gemini calls. Use Gemini for interview question generation, evaluation, and adaptive feedback."

**Actual Prompts Used:**
1. *"I want to inspect the backend repository setup. Let's list the files under `backend/app` to locate where settings are configured and where the question generation mock mocks are active."*
2. *"Where is the Gemini client initialized? I want to transition the client creation code to use `from google import genai` from the new official `google-genai` SDK package."*
3. *"Write setting variables to load `GEMINI_API_KEY` from `backend/.env` without exposing it to the frontend client."*

---

## AI Interview Agent & Gemini Integration

**Prompt Context:**
> "The current implementation uses gemini-1.5-flash. The Google GenAI SDK returns: 404 NOT_FOUND models/gemini-1.5-flash is not found for API version v1beta. Programmatically list available models. Select a model that supports text generation and update the application configuration."

**Actual Prompts Used:**
1. *"The Gemini API calls are throwing 404 NOT_FOUND errors indicating models/gemini-1.5-flash does not exist. Write a diagnostic script to query `client.models.list()` using our configured `GEMINI_API_KEY` to see exactly which model variants are active on this key."*
2. *"The model list shows that `gemini-3.5-flash` and `gemini-3.6-flash` are active and available, but 1.5-flash is disabled/expired. Update setting files and environmental properties to swap all generation calls to use `settings.GEMINI_MODEL` configured dynamically."*

---

## Hackathon Data Integration & Personalization

**Prompt Context:**
> "The hackathon candidate profiles contain completed missions, attempts, skipped topics, and learning signals. Wire the candidate personalization context into planning prompts, turn question generation, and adaptive questioning."

**Actual Prompts Used:**
1. *"Review the schema structure inside `data/candidates.json` and `data/curriculum.json` to see how missions, attempts, skipped days, and learning signal counts are structured."*
2. *"Write a helper method `_build_personalization_context(candidate, next_day)` inside `AgentEngine` that parses completed missions, counts attempts to identify struggles, reads skipped flags, and calculates the first-try pass ratio to classify candidate signals (Strong vs Weak)."*
3. *"Modify the prompts in `start_interview_simulation` to pass detailed candidate instructions (e.g., probe skipped topics conceptual foundations, push difficulty if first-try ratio is high). Also update `generate_question_gemini` and `generate_adaptive_question` prompts to personalize current turn questions."*

---

## Error Handling & Fallbacks

**Prompt Context:**
> "Ensure the application never silently presents static/mock questions on Gemini failures. Stop E2E retry loops. If Gemini fails (503 or 429), preserve session index, halt execution, and return structured JSON indicating generation errors."

**Actual Prompts Used:**
1. *"Look at where exceptions are trapped inside `generate_question_gemini`. Remove the standard mock fallback text. Make sure we raise exceptions directly when Gemini configured calls fail."*
2. *"Rewrite `handle_unified_interview_endpoint` in `interview.py` to make state changes transactional/atomic. If Gemini throws a 429 rate limit or 503 service unavailable error, do NOT advance the session's question index or save history. Halt, preserve state, and return a clean error payload: `{"reply": "Error: Gemini question generation failed:...", "done": false, "status": "generation_error", "source": "gemini", "retryable": true}`"*
3. *"Write a mocked unit test script `test_structured_fallbacks.py` to trigger API endpoint calls, mock Gemini 503 exceptions, and verify that the session index remains unchanged and the endpoint returns the structured error contract."*

---

## UI/UX Redesign

**Prompt Context:**
> "Redesign the interface to feel like a premium AI technical interviewer using the warm editorial color palette (Background: #F6EBDD, Accent: #B85D2F, Cards: #DCCCB6, Borders: #C8B79E). Create visual hero animations, split-screens, curriculum indicators, radar charts, and timelines."

**Actual Prompts Used:**
1. *"Redesign the homepage `src/app/page.tsx` using typography styles, vintage paper backgrounds, and clean border separations. On the right of the hero, create a visual flow cycle (Profile → Curriculum → Planner → Question → Response → Follow-up → Feedback) that animates active steps using a state interval."*
2. *"Rewrite the active interview screen `dashboard/interview/page.tsx` into a split-screen dashboard. Place the current question in large, focused typography on the left. Put the editor and feedback feed on the right. At the bottom, render a horizontal milestone list showing completed vs current vs pending curriculum days."*
3. *"Update the candidate detail feedback report page `dashboard/candidates/[id]/page.tsx`. Include a Recharts Radar chart mapping accuracy, reasoning, depth, and communication, a custom curriculum tree graph showing node highlights, and an interactive timeline listing Normal turns vs Follow-ups and detected misconceptions."*

---

## Testing & Auditing

**Prompt Context:**
> "Run a single controlled E2E test. Verify candidate loading, curriculum loading, 8-question checklist, 4+ curriculum days, dynamic follow-ups, and unified API contract compliance."

**Actual Prompts Used:**
1. *"Run a diagnostic check on the live SQLite database and print out the latest candidate responses and turn metrics from our test log to confirm exactly how many questions were answered and how many curriculum days were successfully covered."*
2. *"Create an API contract test script `test_api_contract.py` that spins up FastAPI's `TestClient` and tests valid initialization, conversation turn progression, completion reports, invalid candidates, and invalid sessions. Verify that the response payload matches the required technical specifications."*
