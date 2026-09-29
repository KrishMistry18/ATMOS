import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Panel, StatusTag, stateColor, stateDot } from "@/components/atmos/primitives";
import { STATIONS, STATION_MAP, neighborsOf } from "@/data/stations";
import { useSimulation } from "@/services/simulationStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/network-map")({
  head: () => ({
    meta: [
      { title: "Network Map — A.T.M.O.S" },
      {
        name: "description",
        content:
          "Schematic geographic layout of the Automatic Weather Station network with live status markers.",
      },
      { property: "og:title", content: "Network Map — A.T.M.O.S" },
      { property: "og:description", content: "Schematic map of the AWS network with live status." },
    ],
  }),
  component: NetworkMap,
});

function NetworkMap() {
  const { latest, healthById, assess, scenario } = useSimulation();
  const [selected, setSelected] = useState("AWS-003");
  const station = STATION_MAP.get(selected)!;
  const obs = latest[selected]!;
  const health = healthById[selected]!;
  const assessment = assess(selected);
  const neighbors = neighborsOf(selected);

  return (
    <div className="grid grid-cols-12 gap-4">
      <Panel
        className="col-span-12 xl:col-span-8"
        title="Station Network"
        meta="SCHEMATIC PROJECTION · CLICK A NODE"
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-line/60 bg-background/70">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(var(--primary) 1px,transparent 1px),linear-gradient(90deg,var(--primary) 1px,transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {STATIONS.flatMap((s) =>
              neighborsOf(s.id, 2).map((nid) => {
                const n = STATION_MAP.get(nid)!;
                return (
                  <line
                    key={`${s.id}-${nid}`}
                    x1={s.x}
                    y1={s.y}
                    x2={n.x}
                    y2={n.y}
                    stroke="var(--line)"
                    strokeWidth={0.2}
                  />
                );
              }),
            )}
          </svg>

          {STATIONS.map((s) => {
            const h = healthById[s.id]!;
            const isEvent = scenario === "regional_event";
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                style={{ left: `${s.x}%`, top: `${s.y}%` }}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 rounded-md border px-2 py-1 transition-all",
                  selected === s.id
                    ? "border-primary/60 bg-primary/15"
                    : "border-line/60 bg-panel/80 hover:border-primary/30",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "size-2 rounded-full pulse-dot",
                      isEvent ? "bg-event" : stateDot[h.state],
                    )}
                  />
                  <span className="font-mono text-[10px] text-foreground">{s.id}</span>
                </span>
                <span className="block font-mono text-[9px] text-dim">
                  {latest[s.id]?.received ? `${latest[s.id]!.temperature.toFixed(1)}°C` : "NO DATA"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] text-dim">
          <Legend tone="bg-ok" label="HEALTHY" />
          <Legend tone="bg-watch" label="WATCH" />
          <Legend tone="bg-degraded" label="DEGRADED" />
          <Legend tone="bg-critical" label="CRITICAL" />
          <Legend tone="bg-event" label="ACTIVE EVENT" />
        </div>
      </Panel>

      <Panel className="col-span-12 xl:col-span-4" title={station.id} meta={station.name.toUpperCase()}>
        <dl className="space-y-2 font-mono text-[11px]">
          <Row label="LOCATION" value={`${station.lat.toFixed(3)}, ${station.lon.toFixed(3)}`} />
          <Row label="DISTRICT" value={station.district} />
          <Row label="ELEVATION" value={`${station.elevation} m`} />
          <Row
            label="TEMPERATURE"
            value={obs.received ? `${obs.temperature.toFixed(1)}°C` : "NO PACKET"}
            tone={assessment.anomalous ? "text-critical" : "text-primary"}
          />
          <Row label="PRESSURE" value={obs.received ? `${obs.pressure.toFixed(1)} hPa` : "—"} />
          <Row label="HUMIDITY" value={obs.received ? `${obs.humidity.toFixed(1)}%` : "—"} />
          <Row label="HEALTH" value={`${health.score} · ${health.state}`} tone={stateColor[health.state]} />
        </dl>

        <div className="mt-4 rounded-md border border-line/60 bg-panel2/40 p-3">
          <div className="label-mono mb-2">Current anomaly</div>
          {assessment.anomalous ? (
            <>
              <StatusTag label={assessment.type} tone="critical" />
              <p className="mt-2 text-[12px] text-muted-foreground">{assessment.reason}</p>
            </>
          ) : (
            <StatusTag label="NONE" tone="ok" />
          )}
        </div>

        <div className="mt-4">
          <div className="label-mono mb-2">Nearest neighbours</div>
          <div className="space-y-1.5">
            {neighbors.map((id) => (
              <button
                key={id}
                onClick={() => setSelected(id)}
                className="flex w-full items-center justify-between rounded-md border border-line/60 bg-panel2/40 px-3 py-1.5 font-mono text-[11px] hover:border-primary/30"
              >
                <span className="text-muted-foreground">{id}</span>
                <span className="text-foreground">{latest[id]?.temperature.toFixed(1)}°C</span>
              </button>
            ))}
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
