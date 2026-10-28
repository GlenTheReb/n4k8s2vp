export interface Metrics {
  sample_count: number;
  expected_intervals: number;
  eligible_forecasts: number;
  actual_intervals: number;
  coverage_percent: number;
  eligible_match_percent: number | null;
  mae_mw: number | null;
  rmse_mw: number | null;
  bias_mw: number | null;
  p90_absolute_error_mw: number | null;
}
export interface Interval {
  decision_date: string;
  decision_time: string;
  target_time: string;
  forecast_mw: number | null;
  actual_mw: number | null;
  error_mw: number | null;
  publish_time: string | null;
  actual_publish_time: string | null;
  forecast_age_hours: number | null;
  lead_time_hours: number | null;
}
export interface Analysis {
  start_date: string;
  end_date: string;
  cutoff: string;
  timezone: string;
  metrics: Metrics;
  daily: { decision_date: string; delivery_date: string; metrics: Metrics }[];
  intervals: Interval[];
  insights: { title: string; detail: string; kind: string }[];
  provenance: {
    generated_at: string;
    source: string;
    forecast_records: number;
    actual_records: number;
    cache_sha256: string;
    forecast_target_cadence_minutes: Record<string, number>;
    requests: {
      url: string;
      retrieved_at: string;
      record_count: number;
      sha256: string;
    }[];
    coverage_denominator: string;
    selection: string;
    bias_sign: string;
  };
}
export type View = "explorer" | "accuracy" | "insights" | "methodology";
