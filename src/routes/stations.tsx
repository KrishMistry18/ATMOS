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
  CheckCircle2,
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
      {/* Station Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATIONS.map((station) => {
          const obs = latest[station.id];
          const health = healthById[station.id]!;
          const assessment = assess(station.id);
          const baseline = adaptiveBaselineFor(station.id);
          const isAnomalous = assessment.anomalous;

          return (
            <div
              key={station.id}
              onClick={() => setSelectedStationId(station.id)}
              className={cn(
                "group cursor-pointer rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md shadow-xs",
                isAnomalous
                  ? "border-critical/50 bg-critical/5 ring-1 ring-critical/20"
                  : "border-border",
              )}
            >
              {/* Card Header: Station ID, Name & Status */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[14px] font-bold text-foreground">
                      {station.id}
                    </span>
                    <span className="flex size-2 rounded-full bg-primary" />
                  </div>
                  <h3 className="text-[15px] font-bold text-foreground mt-0.5 group-hover:text-primary transition-colors">
                    {station.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                    <MapPin className="size-3 text-muted-foreground" />
                    <span>{station.district}</span>
                  </div>
                </div>

                <StatusTag
                  label={isAnomalous ? "ANOMALY" : health.state}
                  tone={
                    isAnomalous
                      ? "critical"
                      : health.state === "HEALTHY"
                        ? "ok"
                        : health.state === "WATCH"
                          ? "watch"
                          : "critical"
                  }
                />
              </div>

              {/* Primary Telemetry: 3 Columns */}
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-muted/30 p-2.5 text-center">
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase">Temp</div>
                  <div className={cn("font-mono text-[13px] font-bold mt-0.5", isAnomalous ? "text-critical" : "text-foreground")}>
                    {obs?.received ? `${obs.temperature.toFixed(1)}°C` : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase">Pressure</div>
                  <div className="font-mono text-[13px] font-bold text-foreground mt-0.5">
                    {obs?.received ? `${obs.pressure.toFixed(0)} hPa` : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase">Humidity</div>
                  <div className="font-mono text-[13px] font-bold text-foreground mt-0.5">
                    {obs?.received ? `${obs.humidity.toFixed(0)}%` : "—"}
                  </div>
                </div>
              </div>

              {/* Health Score & Progress Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Health Score</span>
                  <span className={cn("font-mono font-bold", stateColor[health.state])}>
                    {health.score} / 100
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      health.state === "HEALTHY"
                        ? "bg-ok"
                        : health.state === "WATCH"
                          ? "bg-watch"
                          : "bg-critical",
                    )}
                    style={{ width: `${health.score}%` }}
                  />
                </div>
              </div>

              {/* Station Metadata Details */}
              <div className="mt-4 space-y-1.5 border-t border-border/70 pt-3 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Elevation</span>
                  <span className="font-medium text-foreground">{station.elevation} m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Adaptive Baseline</span>
                  <span className="font-mono font-medium text-foreground">
                    {baseline.historicalMean.toFixed(1)}°C
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Communication</span>
                  <span className="font-medium text-foreground">{health.communication}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Active Anomaly</span>
                  <span className={cn("font-medium", isAnomalous ? "text-critical font-bold" : "text-ok")}>
                    {isAnomalous ? assessment.type : "None"}
                  </span>
                </div>
              </div>

              {/* Action hint */}
              <div className="mt-3 flex items-center justify-end text-[11px] font-medium text-primary group-hover:underline">
                View Diagnostics & Telemetry →
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Dialog for Selected Station */}
      <Dialog
        open={!!selectedStationId}
        onOpenChange={(open) => !open && setSelectedStationId(null)}
      >
        <DialogContent className="max-w-2xl border-border bg-card p-6">
          {selectedStation && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-foreground">
                    <Radio className="size-5 text-primary" />
                    <span>
                      {selectedStation.id} — {selectedStation.name}
                    </span>
                  </DialogTitle>
                  <StatusTag
                    label={assess(selectedStation.id).anomalous ? "ANOMALOUS" : healthById[selectedStation.id]!.state}
                    tone={assess(selectedStation.id).anomalous ? "critical" : "ok"}
                  />
                </div>
                <p className="text-[12px] text-muted-foreground">
                  {selectedStation.district} • Elevation: {selectedStation.elevation}m • Coordinates: {selectedStation.lat.toFixed(3)}°N, {selectedStation.lon.toFixed(3)}°E
                </p>
              </DialogHeader>

              {/* Station Detailed Telemetry Chart */}
              <div>
                <div className="mb-2 text-[12px] font-semibold text-foreground">
                  Live Telemetry Analysis
                </div>
                <TelemetryChart stationId={selectedStation.id} height={260} />
              </div>

              {/* Diagnostic Parameters */}
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/20 p-4 text-[12px] sm:grid-cols-4">
                <div>
                  <div className="text-muted-foreground">Health Score</div>
                  <div className="font-mono text-lg font-bold text-foreground mt-0.5">
                    {healthById[selectedStation.id]!.score} / 100
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Packet Delivery</div>
                  <div className="font-mono text-lg font-bold text-ok mt-0.5">
                    {healthById[selectedStation.id]!.packetDelivery.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Mean Latency</div>
                  <div className="font-mono text-lg font-bold text-foreground mt-0.5">
                    {healthById[selectedStation.id]!.latencyMs} ms
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Sensor Drift</div>
                  <div className="font-mono text-lg font-bold text-foreground mt-0.5">
                    {healthById[selectedStation.id]!.drift}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
