import { useState } from "react";
import type { Interval } from "../types";
import { number, signed, ukDate } from "../utils";

export function AuditTable({
  rows,
  onSelect,
  selected,
}: {
  rows: Interval[];
  onSelect: (r: Interval) => void;
  selected?: string;
}) {
  const [showMissing, setShowMissing] = useState(false);
  const [page, setPage] = useState(0);
  const filtered = showMissing
    ? rows
    : rows.filter((r) => r.forecast_mw !== null);
  const pages = Math.max(1, Math.ceil(filtered.length / 12));
  const current = Math.min(page, pages - 1);
  return (
    <section className="panel audit">
      <div className="panel-heading">
        <div>
          <h2>Forecast vs actual</h2>
          <p>Publication timestamps preserved for audit</p>
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={showMissing}
            onChange={(e) => {
              setShowMissing(e.target.checked);
              setPage(0);
            }}
          />{" "}
          Include missing forecasts
        </label>
      </div>
      <div className="table-scroll">
        <table>
          <caption className="sr-only">
            Exact matched and unmatched delivery observations. Select a target
            to inspect its forecast version.
          </caption>
          <thead>
            <tr>
              <th scope="col">Delivery target (UK)</th>
              <th scope="col">Forecast MW</th>
              <th scope="col">Actual MW</th>
              <th scope="col">Error MW</th>
              <th scope="col">Published at (UK)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(current * 12, (current + 1) * 12).map((r) => (
              <tr
                key={r.target_time}
                className={selected === r.target_time ? "selected-row" : ""}
              >
                <td>
                  <button
                    className="table-button"
                    onClick={() => onSelect(r)}
                    aria-label={`Inspect ${ukDate(r.target_time, true)}`}
                  >
                    {ukDate(r.target_time, true)}
                  </button>
                </td>
                <td className="forecast-text">{number(r.forecast_mw)}</td>
                <td>{number(r.actual_mw)}</td>
                <td
                  className={
                    r.error_mw !== null && r.error_mw > 0 ? "caution-text" : ""
                  }
                >
                  {signed(r.error_mw)}
                </td>
                <td>
                  {r.publish_time
                    ? ukDate(r.publish_time, true)
                    : "Unavailable at cutoff"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="table-empty">
            No eligible forecasts at this cutoff. Include missing forecasts to
            inspect actuals.
          </p>
        )}
      </div>
      <div className="table-footer">
        <span>
          {filtered.length} observations · Page {current + 1} of {pages}
        </span>
        <div>
          <button
            className="button subtle"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            Previous
          </button>
          <button
            className="button subtle"
            disabled={current === pages - 1}
            onClick={() => setPage(current + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
