import type { Analysis } from "../types";
import {
  DailyChart,
  ErrorDistribution,
  GenerationChart,
} from "../components/Charts";
import { number } from "../utils";

export default function Accuracy({ data }: { data: Analysis }) {
  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Forecast performance over time</h2>
            <p>
              Latest eligible forecast for each next-day target · n=
              {data.metrics.sample_count}
            </p>
          </div>
        </div>
        <GenerationChart data={data} />
        <div className="chart-legend">
          <span>
            <i className="forecast-dot" />
            Forecast at cutoff
          </span>
          <span>
            <i className="actual-line" />
            Observed generation
          </span>
          <small>MW · UK delivery time</small>
        </div>
      </section>
      <div className="two-column">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Daily accuracy</h2>
              <p>Equal-weight observations; each day uses its own cutoff</p>
            </div>
          </div>
          <DailyChart data={data} />
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Error distribution</h2>
              <p>
                Forecast − actual · negative = underprediction · n=
                {data.metrics.sample_count}
              </p>
            </div>
          </div>
          <ErrorDistribution data={data} />
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Daily comparison</h2>
            <p>Coverage denominator includes every next-day half-hour</p>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Decision day</th>
                <th>Delivery day</th>
                <th>MAE MW</th>
                <th>RMSE MW</th>
                <th>Bias MW</th>
                <th>Matched / expected</th>
              </tr>
            </thead>
            <tbody>
              {data.daily.map((d) => (
                <tr key={d.decision_date}>
                  <td>{d.decision_date}</td>
                  <td>{d.delivery_date}</td>
                  <td>{number(d.metrics.mae_mw)}</td>
                  <td>{number(d.metrics.rmse_mw)}</td>
                  <td>{number(d.metrics.bias_mw)}</td>
                  <td>
                    {d.metrics.sample_count} / {d.metrics.expected_intervals}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
