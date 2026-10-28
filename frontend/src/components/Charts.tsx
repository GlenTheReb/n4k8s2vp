import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Analysis } from "../types";
import { number, ukDate, ukTime } from "../utils";

const grid = "#233148",
  tick = { fill: "#94a5bd", fontSize: 11 };
const tooltipStyle = {
  background: "#162338",
  border: "1px solid #3b506b",
  borderRadius: 8,
  color: "#eef3fb",
  fontSize: 12,
};

export function GenerationChart({ data }: { data: Analysis }) {
  const points = data.intervals.map((row) => ({
    ...row,
    timestamp: new Date(row.target_time).getTime(),
  }));
  const multiDay = data.start_date !== data.end_date;
  const tickEvery = multiDay
    ? Math.max(1, Math.ceil(data.daily.length / 6)) * 48
    : 6;
  const ticks = points
    .filter((_, i) => i % tickEvery === 0)
    .map((p) => p.timestamp);
  return (
    <div
      className="chart"
      role="img"
      aria-label="Forecast at native hourly targets and observed half-hourly wind generation in megawatts. Horizontal axis is UK delivery time. Exact values available in the audit table."
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={points}
          margin={{ top: 16, right: 18, left: 10, bottom: 8 }}
        >
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={["dataMin", "dataMax"]}
            ticks={ticks}
            tick={tick}
            tickFormatter={(v) =>
              multiDay
                ? ukDate(new Date(v).toISOString()).slice(0, 6)
                : ukTime(new Date(v).toISOString())
            }
            minTickGap={45}
            axisLine={{ stroke: grid }}
            tickLine={false}
          />
          <YAxis
            tick={tick}
            tickFormatter={(v) => number(v)}
            domain={[0, "auto"]}
            width={58}
            axisLine={false}
            tickLine={false}
            label={{
              value: "MW",
              angle: -90,
              position: "insideLeft",
              fill: "#94a5bd",
              fontSize: 11,
            }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(v) =>
              `${ukDate(new Date(Number(v)).toISOString(), true)} UK`
            }
            formatter={(v, name) => [`${number(Number(v))} MW`, name]}
          />
          <Line
            name="Observed generation"
            type="linear"
            dataKey="actual_mw"
            stroke="#8b9dff"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Line
            name="Forecast at cutoff"
            dataKey="forecast_mw"
            stroke="none"
            dot={{
              r: multiDay ? 1.8 : 3.5,
              fill: "#55dfb4",
              stroke: "#55dfb4",
            }}
            activeDot={{ r: 6 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DailyChart({ data }: { data: Analysis }) {
  const points = data.daily.map((d) => ({
    date: d.decision_date.slice(-2),
    mae: d.metrics.mae_mw,
    bias: d.metrics.bias_mw,
    n: d.metrics.sample_count,
  }));
  return (
    <div
      className="small-chart"
      role="img"
      aria-label="Daily mean absolute error and signed bias in megawatts"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={points}
          margin={{ top: 12, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis
            dataKey="date"
            tick={tick}
            tickLine={false}
            axisLine={false}
            label={{
              value: "January decision day",
              position: "insideBottom",
              offset: -2,
              fill: "#94a5bd",
              fontSize: 11,
            }}
            height={45}
          />
          <YAxis tick={tick} tickLine={false} axisLine={false} width={55} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(v, p) =>
              `Decision ${v} Jan · n=${p?.[0]?.payload.n ?? 0}`
            }
            formatter={(v, name) => [`${number(Number(v))} MW`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            name="MAE (MW)"
            dataKey="mae"
            fill="#55dfb4"
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            name="Bias (MW)"
            dataKey="bias"
            fill="#8b9dff"
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ErrorDistribution({ data }: { data: Analysis }) {
  const errors = data.intervals.flatMap((r) =>
    r.error_mw === null ? [] : [r.error_mw],
  );
  const extent = Math.max(500, ...errors.map(Math.abs));
  const width = Math.ceil(extent / 4 / 250) * 250;
  const points = Array.from({ length: 8 }, (_, i) => ({
    label: `${number((i - 4) * width)} to ${number((i - 3) * width)}`,
    count: 0,
  }));
  errors.forEach((e) => {
    points[Math.max(0, Math.min(7, Math.floor(e / width) + 4))].count++;
  });
  return (
    <div
      className="small-chart"
      role="img"
      aria-label="Distribution of forecast minus actual errors; negative means underprediction"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={points}
          margin={{ top: 12, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ ...tick, fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            interval={1}
            height={45}
            label={{
              value: "Signed error bins (MW)",
              position: "insideBottom",
              offset: -2,
              fill: "#94a5bd",
              fontSize: 11,
            }}
          />
          <YAxis
            allowDecimals={false}
            tick={tick}
            tickLine={false}
            axisLine={false}
            width={38}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [v, "Observations"]}
          />
          <Bar
            dataKey="count"
            name="Observations"
            fill="#8b9dff"
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
