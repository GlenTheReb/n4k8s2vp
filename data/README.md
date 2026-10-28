# Historical data

`processed/historical.json` is genuine Elexon data, not demonstration or synthetic data. It contains 17,864 WINDFOR forecast versions with delivery targets from 2 January to 1 February 2026, plus 1,488 FUELHH WIND half-hourly outturns over that delivery window.

`processed/manifest.json` records 64 exact official API queries, retrieval timestamps, raw response SHA-256 values, row counts, observed target cadence, and the processed snapshot SHA-256. The snapshot was generated on 28 October 2026. Run `uv run python -m backend.app.ingestion` from the repository root to reproduce it. No Elexon API key is required. Source links:

- [WINDFOR stream](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream): `publishDateTimeFrom` and `publishDateTimeTo`; daily publication chunks, 30 Dec 2025 through 31 Jan 2026 inclusive.
- [FUELHH stream](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream): `settlementDateFrom`, `settlementDateTo`, `fuelType=WIND`; daily settlement chunks, 2 Jan through 1 Feb 2026 inclusive.

These stream endpoints return JSON arrays rather than paginated envelopes. No pagination parameter is invented. The displayed documentation does not specify a maximum range for these streams; one-day queries keep payloads small. Timeout: 60 seconds, connection timeout: 15 seconds, four attempts for network failures, HTTP 429 and server failures, exponential backoff and numeric Retry-After support. Permanent client errors and schema errors fail immediately.

Raw responses are cached under ignored `raw/`; repeat ingestion reuses them. To refresh from upstream, stop the application, move `data/raw/` aside, and rerun ingestion. Keep the prior processed snapshot until ingestion completes. Restart API workers afterward: the read-only snapshot and analyses are cached in memory. Two processed files are atomically replaced individually; a hash mismatch during a refresh returns 503 rather than serving inconsistent data.

All forecast versions required by the retrieval window are preserved; only out-of-scope delivery targets are removed. Exact source-key duplicates collapse. Conflicting duplicates fail. Actuals use their latest cached publication. Sources may be revised later, so a fresh upstream retrieval may produce a new fingerprint and results. The public processed files make this submission's results reproducible even if upstream changes.

The source snapshot has **hourly forecast target timestamps** (744 unique targets), while actuals occur every 30 minutes. At 12:00 UK decisions, 744 eligible forecasts match 744 actuals: **50% of 1,488 half-hour comparison timestamps**, **100% of eligible forecasts**. We compare the exact `startTime` records and never average adjacent actuals to manufacture a match. Some earlier cutoffs have fewer targets because the forecast horizon has not yet reached the end of delivery day.

This snapshot reflects what the official API returned when retrieved. It cannot establish a complete historical revision history beyond the source's retained records, exact public dissemination latency, or generation outside these specific national metered datasets. Retrospective actuals are displayed for evaluation only; they are not decision-time knowledge. Elexon data is credited to its source; no claim of ownership or unrestricted relicensing is made.
