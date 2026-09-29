import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { KpiCard, Panel, StatusTag, severityColor } from "@/components/atmos/primitives";
import { TelemetryChart } from "@/components/atmos/TelemetryChart";
import { ConsensusPanel } from "@/components/atmos/ConsensusPanel";
import { SimulationControls } from "@/components/atmos/SimulationControls";
import { AnomalyDrawer } from "@/components/atmos/AnomalyDrawer";
import { PRIMARY_STATION, STATIONS } from "@/data/stations";
import { formatSimTime, useSimulation } from "@/services/simulationStore";
import type { AnomalyRecord } from "@/lib/atmos/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — A.T.M.O.S AWS Monitoring" },
      {
        name: "description",
        content:
          "Network-wide state of the Automatic Weather Station grid: station health, live telemetry, active anomalies and spatial consensus.",
      },
      { property: "og:title", content: "Overview — A.T.M.O.S AWS Monitoring" },
      {
        property: "og:description",
        content: "Network-wide state of the Automatic Weather Station grid.",
      },
    ],
  }),
  component: Overview,
});

const CAPABILITIES = [
  { title: "Adaptive Sensor Intelligence", link: "/system-intelligence", note: "Station-specific baselines" },
  { title: "Physics-Aware Multivariate Fusion", link: "/system-intelligence", note: "Temp · pressure · humidity" },
  { title: "Spatio-Temporal Consensus", link: "/network-map", note: "Neighbour agreement" },
  { title: "Fault & Comm Fingerprinting", link: "/anomalies", note: "Pattern classification" },
  { title: "Predictive Sensor Health", link: "/sensor-health", note: "Degradation tracking" },
  { title: "Explainable Self-Healing QC", link: "/anomalies", note: "Estimates, never overwrites" },
] as const;

function Overview() {
  const { health, anomalies, latest, tick } = useSimulation();
  const [selected, setSelected] = useState<AnomalyRecord | null>(null);

  const counts = {
    healthy: health.filter((h) => h.state === "HEALTHY").length,
    watch: health.filter((h) => h.state === "WATCH").length,
    degraded: health.filter((h) => h.state === "DEGRADED").length,
    critical: health.filter((h) => h.state === "CRITICAL").length,
  };
  const open = anomalies.filter((a) => a.status !== "RESOLVED");
  const focusStation = open[0]?.stationId ?? PRIMARY_STATION;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Active Stations" value={STATIONS.length} note={`CYCLE #${tick}`} />
        <KpiCard label="Healthy" value={counts.healthy} note="WITHIN BASELINE" tone="ok" />
        <KpiCard label="Watch" value={counts.watch} note="ELEVATED VARIANCE" tone="watch" />
        <KpiCard label="Degraded" value={counts.degraded} note="SERVICE ADVISED" tone="degraded" />
        <KpiCard label="Critical" value={counts.critical} note="IMMEDIATE ACTION" tone="critical" />
        <KpiCard
          label="Active Anomalies"
          value={open.length}
          note={`${anomalies.length} TOTAL LOGGED`}
          tone={open.length ? "critical" : "ok"}
        />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 space-y-4 xl:col-span-8">
          <Panel
            title="Live Network Telemetry"
            meta={`${focusStation} · ${latest[focusStation]?.received ? "PACKET OK" : "PACKET MISSING"}`}
          >
            <TelemetryChart stationId={focusStation} />
          </Panel>
          <ConsensusPanel stationId={focusStation} />
        </div>

        <div className="col-span-12 space-y-4 xl:col-span-4">
          <Panel
            title="Active Anomalies"
            meta={`${open.length} OPEN`}
            action={
              <Link to="/anomalies" className="font-mono text-[10px] uppercase text-primary hover:underline">
                All →
              </Link>
            }
          >
            {open.length === 0 ? (
              <p className="rounded-md border border-dashed border-line/70 bg-panel2/30 px-3 py-6 text-center font-mono text-[11px] uppercase text-dim">
                Network nominal — no open anomalies
              </p>
            ) : (
              <div className="space-y-2">
                {open.slice(0, 4).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className="w-full rounded-lg border border-critical/30 bg-critical/5 p-3 text-left transition-colors hover:border-critical/60"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-critical">{a.id}</span>
                      <StatusTag label={a.severity} tone="critical" />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-foreground">
                        {a.stationId} · {a.type}
                      </span>
                      <span className={cn("font-mono text-[11px]", severityColor[a.severity])}>
                        {a.confidence}%
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-dim">
                      {formatSimTime(a.detectedAt)} · {a.reason.slice(0, 48)}…
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <SimulationControls />
        </div>
      </div>

      <Panel title="Platform Capabilities" meta="EACH LINKS INTO THE LIVE WORKFLOW">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <Link
              key={c.title}
              to={c.link}
              className="rounded-lg border border-line/60 bg-panel2/40 p-3 transition-colors hover:border-primary/30"
            >
              <div className="text-[12px] font-medium text-foreground">{c.title}</div>
              <div className="label-mono mt-1">{c.note}</div>
            </Link>
          ))}
        </div>
      </Panel>

      <AnomalyDrawer anomaly={selected} onClose={() => setSelected(null)} />
    </>
  );
}
