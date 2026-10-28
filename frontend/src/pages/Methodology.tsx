import type { Analysis } from "../types";
import { ukDate } from "../utils";

export default function Methodology({ data }: { data: Analysis }) {
  const p = data.provenance;
  return (
    <div className="methodology">
      <section className="panel prose">
        <h2>Three timestamps. One auditable decision.</h2>
        <p>
          <strong>Decision time</strong> is your chosen UK cutoff.{" "}
          <strong>Publication time</strong> is when a forecast was published.{" "}
          <strong>Delivery time</strong> is the period being forecast. For each
          delivery target, WindSight keeps only forecasts published at or before
          the decision, then selects the latest one.
        </p>
        <p>
          Decisions run from 1–31 January 2026. Each decision concerns the next
          UK calendar day, so delivery includes 1 February. The default 12:00 UK
          cutoff is an illustrative assumption you can change, and is not
          asserted to be an official market gate closure. UTC is used
          internally; business times display in Europe/London (GMT during this
          window).
        </p>
      </section>
      <section className="panel prose">
        <h2>What the metrics mean</h2>
        <dl className="definitions">
          <div>
            <dt>Error</dt>
            <dd>
              Forecast MW − actual MW. Positive = overprediction, negative =
              underprediction.
            </dd>
          </div>
          <div>
            <dt>MAE</dt>
            <dd>
              Mean of absolute errors. Typical discrepancy in MW, with every
              matched observation weighted equally.
            </dd>
          </div>
          <div>
            <dt>RMSE</dt>
            <dd>
              Square root of the mean squared error. Penalises larger
              discrepancies more strongly.
            </dd>
          </div>
          <div>
            <dt>Bias</dt>
            <dd>
              Mean signed error. Overprediction and underprediction can cancel,
              so read alongside MAE.
            </dd>
          </div>
          <div>
            <dt>Coverage</dt>
            <dd>{p.coverage_denominator}</dd>
          </div>
        </dl>
        <p>
          Missing values are null, never zero. Forecasts appear only at native
          source targets. No interpolation, forward-filling, MAPE or summing MW
          into MWh. The 90th percentile uses the nearest-rank method on absolute
          errors; it is descriptive, not a future confidence interval.
        </p>
      </section>
      <section className="panel prose">
        <h2>Source and reproducibility</h2>
        <p>
          Official Elexon{" "}
          <a
            href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
            target="_blank"
            rel="noreferrer"
          >
            WINDFOR stream
          </a>{" "}
          and{" "}
          <a
            href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
            target="_blank"
            rel="noreferrer"
          >
            FUELHH stream, WIND only
          </a>
          . The snapshot holds {p.forecast_records.toLocaleString()} forecast
          versions and {p.actual_records.toLocaleString()} actual records,
          retrieved {ukDate(p.generated_at, true)} UK. Forecast targets are
          hourly; actual outturns are half-hour averages. They are joined by
          exact start timestamp, without averaging adjacent actuals.
        </p>
        <p>
          Ingestion downloads daily chunks with retries and raw request caching.
          Forecast publication retrieval starts 30 December 2025 to cover the
          first decision. Identical duplicates collapse; contradictory
          duplicates fail validation. Actuals use the latest cached
          retrospective revision. Snapshot hashes are verified before the API
          serves data.
        </p>
        <p>
          This is a historical snapshot, not a live feed. It covers metered
          national wind in the specified datasets, not necessarily every
          embedded wind generator. Demand, prices and full procurement
          requirements are absent.
        </p>
        <details>
          <summary>View snapshot fingerprint and source requests</summary>
          <p className="hash">SHA-256: {p.cache_sha256}</p>
          <ul className="request-list">
            {p.requests.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  {r.url.includes("WINDFOR") ? "WINDFOR" : "FUELHH"} ·{" "}
                  {new URL(r.url).searchParams
                    .get("publishDateTimeFrom")
                    ?.slice(0, 10) ??
                    new URL(r.url).searchParams.get("settlementDateFrom")}{" "}
                  · {r.record_count} records
                </a>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </div>
  );
}
