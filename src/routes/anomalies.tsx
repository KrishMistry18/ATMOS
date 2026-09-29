import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { EmptyState, Panel, StatusTag, severityColor } from "@/components/atmos/primitives";
import { AnomalyDrawer } from "@/components/atmos/AnomalyDrawer";
import { SimulationControls } from "@/components/atmos/SimulationControls";
import type { AnomalyRecord } from "@/lib/atmos/types";
import { formatSimTime, useSimulation } from "@/services/simulationStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/anomalies")({
  head: () => ({
    meta: [
      { title: "Anomalies — A.T.M.O.S Incident Management" },
      {
        name: "description",
        content:
          "Detection log of sensor faults, communication problems and regional weather events with evidence and recommended actions.",
      },
      { property: "og:title", content: "Anomalies — A.T.M.O.S Incident Management" },
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
      {/* Incident Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase">Open</div>
          <div className="mt-1 text-2xl font-bold font-mono text-critical">
            {openList.length}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Active incidents</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase">Critical</div>
          <div className="mt-1 text-2xl font-bold font-mono text-critical">
            {criticalList.length}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Severity score &gt; 80%</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase">Resolved / Healed</div>
          <div className="mt-1 text-2xl font-bold font-mono text-ok">
            {resolvedList.length}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Within adaptive baseline</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase">QC Reconstruction</div>
          <div className="mt-1 text-2xl font-bold font-mono text-primary">
            93%
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Mean spatial confidence</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 xl:col-span-9">
          <Panel
            title="Incident Management Log"
            meta={`${openList.length} open • ${anomalies.length} total logged incidents`}
            action={
              <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "rounded-md px-3 py-1 text-[11px] font-semibold transition-colors",
                      filter === f
                        ? "bg-card text-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            }
          >
            {rows.length === 0 ? (
              <EmptyState message="No incidents match the selected filter." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-border/80 text-[11px] font-semibold text-muted-foreground uppercase">
                      <th className="py-2.5 px-3">Event</th>
                      <th className="py-2.5 px-3">Station</th>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Parameter</th>
                      <th className="py-2.5 px-3">Observed</th>
                      <th className="py-2.5 px-3">Expected</th>
                      <th className="py-2.5 px-3">Severity</th>
                      <th className="py-2.5 px-3">Confidence</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {rows.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => setSelected(a)}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                          {a.id}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-foreground font-semibold">
                          {a.stationId}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                          {formatSimTime(a.detectedAt)} UTC
                        </td>
                        <td className="py-2.5 px-3 text-foreground font-medium">
                          {a.type}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-critical">
                          {a.observed.toFixed(1)}°C
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                          {a.expectedTemperature.toFixed(1)}°C
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={cn("font-semibold font-mono", severityColor[a.severity])}>
                            {a.severityScore}% ({a.severity})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-primary">
                          {a.confidence}%
                        </td>
                        <td className="py-2.5 px-3">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <div className="col-span-12 xl:col-span-3 space-y-5">
          <SimulationControls />
        </div>
      </div>

      <AnomalyDrawer anomaly={live} onClose={() => setSelected(null)} />
    </>
  );
}
