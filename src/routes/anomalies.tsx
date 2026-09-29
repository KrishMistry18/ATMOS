import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { EmptyState, Panel, StatusTag, severityColor } from "@/components/atmos/primitives";
import { AnomalyDrawer } from "@/components/atmos/AnomalyDrawer";
import { SimulationControls } from "@/components/atmos/SimulationControls";
import type { AnomalyRecord } from "@/lib/atmos/types";
import { formatSimTime, useSimulation } from "@/services/simulationStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/anomalies")({
  head: () => ({
    meta: [
      { title: "Anomalies — A.T.M.O.S" },
      {
        name: "description",
        content:
          "Detection log of sensor faults, communication problems and regional weather events with evidence and recommended actions.",
      },
      { property: "og:title", content: "Anomalies — A.T.M.O.S" },
      { property: "og:description", content: "Detection log with evidence and recommended action." },
    ],
  }),
  component: Anomalies,
});

const FILTERS = ["ALL", "OPEN", "RESOLVED"] as const;

function Anomalies() {
  const { anomalies } = useSimulation();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const [selected, setSelected] = useState<AnomalyRecord | null>(null);

  const rows = anomalies.filter((a) =>
    filter === "ALL" ? true : filter === "OPEN" ? a.status !== "RESOLVED" : a.status === "RESOLVED",
  );
  const live = selected ? (anomalies.find((a) => a.id === selected.id) ?? selected) : null;

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 xl:col-span-9">
        <Panel
          title="Anomaly Log"
          meta={`${anomalies.filter((a) => a.status !== "RESOLVED").length} OPEN · ${anomalies.length} TOTAL`}
          action={
            <div className="flex gap-1 rounded border border-line/70 bg-background/50 p-0.5">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-sm px-3 py-1 font-mono text-[10px]",
                    filter === f
                      ? "bg-primary font-bold text-primary-foreground"
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
            <EmptyState message="No anomalies match this filter" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead>
                  <tr className="label-mono border-b border-line/70">
                    <th className="py-2 font-normal">ID</th>
                    <th className="py-2 font-normal">Station</th>
                    <th className="py-2 font-normal">Detected</th>
                    <th className="py-2 font-normal">Type</th>
                    <th className="py-2 font-normal">Severity</th>
                    <th className="py-2 font-normal">Confidence</th>
                    <th className="py-2 font-normal">Status</th>
                    <th className="py-2 font-normal">Root cause</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[11px]">
                  {rows.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className="cursor-pointer border-b border-line/40 transition-colors hover:bg-foreground/5"
                    >
                      <td className="py-2.5 text-primary">{a.id}</td>
                      <td className="py-2.5 text-foreground">{a.stationId}</td>
                      <td className="py-2.5 text-dim">{formatSimTime(a.detectedAt)}</td>
                      <td className="py-2.5 text-muted-foreground">{a.type}</td>
                      <td className={cn("py-2.5", severityColor[a.severity])}>
                        {a.severity} · {a.severityScore}%
                      </td>
                      <td className="py-2.5 text-muted-foreground">{a.confidence}%</td>
                      <td className="py-2.5">
                        <StatusTag
                          label={a.status}
                          tone={a.status === "RESOLVED" ? "ok" : "critical"}
                        />
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {a.type === "REGIONAL WEATHER EVENT" ? "Regional weather event" : "Sensor anomaly"}
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

      <AnomalyDrawer anomaly={live} onClose={() => setSelected(null)} />
    </div>
  );
}
