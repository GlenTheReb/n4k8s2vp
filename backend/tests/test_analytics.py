from datetime import UTC, date, datetime, time
from math import sqrt

import pytest
from pydantic import ValidationError

from backend.app.analytics import (
    calculate_metrics,
    deduplicate,
    delivery_targets,
    select_intervals,
)
from backend.app.models import SourceRecord


def forecast(
    value=100, published="2026-01-01T10:00:00Z", target="2026-01-02T00:00:00Z"
):
    return SourceRecord(
        dataset="WINDFOR", startTime=target, publishTime=published, generation=value
    )


def actual(
    value=80,
    target="2026-01-02T00:00:00Z",
    fuel="WIND",
    published="2026-01-02T00:30:00Z",
):
    return SourceRecord(
        dataset="FUELHH",
        startTime=target,
        publishTime=published,
        generation=value,
        fuelType=fuel,
    )


def select(fs, acts, cutoff=time(12), day=date(2026, 1, 1)):
    return select_intervals(fs, acts, day, day, cutoff)


def test_latest_revision_at_or_before_cutoff_and_no_lookahead():
    rows = select(
        [
            forecast(90),
            forecast(100, "2026-01-01T12:00:00Z"),
            forecast(900, "2026-01-01T12:00:01Z"),
        ],
        [actual()],
    )
    assert rows[0].forecast_mw == 100
    assert rows[0].error_mw == 20
    assert rows[0].publish_time == datetime(2026, 1, 1, 12, tzinfo=UTC)
    assert all(
        r.publish_time is None or r.publish_time <= r.decision_time for r in rows
    )


def test_no_eligible_forecast_and_missing_values_are_not_zero():
    rows = select([forecast()], [actual()], time(9))
    metrics = calculate_metrics(rows)
    assert rows[0].forecast_mw is None
    assert metrics.sample_count == 0
    assert metrics.mae_mw is None and metrics.bias_mw is None


def test_missing_actual_and_exact_timestamp_match():
    rows = select([forecast()], [actual(target="2026-01-02T00:30:00Z")])
    assert rows[0].actual_mw is None and rows[0].error_mw is None
    assert rows[1].actual_mw == 80 and rows[1].forecast_mw is None
    assert calculate_metrics(rows).sample_count == 0


def test_formula_bias_zero_actual_and_coverage():
    rows = select(
        [forecast(3), forecast(0, target="2026-01-02T00:30:00Z")],
        [actual(0), actual(4, target="2026-01-02T00:30:00Z")],
    )
    m = calculate_metrics(rows)
    assert m.mae_mw == 3.5
    assert m.rmse_mw == sqrt(12.5)
    assert m.bias_mw == -0.5
    assert m.sample_count == 2 and m.expected_intervals == 48
    assert m.coverage_percent == pytest.approx(100 * 2 / 48)
    assert m.eligible_match_percent == 100


def test_identical_duplicates_collapse_and_conflicts_fail():
    clean, count = deduplicate([forecast(), forecast()])
    assert len(clean) == 1 and count == 1
    with pytest.raises(ValueError, match="Conflicting duplicate"):
        deduplicate([forecast(), forecast(999)])


def test_latest_retrospective_actual_and_wind_only():
    rows = select(
        [forecast()],
        [
            actual(80),
            actual(70, published="2026-01-03T00:00:00Z"),
            actual(999, fuel="GAS"),
        ],
    )
    assert rows[0].actual_mw == 70
    assert rows[0].error_mw == 30


def test_january_31_decision_delivers_february_1():
    rows = select(
        [forecast(100, "2026-01-31T11:00:00Z", "2026-02-01T00:00:00Z")],
        [actual(80, "2026-02-01T00:00:00Z")],
        day=date(2026, 1, 31),
    )
    assert rows[0].target_time == datetime(2026, 2, 1, tzinfo=UTC)
    assert calculate_metrics(rows).sample_count == 1


@pytest.mark.parametrize(
    "start,end",
    [
        (date(2025, 12, 31), date(2026, 1, 1)),
        (date(2026, 1, 31), date(2026, 2, 1)),
        (date(2026, 1, 2), date(2026, 1, 1)),
    ],
)
def test_invalid_decision_boundaries(start, end):
    with pytest.raises(ValueError):
        select_intervals([], [], start, end, time(12))


def test_utc_offset_equivalence_and_naive_timestamp_rejected():
    rows = select([forecast(published="2026-01-01T13:00:00+01:00")], [actual()])
    assert rows[0].forecast_mw == 100
    with pytest.raises(ValidationError):
        forecast(published="2026-01-01T12:00:00")
    with pytest.raises(ValueError, match="wall-clock"):
        select([], [], time(12, tzinfo=UTC))


def test_dst_half_hour_grid_and_sparse_forecasts_not_filled():
    assert len(delivery_targets(date(2026, 3, 28))) == 46
    assert len(delivery_targets(date(2026, 10, 24))) == 50
    rows = select([forecast()], [actual()])
    assert sum(r.forecast_mw is not None for r in rows) == 1
    assert rows[0].forecast_age_hours == 2
    assert rows[0].lead_time_hours == 14


@pytest.mark.parametrize("generation", [-1, float("nan"), float("inf")])
def test_invalid_generation_rejected(generation):
    with pytest.raises(ValidationError):
        forecast(generation)
