import {
  BarChart3,
  BookOpen,
  Compass,
  Lightbulb,
  Wind,
  ArrowUpRight,
} from "lucide-react";
import type { ReactNode } from "react";
import type { View } from "../types";

const links = [
  { id: "explorer", label: "Forecast Explorer", Icon: Compass },
  { id: "accuracy", label: "Forecast Accuracy", Icon: BarChart3 },
  { id: "insights", label: "Decision Insights", Icon: Lightbulb },
] as const;

export function Shell({ view, children }: { view: View; children: ReactNode }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <a className="brand" href="#explorer" aria-label="WindSight home">
          <Wind size={34} strokeWidth={1.6} />
          <div>
            <strong>WindSight</strong>
            <span>
              Day-Ahead Wind
              <br />
              Generation Intelligence
            </span>
          </div>
        </a>
        <nav aria-label="Main navigation">
          {links.map(({ id, label, Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className={view === id ? "nav-item active" : "nav-item"}
              aria-current={view === id ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="source-note">
            <span className="status-dot" /> Historical pilot
            <span>National wind · Great Britain</span>
          </div>
          <a
            href="#methodology"
            className={view === "methodology" ? "nav-item active" : "nav-item"}
          >
            <BookOpen size={18} />
            <span>Data & methodology</span>
          </a>
          <a className="api-link" href="/docs" target="_blank" rel="noreferrer">
            API documentation <ArrowUpRight size={14} />
          </a>
        </div>
      </aside>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
