import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Clock, Gauge, Radio, Wifi, WifiOff } from "lucide-react";
import { Panel, StatusTag, stateColor } from "@/components/atmos/primitives";
import { TelemetryChart } from "@/components/atmos/TelemetryChart";
import { SimulationControls } from "@/components/atmos/SimulationControls";
import { STATIONS, STATION_MAP } from "@/data/stations";
import { formatSimTime, useSimulation } from "@/services/simulationStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/live-monitoring")({
  head: () => ({
    meta: [
      { title: "Live Monitoring — A.T.M.O.S" },
      {
        name: "description",
        content:
          "Streaming observations from every Automatic Weather Station with per-station telemetry and packet health.",
      },
      { property: "og:title", content: "Live Monitoring — A.T.M.O.S" },
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
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line/70 bg-panel/60 p-2.5 backdrop-blur">
        <span className="label-mono px-2 text-[10px] text-dim">SELECT STATION:</span>
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
                  "flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-[11px] font-semibold transition-all",
                  active
                    ? "border-primary/60 bg-primary/15 text-primary ring-1 ring-primary/30"
                    : "border-line/60 bg-panel2/40 text-muted-foreground hover:border-primary/30 hover:text-foreground",
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
                          : "bg-degraded",
                  )}
                />
                <span>{s.id}</span>
                <span className="text-[10px] text-dim hidden sm:inline">
                  {latest[s.id]?.received ? `${latest[s.id]!.temperature.toFixed(1)}°` : "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left Column: Station Telemetry & Incoming Stream */}
        <div className="col-span-12 space-y-4 xl:col-span-8">
          {/* Quick Metrics Ribbon for Selected Station */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricCard
              label="Temperature"
              value={currentObs?.received ? `${currentObs.temperature.toFixed(1)}°C` : "NO DATA"}
              subtext={`Baseline ${currentExpected.temperature.toFixed(1)}°C`}
              tone={currentAssessment.anomalous ? "critical" : "primary"}
            />
            <MetricCard
              label="Pressure"
              value={currentObs?.received ? `${currentObs.pressure.toFixed(1)} hPa` : "—"}
              subtext="Atmospheric"
              tone="event"
            />
            <MetricCard
              label="Relative Humidity"
              value={currentObs?.received ? `${currentObs.humidity.toFixed(0)}%` : "—"}
              subtext="Hygrometric"
              tone="ok"
            />
            <MetricCard
              label="Packet Transport"
              value={
                currentObs?.received
                  ? `${currentObs.latencyMs} ms`
                  : "UNREACHABLE"
              }
              subtext={currentObs?.delayed ? "LATENCY WARNING" : "LINK STABLE"}
              tone={!currentObs?.received ? "critical" : currentObs.delayed ? "watch" : "ok"}
            />
          </div>

          <Panel
            title={`Telemetry Stream: ${stationId} (${currentStation.name})`}
            meta={`DISTRICT: ${currentStation.district} · ELEVATION: ${currentStation.elevation}m · CYCLE TIME: ${formatSimTime(simTime)}`}
          >
            <TelemetryChart stationId={stationId} height={310} />
          </Panel>

          <Panel
            title="Real-Time Station Packet Log"
            meta="LATEST OBSERVATIONS FROM ALL 8 AUTOMATIC WEATHER STATIONS"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr className="label-mono border-b border-line/70 text-[10px]">
                    <th className="py-2.5 font-normal">Station Node</th>
                    <th className="py-2.5 font-normal">Location</th>
                    <th className="py-2.5 font-normal">Temperature</th>
                    <th className="py-2.5 font-normal">Pressure</th>
                    <th className="py-2.5 font-normal">Humidity</th>
                    <th className="py-2.5 font-normal">Latency</th>
                    <th className="py-2.5 font-normal">Health</th>
                    <th className="py-2.5 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[11px]">
                  {stream.map(({ station, obs }) => {
                    const health = healthById[station.id]!;
                    const anomalous = assess(station.id).anomalous;
                    const isSelected = station.id === stationId;
                    return (
                      <tr
                        key={station.id}
                        onClick={() => setStationId(station.id)}
                        className={cn(
                          "cursor-pointer border-b border-line/40 transition-colors hover:bg-foreground/5",
                          isSelected && "bg-primary/8 font-medium",
                        )}
                      >
                        <td className="py-2.5 text-foreground flex items-center gap-1.5">
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              anomalous ? "bg-critical" : "bg-ok",
                            )}
                          />
                          {station.id}
                        </td>
                        <td className="py-2.5 text-dim">{station.district}</td>
                        <td
                          className={cn(
                            "py-2.5 font-bold",
                            anomalous ? "text-critical" : "text-muted-foreground",
                          )}
                        >
                          {obs.received ? `${obs.temperature.toFixed(1)}°C` : "MISSING"}
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {obs.received ? `${obs.pressure.toFixed(1)} hPa` : "—"}
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {obs.received ? `${obs.humidity.toFixed(0)}%` : "—"}
                        </td>
                        <td
                          className={cn(
                            "py-2.5",
                            obs.delayed ? "text-degraded font-bold" : "text-muted-foreground",
                          )}
                        >
                          {obs.received ? `${obs.latencyMs} ms` : "TIMED OUT"}
                        </td>
                        <td className={cn("py-2.5 font-bold", stateColor[health.state])}>
                          {health.score}
                        </td>
                        <td className="py-2.5">
                          <StatusTag
                            label={anomalous ? "ANOMALOUS" : health.state}
                            tone={
                              anomalous
                                ? "critical"
                                : health.state === "HEALTHY"
                                  ? "ok"
                                  : health.state === "WATCH"
                                    ? "watch"
                                    : "degraded"
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
        <div className="col-span-12 space-y-4 xl:col-span-4">
          <Panel
            title="Communication & Packet Health"
            meta={`${stationId} · LAST 40 REPORTING CYCLES`}
          >
            <dl className="space-y-2.5 font-mono text-[11px]">
              <Row
                label="Packet Delivery Rate"
                value={`${currentHealth.packetDelivery.toFixed(1)}%`}
              />
              <Row label="Mean Backhaul Latency" value={`${currentHealth.latencyMs} ms`} />
              <Row
                label="Dropped / Missing Packets"
                value={`${missingInWindow}`}
                tone={missingInWindow > 0 ? "text-critical" : "text-foreground"}
              />
              <Row
                label="Delayed Packets (>1800ms)"
                value={`${delayedInWindow}`}
                tone={delayedInWindow > 0 ? "text-watch" : "text-foreground"}
              />
              <Row
                label="Radio Link Quality"
                value={currentHealth.communication}
                tone={currentHealth.communication === "Excellent" ? "text-ok" : "text-watch"}
              />
            </dl>

            <div className="mt-4">
              <div className="label-mono mb-1.5 text-[9px] flex items-center justify-between">
                <span>Packet Reception Timeline (Historical Buffer)</span>
                <span className="text-ok">40 CYCLES</span>
              </div>
              <div className="flex gap-1">
                {stationHistory.slice(-40).map((o, i) => (
                  <span
                    key={i}
                    title={`Tick #${o.tick}: ${o.received ? `${o.latencyMs}ms` : "MISSING"}`}
                    className={cn(
                      "h-7 flex-1 rounded-[2px] transition-all",
                      !o.received
                        ? "bg-critical"
                        : o.delayed
                          ? "bg-degraded"
                          : "bg-ok/50 hover:bg-ok",
                    )}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between font-mono text-[9px] text-dim">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-ok/50" /> NORMAL PACKET
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-degraded" /> DELAYED
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-critical" /> LOST
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
  subtext,
  tone,
}: {
  label: string;
  value: string;
  subtext: string;
  tone: "primary" | "event" | "ok" | "watch" | "critical";
}) {
  const toneClasses = {
    primary: "text-primary",
    event: "text-event",
    ok: "text-ok",
    watch: "text-watch",
    critical: "text-critical",
  }[tone];

  return (
    <div className="rounded-lg border border-line/60 bg-panel2/40 p-3">
      <div className="label-mono text-[9px]">{label}</div>
      <div className={cn("mt-1 font-mono text-lg font-bold truncate", toneClasses)}>{value}</div>
      <div className="mt-0.5 font-mono text-[9px] text-dim truncate">{subtext}</div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line/40 pb-2">
      <dt className="text-dim">{label}</dt>
      <dd className={cn("text-foreground font-semibold", tone)}>{value}</dd>
    </div>
  );
}
