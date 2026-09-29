import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Meter, Panel, StatusTag, stateColor } from "@/components/atmos/primitives";
import { useSimulation } from "@/services/simulationStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sensor-health")({
  head: () => ({
    meta: [
      { title: "Sensor Health — A.T.M.O.S" },
      {
        name: "description",
        content:
          "Predictive sensor health for every AWS node: health score, drift, noise, fault rate and communication quality.",
      },
      { property: "og:title", content: "Sensor Health — A.T.M.O.S" },
      { property: "og:description", content: "Predictive sensor health across the AWS network." },
    ],
  }),
  component: SensorHealth,
});

function SensorHealth() {
  const { health, tick } = useSimulation();
  const chartData = health.map((h) => ({ station: h.stationId.replace("AWS-", ""), score: h.score }));

  return (
    <>
      <div className="grid grid-cols-12 gap-4">
        <Panel
          className="col-span-12 xl:col-span-8"
          title="Health Score Distribution"
          meta={`CYCLE #${tick} · 0–100 SCALE`}
        >
          <div className="h-[240px] rounded-lg border border-line/60 bg-background/70 p-2">
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
                <Bar dataKey="score" fill="var(--chart-1)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="col-span-12 xl:col-span-4" title="Network Communication" meta="AGGREGATED">
          <dl className="space-y-2.5 font-mono text-[11px]">
            <Row
              label="Packet delivery"
              value={`${(health.reduce((a, h) => a + h.packetDelivery, 0) / health.length).toFixed(1)}%`}
            />
            <Row
              label="Average latency"
              value={`${Math.round(health.reduce((a, h) => a + h.latencyMs, 0) / health.length)} ms`}
            />
            <Row label="Missing packets" value={`${health.reduce((a, h) => a + h.missingPackets, 0)}`} />
            <Row label="Delayed packets" value={`${health.reduce((a, h) => a + h.delayedPackets, 0)}`} />
          </dl>
          <div className="mt-4 space-y-2">
            {health.map((h) => (
              <div key={h.stationId} className="flex items-center gap-2">
                <span className="w-[62px] font-mono text-[10px] text-dim">{h.stationId}</span>
                <Meter
                  value={h.packetDelivery}
                  tone={h.packetDelivery > 97 ? "bg-ok" : h.packetDelivery > 90 ? "bg-watch" : "bg-critical"}
                />
                <span className="w-12 text-right font-mono text-[10px] text-muted-foreground">
                  {h.packetDelivery.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Station Health Matrix" meta="PREDICTIVE DEGRADATION INDICATORS">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="label-mono border-b border-line/70">
                <th className="py-2 font-normal">Station</th>
                <th className="py-2 font-normal">Health</th>
                <th className="py-2 font-normal">State</th>
                <th className="py-2 font-normal">Drift</th>
                <th className="py-2 font-normal">Noise</th>
                <th className="py-2 font-normal">Fault rate</th>
                <th className="py-2 font-normal">Communication</th>
                <th className="py-2 font-normal">Last seen</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[11px]">
              {health.map((h) => (
                <tr key={h.stationId} className="border-b border-line/40 hover:bg-foreground/5">
                  <td className="py-2.5 text-foreground">{h.stationId}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-7", stateColor[h.state])}>{h.score}</span>
                      <div className="w-24">
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
                  <td className="py-2.5">
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
                  <td className="py-2.5 text-muted-foreground">{h.drift}</td>
                  <td className="py-2.5 text-muted-foreground">{h.noise}</td>
                  <td className="py-2.5 text-muted-foreground">{h.faultRate.toFixed(1)}%</td>
                  <td className="py-2.5 text-muted-foreground">{h.communication}</td>
                  <td className="py-2.5 text-dim">cycle #{h.lastSeenTick}</td>
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
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
