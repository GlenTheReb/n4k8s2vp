"""Reproducible, resumable historical Elexon ingestion. Run as a module."""

import argparse
import hashlib
import json
import os
import time
from collections import Counter
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

import httpx

from backend.app.analytics import deduplicate
from backend.app.models import SourceRecord

ROOT = Path(__file__).resolve().parents[2]
DATA = Path(os.environ.get("WINDSIGHT_DATA_DIR", ROOT / "data"))
BASE = "https://data.elexon.co.uk/bmrs/api/v1"


def download(
    client: httpx.Client, dataset: str, params: dict
) -> tuple[list[dict], dict]:
    raw_dir = DATA / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    key = hashlib.sha256(
        json.dumps([dataset, params], sort_keys=True).encode()
    ).hexdigest()[:16]
    path = raw_dir / f"{dataset}-{key}.json"
    if path.exists():
        cached = json.loads(path.read_text())
        return cached["records"], cached["request"]
    url = f"{BASE}/datasets/{dataset}/stream"
    for attempt in range(4):
        try:
            response = client.get(url, params=params)
            response.raise_for_status()
            records = response.json()
            if not isinstance(records, list):
                raise ValueError("Expected Elexon stream JSON array")
            for row in records:
                record = SourceRecord.model_validate(row)
                if record.dataset != dataset:
                    raise ValueError("Unexpected dataset in stream")
            request = {
                "url": str(response.url),
                "retrieved_at": datetime.now(UTC).isoformat(),
                "record_count": len(records),
                "sha256": hashlib.sha256(response.content).hexdigest(),
            }
            wrapped = {"records": records, "request": request}
            path.write_text(json.dumps(wrapped, separators=(",", ":")))
            time.sleep(0.15)
            return records, request
        except (
            httpx.TimeoutException,
            httpx.NetworkError,
            httpx.HTTPStatusError,
        ) as exc:
            status = (
                exc.response.status_code
                if isinstance(exc, httpx.HTTPStatusError)
                else None
            )
            if status is not None and status != 429 and status < 500:
                raise
            if attempt == 3:
                raise
            retry_after = exc.response.headers.get("retry-after", "") if status else ""
            delay = min(float(retry_after), 60) if retry_after.isdigit() else 2**attempt
            time.sleep(delay)
    raise RuntimeError("Retry loop exhausted")


def ingest() -> None:
    forecasts, actuals, requests = [], [], []
    # Two-day publication warmup covers earliest January decision, including 00:00.
    with httpx.Client(
        timeout=httpx.Timeout(60, connect=15),
        headers={
            "Accept": "application/json",
            "User-Agent": "WindSight/1.0 historical research",
        },
    ) as client:
        day = date(2025, 12, 30)
        while day <= date(2026, 1, 31):
            rows, request = download(
                client,
                "WINDFOR",
                {
                    "publishDateTimeFrom": f"{day}T00:00:00Z",
                    "publishDateTimeTo": f"{day + timedelta(days=1)}T00:00:00Z",
                },
            )
            forecasts.extend(rows)
            requests.append(request)
            print(f"WINDFOR {day}: {len(rows)}", flush=True)
            day += timedelta(days=1)
        day = date(2026, 1, 2)
        while day <= date(2026, 2, 1):
            rows, request = download(
                client,
                "FUELHH",
                {
                    "settlementDateFrom": str(day),
                    "settlementDateTo": str(day),
                    "fuelType": "WIND",
                },
            )
            actuals.extend(row for row in rows if row.get("fuelType") == "WIND")
            requests.append(request)
            print(f"FUELHH {day}: {len(rows)}", flush=True)
            day += timedelta(days=1)
    clean_f, duplicate_f = deduplicate(
        [SourceRecord.model_validate(r) for r in forecasts]
    )
    clean_a, duplicate_a = deduplicate(
        [SourceRecord.model_validate(r) for r in actuals]
    )
    lo = datetime(2026, 1, 2, tzinfo=UTC)
    hi = datetime(2026, 2, 2, tzinfo=UTC)
    clean_f = [r for r in clean_f if lo <= r.start_time < hi]
    targets = sorted({r.start_time for r in clean_f})
    cadence = Counter(
        int((b - a).total_seconds() / 60) for a, b in zip(targets, targets[1:])
    )
    payload = {
        "forecasts": [
            r.model_dump(mode="json", by_alias=True, exclude_none=True) for r in clean_f
        ],
        "actuals": [
            r.model_dump(mode="json", by_alias=True, exclude_none=True) for r in clean_a
        ],
    }
    output = DATA / "processed"
    output.mkdir(parents=True, exist_ok=True)
    content = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    manifest = {
        "generated_at": datetime.now(UTC).isoformat(),
        "source": "Elexon Insights Solution official API",
        "datasets": ["WINDFOR", "FUELHH (WIND)"],
        "decision_window": ["2026-01-01", "2026-01-31"],
        "delivery_window": ["2026-01-02", "2026-02-01"],
        "publication_warmup_from": "2025-12-30",
        "forecast_records": len(clean_f),
        "actual_records": len(clean_a),
        "forecast_target_cadence_minutes": dict(sorted(cadence.items())),
        "duplicate_records_removed": {"WINDFOR": duplicate_f, "FUELHH": duplicate_a},
        "cache_sha256": hashlib.sha256(content).hexdigest(),
        "requests": requests,
    }
    # Readers see only complete files. Manifest hash detects interrupted two-file updates.
    for name, body in [
        ("historical.json", content),
        ("manifest.json", json.dumps(manifest, indent=2).encode()),
    ]:
        temporary = output / f"{name}.tmp"
        temporary.write_bytes(body)
        temporary.replace(output / name)
    print(json.dumps({k: v for k, v in manifest.items() if k != "requests"}, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args()
    ingest()
