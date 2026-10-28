# WindSight demonstration — target 9 minutes 20 seconds

Status: script and recording plan prepared. A narrated final video has not yet been recorded or uploaded to YouTube. Do not submit until an **unlisted**, publicly viewable video exists. Keep client section below five minutes and technical section below five minutes. This script targets about 9:20 total including interaction pauses; rehearse with a timer and trim if needed.

Before recording: open the public deployment (or local app for rehearsal), close unrelated tabs and notifications, use 1440×1000 at 100% browser zoom, and load Explorer at 15 Jan / 12:00 UK. Use the included historical snapshot. Open the six code files listed below and the API docs in separate tabs. Do not display credentials, personal browser history or environment files. Use your own natural narration.

## Part 1: client product presentation — 0:00–4:20

### 0:00–0:35 — Problem and product value

Screen: Forecast Explorer, initial view.

“When you buy electricity a day before delivery, wind generation is still uncertain. You need to know which forecast was actually available when you made the decision, and how much that forecast has differed from observed generation historically. WindSight brings those two questions together. This pilot uses only the requested Elexon national wind forecasts and actual generation, with January 2026 as the decision window.”

### 0:35–1:20 — Reconstruct the decision

Screen: point out 15 January, noon UK, delivery 16 January. Select the first interval in the inspector.

“Here, the decision is on 15 January at noon UK time, for delivery on 16 January. Noon is an illustrative cutoff we can change. For each delivery target, the application selects the latest forecast published at or before that cutoff. The inspector shows the publication timestamp and its age, so the forecast is auditable. The actual value is shown retrospectively to evaluate the earlier forecast; it was not known at the decision.”

### 1:20–2:00 — Interact with availability

Action: change cutoff to 06:00, click Apply cutoff, compare metrics and publication. Check Include missing forecasts, select a :30 target, then restore noon.

“Moving the cutoff earlier changes the forecast information available. The mint points are the source's actual hourly forecast targets. The observed series is half-hourly. A half-hour with no eligible forecast stays empty. We do not create a forecast by filling or interpolating a gap. At noon this day has 24 matched observations out of 48 half-hour timestamps. All eligible forecasts match actuals, but half-hour-grid coverage is only 50 percent.”

### 2:00–2:55 — Quantify accuracy

Action: Forecast Accuracy; use full January at noon. Show top metrics, then daily accuracy and error distribution.

“Across all January decisions at noon, we compare 744 valid pairs. Mean absolute error is approximately 1,884 megawatts: the average size of a discrepancy. Root mean squared error is around 2,350 megawatts and gives more weight to large misses. Mean bias is about plus 1,685 megawatts, so these selected forecasts overpredicted observed wind on average. The daily comparison and distribution make variation visible instead of hiding it inside one monthly score. These are historical descriptions of this selected sample, not future guarantees.”

### 2:55–3:40 — Explain decision relevance

Action: Decision Insights. Read direction, uncertainty and largest discrepancy.

“The insights are calculated directly from the selected records. They identify the direction of error, typical error size and the largest observed discrepancy, with the delivery and publication timestamps. Lower-than-forecast wind can increase uncertainty about other generation needs. But these sources contain neither customer demand nor prices, so WindSight does not claim to calculate purchase quantities or costs.”

### 3:40–4:20 — Demonstrate trust and portability

Action: Explorer, set 31 January / noon; show delivery 1 February; Export CSV. Open Data & methodology via footer.

“The window follows purchasing decisions, so 31 January correctly includes delivery on 1 February. You can export the exact observations and publication timestamps. The methodology page explains the cutoff, coverage, source queries and snapshot fingerprint. This gives your team a clear account of what was known, how the forecast performed and where the evidence is incomplete.”

## Part 2: technical lead walkthrough — 4:20–9:20

### 4:20–5:00 — Architecture

Screen: README architecture diagram, repository structure.

“The frontend is React with TypeScript and Vite. FastAPI serves typed responses from Python. Ingestion is an explicit offline command, and the deployed application reads a versioned historical JSON snapshot. The client and API share one origin. For this fixed January pilot, a database service would add operational complexity without improving the core behavior. The tradeoff is that refresh is explicit and workers must restart after snapshot replacement.”

### 5:00–5:45 — Ingestion and provenance

Screen: `backend/app/ingestion.py`, `data/processed/manifest.json` (show compact metadata, not the full JSON).

“WINDFOR is retrieved by publication dates, preserving forecast versions. FUELHH is retrieved by settlement date and filtered to WIND. Daily chunks keep responses manageable. We validate fields and aware timestamps, retry transient failures, cache raw requests and preserve query URLs and hashes. Publication retrieval begins two days before January to support the earliest cutoff. Identical duplicates collapse; conflicting duplicates fail rather than being arbitrarily resolved. A snapshot hash prevents serving a partially replaced cache.”

### 5:45–6:40 — Prevent look-ahead bias

Screen: `backend/app/analytics.py`, `select_intervals`.

“Decision, publication and target time are different concepts. A January decision maps to the following UK calendar day. The cutoff is converted to UTC. For each target we reject every publication after that decision and select the maximum eligible publication time. The join to actuals is exact by start timestamp. Missing values remain null. Hourly forecasts do not become half-hourly forecasts. Actuals use the latest cached retrospective revision and are never used to choose a forecast. This preserves the information boundary that makes the historical comparison credible.”

### 6:40–7:15 — Metrics and API

Screen: `calculate_metrics`, then `/docs` and expand `/api/analysis`.

“Signed error is forecast minus actual. MAE averages absolute errors; RMSE averages squared errors and takes the square root; bias averages signed errors. Only valid pairs contribute. The response includes sample counts and both grid coverage and eligible-match coverage. The API validates ordered January ranges and UK wall-clock cutoffs, returns useful status codes and exports the same audit records to CSV. Metrics and export share the same analytical function.”

### 7:15–8:00 — Frontend and interactions

Screen: `frontend/src/hooks/useAnalysis.ts`, then `frontend/src/pages/Explorer.tsx`.

“The app shell composes feature pages. Charts, audit tables and metrics have separate components. Page modules load lazily. The request hook cancels obsolete requests so a slower earlier response cannot overwrite a newer selection. Draft filters are distinct from applied filters. Loading, retry, unavailable and missing-observation states are explicit. Accessible inputs and table controls allow keyboard inspection, and a narrow layout keeps filters and charts usable on mobile.”

### 8:00–8:45 — Verification

Screen: run `uv run pytest -q`; show completed browser test output or rerun `npm run test:e2e --prefix frontend` before recording to avoid waiting in the final edit.

“The tests cover inclusive cutoffs, revisions, future publication exclusion, missing actuals, exact joins, duplicate conflicts, metric formulas, zero values, timezones and the January-to-February boundary. An exhaustive check compares all noon selections against source maxima. Browser tests exercise cutoff changes, export, navigation, error recovery and responsive layout. Test-only intercepted responses exercise empty and failed states without substituting synthetic production data. The evidence is recorded in the verification document.”

### 8:45–9:20 — Delivery and tradeoffs

Screen: Dockerfile, verified deployment URL, submission checklist.

“Docker builds React separately and runs a non-root Python container with the historical snapshot. The Vercel configuration uses its supported FastAPI runtime. The published URL and public repository must be checked without authentication before submission. This is a historical pilot: source revisions, sparse targets and the fixed cutoff assumption limit interpretation. The README acknowledges AI assistance. The submission includes the source, reproducible data preparation, executed tests and this video, with those boundaries stated plainly.”

Do not say publication or Docker validation succeeded until `docs/verification.md` records the successful checks. Replace that sentence with its exact current status if recording before delivery is finished.

## Files to show, in order

1. `README.md`: architecture diagram and startup.
2. `backend/app/ingestion.py`: daily queries, retries, source validation and snapshot write.
3. `backend/app/analytics.py`: selection and metric formulas.
4. `backend/app/api.py`: shared analysis response and CSV.
5. `frontend/src/hooks/useAnalysis.ts`: cancellation, loading and errors.
6. `backend/tests/test_analytics.py` and `backend/tests/test_api.py`: boundary and real snapshot checks.

Use symbol search rather than scrolling entire files. Rehearse transitions. Keep each part below five minutes even after adding pauses. Export at 1080p if practical, listen to the full audio, and check visible chart labels before upload. Set YouTube visibility to **Unlisted**, not Private. Open the resulting URL in a fresh signed-out browser context and verify that playback begins. Record the exact URL in `docs/submission.md`.
