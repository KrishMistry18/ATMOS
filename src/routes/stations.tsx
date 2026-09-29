import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Compass,
  MapPin,
  Mountain,
  Radio,
  Wifi,
} from "lucide-react";
import { Meter, Panel, StatusTag, stateColor } from "@/components/atmos/primitives";
import { STATIONS, neighborsOf } from "@/data/stations";
import { useSimulation } from "@/services/simulationStore";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TelemetryChart } from "@/components/atmos/TelemetryChart";

export const Route = createFileRoute("/stations")({
  head: () => ({
    meta: [
      { title: "Stations — A.T.M.O.S AWS Registry" },
      {
        name: "description",
        content:
          "Registry of all Automatic Weather Stations with location, elevation, current observation and health state.",
      },
      { property: "og:title", content: "Stations — A.T.M.O.S AWS Registry" },
      {
        property: "og:description",
        content: "Registry of all Automatic Weather Stations with live telemetry and health.",
      },
    ],
  }),
  component: Stations,
});

function Stations() {
  const { latest, healthById, assess, expectedFor, adaptiveBaselineFor } = useSimulation();
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const selectedStation = selectedStationId
    ? STATIONS.find((s) => s.id === selectedStationId)
    : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {STATIONS.map((station) => {
          const obs = latest[station.id]!;
          const health = healthById[station.id]!;
          const assessment = assess(station.id);
          const baseline = adaptiveBaselineFor(station.id);
          const isAnomalous = assessment.anomalous;

          return (
            <div
              key={station.id}
              onClick={() => setSelectedStationId(station.id)}
              className={cn(
                "cursor-pointer rounded-xl border p-4 transition-all hover:scale-[1.01] hover:border-primary/50 bg-panel/75 backdrop-blur",
                isAnomalous
                  ? "border-critical/40 ring-1 ring-critical/20 bg-critical/5 shadow-sm shadow-critical/5"
                  : "border-line/70 hover:shadow-md",
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-mono text-[14px] font-bold text-foreground">
                    <Radio className="size-3.5 text-primary" />
                    <span>{station.id}</span>
                  </div>
                  <div className="text-[13px] font-semibold text-foreground mt-0.5">
                    {station.name}
                  </div>
                  <div className="label-mono mt-0.5 text-[9px] text-dim flex items-center gap-1">
                    <MapPin className="size-2.5" />
                    {station.district}
                  </div>
                </div>
                <StatusTag
                  label={health.state}
                  tone={
                    health.state === "HEALTHY"
                      ? "ok"
                      : health.state === "WATCH"
                        ? "watch"
                        : health.state === "DEGRADED"
                          ? "degraded"
                          : "critical"
                  }
                />
              </div>

              {/* Real-time Telemetry Metrics */}
              <div className="mt-3.5 grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                <MetricBox
                  label="TEMP"
                  value={obs?.received ? `${obs.temperature.toFixed(1)}°` : "—"}
                  tone={isAnomalous ? "text-critical" : "text-primary"}
                />
                <MetricBox
                  label="PRES"
                  value={obs?.received ? `${obs.pressure.toFixed(0)}` : "—"}
                  tone="text-event"
                />
                <MetricBox
                  label="HUM"
                  value={obs?.received ? `${obs.humidity.toFixed(0)}%` : "—"}
                  tone="text-ok"
                />
              </div>

              {/* Station Sensor Health Meter */}
              <div className="mt-3 border-t border-line/40 pt-2.5">
                <div className="flex items-center justify-between font-mono text-[10px] mb-1">
                  <span className="text-dim">HEALTH SCORE</span>
                  <span className={cn("font-bold", stateColor[health.state])}>{health.score} / 100</span>
                </div>
                <Meter
                  value={health.score}
                  tone={
                    health.state === "HEALTHY"
                      ? "bg-ok"
                      : health.state === "WATCH"
                        ? "bg-watch"
                        : health.state === "DEGRADED"
                          ? "bg-degraded"
                          : "bg-critical"
                  }
                />
              </div>

              {/* Technical Attributes */}
              <dl className="mt-3 space-y-1 font-mono text-[10px]">
                <Line label="ELEVATION" value={`${station.elevation} m MSL`} />
                <Line
                  label="ADAPTIVE BASELINE"
                  value={`${baseline.historicalMean.toFixed(1)}°C (±${(
                    baseline.expectedMax - baseline.historicalMean
                  ).toFixed(1)}°)`}
                />
                <Line
                  label="COMMS UPLINK"
                  value={`${health.communication} (${health.packetDelivery.toFixed(0)}%)`}
                />
                <Line
                  label="ACTIVE ANOMALY"
                  value={isAnomalous ? assessment.type : "NONE"}
                  tone={isAnomalous ? "text-critical font-bold" : "text-ok"}
                />
              </dl>
            </div>
          );
        })}
      </div>

      {/* Station Detailed Modal */}
      {selectedStation && (
        <Dialog open={!!selectedStationId} onOpenChange={(open) => !open && setSelectedStationId(null)}>
          <DialogContent className="max-w-3xl border-line bg-panel p-6">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="font-mono text-lg font-bold text-foreground flex items-center gap-2">
                    <Radio className="size-4 text-primary" />
                    {selectedStation.id} — {selectedStation.name}
                  </DialogTitle>
                  <p className="font-mono text-[11px] text-dim mt-0.5">
                    {selectedStation.district} · Lat {selectedStation.lat.toFixed(3)}, Lon{" "}
                    {selectedStation.lon.toFixed(3)} · Elevation {selectedStation.elevation}m
                  </p>
                </div>
                <StatusTag
                  label={healthById[selectedStation.id]!.state}
                  tone={
                    healthById[selectedStation.id]!.state === "HEALTHY"
                      ? "ok"
                      : healthById[selectedStation.id]!.state === "WATCH"
                        ? "watch"
                        : "critical"
                  }
                />
              </div>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <TelemetryChart stationId={selectedStation.id} height={250} />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                <div className="rounded border border-line/60 bg-panel2/40 p-2.5">
                  <div className="text-dim text-[10px]">DRIFT INDEX</div>
                  <div className="text-foreground font-bold mt-1">
                    {healthById[selectedStation.id]!.drift}
                  </div>
                </div>
                <div className="rounded border border-line/60 bg-panel2/40 p-2.5">
                  <div className="text-dim text-[10px]">NOISE VARIANCE</div>
                  <div className="text-foreground font-bold mt-1">
                    {healthById[selectedStation.id]!.noise}
                  </div>
                </div>
                <div className="rounded border border-line/60 bg-panel2/40 p-2.5">
                  <div className="text-dim text-[10px]">FAULT RATE</div>
                  <div className="text-foreground font-bold mt-1">
                    {healthById[selectedStation.id]!.faultRate.toFixed(1)}%
                  </div>
                </div>
                <div className="rounded border border-line/60 bg-panel2/40 p-2.5">
                  <div className="text-dim text-[10px]">MEAN LATENCY</div>
                  <div className="text-foreground font-bold mt-1">
                    {healthById[selectedStation.id]!.latencyMs} ms
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-line/60 bg-panel2/30 p-3">
                <div className="label-mono text-[10px] text-dim mb-1.5">Nearest Cluster Nodes</div>
                <div className="flex flex-wrap gap-2 font-mono text-[11px]">
                  {neighborsOf(selectedStation.id, 4).map((nid) => (
                    <div
                      key={nid}
                      className="rounded border border-line/50 bg-background/50 px-2.5 py-1 text-muted-foreground"
                    >
                      {nid}: {latest[nid]?.temperature.toFixed(1)}°C
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function MetricBox({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-md border border-line/60 bg-panel2/50 p-2 text-center">
      <div className="label-mono text-[9px]">{label}</div>
      <div className={cn("mt-1 text-[13px] font-bold", tone)}>{value}</div>
    </div>
  );
}

function Line({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line/30 pb-1">
      <dt className="text-dim">{label}</dt>
      <dd className={cn("text-muted-foreground", tone)}>{value}</dd>
    </div>
  );
}
