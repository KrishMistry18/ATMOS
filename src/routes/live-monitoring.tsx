import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Panel, StatusTag, stateColor } from "@/components/atmos/primitives";
import { TelemetryChart } from "@/components/atmos/TelemetryChart";
import { SimulationControls } from "@/components/atmos/SimulationControls";
import { STATIONS } from "@/data/stations";
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
  const { latest, healthById, assess, simTime, history } = useSimulation();
  const [stationId, setStationId] = useState("AWS-003");

  const stream = STATIONS.map((s) => ({ station: s, obs: latest[s.id]! }))
    .filter((r) => r.obs)
    .sort((a, b) => a.station.id.localeCompare(b.station.id));

  const missing = Object.values(history)
    .flat()
    .slice(-160)
    .filter((o) => !o.received).length;

  return (
    <>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 space-y-4 xl:col-span-8">
          <Panel
            title="Station Telemetry"
            meta={`${stationId} · SIM TIME ${formatSimTime(simTime)}`}
            action={
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="rounded-md border border-line/70 bg-panel2/60 px-2 py-1 font-mono text-[11px] text-foreground"
              >
                {STATIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.name}
                  </option>
                ))}
              </select>
            }
          >
            <TelemetryChart stationId={stationId} height={300} />
          </Panel>

          <Panel title="Incoming Observation Stream" meta="LATEST PACKET PER STATION">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="label-mono border-b border-line/70">
                    <th className="py-2 font-normal">Station</th>
                    <th className="py-2 font-normal">Temp</th>
                    <th className="py-2 font-normal">Pressure</th>
                    <th className="py-2 font-normal">Humidity</th>
                    <th className="py-2 font-normal">Latency</th>
                    <th className="py-2 font-normal">Timestamp</th>
                    <th className="py-2 font-normal">State</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[11px]">
                  {stream.map(({ station, obs }) => {
                    const health = healthById[station.id]!;
                    const anomalous = assess(station.id).anomalous;
                    return (
                      <tr
                        key={station.id}
                        onClick={() => setStationId(station.id)}
                        className={cn(
                          "cursor-pointer border-b border-line/40 transition-colors hover:bg-foreground/5",
                          station.id === stationId && "bg-primary/5",
                        )}
                      >
                        <td className="py-2 text-foreground">{station.id}</td>
                        <td className={cn("py-2", anomalous ? "text-critical" : "text-muted-foreground")}>
                          {obs.received ? `${obs.temperature.toFixed(1)}°C` : "—"}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {obs.received ? `${obs.pressure.toFixed(1)}` : "—"}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {obs.received ? `${obs.humidity.toFixed(1)}%` : "—"}
                        </td>
                        <td className={cn("py-2", obs.delayed ? "text-degraded" : "text-muted-foreground")}>
                          {obs.latencyMs} ms
                        </td>
                        <td className="py-2 text-dim">{formatSimTime(obs.time)}</td>
                        <td className={cn("py-2", stateColor[health.state])}>{health.state}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="col-span-12 space-y-4 xl:col-span-4">
          <Panel title="Communication Health" meta="LAST 20 CYCLES">
            <dl className="space-y-2.5 font-mono text-[11px]">
              <Row label="Packet delivery" value={`${(100 - missing * 0.6).toFixed(1)}%`} />
              <Row
                label="Average latency"
                value={`${Math.round(
                  stream.reduce((a, r) => a + r.obs.latencyMs, 0) / Math.max(stream.length, 1),
                )} ms`}
              />
              <Row label="Missing packets" value={`${missing}`} />
              <Row
                label="Delayed packets"
                value={`${stream.filter((r) => r.obs.delayed).length}`}
              />
              <Row label="Last packet" value={`${formatSimTime(simTime)}`} />
            </dl>
            <div className="mt-4 flex gap-1">
              {Object.values(history)
                .flat()
                .slice(-48)
                .map((o, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-6 flex-1 rounded-[2px]",
                      !o.received ? "bg-critical/70" : o.delayed ? "bg-degraded/70" : "bg-ok/40",
                    )}
                  />
                ))}
            </div>
            <div className="label-mono mt-2">PACKET TIMELINE · GREEN OK / AMBER DELAY / RED LOSS</div>
          </Panel>

          <SimulationControls />
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line/40 pb-2">
      <dt className="text-dim">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
