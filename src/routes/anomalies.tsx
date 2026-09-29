import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Filter, ShieldCheck, Sparkles } from "lucide-react";
import { EmptyState, Panel, StatusTag, severityColor } from "@/components/atmos/primitives";
import { AnomalyDrawer } from "@/components/atmos/AnomalyDrawer";
import { SimulationControls } from "@/components/atmos/SimulationControls";
import type { AnomalyRecord } from "@/lib/atmos/types";
import { formatSimTime, useSimulation } from "@/services/simulationStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/anomalies")({
  head: () => ({
    meta: [
      { title: "Anomalies — A.T.M.O.S Detection Log" },
      {
        name: "description",
        content:
          "Detection log of sensor faults, communication problems and regional weather events with evidence and recommended actions.",
      },
      { property: "og:title", content: "Anomalies — A.T.M.O.S Detection Log" },
      {
        property: "og:description",
        content: "Detection log with multi-evidence breakdown and self-healing recovery.",
      },
    ],
  }),
  component: Anomalies,
});

const FILTERS = ["ALL", "OPEN", "CRITICAL", "RESOLVED"] as const;

function Anomalies() {
  const { anomalies } = useSimulation();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const [selected, setSelected] = useState<AnomalyRecord | null>(null);

  const openList = anomalies.filter((a) => a.status !== "RESOLVED");
  const criticalList = anomalies.filter((a) => a.severity === "Critical" && a.status !== "RESOLVED");
  const resolvedList = anomalies.filter((a) => a.status === "RESOLVED");

  const rows = anomalies.filter((a) => {
    if (filter === "ALL") return true;
    if (filter === "OPEN") return a.status !== "RESOLVED";
    if (filter === "CRITICAL") return a.severity === "Critical" && a.status !== "RESOLVED";
    if (filter === "RESOLVED") return a.status === "RESOLVED";
    return true;
  });

  const live = selected ? anomalies.find((a) => a.id === selected.id) ?? selected : null;

  return (
    <>
      {/* Top Anomaly Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-line/70 bg-panel/75 p-3.5 backdrop-blur">
          <div className="label-mono text-[9px] text-dim">OPEN ANOMALIES</div>
          <div className="mt-1 font-mono text-2xl font-bold text-critical">{openList.length}</div>
          <div className="mt-1 font-mono text-[10px] text-dim">Active investigation required</div>
        </div>

        <div className="rounded-xl border border-line/70 bg-panel/75 p-3.5 backdrop-blur">
          <div className="label-mono text-[9px] text-dim">CRITICAL SEVERITY</div>
          <div className="mt-1 font-mono text-2xl font-bold text-critical">{criticalList.length}</div>
          <div className="mt-1 font-mono text-[10px] text-dim">Severity score &gt; 80%</div>
        </div>

        <div className="rounded-xl border border-line/70 bg-panel/75 p-3.5 backdrop-blur">
          <div className="label-mono text-[9px] text-dim">RESOLVED / HEALED</div>
          <div className="mt-1 font-mono text-2xl font-bold text-ok">{resolvedList.length}</div>
          <div className="mt-1 font-mono text-[10px] text-dim">Recovered within baseline</div>
        </div>

        <div className="rounded-xl border border-line/70 bg-panel/75 p-3.5 backdrop-blur">
          <div className="label-mono text-[9px] text-dim">QC RECONSTRUCTION</div>
          <div className="mt-1 font-mono text-2xl font-bold text-primary">93%</div>
          <div className="mt-1 font-mono text-[10px] text-dim">Mean spatial confidence</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-9">
          <Panel
            title="Real-Time Anomaly Detection Log"
            meta={`${openList.length} OPEN · ${anomalies.length} TOTAL EVENTS LOGGED`}
            action={
              <div className="flex gap-1 rounded border border-line/70 bg-background/50 p-0.5">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "rounded-sm px-3 py-1 font-mono text-[10px] font-semibold transition-colors",
                      filter === f
                        ? "bg-primary font-bold text-primary-foreground shadow-sm"
                        : "text-dim hover:text-foreground",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            }
          >
            {rows.length === 0 ? (
              <EmptyState message="No anomalies match this filter in the current buffer" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left">
                  <thead>
                    <tr className="label-mono border-b border-line/70 text-[10px]">
                      <th className="py-2.5 font-normal">Event ID</th>
                      <th className="py-2.5 font-normal">Node</th>
                      <th className="py-2.5 font-normal">Timestamp</th>
                      <th className="py-2.5 font-normal">Fault Pattern</th>
                      <th className="py-2.5 font-normal">Observed</th>
                      <th className="py-2.5 font-normal">Expected</th>
                      <th className="py-2.5 font-normal">Severity</th>
                      <th className="py-2.5 font-normal">Confidence</th>
                      <th className="py-2.5 font-normal">Status</th>
                      <th className="py-2.5 font-normal">Root Cause</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[11px]">
                    {rows.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => setSelected(a)}
                        className="cursor-pointer border-b border-line/40 transition-colors hover:bg-foreground/5 hover:border-primary/40"
                      >
                        <td className="py-3 text-primary font-bold">{a.id}</td>
                        <td className="py-3 text-foreground font-semibold">{a.stationId}</td>
                        <td className="py-3 text-dim">{formatSimTime(a.detectedAt)}</td>
                        <td className="py-3 text-foreground">{a.type}</td>
                        <td className="py-3 font-bold text-critical">{a.observed.toFixed(1)}°C</td>
                        <td className="py-3 text-dim">{a.expectedTemperature.toFixed(1)}°C</td>
                        <td className={cn("py-3 font-bold", severityColor[a.severity])}>
                          {a.severity} ({a.severityScore}%)
                        </td>
                        <td className="py-3 text-primary font-medium">{a.confidence}%</td>
                        <td className="py-3">
                          <StatusTag
                            label={a.status}
                            tone={
                              a.status === "RESOLVED"
                                ? "ok"
                                : a.status === "ACKNOWLEDGED"
                                  ? "watch"
                                  : "critical"
                            }
                          />
                        </td>
                        <td className="py-3 text-dim max-w-[180px] truncate">
                          {a.causes[0] ?? "Sensor anomaly"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <div className="col-span-12 xl:col-span-3">
          <SimulationControls />
        </div>
      </div>

      <AnomalyDrawer anomaly={live} onClose={() => setSelected(null)} />
    </>
  );
}
