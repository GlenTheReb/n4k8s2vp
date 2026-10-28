import { Component, lazy, Suspense, useEffect, useState } from "react";
import type { ErrorInfo, FormEvent, ReactNode } from "react";
import { Download, Info, LoaderCircle, RefreshCw } from "lucide-react";
import { Shell } from "./components/Shell";
import { Metrics } from "./components/Metrics";
import { useAnalysis } from "./hooks/useAnalysis";
import type { View } from "./types";
import { nextDay, ukDate } from "./utils";

const Explorer = lazy(() => import("./pages/Explorer"));
const Accuracy = lazy(() => import("./pages/Accuracy"));
const Insights = lazy(() => import("./pages/Insights"));
const Methodology = lazy(() => import("./pages/Methodology"));
const titles: Record<View, [string, string]> = {
  explorer: [
    "Forecast Explorer",
    "Reconstruct what was known before delivery.",
  ],
  accuracy: [
    "Forecast Accuracy",
    "Measure the uncertainty behind the forecast.",
  ],
  insights: [
    "Decision Insights",
    "Turn historical forecast errors into planning context.",
  ],
  methodology: [
    "Data & methodology",
    "Clear sources. Explicit assumptions. Reproducible analysis.",
  ],
};
function readView(): View {
  const hash = window.location.hash.slice(1);
  return hash in titles ? (hash as View) : "explorer";
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("WindSight render error", error, info.componentStack);
  }
  render() {
    return this.state.failed ? (
      <div className="state-panel" role="alert">
        <h2>The view could not be displayed</h2>
        <p>Reload to restore the application.</p>
        <button className="button" onClick={() => window.location.reload()}>
          Reload application
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

export default function App() {
  const [view, setView] = useState<View>(readView);
  const [day, setDay] = useState("2026-01-15");
  const [start, setStart] = useState("2026-01-01");
  const [end, setEnd] = useState("2026-01-31");
  const [cutoff, setCutoff] = useState("12:00");
  const [applied, setApplied] = useState({
    day: "2026-01-15",
    start: "2026-01-01",
    end: "2026-01-31",
    cutoff: "12:00",
  });
  const [retry, setRetry] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const single = view === "explorer";
  const from = single ? applied.day : applied.start;
  const to = single ? applied.day : applied.end;
  const { data, loading, error } = useAnalysis(from, to, applied.cutoff, retry);
  useEffect(() => {
    const change = () => setView(readView());
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    document.title = `${titles[view][0]} · WindSight`;
  }, [view]);
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplied({ day, start, end, cutoff });
    setExportError("");
  }
  async function download() {
    setExporting(true);
    setExportError("");
    try {
      const response = await fetch(
        `/api/export.csv?${new URLSearchParams({ start_date: from, end_date: to, cutoff: applied.cutoff })}`,
      );
      if (!response.ok)
        throw new Error(
          `Export failed (${response.status}). Please try again.`,
        );
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `windsight-${from}-${to}.csv`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }
  return (
    <ErrorBoundary>
      <Shell view={view}>
        <div className="topbar">
          <span>
            <span className="status-dot" /> Elexon historical snapshot
          </span>
          <span>
            Decision window: January 2026 <b>·</b> Europe/London (GMT)
          </span>
        </div>
        <header className="page-heading">
          <div>
            <h1>{titles[view][0]}</h1>
            <p>{titles[view][1]}</p>
          </div>
          {view !== "methodology" && (
            <button
              className="button export-button"
              onClick={() => void download()}
              disabled={!data || exporting}
            >
              <Download size={16} />
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
          )}
        </header>
        {view !== "methodology" && (
          <form className="filters" onSubmit={apply}>
            <label>
              {single ? "Decision date" : "From decision date"}
              <input
                aria-label={single ? "Decision date" : "From decision date"}
                type="date"
                min="2026-01-01"
                max={single ? "2026-01-31" : end}
                required
                value={single ? day : start}
                onChange={(e) =>
                  single ? setDay(e.target.value) : setStart(e.target.value)
                }
              />
            </label>
            {!single && (
              <label>
                To decision date
                <input
                  aria-label="To decision date"
                  type="date"
                  min={start}
                  max="2026-01-31"
                  required
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </label>
            )}
            <label>
              Cutoff time (UK)
              <input
                aria-label="Cutoff time (UK)"
                type="time"
                step="60"
                required
                value={cutoff}
                onChange={(e) => setCutoff(e.target.value)}
              />
            </label>
            <div className="delivery-context">
              <span>Delivery {single ? "day" : "window"}</span>
              <strong>
                {single
                  ? ukDate(nextDay(day))
                  : `${ukDate(nextDay(start))} – ${ukDate(nextDay(end))}`}
              </strong>
              <small>Next UK calendar day</small>
            </div>
            <button className="button primary" type="submit">
              Apply cutoff
            </button>
          </form>
        )}
        {view !== "methodology" && (
          <p className="assumption">
            <Info size={13} /> Illustrative decision cutoff, not an asserted
            market gate closure. All displayed times are UK time.
          </p>
        )}
        {exportError && (
          <p className="error-banner" role="alert">
            {exportError}
          </p>
        )}
        <div aria-busy={loading}>
          {loading ? (
            <div className="state-panel" role="status">
              <LoaderCircle className="spin" size={28} />
              <h2>Reconstructing the decision</h2>
              <p>
                Selecting eligible forecast versions and matching observed
                generation…
              </p>
            </div>
          ) : error ? (
            <div className="state-panel" role="alert">
              <Info size={28} />
              <h2>Historical data could not be loaded</h2>
              <p>{error}</p>
              <button className="button" onClick={() => setRetry((n) => n + 1)}>
                <RefreshCw size={16} />
                Retry data request
              </button>
            </div>
          ) : (
            data && (
              <>
                {view !== "methodology" && (
                  <>
                    <div className="applied-context">
                      Showing decisions {ukDate(data.start_date)}
                      {data.end_date !== data.start_date
                        ? ` – ${ukDate(data.end_date)}`
                        : ""}{" "}
                      at {applied.cutoff} UK{" "}
                      <span>
                        Delivery: {ukDate(nextDay(data.start_date))}
                        {data.end_date !== data.start_date
                          ? ` – ${ukDate(nextDay(data.end_date))}`
                          : ""}
                      </span>
                    </div>
                    <Metrics
                      metrics={data.metrics}
                      accuracy={view === "accuracy"}
                    />
                    {data.metrics.sample_count === 0 && (
                      <div className="notice" role="status">
                        <Info size={18} />
                        <p>
                          No matched forecast and actual observations at this
                          cutoff. Actual outturns may still be visible. Choose
                          another date or cutoff; missing data is never zero.
                        </p>
                      </div>
                    )}
                  </>
                )}
                <Suspense
                  fallback={
                    <div className="state-panel" role="status">
                      Loading view…
                    </div>
                  }
                >
                  {view === "explorer" ? (
                    <Explorer data={data} />
                  ) : view === "accuracy" ? (
                    <Accuracy data={data} />
                  ) : view === "insights" ? (
                    <Insights data={data} />
                  ) : (
                    <Methodology data={data} />
                  )}
                </Suspense>
                <footer className="footer">
                  <span>
                    WindSight · National wind, with hindsight kept out of the
                    forecast.
                  </span>
                  <a href="#methodology">Source, coverage & assumptions</a>
                </footer>
              </>
            )
          )}
        </div>
      </Shell>
    </ErrorBoundary>
  );
}
