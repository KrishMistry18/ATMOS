import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Compass,
  MapPin,
  Mountain,
  Navigation,
  Radio,
  Wifi,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Panel, StatusTag, stateColor } from "@/components/atmos/primitives";
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
  const { latest, healthById, assess, expectedFor } = useSimulation();
  const [selected, setSelected] = useState("AWS-003");

  const station = STATION_MAP.get(selected)!;
  const obs = latest[selected]!;
  const health = healthById[selected]!;
  const assessment = assess(selected);
  const expected = expectedFor(selected);
  const neighbors = neighborsOf(selected, 3);

  const getMarkerColor = (id: string) => {
    const isAnomalous = assess(id).anomalous;
    if (isAnomalous) return "#DC2626"; // Critical Red
    const h = healthById[id];
    if (h?.state === "WATCH" || h?.state === "DEGRADED") return "#D97706"; // Amber
    return "#16A34A"; // Green Healthy
  };

  return (
    <div className="grid grid-cols-12 gap-5">
      {/* Schematic Geographic Map Canvas */}
      <Panel
        className="col-span-12 xl:col-span-8"
        title="Automatic Weather Station Network Topology"
        meta="Regional Sensor Distribution • Goa & Western Ghats Foothills (15.2°N–15.6°N / 73.8°E–74.2°E)"
        action={
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
            <Compass className="size-3.5 text-primary" />
            <span>Map Projection: UTM WGS84</span>
          </div>
        }
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-muted/30 to-card p-4 shadow-inner">
          {/* Professional map-style background grid lines */}
          <div
            className="absolute inset-0 opacity-[0.06] dark:opacity-[0.1]"
            style={{
              backgroundImage:
                "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Regional terrain backdrop hint */}
          <div className="absolute top-3 left-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Arabian Sea Coast (West) ◄ ────────────────────────── ► Western Ghats Ridge (East)
          </div>

          <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Draw inter-station topological mesh links */}
            {STATIONS.flatMap((s) =>
              neighborsOf(s.id, 2).map((nid) => {
                const n = STATION_MAP.get(nid)!;
                const isSelectedLink = s.id === selected || nid === selected;
                const hasAnomaly = assess(s.id).anomalous || assess(nid).anomalous;
                return (
                  <line
                    key={`${s.id}-${nid}`}
                    x1={s.x}
                    y1={s.y}
                    x2={n.x}
                    y2={n.y}
                    stroke={
                      hasAnomaly && isSelectedLink
                        ? "#DC2626"
                        : isSelectedLink
                          ? "#2563EB"
                          : "var(--line)"
                    }
                    strokeWidth={isSelectedLink ? 0.7 : 0.35}
                    strokeDasharray={hasAnomaly ? "1.5 1.5" : undefined}
                    opacity={isSelectedLink ? 0.8 : 0.4}
                  />
                );
              }),
            )}

            {/* Station markers */}
            {STATIONS.map((s) => {
              const isSelected = s.id === selected;
              const a = assess(s.id);
              const color = getMarkerColor(s.id);

              return (
                <g
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className="cursor-pointer transition-all"
                >
                  {/* Selection pulse halo */}
                  {isSelected && (
                    <circle
                      cx={s.x}
                      cy={s.y}
                      r={3.8}
                      fill={color}
                      opacity={0.2}
                      className="animate-pulse"
                    />
                  )}

                  {/* Marker outer circle */}
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={isSelected ? 2.2 : 1.6}
                    fill={color}
                    stroke="#FFFFFF"
                    strokeWidth={0.5}
                  />

                  {/* Inner dot */}
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={0.6}
                    fill="#FFFFFF"
                  />

                  {/* Station text label */}
                  <text
                    x={s.x + 2.5}
                    y={s.y + 1}
                    fontSize="2.4"
                    fontWeight={isSelected ? "bold" : "600"}
                    fill={isSelected ? "var(--color-primary)" : "var(--foreground)"}
                    fontFamily="var(--font-mono)"
                  >
                    {s.id}
                  </text>
                  <text
                    x={s.x + 2.5}
                    y={s.y + 3.4}
                    fontSize="1.8"
                    fill="var(--dim)"
                    fontFamily="var(--font-sans)"
                  >
                    {s.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Map Legend */}
          <div className="absolute bottom-3 left-4 flex items-center gap-3 rounded-lg border border-border bg-card/90 px-3 py-1.5 text-[11px] backdrop-blur shadow-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="size-2 rounded-full bg-ok" /> Normal
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="size-2 rounded-full bg-watch" /> Warning
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="size-2 rounded-full bg-critical" /> Critical
            </span>
          </div>
        </div>

        {/* Stations Quick Selector Bar */}
        <div className="mt-4 flex flex-wrap gap-2">
          {STATIONS.map((s) => {
            const isSelected = s.id === selected;
            const a = assess(s.id);
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all shadow-xs",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: getMarkerColor(s.id) }}
                />
                <span className="font-mono">{s.id}</span>
                <span className="text-[10px] text-muted-foreground">{s.name}</span>
              </button>
            );
          })}
        </div>
      </Panel>

      {/* Selected Station Detailed Diagnostics Panel */}
      <div className="col-span-12 xl:col-span-4 space-y-5">
        <Panel
          title={`Node Detail: ${selected}`}
          meta={`${station.name} • ${station.district}`}
          action={
            <StatusTag
              label={assessment.anomalous ? "ANOMALOUS" : health.state}
              tone={assessment.anomalous ? "critical" : health.state === "HEALTHY" ? "ok" : "watch"}
            />
          }
        >
          <div className="space-y-4 text-[12px]">
            {/* Top Telemetry for Selected Station */}
            <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-border bg-muted/20 p-3.5">
              <div>
                <span className="text-muted-foreground text-[11px]">Current Observation</span>
                <div className={cn("font-mono text-xl font-bold mt-0.5", assessment.anomalous ? "text-critical" : "text-foreground")}>
                  {obs?.received ? `${obs.temperature.toFixed(1)}°C` : "MISSING"}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px]">Adaptive Baseline</span>
                <div className="font-mono text-xl font-bold text-foreground mt-0.5">
                  {expected.temperature.toFixed(1)}°C
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px]">Barometric Pressure</span>
                <div className="font-mono text-[13px] font-semibold text-foreground mt-0.5">
                  {obs?.received ? `${obs.pressure.toFixed(1)} hPa` : "—"}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px]">Relative Humidity</span>
                <div className="font-mono text-[13px] font-semibold text-foreground mt-0.5">
                  {obs?.received ? `${obs.humidity.toFixed(0)}%` : "—"}
                </div>
              </div>
            </div>

            {/* Geographical details */}
            <div className="space-y-2 border-t border-border/70 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Elevation</span>
                <span className="font-medium text-foreground">{station.elevation} m MSL</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Geographic Coordinates</span>
                <span className="font-mono text-foreground">{station.lat.toFixed(3)}°N, {station.lon.toFixed(3)}°E</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Health Score</span>
                <span className={cn("font-mono font-bold", stateColor[health.state])}>{health.score} / 100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Packet Delivery</span>
                <span className="font-mono text-ok font-semibold">{health.packetDelivery.toFixed(1)}%</span>
              </div>
            </div>

            {/* Nearest Neighbors */}
            <div className="border-t border-border/70 pt-3">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase mb-2">
                Topological Neighbors
              </div>
              <div className="space-y-1.5">
                {neighbors.map((nid) => {
                  const n = STATION_MAP.get(nid)!;
                  const nobs = latest[nid];
                  return (
                    <div
                      key={nid}
                      onClick={() => setSelected(nid)}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card p-2.5 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">{nid}</span>
                        <span className="text-[11px] text-muted-foreground">{n.name}</span>
                      </div>
                      <span className="font-mono text-foreground font-semibold">
                        {nobs?.received ? `${nobs.temperature.toFixed(1)}°C` : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
