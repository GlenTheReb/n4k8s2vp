import { useState } from "react";
import { Info } from "lucide-react";
import type { Analysis, Interval } from "../types";
import { number, signed, ukDate } from "../utils";
import { GenerationChart } from "../components/Charts";
import { AuditTable } from "../components/AuditTable";

export default function Explorer({ data }: { data: Analysis }) {
  const [target, setTarget] = useState<string>("");
  const selected =
    data.intervals.find((r) => r.target_time === target) ??
    data.intervals.find((r) => r.forecast_mw !== null) ??
    data.intervals[0];
  const select = (r: Interval) => setTarget(r.target_time);
  return (
    <>
      <div className="explorer-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Wind generation</h2>
              <p>Forecast available at cutoff vs observed generation</p>
            </div>
            <span className="unit-label">POWER / MW</span>
          </div>
          <GenerationChart data={data} />
          <div className="chart-legend">
            <span>
              <i className="forecast-dot" />
              Forecast at cutoff · native targets
            </span>
            <span>
              <i className="actual-line" />
              Observed generation
            </span>
            <small>No interpolation</small>
          </div>
        </section>
        <section className="panel inspector">
          <h2>Selected interval</h2>
          <label className="inspector-select">
            Delivery target (UK)
            <select
              aria-label="Selected delivery interval"
              value={selected.target_time}
              onChange={(e) => setTarget(e.target.value)}
            >
              {data.intervals.map((r) => (
                <option key={r.target_time} value={r.target_time}>
                  {ukDate(r.target_time, true)}
                </option>
              ))}
            </select>
          </label>
          <dl>
            <div>
              <dt>Forecast</dt>
              <dd className="forecast-text">
                {number(selected.forecast_mw)} <small>MW</small>
              </dd>
            </div>
            <div>
              <dt>Observed</dt>
              <dd>
                {number(selected.actual_mw)} <small>MW</small>
              </dd>
            </div>
            <div>
              <dt>Signed error</dt>
              <dd>
                {signed(selected.error_mw)} <small>MW</small>
              </dd>
            </div>
            <div>
              <dt>Published at (UK)</dt>
              <dd>
                {selected.publish_time
                  ? ukDate(selected.publish_time, true)
                  : "Unavailable"}
              </dd>
            </div>
            <div>
              <dt>Age at decision</dt>
              <dd>
                {number(selected.forecast_age_hours, 1)} <small>hours</small>
              </dd>
            </div>
            <div>
              <dt>Publication to delivery</dt>
              <dd>
                {number(selected.lead_time_hours, 1)} <small>hours</small>
              </dd>
            </div>
          </dl>
          <p className="inspector-note">
            Observed generation is a retrospective outturn, unavailable at the
            decision time.
          </p>
        </section>
      </div>
      <div className="notice">
        <Info size={17} />
        <p>
          {data.metrics.eligible_forecasts} eligible hourly forecasts /{" "}
          {data.metrics.expected_intervals} comparison timestamps.{" "}
          {number(data.metrics.eligible_match_percent, 1)}% of eligible
          forecasts have matching actuals. Half-hour gaps stay empty.
        </p>
      </div>
      <AuditTable
        rows={data.intervals}
        onSelect={select}
        selected={selected.target_time}
      />
    </>
  );
}
