"""Verified historical snapshot, loaded once per worker and never mutated."""

import hashlib
import json
from functools import lru_cache

from backend.app.ingestion import DATA
from backend.app.models import SourceRecord


@lru_cache(maxsize=1)
def load_snapshot() -> tuple[list[SourceRecord], list[SourceRecord], dict]:
    content = (DATA / "processed" / "historical.json").read_bytes()
    manifest = json.loads((DATA / "processed" / "manifest.json").read_text())
    if hashlib.sha256(content).hexdigest() != manifest["cache_sha256"]:
        raise ValueError("Historical cache integrity check failed; re-run ingestion")
    data = json.loads(content)
    forecasts = [SourceRecord.model_validate(r) for r in data["forecasts"]]
    actuals = [SourceRecord.model_validate(r) for r in data["actuals"]]
    return forecasts, actuals, manifest
