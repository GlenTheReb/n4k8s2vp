# Verification record

Checks executed on 28 October 2026. Results below describe observed outcomes, not planned checks.

| Check | Outcome |
| --- | --- |
| Backend `uv run pytest -q` | 26 passed in 1.00s; no warnings on final run |
| Python `uv run ruff check backend app.py` | Passed |
| Frontend `npm run build --prefix frontend` | TypeScript and Vite production build passed |
| Playwright against local production server | 3 passed; cutoff/filtering, exact interval audit, export, navigation, month boundary, loading/error/retry, intercepted empty state, mobile and keyboard |
| Same Playwright suite against Docker port 8010 | 3 passed in 6.9s |
| Browser console, local Explorer | 0 errors, 0 warnings |
| Desktop visual inspection | Native concept and live screenshot both inspected at 1536×1024; palette, hierarchy, sidebar, metrics, chart/inspector and audit table compared |
| Mobile | 390×844; no page-level horizontal overflow; charts, dates and navigation respond |
| Docker build and startup | Built successfully; service healthy and running as non-root on read-only filesystem |
| Docker HTTP checks | `/`, `/api/health`, January-31 `/api/analysis` and `/docs` return 200; Jan-31 returns 24 matched Feb-1 delivery records |
| Data | 17,864 genuine forecast versions, 1,488 actuals; 744 noon pairs; exact source maxima checked exhaustively |
| Credential-pattern scan | No matching private keys or common token patterns in candidate source files; `.env`, virtual environment, raw cache and SDD ignored |
| Silent visual rehearsal | 37.8 seconds, 1440×1000; VP8 source and H.264 MP4 inspected with ffprobe; no narration or upload |
| Vercel | Create-project blocked by team scope 403; user reports consent approval but retry still fails. No public deployment exists yet |
| GitHub | Connected identity verified; local Git credential available. Repository creation/publication not executed |
| Submission form | Read in browser; eight fields recorded in submission document; nothing entered or submitted |

Core analytical tests cover publication equality and one-second-after cutoff; multiple revisions; no eligible forecast; exact timestamp joins; missing actuals; deterministic duplicate collapse and conflicting-duplicate rejection; latest retrospective WIND-only actual; formula and bias signs; valid zero generation; January boundaries including Feb-1 delivery; equivalent timestamp offsets; naive timestamps; DST-safe target grids; sparse forecasts; invalid generation; API input errors; CSV null handling; missing-cache 503; retry, schema and raw-cache behavior.

The Browser skill/plugin was unavailable, so the workflow used Playwright MCP and the project's Playwright runner with installed Google Chrome. The first runner invocation failed because the matching bundled headless Chromium was absent; the configuration was changed to reuse installed Chrome, and all three tests then passed. This was a browser setup failure, not an application test pass. Build checking also caught a missing Vite CSS declaration, which was fixed before browser validation.

Docker first exposed an incorrect project-root calculation in ingestion. Only the 66 task-generated cache files were moved from the parent folder into this repository; empty generated parent directories were removed, and `ROOT` was corrected. Tests and Docker then passed with repository-local data. This matters for reproducibility: source files and cache must travel together.

The design concept showed illustrative three-hour points and placeholder metrics. The implementation deliberately uses genuine hourly targets, actual sample counts, applied-filter context, read-only timezone/delivery labels and explicit coverage assumptions. Exact pixel duplication of illustrative data was not used as a reason to misrepresent the source. The final UI is code-native and contains no screenshot-based controls.

Remaining checks: successful Vercel build and signed-out runtime checks; public GitHub readability and source completeness; final narrated YouTube video accessibility; all final form links checked in a fresh anonymous context. Chromium is covered; Firefox and Safari are not. No performance load test or formal accessibility audit has been performed.

Local architectural handoff context (intentionally ignored): `SDD.md:3` Current status and execution pointer; `SDD.md:6` Architecture; `SDD.md:9` Temporal model and analytical safety; `SDD.md:12` Interfaces and storage; `SDD.md:15` Verification and remaining work. Reopen those bounded sections when continuing publication or data refresh work.
