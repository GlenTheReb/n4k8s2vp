"""Pure deterministic as-of selection. No I/O and no imputed observations."""

from collections import defaultdict
from datetime import UTC, date, datetime, time, timedelta
from math import ceil, fsum, sqrt
from zoneinfo import ZoneInfo

from backend.app.models import DailyResult, Insight, Interval, Metrics, SourceRecord

UK = ZoneInfo("Europe/London")
FIRST_DECISION = date(2026, 1, 1)
LAST_DECISION = date(2026, 1, 31)


def deduplicate(records: list[SourceRecord]) -> tuple[list[SourceRecord], int]:
    """Collapse identical source keys; reject contradictory duplicates, never guess."""
    unique: dict[tuple, SourceRecord] = {}
    for record in records:
        key = (record.dataset, record.start_time, record.publish_time, record.fuel_type)
        if key in unique and unique[key].generation != record.generation:
            raise ValueError(
                f"Conflicting duplicate source records at {record.start_time}"
            )
        unique[key] = record
    return sorted(unique.values(), key=lambda r: (r.start_time, r.publish_time)), len(
        records
    ) - len(unique)


def delivery_targets(decision_day: date) -> list[datetime]:
    """UK next-calendar-day half-hours, iterated in UTC (also DST safe)."""
    delivery_day = decision_day + timedelta(days=1)
    start = datetime.combine(delivery_day, time(), UK).astimezone(UTC)
    end = datetime.combine(delivery_day + timedelta(days=1), time(), UK).astimezone(UTC)
    result = []
    while start < end:
        result.append(start)
        start += timedelta(minutes=30)
    return result


def select_intervals(
    forecasts: list[SourceRecord],
    actuals: list[SourceRecord],
    start_day: date,
    end_day: date,
    cutoff: time,
) -> list[Interval]:
    if cutoff.tzinfo is not None:
        raise ValueError("Cutoff must be a local UK wall-clock time without an offset")
    if not FIRST_DECISION <= start_day <= end_day <= LAST_DECISION:
        raise ValueError("Decision dates must be ordered and within January 2026")
    versions: dict[datetime, list[SourceRecord]] = defaultdict(list)
    clean_forecasts, _ = deduplicate(forecasts)
    clean_actuals, _ = deduplicate(actuals)
    for record in clean_forecasts:
        if record.dataset == "WINDFOR":
            versions[record.start_time].append(record)
    outturns: dict[datetime, SourceRecord] = {}
    for record in clean_actuals:
        if record.dataset == "FUELHH" and record.fuel_type == "WIND":
            # Latest retrospective outturn revision; it is not decision-time knowledge.
            outturns[record.start_time] = record
    rows = []
    day = start_day
    while day <= end_day:
        decision = datetime.combine(day, cutoff, UK).astimezone(UTC)
        targets = delivery_targets(day)
        # Preserve irregular native targets as well as the expected half-hour grid.
        delivery_end = targets[-1] + timedelta(minutes=30)
        targets = sorted(
            set(targets) | {t for t in versions if targets[0] <= t < delivery_end}
        )
        for target in targets:
            eligible = [
                r for r in versions.get(target, []) if r.publish_time <= decision
            ]
            forecast = max(eligible, key=lambda r: r.publish_time, default=None)
            actual = outturns.get(target)
            rows.append(
                Interval(
                    decision_date=day,
                    decision_time=decision,
                    target_time=target,
                    forecast_mw=forecast.generation if forecast else None,
                    actual_mw=actual.generation if actual else None,
                    error_mw=forecast.generation - actual.generation
                    if forecast and actual
                    else None,
                    publish_time=forecast.publish_time if forecast else None,
                    actual_publish_time=actual.publish_time if actual else None,
                    forecast_age_hours=(
                        decision - forecast.publish_time
                    ).total_seconds()
                    / 3600
                    if forecast
                    else None,
                    lead_time_hours=(target - forecast.publish_time).total_seconds()
                    / 3600
                    if forecast
                    else None,
                )
            )
        day += timedelta(days=1)
    return rows


def calculate_metrics(rows: list[Interval]) -> Metrics:
    errors = [r.error_mw for r in rows if r.error_mw is not None]
    n = len(errors)
    eligible = sum(r.forecast_mw is not None for r in rows)
    absolute = sorted(abs(e) for e in errors)
    return Metrics(
        sample_count=n,
        expected_intervals=len(rows),
        eligible_forecasts=eligible,
        actual_intervals=sum(r.actual_mw is not None for r in rows),
        coverage_percent=100 * n / len(rows) if rows else 0,
        eligible_match_percent=100 * n / eligible if eligible else None,
        mae_mw=fsum(absolute) / n if n else None,
        rmse_mw=sqrt(fsum(e * e for e in errors) / n) if n else None,
        bias_mw=fsum(errors) / n if n else None,
        p90_absolute_error_mw=absolute[ceil(0.9 * n) - 1] if n else None,
    )


def daily_results(rows: list[Interval]) -> list[DailyResult]:
    grouped: dict[date, list[Interval]] = defaultdict(list)
    for row in rows:
        grouped[row.decision_date].append(row)
    return [
        DailyResult(
            decision_date=d,
            delivery_date=d + timedelta(days=1),
            metrics=calculate_metrics(rs),
        )
        for d, rs in grouped.items()
    ]


def build_insights(rows: list[Interval], metrics: Metrics) -> list[Insight]:
    n = metrics.sample_count
    if not n:
        return [
            Insight(
                title="No matched observations",
                detail="No forecast and actual pairs are available at this cutoff. Move the cutoff later or choose another decision date. Missing values are never treated as zero.",
                kind="caution",
            )
        ]
    bias = metrics.bias_mw
    direction = (
        "overpredicted"
        if bias > 0
        else "underpredicted"
        if bias < 0
        else "were balanced against"
    )
    worst = max(
        (r for r in rows if r.error_mw is not None), key=lambda r: abs(r.error_mw)
    )
    ages = [r.forecast_age_hours for r in rows if r.forecast_age_hours is not None]
    return [
        Insight(
            title="Direction of forecast error",
            detail=f"Across {n} matched observations, forecasts {direction} observed wind by {abs(bias):,.0f} MW on average. Positive bias means overprediction; negative bias means underprediction.",
            kind="caution" if bias > 0 else "neutral",
        ),
        Insight(
            title="Historical uncertainty",
            detail=f"Mean absolute error was {metrics.mae_mw:,.0f} MW. The nearest-rank 90th percentile of absolute error was {metrics.p90_absolute_error_mw:,.0f} MW (n={n}). This describes this historical sample, not a future prediction interval.",
            kind="neutral",
        ),
        Insight(
            title="Largest observed discrepancy",
            detail=f"Delivery {worst.target_time.astimezone(UK):%d %b %H:%M} UK: forecast {worst.forecast_mw:,.0f} MW, actual {worst.actual_mw:,.0f} MW; signed error {worst.error_mw:+,.0f} MW. Published {worst.publish_time.astimezone(UK):%d %b %H:%M} UK.",
            kind="caution",
        ),
        Insight(
            title="Availability changes the interpretation",
            detail=f"{n} of {metrics.expected_intervals} comparison timestamps matched ({metrics.coverage_percent:.1f}%). {metrics.eligible_forecasts} had eligible forecasts. Selected forecasts were {min(ages):.1f}–{max(ages):.1f} hours old at decision time. Sparse source targets are not filled.",
            kind="neutral",
        ),
        Insight(
            title="Use as planning context",
            detail="Lower-than-forecast wind can increase uncertainty about other generation needs. These datasets contain neither customer demand nor prices, so they cannot determine an electricity purchase quantity or cost.",
            kind="neutral",
        ),
    ]
