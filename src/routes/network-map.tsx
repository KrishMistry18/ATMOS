import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Compass,
  MapPin,
  Mountain,
  Navigation,
  Radio,
  Wifi,
  Zap,
} from "lucide-react";
import { Panel, StatusTag, stateColor, stateDot } from "@/components/atmos/primitives";
import { STATIONS, STATION_MAP, neighborsOf } from "@/data/stations";
import { useSimulation } from "@/services/simulationStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/network-map")({
  head: () => ({
    meta: [
      { title: "Network Map — A.T.M.O.S Geographic Grid" },
      {
        name: "description",
        content:
          "Schematic geographic layout of the Automatic Weather Station network with live status markers and spatial topology.",
      },
      { property: "og:title", content: "Network Map — A.T.M.O.S Geographic Grid" },
      {
        property: "og:description",
        content: "Interactive schematic map of the Automatic Weather Station network.",
      },
    ],
  }),
  component: NetworkMap,
});

function NetworkMap() {
  const { latest, healthById, assess, scenario, expectedFor } = useSimulation();
  const [selected, setSelected] = useState("AWS-003");

  const station = STATION_MAP.get(selected)!;
  const obs = latest[selected]!;
  const health = healthById[selected]!;
  const assessment = assess(selected);
  const expected = expectedFor(selected);
  const neighbors = neighborsOf(selected, 3);

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Schematic Geographic Map Canvas */}
      <Panel
        className="col-span-12 xl:col-span-8"
        title="Automatic Weather Station Network Topology"
        meta="SCHEMATIC GEOGRAPHIC PROJECTION · REGION WEST (GOA / WESTERN GHATS)"
        action={
          <div className="flex items-center gap-2 font-mono text-[10px] text-dim">
            <Compass className="size-3 text-primary" />
            <span>GRID: 15.2°N–15.6°N / 73.8°E–74.2°E</span>
          </div>
        }
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-line/70 bg-gradient-to-b from-background/90 via-panel2/40 to-background/90 p-4">
          {/* Subtle radar / grid texture */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          {/* Regional terrain backdrop hint */}
          <div className="absolute top-3 left-4 font-mono text-[9px] text-dim uppercase tracking-wider">
            ARABIAN SEA COAST (WEST) ◄ ────────────────────────── ► WESTERN GHATS RIDGE (EAST)
          </div>

          <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Draw inter-station topological mesh links */}
            {STATIONS.flatMap((s) =>
              neighborsOf(s.id, 2).map((nid) => {
                const n = STATION_MAP.get(nid)!;
                const isSelectedLink = s.id === selected || nid === selected;
                const hasAnomaly =
                  assess(s.id).anomalous || assess(nid).anomalous;
                return (
                  <line
                    key={`${s.id}-${nid}`}
                    x1={s.x}
                    y1={s.y}
                    x2={n.x}
                    y2={n.y}
                    stroke={
                      hasAnomaly && isSelectedLink
                        ? "var(--critical)"
                        : isSelectedLink
                          ? "var(--primary)"
                          : "var(--line)"
                    }
                    strokeWidth={isSelectedLink ? (hasAnomaly ? 0.6 : 0.5) : 0.25}
                    strokeDasharray={hasAnomaly ? "1.5 1.5" : undefined}
                    opacity={isSelectedLink ? 0.85 : 0.35}
                  />
                );
              }),
            )}
          </svg>

          {/* Station Markers */}
          {STATIONS.map((s) => {
            const h = healthById[s.id]!;
            const a = assess(s.id);
            const isTarget = s.id === selected;
            const isEvent = scenario === "regional_event";
            const stationObs = latest[s.id];

            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                style={{ left: `${s.x}%`, top: `${s.y}%` }}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border px-2.5 py-1.5 transition-all text-left group",
                  isTarget
                    ? "border-primary/80 bg-panel shadow-lg shadow-primary/15 ring-2 ring-primary/40 z-20 scale-105"
                    : a.anomalous
                      ? "border-critical/60 bg-critical/15 z-10 animate-pulse"
                      : "border-line/70 bg-panel/85 hover:border-primary/40 hover:bg-panel2 z-10",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      isEvent
                        ? "bg-event"
                        : a.anomalous
                          ? "bg-critical animate-ping"
                          : stateDot[h.state],
                    )}
                  />
                  <span className="font-mono text-[11px] font-bold text-foreground">
                    {s.id}
                  </span>
                </div>
                <div className="font-mono text-[9px] text-dim truncate max-w-[80px]">
                  {s.name}
                </div>
                <div
                  className={cn(
                    "mt-0.5 font-mono text-[10px] font-semibold",
                    a.anomalous ? "text-critical" : "text-primary",
                  )}
                >
                  {stationObs?.received ? `${stationObs.temperature.toFixed(1)}°C` : "MISSING"}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3.5 flex flex-wrap items-center gap-4 font-mono text-[10px] text-dim px-1">
          <Legend tone="bg-ok" label="HEALTHY" />
          <Legend tone="bg-watch" label="WATCH" />
          <Legend tone="bg-degraded" label="DEGRADED" />
          <Legend tone="bg-critical" label="CRITICAL / ANOMALY" />
          <Legend tone="bg-event" label="REGIONAL EVENT" />
          <span className="ml-auto text-[9px] text-dim hidden md:inline">
            CLICK ANY NODE TO INSPECT TELEMETRY
          </span>
        </div>
      </Panel>

      {/* Selected Station Inspection Sidebar */}
      <Panel
        className="col-span-12 xl:col-span-4"
        title={`Node Inspection: ${station.id}`}
        meta={`${station.name.toUpperCase()} · ${station.district.toUpperCase()}`}
      >
        <dl className="space-y-2 font-mono text-[11px]">
          <Row label="STATION ID" value={station.id} tone="text-primary font-bold" />
          <Row label="DISTRICT" value={station.district} />
          <Row label="COORDINATES" value={`${station.lat.toFixed(3)}°N, ${station.lon.toFixed(3)}°E`} />
          <Row label="ELEVATION" value={`${station.elevation} m MSL`} />
          <Row
            label="MEASURED TEMP"
            value={obs?.received ? `${obs.temperature.toFixed(1)}°C` : "PACKET TIMEOUT"}
            tone={assessment.anomalous ? "text-critical font-bold text-[13px]" : "text-primary font-bold"}
          />
          <Row
            label="ADAPTIVE BASELINE"
            value={`${expected.temperature.toFixed(1)}°C`}
          />
          <Row
            label="DEVIATION"
            value={`${assessment.difference > 0 ? "+" : ""}${assessment.difference.toFixed(1)}°C`}
            tone={assessment.anomalous ? "text-watch font-bold" : "text-dim"}
          />
          <Row label="PRESSURE" value={obs?.received ? `${obs.pressure.toFixed(1)} hPa` : "—"} />
          <Row label="HUMIDITY" value={obs?.received ? `${obs.humidity.toFixed(0)}%` : "—"} />
          <Row
            label="HEALTH SCORE"
            value={`${health.score} / 100 (${health.state})`}
            tone={stateColor[health.state]}
          />
        </dl>

        {/* Current Anomaly Callout */}
        <div
          className={cn(
            "mt-4 rounded-lg border p-3 font-mono",
            assessment.anomalous
              ? "border-critical/40 bg-critical/10"
              : "border-line/60 bg-panel2/40",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="label-mono text-[9px]">Anomaly Evaluation</span>
            <StatusTag
              label={assessment.anomalous ? assessment.type : "NONE"}
              tone={assessment.anomalous ? "critical" : "ok"}
            />
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground font-sans">
            {assessment.reason}
          </p>
          {assessment.anomalous && (
            <div className="mt-2 text-[10px] text-primary">
              Reconstructed estimate: {assessment.recovery.estimated.toFixed(1)}°C (
              {assessment.recovery.confidence}% confidence)
            </div>
          )}
        </div>

        {/* Nearest Cluster Nodes */}
        <div className="mt-4">
          <div className="label-mono mb-2 text-[9px] text-dim">Nearest Topology Neighbors:</div>
          <div className="space-y-1.5">
            {neighbors.map((id) => {
              const nStation = STATION_MAP.get(id);
              const nObs = latest[id];
              return (
                <button
                  key={id}
                  onClick={() => setSelected(id)}
                  className="flex w-full items-center justify-between rounded-md border border-line/60 bg-panel2/40 px-3 py-1.5 font-mono text-[11px] transition-colors hover:border-primary/40 hover:bg-panel2/80"
                >
                  <span className="text-foreground font-semibold">{id}</span>
                  <span className="text-dim text-[10px]">{nStation?.name}</span>
                  <span className="text-primary font-bold">
                    {nObs?.received ? `${nObs.temperature.toFixed(1)}°C` : "—"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", tone)} />
      {label}
    </span>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line/40 pb-1.5">
      <dt className="text-dim">{label}</dt>
      <dd className={cn("text-muted-foreground", tone)}>{value}</dd>
    </div>
  );
}
