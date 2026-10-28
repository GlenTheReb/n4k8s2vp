# Implementation checklist

Source of assignment requirements: the supplied v4.1 intern DOCX, read in full. The user's mission adds FastAPI, analytics, UX and verification detail. The original document is not redistributed.

| Requirement | Implementation / evidence | State |
| --- | --- | --- |
| Clearly show latest forecast available at decision time | Explorer, interval inspector, source publication audit, inclusive as-of cutoff | Implemented |
| Quantify forecast accuracy | MAE, RMSE, signed bias, n, two coverage denominators, daily breakdown and distribution | Implemented |
| Elexon FUELHH WIND and WINDFOR exclusively | Official stream ingestion; genuine historical snapshot and query manifest | Implemented |
| January 2026 purchase decisions | 1–31 Jan decision dates map to 2 Jan–1 Feb delivery | Implemented |
| React frontend, Python backend | React/TypeScript/Vite; FastAPI and Pydantic models | Implemented |
| Docker | Multi-stage Dockerfile and single-origin Compose; healthy running container; browser suite passes against container | Verified |
| Vercel or Heroku | Vercel FastAPI runtime at https://n4k8s2vp.vercel.app; public HTTP and browser checks | Verified |
| Public GitHub repo, anonymous name | https://github.com/GlenTheReb/n4k8s2vp; source, tests, data, docs and lockfiles | Verified anonymously |
| README: files, startup, deployment link | README.md, including verified live URL | Implemented |
| Explicit AI acknowledgement | README.md | Implemented |
| Unlisted YouTube, ≤10 min, customer ≤5 min + technical ≤5 min | docs/video-walkthrough.md timed script and shot list; silent rehearsal recorded | Prepared; narrated video and upload pending |
| Submit supplied form and verify URLs anonymously | docs/submission.md; final approval required | Pending |
| ≤16 hours effort | Keep one deployable product, no database service, LLM, prices, demand, or unsupported purchases | Within scope |

Additional mission acceptance: deterministic ingestion with retries and provenance, no look-ahead, no filling gaps, timezone-aware selection, half-hour coverage disclosure, source integrity checks, meaningful browser tests, loading/error/empty states, responsive navigation, CSV export, Docker runtime and independent public-access checks.
