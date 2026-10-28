import { ArrowUpRight, Info, ShieldCheck } from "lucide-react";
import type { Analysis } from "../types";
import { number } from "../utils";

export default function Insights({ data }: { data: Analysis }) {
  return (
    <>
      <section className="insight-intro">
        <ShieldCheck size={26} />
        <div>
          <h2>Evidence for a more informed decision</h2>
          <p>
            Derived from {data.metrics.sample_count} matched Elexon observations
            at your selected cutoff. Every insight follows a fixed calculation.
          </p>
        </div>
      </section>
      <div className="insight-list">
        {data.insights.map((i, index) => (
          <article key={i.title} className="insight-row">
            <span className="insight-number">0{index + 1}</span>
            <div>
              <h2>{i.title}</h2>
              <p>{i.detail}</p>
            </div>
            <ArrowUpRight
              size={20}
              className={
                i.kind === "caution" ? "caution-text" : "forecast-text"
              }
            />
          </article>
        ))}
      </div>
      <div className="notice">
        <Info size={18} />
        <p>
          Observed forecast targets: hourly. Half-hour comparison coverage:{" "}
          {number(data.metrics.coverage_percent, 1)}%. These results describe
          the selected historical sample and should not be treated as a future
          reliability guarantee.
        </p>
      </div>
    </>
  );
}
