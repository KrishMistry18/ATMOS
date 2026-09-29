import { createFileRoute } from "@tanstack/react-router";
import { Panel, StatusTag, stateColor } from "@/components/atmos/primitives";
import { STATIONS } from "@/data/stations";
import { useSimulation } from "@/services/simulationStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stations")({
  head: () => ({
    meta: [
      { title: "Stations — A.T.M.O.S" },
      {
        name: "description",
        content:
          "Registry of all Automatic Weather Stations with location, elevation, current observation and health state.",
      },
      { property: "og:title", content: "Stations — A.T.M.O.S" },
      { property: "og:description", content: "Registry of all Automatic Weather Stations." },
    ],
  }),
  component: Stations,
});

function Stations() {
  const { latest, healthById, assess } = useSimulation();

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {STATIONS.map((station) => {
        const obs = latest[station.id]!;
        const health = healthById[station.id]!;
        const assessment = assess(station.id);
        return (
          <Panel key={station.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-[13px] text-foreground">{station.id}</div>
                <div className="text-[12px] text-muted-foreground">{station.name}</div>
                <div className="label-mono mt-1">{station.district}</div>
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

            <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[11px]">
              <Metric
                label="TEMP"
                value={obs.received ? `${obs.temperature.toFixed(1)}°` : "—"}
                tone={assessment.anomalous ? "text-critical" : "text-primary"}
              />
              <Metric
                label="PRES"
                value={obs.received ? obs.pressure.toFixed(1) : "—"}
                tone="text-event"
              />
              <Metric
                label="HUM"
                value={obs.received ? `${obs.humidity.toFixed(0)}%` : "—"}
                tone="text-ok"
              />
            </div>

            <dl className="mt-4 space-y-1.5 font-mono text-[10px]">
              <Line label="HEALTH" value={`${health.score}`} tone={stateColor[health.state]} />
              <Line label="LAT/LON" value={`${station.lat.toFixed(3)}, ${station.lon.toFixed(3)}`} />
              <Line label="ELEVATION" value={`${station.elevation} m`} />
              <Line label="COMMS" value={health.communication} />
              <Line
                label="ANOMALY"
                value={assessment.anomalous ? assessment.type : "NONE"}
                tone={assessment.anomalous ? "text-critical" : "text-ok"}
              />
            </dl>
          </Panel>
        );
      })}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-md border border-line/60 bg-panel2/40 p-2 text-center">
      <div className="label-mono">{label}</div>
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
