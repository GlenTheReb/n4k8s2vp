# Developer learning

## Core engineering strategy

The central problem is reconstructing an information boundary. First define what the user knew at the decision time. Then separate that selection from later observations. Finally calculate metrics only on valid pairs, retaining enough source detail to audit every result. The user interface comes after this contract, so visual polish cannot hide a mistaken analytical assumption.

In `backend/app/models.py`, each source record has aware publication and target timestamps. An aware timestamp includes an offset, which makes comparisons refer to instants rather than ambiguous local clock readings. `analytics.py:delivery_targets` constructs the next UK calendar day, then iterates in UTC. A calendar day can contain 46 or 50 half-hours at daylight-saving changes; assuming every day always has 48 would be unsafe in a reusable helper. January has 48, but the helper and tests cover both clock changes.

`select_intervals` implements an **as-of join**: select the latest record available as of a specified instant, independently for each target. `<=` is deliberate: a forecast published exactly at cutoff is eligible; one second later is excluded. Keeping revisions is essential. If ingestion first discarded all but the newest forecast per target, the earlier decision could not be reconstructed. Deduplication uses a composite key (dataset, target, publication, fuel), so two different revisions remain distinct. Conflicting values for the same key raise an error because choosing one would be an unsupported assumption.

The functions in `analytics.py` are **pure**: their output depends on their inputs, and they do not download data or modify storage. This makes edge cases cheap to test and keeps network failures outside the mathematical rules. `ingestion.py` owns external requests; `store.py` owns snapshot loading; `api.py` validates and exposes the result. These boundaries allow the storage choice to change without rewriting forecast selection.

Missing data and zero are fundamentally different. A zero is a valid measured value. A missing forecast says the comparison cannot be made. `None` in Python becomes `null` in JSON and an empty CSV field; it never enters the error list. This avoids accidentally treating an unavailable forecast as a prediction of no wind. The exact timestamp join also prevents hourly forecast targets from appearing to cover half-hourly observations.

`frontend/src/hooks/useAnalysis.ts` owns the request lifecycle. An `AbortController` cancels the prior request when filters change or the component unmounts. The hook also checks whether a request was aborted before updating state. This prevents an old, slow response from overwriting the user's newer selection. `App.tsx` separates draft form values from applied values, so a chart always names the cutoff used to produce it. Components consume a typed response rather than independently recalculating backend metrics.

For a fixed historical pilot, read-only JSON is simpler than adding a database server: it is portable, easy to bundle and reproducible by hash. Its limits are explicit refreshes, per-worker memory caching and no incremental queries. At larger scale, keep the same pure analytical contract and introduce indexed storage keyed by target and publication time. Avoid building that infrastructure before the actual query volume requires it.

## Interview questions and strong example answers

### 1. Why does filtering forecasts to January delivery dates fail this assignment?

**Example answer:** The scope is January purchase decisions, not January delivery. A decision on 31 January concerns 1 February, and a decision on 1 January concerns 2 January. I start with decision dates, construct the next UK calendar day, and then select forecasts eligible at that decision's cutoff. Publication dates form another range: late December publications may be needed for an early January decision. Separating those three clocks prevents off-by-one-day errors and look-ahead bias. I would first write boundary examples, then encode them as tests before building a chart.

### 2. MAE and bias disagree. Is that a bug, and how would you investigate?

**Example answer:** They measure different properties. With errors +100 MW and −100 MW, bias is zero but MAE is 100 MW. The errors cancel in the signed mean, while absolute values preserve their magnitude. RMSE additionally weights large errors because squaring grows faster than taking absolute value. I would inspect the pair count and coverage, check the forecast-minus-actual sign, and recompute a small sample by hand. Then I would verify that both metrics use exactly the same valid pairs and cutoff. A low bias alone does not show accurate forecasting, and missing values cannot be included as zero to improve the result.

### 3. What would you change to support live data and millions of forecast revisions?

**Example answer:** I would keep `select_intervals` and metric definitions as the reference behavior, then store revisions in an indexed database with a unique key covering dataset, target, publication and fuel. An index beginning with target and publication would support the latest publication at or before cutoff. Ingestion would become scheduled and idempotent, and snapshot or dataset-version identifiers would invalidate response caches. I would add operational monitoring for late and missing publications before adding procurement recommendations. The tradeoff is more infrastructure, migrations and concurrency handling; none is necessary for a small, fixed January snapshot.

### 4. How can a correct API still show the wrong answer after a user changes filters quickly?

**Example answer:** Requests can finish in a different order from the order they started. If the noon request starts first but completes after the later 06:00 request, naïve state updates can put noon data under a 06:00 label. The hook cancels obsolete requests and ignores aborted completions. Applied filter state also labels the displayed result, while editable draft state stays separate. I would test the failure by delaying the first response and completing the second first. This is a race condition: correctness depends on event ordering, not merely on each individual calculation being correct.

## Commands used

Run project commands from the repository root unless noted. None needs a secret. Commands below are safe to rerun with the stated effects.

| Command | What it does and how to interpret it |
| --- | --- |
| `uv sync --frozen` | Creates/updates the local virtual environment from `uv.lock`. `--frozen` keeps the resolved dependency versions. Success means dependencies installed; it does not mean application tests passed. Safe to rerun. |
| `uv run python -m backend.app.ingestion` | `uv run` uses that environment; `python -m` executes the ingestion module with correct package imports. It downloads or reuses raw daily caches and replaces the processed snapshot and manifest. Check final counts, cadence and fingerprint; an error means ingestion did not complete. Stop/restart API workers around refreshes. |
| `uv run pytest -q` | Runs the analytical, API, ingestion and genuine-snapshot tests. `-q` reduces output. A zero exit status and all tests passed is success; a traceback names the failed rule. Safe to rerun, and tests isolate temporary data. |
| `uv run ruff check backend app.py` | Checks Python source for selected correctness and import issues without modifying it. Exit zero means no selected lint violations. `ruff format` formats code; `--fix` on lint is a modifying operation and was used only on authorized project files. |
| `npm ci --prefix frontend` | Installs exactly the frontend lockfile versions into `frontend/node_modules`. `ci` fails when package and lockfile disagree and replaces that dependency folder. `--prefix` chooses the frontend project while running from the root. |
| `npm run build --prefix frontend` | Runs TypeScript checking followed by Vite's production build. Success requires both to exit zero and writes `frontend/dist`. It proves compile/build correctness, not browser behavior. Safe to rerun. |
| `uv run uvicorn app:app --host 127.0.0.1 --port 8000` | Serves variable `app` from module `app.py`. Loopback limits access to this machine. Port 8000 must be free. Keep the terminal running; Ctrl+C stops it. Start after a frontend build for a single-origin production preview. |
| `npm run test:e2e --prefix frontend` | Runs Playwright's real-browser workflows in Chrome. It can start a local server if none is present. Passing output proves the listed user flows, not every possible browser or date. Set `WINDSIGHT_BASE_URL` to target Docker or the public deployment. |
| `docker compose up --build -d` | Builds the image if needed and starts the isolated service. `-d` leaves it running in the background. Check `docker compose ps` for `healthy` and call `/api/health`. Safe to rerun; it may replace this project's container. `docker compose down` removes this project's containers and network. |
| `ffprobe -v error -show_entries format=duration:stream=codec_name,width,height -of json <video>` | Reads media metadata without modifying the clip. It verified the silent rehearsal's duration, codec and dimensions. An empty or invalid stream list means it is not a usable recording. |

Local Git initialization used `git init -b feature/windsight`, following the required branch prefix. Publication is a separate external action. Local commits should use concise Conventional Commit subjects and bodies explaining material design choices.
