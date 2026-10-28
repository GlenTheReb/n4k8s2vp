"""UTC-aware source records and explicit API contracts."""

from datetime import date, datetime, time
from typing import Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field


class SourceRecord(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)
    dataset: Literal["WINDFOR", "FUELHH"]
    start_time: AwareDatetime = Field(alias="startTime")
    publish_time: AwareDatetime = Field(alias="publishTime")
    generation: float = Field(ge=0, allow_inf_nan=False)
    fuel_type: str | None = Field(default=None, alias="fuelType")


class Metrics(BaseModel):
    sample_count: int
    expected_intervals: int
    eligible_forecasts: int
    actual_intervals: int
    coverage_percent: float
    eligible_match_percent: float | None
    mae_mw: float | None
    rmse_mw: float | None
    bias_mw: float | None
    p90_absolute_error_mw: float | None


class Interval(BaseModel):
    decision_date: date
    decision_time: datetime
    target_time: datetime
    forecast_mw: float | None
    actual_mw: float | None
    error_mw: float | None
    publish_time: datetime | None
    actual_publish_time: datetime | None
    forecast_age_hours: float | None
    lead_time_hours: float | None


class DailyResult(BaseModel):
    decision_date: date
    delivery_date: date
    metrics: Metrics


class Insight(BaseModel):
    title: str
    detail: str
    kind: Literal["neutral", "positive", "caution"]


class Analysis(BaseModel):
    start_date: date
    end_date: date
    cutoff: time
    timezone: str = "Europe/London"
    metrics: Metrics
    daily: list[DailyResult]
    intervals: list[Interval]
    insights: list[Insight]
    provenance: dict
