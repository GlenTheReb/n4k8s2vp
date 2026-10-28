import csv
import hashlib
import io
import json
from datetime import date, time

import httpx
import pytest

from app import app
from backend.app.api import analyze
from backend.app.ingestion import download
from backend.app.store import load_snapshot


def request(path):
    # ASGITransport avoids opening sockets and exercises real routing and validation.
    import asyncio

    async def run():
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as client:
            return await client.get(path)

    return asyncio.run(run())


def test_health_dates_and_openapi():
    assert request("/api/health").json()["status"] == "ok"
    dates = request("/api/dates").json()["decision_dates"]
    assert len(dates) == 31 and dates[-1] == "2026-01-31"
    assert "/api/analysis" in request("/openapi.json").json()["paths"]


def test_real_january_snapshot_integrity_and_cutoffs():
    forecasts, actuals, manifest = load_snapshot()
    assert len(forecasts) == manifest["forecast_records"]
    assert len(actuals) == manifest["actual_records"]
    assert len({r.start_time for r in actuals}) == 31 * 48
    result = analyze(date(2026, 1, 1), date(2026, 1, 31), time(12))
    assert result.metrics.expected_intervals == 1488
    assert result.metrics.sample_count == 744
    assert result.metrics.coverage_percent == 50
    assert result.metrics.eligible_match_percent == 100
    assert result.intervals[-1].target_time.date() == date(2026, 2, 1)
    assert all(
        r.publish_time is None or r.publish_time <= r.decision_time
        for r in result.intervals
    )
    # Independent exhaustive maximum verifies cached as-of results against the source.
    lookup = {}
    for record in forecasts:
        lookup.setdefault(record.start_time, []).append(record)
    for row in result.intervals:
        eligible = [
            f
            for f in lookup.get(row.target_time, [])
            if f.publish_time <= row.decision_time
        ]
        assert row.publish_time == max((f.publish_time for f in eligible), default=None)


@pytest.mark.parametrize(
    "query",
    [
        "start_date=2026-02-01",
        "start_date=2026-01-20&end_date=2026-01-01",
        "cutoff=12:00Z",
        "cutoff=nonsense",
        "start_date=nope",
    ],
)
def test_useful_validation(query):
    assert request("/api/analysis?" + query).status_code == 422


def test_csv_matches_analysis_and_preserves_nulls():
    result = request("/api/analysis?start_date=2026-01-31").json()
    response = request("/api/export.csv?start_date=2026-01-31")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    rows = list(csv.DictReader(io.StringIO(response.text)))
    assert len(rows) == 48
    assert rows[0]["target_time"].startswith("2026-02-01")
    assert float(rows[0]["forecast_mw"]) == result["intervals"][0]["forecast_mw"]
    assert rows[1]["forecast_mw"] == "" and rows[1]["error_mw"] == ""


def test_missing_cache_is_service_unavailable(monkeypatch):
    import backend.app.api as api

    def unavailable():
        raise FileNotFoundError("test-only missing cache")

    monkeypatch.setattr(api, "load_snapshot", unavailable)
    response = request("/api/health")
    assert response.status_code == 503
    assert "cache" in response.json()["detail"]
    assert "test-only" not in response.text


def test_retry_and_raw_cache_reuse(tmp_path, monkeypatch):
    import backend.app.ingestion as ingestion

    monkeypatch.setattr(ingestion, "DATA", tmp_path)
    monkeypatch.setattr(ingestion.time, "sleep", lambda _: None)
    calls = []
    row = {
        "dataset": "WINDFOR",
        "publishTime": "2026-01-01T10:00:00Z",
        "startTime": "2026-01-02T00:00:00Z",
        "generation": 100,
    }

    def handle(req):
        calls.append(req)
        return (
            httpx.Response(429, headers={"retry-after": "0"})
            if len(calls) == 1
            else httpx.Response(200, json=[row])
        )

    with httpx.Client(transport=httpx.MockTransport(handle)) as client:
        records, provenance = download(
            client, "WINDFOR", {"publishDateTimeFrom": "2026-01-01T00:00:00Z"}
        )
        again, _ = download(
            client, "WINDFOR", {"publishDateTimeFrom": "2026-01-01T00:00:00Z"}
        )
    assert records == again == [row] and len(calls) == 2
    assert (
        provenance["sha256"]
        == hashlib.sha256(json.dumps([row], separators=(",", ":")).encode()).hexdigest()
    )


def test_schema_failures_and_permanent_http_failures_are_not_retried(
    tmp_path, monkeypatch
):
    import backend.app.ingestion as ingestion

    monkeypatch.setattr(ingestion, "DATA", tmp_path)
    for response in [
        httpx.Response(400),
        httpx.Response(200, json=[{"dataset": "WRONG"}]),
    ]:
        calls = []

        def handle(req):
            calls.append(req)
            return response

        with httpx.Client(transport=httpx.MockTransport(handle)) as client:
            with pytest.raises((ValueError, httpx.HTTPStatusError)):
                download(client, "WINDFOR", {})
        assert len(calls) == 1
