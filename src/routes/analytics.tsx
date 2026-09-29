import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
      { title: "Analytics — A.T.M.O.S Platform Trends" },
      {
        name: "description",
        content:
          "Aggregate analytics for the AWS network: anomaly frequency, health distribution, parameter trends and latency.",
      },
      { property: "og:title", content: "Analytics — A.T.M.O.S Platform Trends" },
      {
        property: "og:description",
        content: "Aggregate AWS network analytics, parameter trends, and anomaly distributions.",
      },
    ],
  }),
  component: Analytics,
});

const axisStyle = { fontSize: 10, fill: "var(--dim)" };
const tooltipStyle = {
  backgroundColor: "var(--panel)",
  borderColor: "var(--line)",
  borderRadius: "0.75rem",
  fontSize: "12px",
  color: "var(--foreground)",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

function Analytics() {
  const { anomalies, history, health } = useSimulation();

  // 1. Anomaly Type Distribution
  const typeCounts = Object.entries(
    anomalies.reduce<Record<string, number>>((acc, a) => {
      acc[a.type] = (acc[a.type] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([type, count]) => ({ type: type.split(" ")[0], fullName: type, count }));

  // 2. Health State Breakdown
  const stateCounts = ["HEALTHY", "WATCH", "DEGRADED", "CRITICAL"].map((state) => ({
    name: state,
    value: health.filter((h) => h.state === state).length,
  }));
  const stateColors = ["var(--ok)", "var(--watch)", "var(--degraded)", "var(--critical)"];

  // 3. Multi-Station Network Trends
  const reference = history[STATIONS[0]!.id] ?? [];
  const trends = reference.slice(-40).map((_, i) => {
    const idx = reference.length - 40 + i;
    const perStation = STATIONS.map((s) => history[s.id]?.[idx]).filter(Boolean);
    const mean = (key: "temperature" | "pressure" | "humidity" | "latencyMs") =>
      perStation.reduce((a, o) => a + (o![key] as number), 0) / Math.max(perStation.length, 1);

    const aws3Obs = history["AWS-003"]?.[idx];

    return {
      t: formatSimTime(reference[idx]!.time),
      temperature: Number(mean("temperature").toFixed(2)),
      aws3Temp: aws3Obs?.received ? Number(aws3Obs.temperature.toFixed(1)) : null,
      pressure: Number(mean("pressure").toFixed(2)),
      humidity: Number(mean("humidity").toFixed(2)),
      latency: Math.round(mean("latencyMs")),
    };
  });

  // 4. Detected vs Resolved Lifecycle
  const detectedVsResolved = [
    { name: "Logged", value: anomalies.length },
    { name: "Resolved", value: anomalies.filter((a) => a.status === "RESOLVED").length },
    { name: "Open", value: anomalies.filter((a) => a.status !== "RESOLVED").length },
  ];

  return (
    <div className="grid grid-cols-12 gap-5">
      {/* Large Telemetry Trend Chart */}
      <Panel
        className="col-span-12 lg:col-span-8"
        title="Network Telemetry Trend & Node Divergence"
        meta="Cluster Mean vs Target Node (AWS-003) Over Last 40 Cycles"
      >
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 10, right: 10, bottom: 0, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.6} />
              <XAxis
                dataKey="t"
                tick={axisStyle}
                tickLine={false}
                axisLine={{ stroke: "var(--line)" }}
                minTickGap={35}
              />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                iconType="circle"
              />
              {/* Cluster Mean: Professional Blue */}
              <Area
                type="monotone"
                dataKey="temperature"
                name="Network Mean Temp (°C)"
                stroke="var(--color-primary)"
                fill="var(--color-primary)"
                fillOpacity={0.12}
                strokeWidth={2}
                isAnimationActive={false}
              />
              {/* Target Station: Red when diverging */}
              <Line
                type="monotone"
                dataKey="aws3Temp"
                name="AWS-003 Observation (°C)"
                stroke="var(--critical)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Station Health Distribution */}
      <Panel
        className="col-span-12 sm:col-span-6 lg:col-span-4"
        title="Station Health Distribution"
        meta="Proportion of AWS Fleet in Each Health Category"
      >
        <div className="h-[300px] w-full flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={stateCounts}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
              >
                {stateCounts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={stateColors[index]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 text-[11px]">
            {stateCounts.map((entry, i) => (
              <span key={entry.name} className="flex items-center gap-1.5 font-medium">
                <span className="size-2 rounded-full" style={{ backgroundColor: stateColors[i] }} />
                {entry.name}: {entry.value}
              </span>
            ))}
          </div>
        </div>
      </Panel>

      {/* Anomaly Distribution By Type */}
      <Panel
        className="col-span-12 sm:col-span-6 lg:col-span-4"
        title="Anomaly Distribution by Type"
        meta="Incident Frequency Categorized by Fault Fingerprint"
      >
        <div className="h-[240px] w-full">
          {typeCounts.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[12px] text-muted-foreground">
              No anomalies recorded yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeCounts} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.6} />
                <XAxis dataKey="type" tick={axisStyle} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Panel>

      {/* Incident Lifecycle */}
      <Panel
        className="col-span-12 sm:col-span-6 lg:col-span-4"
        title="Incident Lifecycle"
        meta="Detected vs Resolved vs Active Incidents"
      >
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={detectedVsResolved} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.6} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                <Cell fill="var(--color-primary)" />
                <Cell fill="var(--ok)" />
                <Cell fill="var(--critical)" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Communication Latency Over Time */}
      <Panel
        className="col-span-12 sm:col-span-6 lg:col-span-4"
        title="Mean Communication Latency"
        meta="Rolling Backhaul Transmission Latency (ms)"
      >
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.6} />
              <XAxis dataKey="t" tick={axisStyle} axisLine={{ stroke: "var(--line)" }} tickLine={false} minTickGap={35} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} domain={[0, "auto"]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="latency"
                name="Mean Latency (ms)"
                stroke="var(--color-secondary)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
