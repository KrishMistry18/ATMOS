import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel } from "@/components/atmos/primitives";
import { STATIONS } from "@/data/stations";
import { formatSimTime, useSimulation } from "@/services/simulationStore";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — A.T.M.O.S" },
      {
        name: "description",
        content:
          "Aggregate analytics for the AWS network: anomaly frequency and types, health distribution, parameter trends and latency.",
      },
      { property: "og:title", content: "Analytics — A.T.M.O.S" },
      { property: "og:description", content: "Aggregate AWS network analytics and trends." },
    ],
  }),
  component: Analytics,
});

const axis = { fontSize: 10, fill: "var(--dim)", fontFamily: "var(--font-mono)" };
const tooltipStyle = {
  background: "var(--panel2)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  fontFamily: "var(--font-mono)",
  fontSize: 11,
};

function Analytics() {
  const { anomalies, history, health } = useSimulation();

  const typeCounts = Object.entries(
    anomalies.reduce<Record<string, number>>((acc, a) => {
      acc[a.type] = (acc[a.type] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([type, count]) => ({ type: type.split(" ")[0], count }));

  const stateCounts = ["HEALTHY", "WATCH", "DEGRADED", "CRITICAL"].map((state) => ({
    name: state,
    value: health.filter((h) => h.state === state).length,
  }));
  const stateColors = ["var(--ok)", "var(--watch)", "var(--degraded)", "var(--critical)"];

  const reference = history[STATIONS[0]!.id] ?? [];
  const trends = reference.slice(-40).map((_, i) => {
    const idx = reference.length - 40 + i;
    const perStation = STATIONS.map((s) => history[s.id]?.[idx]).filter(Boolean);
    const mean = (key: "temperature" | "pressure" | "humidity" | "latencyMs") =>
      perStation.reduce((a, o) => a + (o![key] as number), 0) / Math.max(perStation.length, 1);
    return {
      t: formatSimTime(reference[idx]!.time),
      temperature: Number(mean("temperature").toFixed(2)),
      pressure: Number(mean("pressure").toFixed(2)),
      humidity: Number(mean("humidity").toFixed(2)),
      latency: Math.round(mean("latencyMs")),
    };
  });

  const detectedVsResolved = [
    { name: "Detected", value: anomalies.length },
    { name: "Resolved", value: anomalies.filter((a) => a.status === "RESOLVED").length },
    { name: "Open", value: anomalies.filter((a) => a.status !== "RESOLVED").length },
  ];

  return (
    <div className="grid grid-cols-12 gap-4">
      <Panel className="col-span-12 lg:col-span-6" title="Anomaly Types" meta="SESSION TOTAL">
        <Chart>
          <BarChart data={typeCounts} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="type" tick={axis} tickLine={false} axisLine={{ stroke: "var(--line)" }} />
            <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--panel2)" }} />
            <Bar dataKey="count" fill="var(--chart-4)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </Chart>
      </Panel>

      <Panel className="col-span-12 lg:col-span-6" title="Station Health Distribution" meta="CURRENT">
        <Chart>
          <PieChart>
            <Pie
              data={stateCounts}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              stroke="var(--panel)"
              isAnimationActive={false}
            >
              {stateCounts.map((entry, i) => (
                <Cell key={entry.name} fill={stateColors[i]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </Chart>
        <div className="mt-2 flex flex-wrap justify-center gap-3 font-mono text-[10px] text-dim">
          {stateCounts.map((s, i) => (
            <span key={s.name} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: stateColors[i] }} />
              {s.name} · {s.value}
            </span>
          ))}
        </div>
      </Panel>

      <Panel className="col-span-12 lg:col-span-8" title="Network Parameter Trends" meta="MEAN OF ALL STATIONS">
        <Chart>
          <LineChart data={trends} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="t" tick={axis} tickLine={false} axisLine={{ stroke: "var(--line)" }} minTickGap={40} />
            <YAxis yAxisId="left" tick={axis} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={axis} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line yAxisId="left" dataKey="temperature" stroke="var(--chart-1)" dot={false} strokeWidth={1.5} isAnimationActive={false} />
            <Line yAxisId="left" dataKey="humidity" stroke="var(--chart-3)" dot={false} strokeWidth={1.5} isAnimationActive={false} />
            <Line yAxisId="right" dataKey="pressure" stroke="var(--chart-2)" dot={false} strokeWidth={1.5} isAnimationActive={false} />
          </LineChart>
        </Chart>
      </Panel>

      <Panel className="col-span-12 lg:col-span-4" title="Detected vs Resolved" meta="ANOMALY LIFECYCLE">
        <Chart>
          <BarChart data={detectedVsResolved} margin={{ top: 8, right: 8, bottom: 0, left: -24 }} layout="vertical">
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={axis} tickLine={false} axisLine={false} width={70} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--panel2)" }} />
            <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 3, 3, 0]} isAnimationActive={false} />
          </BarChart>
        </Chart>
      </Panel>

      <Panel className="col-span-12" title="Communication Latency" meta="NETWORK MEAN, MILLISECONDS">
        <Chart height={200}>
          <AreaChart data={trends} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="t" tick={axis} tickLine={false} axisLine={{ stroke: "var(--line)" }} minTickGap={40} />
            <YAxis tick={axis} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              dataKey="latency"
              stroke="var(--chart-2)"
              fill="var(--chart-2)"
              fillOpacity={0.15}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          </AreaChart>
        </Chart>
      </Panel>
    </div>
  );
}

function Chart({ children, height = 240 }: { children: React.ReactElement; height?: number }) {
  return (
    <div style={{ height }} className="rounded-lg border border-line/60 bg-background/70 p-2">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
