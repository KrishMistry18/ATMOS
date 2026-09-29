import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Clock, Gauge, Radio, Wifi, WifiOff, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Panel, StatusTag, stateColor } from "@/components/atmos/primitives";
import { TelemetryChart } from "@/components/atmos/TelemetryChart";
import { SimulationControls } from "@/components/atmos/SimulationControls";
import { STATIONS, STATION_MAP } from "@/data/stations";
import { formatSimTime, useSimulation } from "@/services/simulationStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/live-monitoring")({
  head: () => ({
    meta: [
      { title: "Live Monitoring — A.T.M.O.S Telemetry Stream" },
      {
        name: "description",
        content:
          "Streaming observations from every Automatic Weather Station with per-station telemetry and packet health.",
      },
      { property: "og:title", content: "Live Monitoring — A.T.M.O.S Telemetry Stream" },
      { property: "og:description", content: "Streaming AWS observations and packet health." },
    ],
  }),
  component: LiveMonitoring,
});

function LiveMonitoring() {
  const { latest, healthById, assess, simTime, history, expectedFor } = useSimulation();
  const [stationId, setStationId] = useState("AWS-003");

  const currentStation = STATION_MAP.get(stationId)!;
  const currentObs = latest[stationId]!;
  const currentHealth = healthById[stationId]!;
  const currentAssessment = assess(stationId);
  const currentExpected = expectedFor(stationId);

  const stream = STATIONS.map((s) => ({ station: s, obs: latest[s.id]! }))
    .filter((r) => r.obs)
    .sort((a, b) => a.station.id.localeCompare(b.station.id));

  const stationHistory = history[stationId] ?? [];
  const missingInWindow = stationHistory.slice(-40).filter((o) => !o.received).length;
  const delayedInWindow = stationHistory.slice(-40).filter((o) => o.delayed).length;

  return (
    <>
      {/* Station Selector Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
        <span className="text-[12px] font-semibold text-muted-foreground uppercase px-1">
          Select Station:
        </span>
        <div className="flex flex-wrap gap-1.5 flex-1">
          {STATIONS.map((s) => {
            const h = healthById[s.id]!;
            const a = assess(s.id);
            const active = s.id === stationId;
            return (
              <button
                key={s.id}
                onClick={() => setStationId(s.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-all shadow-xs",
                  active
                    ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                    : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    a.anomalous
                      ? "bg-critical animate-pulse"
                      : h.state === "HEALTHY"
                        ? "bg-ok"
                        : h.state === "WATCH"
                          ? "bg-watch"
                          : "bg-critical",
                  )}
                />
                <span className="font-mono">{s.id}</span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  {latest[s.id]?.received ? `${latest[s.id]!.temperature.toFixed(1)}°` : "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left Column: Station Telemetry & Incoming Stream */}
        <div className="col-span-12 space-y-5 xl:col-span-8">
          {/* Telemetry KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard
              label="Temperature"
              value={currentObs?.received ? `${currentObs.temperature.toFixed(1)}` : "NO DATA"}
              unit="°C"
              subtext={`Baseline: ${currentExpected.temperature.toFixed(1)}°C`}
              trend={currentAssessment.anomalous ? "+23.2°C" : "Nominal"}
              tone={currentAssessment.anomalous ? "critical" : "primary"}
            />
            <MetricCard
              label="Atmospheric Pressure"
              value={currentObs?.received ? `${currentObs.pressure.toFixed(1)}` : "—"}
              unit="hPa"
              subtext="Barometric Pressure"
              trend="1010.5 hPa avg"
              tone="secondary"
            />
            <MetricCard
              label="Relative Humidity"
              value={currentObs?.received ? `${currentObs.humidity.toFixed(0)}` : "—"}
              unit="%"
              subtext="Hygrometric Sensor"
              trend="68% nominal"
              tone="ok"
            />
            <MetricCard
              label="Packet Health"
              value={currentObs?.received ? `${currentObs.latencyMs}` : "FAIL"}
              unit={currentObs?.received ? "ms" : ""}
              subtext={currentObs?.delayed ? "High Latency" : "Uplink Stable"}
              trend={`${currentHealth.packetDelivery.toFixed(0)}% delivery`}
              tone={!currentObs?.received ? "critical" : currentObs.delayed ? "watch" : "ok"}
            />
          </div>

          <Panel
            title={`Telemetry Stream: ${stationId} (${currentStation.name})`}
            meta={`District: ${currentStation.district} • Elevation: ${currentStation.elevation}m MSL • Sim Time: ${formatSimTime(simTime)}`}
          >
            <TelemetryChart stationId={stationId} height={320} />
          </Panel>

          <Panel
            title="Real-Time Station Packet Log"
            meta="Incoming telemetry frames across all 8 Automatic Weather Stations"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-[12px]">
                <thead>
                  <tr className="border-b border-border/80 text-[11px] font-semibold text-muted-foreground uppercase">
                    <th className="py-2.5 px-3">Station Node</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Temperature</th>
                    <th className="py-2.5 px-3">Pressure</th>
                    <th className="py-2.5 px-3">Humidity</th>
                    <th className="py-2.5 px-3">Latency</th>
                    <th className="py-2.5 px-3">Health Score</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {stream.map(({ station, obs }) => {
                    const health = healthById[station.id]!;
                    const anomalous = assess(station.id).anomalous;
                    const isSelected = station.id === stationId;
                    return (
                      <tr
                        key={station.id}
                        onClick={() => setStationId(station.id)}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/50",
                          isSelected && "bg-primary/10 font-medium",
                          anomalous && "bg-critical/5",
                        )}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-foreground flex items-center gap-2">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              anomalous ? "bg-critical animate-pulse" : "bg-ok",
                            )}
                          />
                          {station.id}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{station.district}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold">
                          <span className={cn(anomalous ? "text-critical font-bold" : "text-foreground")}>
                            {obs.received ? `${obs.temperature.toFixed(1)}°C` : "MISSING"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                          {obs.received ? `${obs.pressure.toFixed(1)} hPa` : "—"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                          {obs.received ? `${obs.humidity.toFixed(0)}%` : "—"}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <span className={cn(obs.delayed ? "text-watch font-bold" : "text-muted-foreground")}>
                            {obs.received ? `${obs.latencyMs} ms` : "TIMEOUT"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          <span className={stateColor[health.state]}>{health.score}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusTag
                            label={anomalous ? "ANOMALOUS" : health.state}
                            tone={
                              anomalous
                                ? "critical"
                                : health.state === "HEALTHY"
                                  ? "ok"
                                  : health.state === "WATCH"
                                    ? "watch"
                                    : "critical"
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        {/* Right Column: Communication Telemetry & Simulation Controls */}
        <div className="col-span-12 space-y-5 xl:col-span-4">
          <Panel
            title="Communication & Packet Health"
            meta={`${stationId} • Rolling 40 Telemetry Cycles`}
          >
            <div className="space-y-3 text-[12px]">
              <Row
                label="Packet Delivery Rate"
                value={`${currentHealth.packetDelivery.toFixed(1)}%`}
                tone={currentHealth.packetDelivery > 95 ? "text-ok" : "text-watch"}
              />
              <Row label="Mean Backhaul Latency" value={`${currentHealth.latencyMs} ms`} />
              <Row
                label="Missing Telemetry Frames"
                value={`${missingInWindow}`}
                tone={missingInWindow > 0 ? "text-critical" : "text-foreground"}
              />
              <Row
                label="Delayed Frames (>1800ms)"
                value={`${delayedInWindow}`}
                tone={delayedInWindow > 0 ? "text-watch" : "text-foreground"}
              />
              <Row
                label="Radio Link Quality"
                value={currentHealth.communication}
                tone={currentHealth.communication === "Excellent" ? "text-ok" : "text-watch"}
              />
            </div>

            <div className="mt-5 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground mb-2">
                <span>Packet Ingestion Buffer</span>
                <span className="text-ok">40 Cycles Buffer</span>
              </div>
              <div className="flex gap-1 h-7">
                {stationHistory.slice(-40).map((o, i) => (
                  <span
                    key={i}
                    title={`Cycle #${o.tick}: ${o.received ? `${o.latencyMs}ms` : "MISSING"}`}
                    className={cn(
                      "flex-1 rounded-[2px] transition-all",
                      !o.received
                        ? "bg-critical"
                        : o.delayed
                          ? "bg-watch"
                          : "bg-ok/60 hover:bg-ok",
                    )}
                  />
                ))}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-ok/60" /> Received
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-watch" /> Delayed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-critical" /> Lost
                </span>
              </div>
            </div>
          </Panel>

          <SimulationControls />
        </div>
      </div>
    </>
  );
}

function MetricCard({
  label,
  value,
  unit,
  subtext,
  trend,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  subtext: string;
  trend: string;
  tone: "primary" | "secondary" | "ok" | "watch" | "critical";
}) {
  const toneClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    ok: "text-ok",
    watch: "text-watch",
    critical: "text-critical",
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="text-[11px] font-semibold text-muted-foreground uppercase">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className={cn("text-2xl font-bold font-mono tracking-tight", toneClasses)}>
          {value}
        </span>
        {unit && <span className="text-[13px] font-medium text-muted-foreground">{unit}</span>}
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="truncate">{subtext}</span>
        <span className="font-medium text-foreground">{trend}</span>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-mono font-semibold text-foreground", tone)}>{value}</span>
    </div>
  );
}
