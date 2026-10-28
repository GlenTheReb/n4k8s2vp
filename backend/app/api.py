import csv
import io
import logging
from datetime import date, time, timedelta
from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from backend.app.analytics import (
    FIRST_DECISION,
    build_insights,
    calculate_metrics,
    daily_results,
    select_intervals,
)
from backend.app.models import Analysis
from backend.app.store import load_snapshot

router = APIRouter(prefix="/api")
log = logging.getLogger(__name__)


def snapshot():
    try:
        return load_snapshot()
    except (OSError, ValueError, KeyError):
        log.exception("Historical snapshot unavailable")
        raise HTTPException(
            503,
            "Historical data cache is unavailable. Run the documented ingestion command or retry after the cache is restored.",
        ) from None


@router.get("/health")
def health():
    forecasts, actuals, manifest = snapshot()
    return {
        "status": "ok",
        "data_status": "cached",
        "forecast_records": len(forecasts),
        "actual_records": len(actuals),
        "generated_at": manifest["generated_at"],
        "cache_sha256": manifest["cache_sha256"],
    }


@router.get("/dates")
def dates():
    snapshot()
    return {
        "decision_dates": [str(FIRST_DECISION + timedelta(days=i)) for i in range(31)],
        "default_cutoff": "12:00",
        "timezone": "Europe/London",
        "cutoff_is_assumption": True,
    }


@lru_cache(maxsize=256)
def analyze(start_date: date, end_date: date, cutoff: time) -> Analysis:
    forecasts, actuals, manifest = snapshot()
    try:
        rows = select_intervals(forecasts, actuals, start_date, end_date, cutoff)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from None
    metrics = calculate_metrics(rows)
    return Analysis(
        start_date=start_date,
        end_date=end_date,
        cutoff=cutoff,
        metrics=metrics,
        daily=daily_results(rows),
        intervals=rows,
        insights=build_insights(rows, metrics),
        provenance={
            **manifest,
            "selection": "Latest publishTime at or before each UK decision timestamp, independently for each next-day delivery target.",
            "coverage_denominator": "All next-day half-hour timestamps in the selected decision window, plus any off-grid native forecast targets. Matched forecast/actual pairs divided by this count. Eligible-match coverage separately divides by eligible forecasts.",
            "bias_sign": "Forecast MW minus actual MW; positive means overprediction.",
            "actuals": "Latest cached retrospective WIND outturn revision; unavailable at the earlier decision time.",
            "interpolation": "None. Lines connect consecutive observed actuals only; forecasts are discrete native targets.",
            "cutoff_assumption": "User-selected illustrative cutoff, not an asserted market gate closure.",
        },
    )


DateQuery = Annotated[date, Query(description="UK decision date within January 2026")]
CutoffQuery = Annotated[
    time,
    Query(description="Illustrative UK local wall-clock cutoff, HH:MM, no UTC offset"),
]


@router.get("/analysis", response_model=Analysis)
def analysis(
    start_date: DateQuery = date(2026, 1, 15),
    end_date: DateQuery | None = None,
    cutoff: CutoffQuery = time(12),
):
    return analyze(start_date, end_date or start_date, cutoff)


@router.get(
    "/export.csv",
    response_class=Response,
    responses={200: {"content": {"text/csv": {}}}},
)
def export(
    start_date: DateQuery = date(2026, 1, 15),
    end_date: DateQuery | None = None,
    cutoff: CutoffQuery = time(12),
):
    result = analyze(start_date, end_date or start_date, cutoff)
    stream = io.StringIO(newline="")
    fields = list(type(result.intervals[0]).model_fields) if result.intervals else []
    writer = csv.DictWriter(stream, fieldnames=fields)
    writer.writeheader()
    for row in result.intervals:
        writer.writerow(row.model_dump(mode="json"))
    return Response(
        stream.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="windsight-{start_date}-{result.end_date}.csv"',
            "X-Data-SHA256": result.provenance["cache_sha256"],
        },
    )
