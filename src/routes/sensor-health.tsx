import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Meter, Panel, StatusTag, stateColor } from "@/components/atmos/primitives";
import { useSimulation } from "@/services/simulationStore";
import { cn } from "@/lib/utils";
import { ShieldAlert, ShieldCheck, Wifi, AlertTriangle } from "lucide-react";
import { STATION_MAP } from "@/data/stations";

export const Route = createFileRoute("/sensor-health")({
  head: () => ({
    meta: [
      { title: "Sensor Health — A.T.M.O.S Fleet Reliability" },
      {
        name: "description",
        content:
          "Predictive sensor health for every AWS node: health score, drift, noise, fault rate and communication quality.",
      },
      { property: "og:title", content: "Sensor Health — A.T.M.O.S Fleet Reliability" },
      {
        property: "og:description",
        content: "Predictive sensor health, drift index and degradation matrix across the AWS network.",
      },
    ],
  }),
  component: SensorHealth,
});

function SensorHealth() {
  const { health, anomalies } = useSimulation();

  const chartData = health.map((h) => ({
    station: h.stationId,
    score: h.score,
    state: h.state,
  }));

  const getColor = (state: string) => {
    switch (state) {
      case "HEALTHY":
        return "var(--ok)";
      case "WATCH":
        return "var(--watch)";
      case "DEGRADED":
        return "var(--degraded)";
      case "CRITICAL":
      default:
        return "var(--critical)";
    }
  };

  const avgHealth = Math.round(health.reduce((a, b) => a + b.score, 0) / health.length);
  const healthyCount = health.filter((h) => h.state === "HEALTHY").length;
  const watchCount = health.filter((h) => h.state === "WATCH").length;
  const degradedCount = health.filter((h) => h.state === "DEGRADED").length;
  const criticalCount = health.filter((h) => h.state === "CRITICAL").length;

  return (
    <>
      {/* Fleet Health Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase">Overall Health</div>
          <div className="mt-1 text-2xl font-bold font-mono text-ok">{avgHealth} / 100</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Mean fleet index</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase">Healthy</div>
          <div className="mt-1 text-2xl font-bold font-mono text-ok">{healthyCount} Nodes</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Nominal baseline</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase">Watch</div>
          <div className="mt-1 text-2xl font-bold font-mono text-watch">{watchCount} Nodes</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Slight variance</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase">Degraded</div>
          <div className="mt-1 text-2xl font-bold font-mono text-degraded">{degradedCount} Nodes</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Calibration advised</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase">Critical</div>
          <div className="mt-1 text-2xl font-bold font-mono text-critical">{criticalCount} Nodes</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Immediate action</div>
        </div>
      </div>

      {/* Fleet Health Distribution Chart */}
      <Panel
        title="Fleet Health Score Distribution"
        meta="Automated composite health indices (0–100) per observational station"
      >
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.6} />
              <XAxis
                dataKey="station"
                tick={{ fontSize: 10, fill: "var(--dim)" }}
                axisLine={{ stroke: "var(--line)" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "var(--dim)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--panel)",
                  borderColor: "var(--line)",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "var(--foreground)",
                }}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.station} fill={getColor(entry.state)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Station Health Fleet List */}
      <Panel
        title="Fleet Station Health & Diagnostics"
        meta="Detailed degradation breakdown, communication quality and noise indicators"
      >
        <div className="space-y-3">
          {health.map((h) => {
            const st = STATION_MAP.get(h.stationId);
            const stationAnomalies = anomalies.filter((a) => a.stationId === h.stationId);
            const openAnomalies = stationAnomalies.filter((a) => a.status !== "RESOLVED");

            return (
              <div
                key={h.stationId}
                className={cn(
                  "rounded-xl border bg-card p-4 transition-all shadow-xs",
                  h.state === "CRITICAL"
                    ? "border-critical/40 bg-critical/5"
                    : "border-border",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground font-mono font-bold text-[13px]">
                      {h.stationId.replace("AWS-", "")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] font-bold text-foreground">
                          {h.stationId}
                        </span>
                        <span className="text-[13px] font-semibold text-foreground">
                          {st?.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {st?.district} • Elevation: {st?.elevation}m MSL
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusTag label={h.state} tone={h.state === "HEALTHY" ? "ok" : h.state === "WATCH" ? "watch" : "critical"} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border/60 pt-3.5 sm:grid-cols-4">
                  {/* Health Score */}
                  <div>
                    <div className="text-[11px] text-muted-foreground font-medium">Health Score</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className={cn("font-mono text-xl font-bold", stateColor[h.state])}>
                        {h.score}
                      </span>
                      <span className="text-[11px] text-muted-foreground">/ 100</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", getColor(h.state))}
                        style={{ width: `${h.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Signal Quality */}
                  <div>
                    <div className="text-[11px] text-muted-foreground font-medium">Signal Quality</div>
                    <div className="mt-1 font-mono text-[13px] font-bold text-foreground">
                      {h.packetDelivery > 95 ? "High (98 dBm)" : "Degraded (82 dBm)"}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Carrier: {h.communication}
                    </div>
                  </div>

                  {/* Communication Reliability */}
                  <div>
                    <div className="text-[11px] text-muted-foreground font-medium">Communication</div>
                    <div className="mt-1 font-mono text-[13px] font-bold text-ok">
                      {h.packetDelivery.toFixed(1)}% Delivery
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Latency: {h.latencyMs} ms
                    </div>
                  </div>

                  {/* Recent Anomalies */}
                  <div>
                    <div className="text-[11px] text-muted-foreground font-medium">Recent Anomalies</div>
                    <div className={cn("mt-1 font-mono text-[13px] font-bold", openAnomalies.length > 0 ? "text-critical" : "text-foreground")}>
                      {openAnomalies.length > 0 ? `${openAnomalies.length} Active` : "None"}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {stationAnomalies.length} Historical Total
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </>
  );
}
