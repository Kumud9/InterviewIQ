# AI Development & Usage Log

This log documents the collaborative pair-programming tasks completed using AI tools (Google Antigravity AI pair assistant) during the AI Cohort hackathon.

---

## Development Log Table

| Time / Stage | Task Category | AI Assistance Used | What was Generated / Changed | Human Verification Performed | Result / Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Stage 1** | **Architecture & API Review** | Directory structure analysis, setting parsing | Inspected backend routers, database schemas, and LangGraph structures | Reviewed endpoint routes manually to locate stubs | Mapped settings variables & API scopes |
| **Stage 2** | **Gemini SDK Integration** | SDK syntax compilation | Integrated official `google-genai` Python client library | Checked environment key variable load paths | Replaced fallback stubs with real generative calls |
| **Stage 3** | **Gemini Model Debugging** | Model list query script generation | Created list model scripts to fetch active key capabilities | Executed listing check using live API endpoints | Swapped model references to supported `gemini-3.6-flash` |
| **Stage 4** | **Error Handling & Fallbacks** | Pydantic validation mapping & client test scripts | Added atomic endpoint handlers, state preservation rules, and `test_structured_fallbacks.py` | Executed test script using TestClient mocks (503 & 429) | Session indices are preserved on Gemini failure states |
| **Stage 5** | **Candidate Personalization** | JSON parsing helper methods & prompt templating | Implemented `_build_personalization_context` to filter skipped, struggled, and strong curriculum topics | Wrote `test_personalization.py` to evaluate customized prompt layouts | Prompts adapt dynamically to candidate CV data signals |
| **Stage 6** | **UI/UX Redesign** | Next.js Page redesigns & styling helpers | Rewrote landing page, dashboard main view, candidate details, and split-screen interview panels | Compiled static site build using Turbopack compiler (`npm run build`) | Responsive editorial interface with zero compilation errors |
| **Stage 7** | **API Contract Verification** | Integration mock tests | Developed `test_api_contract.py` covering standard/invalid sessions and final report outputs | Executed validation test checking JSON schema keys | Converted endpoints to 100% contract compliance |

---

## Human Verification Log

For each stage, manual and automated verification checks were run to confirm correct behavior:

1. **Model Connectivity**: Verified models list returned HTTP 200 via `list_models.py` diagnostic tool.
2. **Personalization Integrity**: Ran `test_personalization.py` to assert that candidate CV attributes successfully altered generated prompts.
3. **Fallback Actions**: Verified via `test_structured_fallbacks.py` that session transaction states were preserved on rate-limit exceptions.
4. **API Compliance**: Validated endpoint formatting using `test_api_contract.py` client checks.
5. **UI Compilation**: Compiled Next.js using production-level Turbopack bundler.
6. **No Keys Committed**: Checked `.gitignore` to ensure `.env` and sqlite `.db` data files are excluded.
