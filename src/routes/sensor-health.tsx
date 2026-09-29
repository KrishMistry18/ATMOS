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

export const Route = createFileRoute("/sensor-health")({
  head: () => ({
    meta: [
      { title: "Sensor Health — A.T.M.O.S Predictive Tracking" },
      {
        name: "description",
        content:
          "Predictive sensor health for every AWS node: health score, drift, noise, fault rate and communication quality.",
      },
      { property: "og:title", content: "Sensor Health — A.T.M.O.S Predictive Tracking" },
      {
        property: "og:description",
        content: "Predictive sensor health, drift index and degradation matrix across the AWS network.",
      },
    ],
  }),
  component: SensorHealth,
});

function SensorHealth() {
  const { health, tick } = useSimulation();

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
  const avgComms = (
    health.reduce((a, b) => a + b.packetDelivery, 0) / health.length
  ).toFixed(1);
  const degradedCount = health.filter((h) => h.state !== "HEALTHY").length;

  return (
    <>
      {/* Top Health Overview KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-line/70 bg-panel/75 p-3.5 backdrop-blur">
          <div className="label-mono text-[9px] text-dim">NETWORK HEALTH INDEX</div>
          <div className="mt-1 font-mono text-2xl font-bold text-ok">{avgHealth} / 100</div>
          <div className="mt-1 font-mono text-[10px] text-dim">Mean health score</div>
        </div>

        <div className="rounded-xl border border-line/70 bg-panel/75 p-3.5 backdrop-blur">
          <div className="label-mono text-[9px] text-dim">DEGRADATION ALERTS</div>
          <div
            className={cn(
              "mt-1 font-mono text-2xl font-bold",
              degradedCount > 0 ? "text-critical" : "text-ok",
            )}
          >
            {degradedCount} NODES
          </div>
          <div className="mt-1 font-mono text-[10px] text-dim">Watch / Degraded / Critical</div>
        </div>

        <div className="rounded-xl border border-line/70 bg-panel/75 p-3.5 backdrop-blur">
          <div className="label-mono text-[9px] text-dim">PACKET DELIVERY</div>
          <div className="mt-1 font-mono text-2xl font-bold text-primary">{avgComms}%</div>
          <div className="mt-1 font-mono text-[10px] text-dim">Across 8 telemetry uplinks</div>
        </div>

        <div className="rounded-xl border border-line/70 bg-panel/75 p-3.5 backdrop-blur">
          <div className="label-mono text-[9px] text-dim">PREDICTIVE SENSOR LIFETIME</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground">98.4%</div>
          <div className="mt-1 font-mono text-[10px] text-dim">MTBF availability estimate</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Health Score Distribution Chart */}
        <Panel
          className="col-span-12 xl:col-span-8"
          title="Sensor Node Health Scores"
          meta={`CYCLE #${tick} · 0–100 COMPOSITE SCORING (ANOMALY FREQUENCY + DRIFT + NOISE + COMMS)`}
        >
          <div className="h-[260px] rounded-lg border border-line/60 bg-background/80 p-2.5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="station"
                  tick={{ fontSize: 10, fill: "var(--dim)", fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--line)" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "var(--dim)", fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--panel2)" }}
                  contentStyle={{
                    background: "var(--panel2)",
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.state)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 font-mono text-[10px] text-dim px-1">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-ok" /> HEALTHY (88–100)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-watch" /> WATCH (74–87)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-degraded" /> DEGRADED (55–73)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-critical" /> CRITICAL (&lt;55)
            </span>
          </div>
        </Panel>

        {/* Network Communication Aggregation */}
        <Panel
          className="col-span-12 xl:col-span-4"
          title="Telemetry Link Stability"
          meta="COMMUNICATION QUALITY PER NODE"
        >
          <dl className="space-y-2.5 font-mono text-[11px]">
            <Row label="Average Packet Delivery" value={`${avgComms}%`} />
            <Row
              label="Mean Network Latency"
              value={`${Math.round(
                health.reduce((a, h) => a + h.latencyMs, 0) / health.length,
              )} ms`}
            />
            <Row
              label="Cumulative Missing Packets"
              value={`${health.reduce((a, h) => a + h.missingPackets, 0)}`}
            />
            <Row
              label="Cumulative Delayed Packets"
              value={`${health.reduce((a, h) => a + h.delayedPackets, 0)}`}
            />
          </dl>

          <div className="mt-4 space-y-2 border-t border-line/40 pt-3">
            {health.map((h) => (
              <div key={h.stationId} className="flex items-center gap-2 font-mono text-[10px]">
                <span className="w-16 text-dim">{h.stationId}</span>
                <Meter
                  value={h.packetDelivery}
                  tone={
                    h.packetDelivery > 97
                      ? "bg-ok"
                      : h.packetDelivery > 90
                        ? "bg-watch"
                        : "bg-critical"
                  }
                />
                <span className="w-12 text-right text-muted-foreground font-semibold">
                  {h.packetDelivery.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Degradation Matrix */}
      <Panel
        title="Predictive Degradation Matrix"
        meta="MONITORING SENSOR DRIFT, NOISE VARIANCE, HARDWARE FAULT RATE & UPLINK QUALITY"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="label-mono border-b border-line/70 text-[10px]">
                <th className="py-2.5 font-normal">Station Node</th>
                <th className="py-2.5 font-normal">Health Score</th>
                <th className="py-2.5 font-normal">Operational State</th>
                <th className="py-2.5 font-normal">Drift Index</th>
                <th className="py-2.5 font-normal">Noise Variance</th>
                <th className="py-2.5 font-normal">Fault Rate</th>
                <th className="py-2.5 font-normal">Communication</th>
                <th className="py-2.5 font-normal">Telemetry Heartbeat</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[11px]">
              {health.map((h) => (
                <tr
                  key={h.stationId}
                  className="border-b border-line/40 hover:bg-foreground/5 transition-colors"
                >
                  <td className="py-3 text-foreground font-bold">{h.stationId}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("w-7 font-bold", stateColor[h.state])}>{h.score}</span>
                      <div className="w-28">
                        <Meter
                          value={h.score}
                          tone={
                            h.state === "HEALTHY"
                              ? "bg-ok"
                              : h.state === "WATCH"
                                ? "bg-watch"
                                : h.state === "DEGRADED"
                                  ? "bg-degraded"
                                  : "bg-critical"
                          }
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <StatusTag
                      label={h.state}
                      tone={
                        h.state === "HEALTHY"
                          ? "ok"
                          : h.state === "WATCH"
                            ? "watch"
                            : h.state === "DEGRADED"
                              ? "degraded"
                              : "critical"
                      }
                    />
                  </td>
                  <td className="py-3 text-muted-foreground">{h.drift}</td>
                  <td className="py-3 text-muted-foreground">{h.noise}</td>
                  <td className="py-3 font-semibold text-foreground">{h.faultRate.toFixed(1)}%</td>
                  <td className="py-3 text-muted-foreground">{h.communication}</td>
                  <td className="py-3 text-dim">Tick #{h.lastSeenTick}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line/40 pb-2">
      <dt className="text-dim">{label}</dt>
      <dd className="text-foreground font-semibold">{value}</dd>
    </div>
  );
}
