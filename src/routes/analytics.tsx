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
      { title: "Analytics — A.T.M.O.S Network Telemetry & Trends" },
      {
        name: "description",
        content:
          "Aggregate analytics for the AWS network: anomaly frequency, health distribution, parameter trends and latency.",
      },
      { property: "og:title", content: "Analytics — A.T.M.O.S Network Telemetry & Trends" },
      {
        property: "og:description",
        content: "Aggregate AWS network analytics, parameter trends, and anomaly distributions.",
      },
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
    <div className="grid grid-cols-12 gap-4">
      {/* Network Parameter Trends: Mean vs Target Station with Anomaly Divergence */}
      <Panel
        className="col-span-12 lg:col-span-8"
        title="Network Temperature & Pressure Trends"
        meta="NETWORK MEAN (AMBER) VS AWS-003 DIVERGENCE (WHITE) · PRESSURE (BLUE)"
      >
        <Chart height={260}>
          <LineChart data={trends} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="t"
              tick={axis}
              tickLine={false}
              axisLine={{ stroke: "var(--line)" }}
              minTickGap={35}
            />
            <YAxis yAxisId="left" tick={axis} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={axis}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              yAxisId="left"
              dataKey="temperature"
              name="Network Mean Temp (°C)"
              stroke="var(--chart-1)"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Line
              yAxisId="left"
              dataKey="aws3Temp"
              name="AWS-003 Temp (°C)"
              stroke="#ffffff"
              dot={false}
              strokeWidth={1.5}
              strokeDasharray="3 3"
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              dataKey="pressure"
              name="Mean Pressure (hPa)"
              stroke="var(--chart-2)"
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          </LineChart>
        </Chart>
      </Panel>

      {/* Health Distribution Donut */}
      <Panel
        className="col-span-12 lg:col-span-4"
        title="Station Health Distribution"
        meta="ACTIVE NODES PER CATEGORY"
      >
        <Chart height={220}>
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
              {s.name}: {s.value}
            </span>
          ))}
        </div>
      </Panel>

      {/* Anomaly Types Frequency */}
      <Panel
        className="col-span-12 lg:col-span-6"
        title="Anomaly Fingerprint Distribution"
        meta="CLASSIFICATION HISTOGRAM"
      >
        <Chart height={220}>
          <BarChart data={typeCounts} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="type" tick={axis} tickLine={false} axisLine={{ stroke: "var(--line)" }} />
            <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name, item) => [value, (item.payload as { fullName?: string }).fullName ?? "Count"]}
              cursor={{ fill: "var(--panel2)" }}
            />
            <Bar dataKey="count" fill="var(--chart-4)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </Chart>
      </Panel>

      {/* Anomaly Lifecycle */}
      <Panel
        className="col-span-12 lg:col-span-6"
        title="Incident Lifecycle Summary"
        meta="TOTAL LOGGED VS RESOLVED"
      >
        <Chart height={220}>
          <BarChart
            data={detectedVsResolved}
            margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
            layout="vertical"
          >
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={axis}
              tickLine={false}
              axisLine={false}
              width={75}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--panel2)" }} />
            <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} isAnimationActive={false} />
          </BarChart>
        </Chart>
      </Panel>

      {/* Network Communication Latency Trend */}
      <Panel
        className="col-span-12"
        title="Mean Telemetry Uplink Latency"
        meta="NETWORK-WIDE HISTORICAL RESPONSE PROFILE (MS)"
      >
        <Chart height={180}>
          <AreaChart data={trends} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="t"
              tick={axis}
              tickLine={false}
              axisLine={{ stroke: "var(--line)" }}
              minTickGap={35}
            />
            <YAxis tick={axis} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              dataKey="latency"
              name="Latency (ms)"
              stroke="var(--chart-2)"
              fill="var(--chart-2)"
              fillOpacity={0.15}
              strokeWidth={1.6}
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
    <div style={{ height }} className="rounded-lg border border-line/60 bg-background/80 p-2.5">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
