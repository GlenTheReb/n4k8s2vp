import type { Metrics as MetricsType } from "../types";
import { number, signed } from "../utils";

export function Metrics({
  metrics,
  accuracy = false,
}: {
  metrics: MetricsType;
  accuracy?: boolean;
}) {
  const items = accuracy
    ? [
        [
          "Mean absolute error",
          number(metrics.mae_mw),
          "MW",
          "Typical size of an error; lower is better.",
        ],
        [
          "Root mean squared error",
          number(metrics.rmse_mw),
          "MW",
          "Larger errors carry more weight.",
        ],
        [
          "Mean forecast bias",
          signed(metrics.bias_mw),
          "MW",
          "Forecast − actual. Positive = overprediction.",
        ],
        [
          "Comparison coverage",
          number(metrics.coverage_percent, 1),
          "%",
          `${metrics.sample_count} matched / ${metrics.expected_intervals} comparison timestamps.`,
        ],
      ]
    : [
        [
          "Matched observations",
          number(metrics.sample_count),
          "",
          `Of ${metrics.expected_intervals} next-day comparison timestamps.`,
        ],
        [
          "Mean absolute error",
          number(metrics.mae_mw),
          "MW",
          "Typical size of a forecast error.",
        ],
        [
          "Forecast bias",
          signed(metrics.bias_mw),
          "MW",
          "Forecast − actual. Positive = overprediction.",
        ],
        [
          "Comparison coverage",
          number(metrics.coverage_percent, 1),
          "%",
          `${metrics.sample_count} matched / ${metrics.expected_intervals} comparison timestamps.`,
        ],
      ];
  return (
    <>
      <section className="metrics" aria-label="Accuracy metrics">
        {items.map(([label, value, unit, detail]) => (
          <div className="metric" key={label}>
            <span>{label}</span>
            <strong className={label.includes("bias") ? "bias-value" : ""}>
              {value}
              <small>{unit}</small>
            </strong>
            <p>{detail}</p>
          </div>
        ))}
      </section>
      <p className="sample-caption">
        All error metrics use the same {metrics.sample_count} matched
        observations. Missing values are excluded.
      </p>
    </>
  );
}
