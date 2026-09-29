import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Flame,
  Radio,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
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
      { title: "Overview — A.T.M.O.S AWS Monitoring Console" },
      {
        name: "description",
        content:
          "Network-wide state of the Automatic Weather Station grid: station health, live telemetry, active anomalies and spatial consensus.",
      },
      { property: "og:title", content: "Overview — A.T.M.O.S AWS Monitoring Console" },
      {
        property: "og:description",
        content: "Network-wide state of the Automatic Weather Station grid.",
      },
    ],
  }),
  component: Overview,
});

const CAPABILITIES = [
  {
    title: "Adaptive Sensor Intelligence",
    link: "/system-intelligence",
    note: "Station-specific baselines vs static thresholds",
    icon: TrendingUp,
  },
  {
    title: "Physics-Aware Multivariate Fusion",
    link: "/system-intelligence",
    note: "Temperature, pressure and humidity coupled validation",
    icon: Sparkles,
  },
  {
    title: "Spatio-Temporal Weather Consensus",
    link: "/network-map",
    note: "Isolated sensor fault vs genuine regional front",
    icon: Radio,
  },
  {
    title: "Intelligent Fault Fingerprinting",
    link: "/anomalies",
    note: "Spike, drift, frozen sensor, packet loss",
    icon: AlertTriangle,
  },
  {
    title: "Predictive Sensor Health",
    link: "/sensor-health",
    note: "Health score, noise, drift & degradation tracking",
    icon: ShieldAlert,
  },
  {
    title: "Explainable Self-Healing QC",
    link: "/anomalies",
    note: "Synthesizes estimates, never overwriting raw data",
    icon: ArrowRight,
  },
] as const;

function Overview() {
  const { health, anomalies, latest, tick, scenario } = useSimulation();
  const [selected, setSelected] = useState<AnomalyRecord | null>(null);

  const counts = {
    healthy: health.filter((h) => h.state === "HEALTHY").length,
    watch: health.filter((h) => h.state === "WATCH").length,
    degraded: health.filter((h) => h.state === "DEGRADED").length,
    critical: health.filter((h) => h.state === "CRITICAL").length,
  };
  const open = anomalies.filter((a) => a.status !== "RESOLVED");
  const focusStation = open[0]?.stationId ?? PRIMARY_STATION;
  const isSpikeScenario = scenario === "temperature_spike";

  return (
    <>
      {/* Primary SIH Demo Scenario Live Banner */}
      {isSpikeScenario && (
        <div className="rounded-xl border border-critical/40 bg-gradient-to-r from-critical/15 via-critical/10 to-panel2/60 p-4 shadow-lg shadow-critical/10 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-critical/20 text-critical border border-critical/30">
                <Flame className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 font-mono text-[13px] font-bold text-foreground">
                  <span className="text-critical uppercase tracking-wider">
                    Primary SIH Scenario Active:
                  </span>
                  <span>AWS-003 Temperature Spike (55.0°C)</span>
                </div>
                <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                  Adaptive baseline expected: ~31.8°C (Deviation: +23.2°C) · Severity: 91% ·
                  Confidence: 96% · Reconstructed Estimate: 31.8°C
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const spikeAnomaly = anomalies.find(
                    (a) => a.stationId === "AWS-003" && a.status !== "RESOLVED",
                  );
                  if (spikeAnomaly) setSelected(spikeAnomaly);
                }}
                className="rounded-md border border-critical/50 bg-critical px-3 py-1.5 font-mono text-[11px] font-bold text-background transition-colors hover:bg-critical/90 shadow-sm"
              >
                Inspect Anomaly Detail & Proof →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Active Stations" value={STATIONS.length} note={`CYCLE #${tick}`} />
        <KpiCard label="Healthy" value={counts.healthy} note="WITHIN BASELINE" tone="ok" />
        <KpiCard label="Watch" value={counts.watch} note="ELEVATED NOISE" tone="watch" />
        <KpiCard label="Degraded" value={counts.degraded} note="SERVICE ADVISED" tone="degraded" />
        <KpiCard label="Critical" value={counts.critical} note="ACTION REQUIRED" tone="critical" />
        <KpiCard
          label="Active Anomalies"
          value={open.length}
          note={`${anomalies.length} TOTAL LOGGED`}
          tone={open.length ? "critical" : "ok"}
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column: Live Telemetry & Consensus */}
        <div className="col-span-12 space-y-4 xl:col-span-8">
          <Panel
            title="Live Station Telemetry"
            meta={`${focusStation} (${STATIONS.find((s) => s.id === focusStation)?.name}) · ${
              latest[focusStation]?.received ? "PACKET RECEIVED" : "PACKET MISSING"
            }`}
          >
            <TelemetryChart stationId={focusStation} />
          </Panel>

          <ConsensusPanel stationId={focusStation} />
        </div>

        {/* Right Column: Active Anomalies & Simulation Controls */}
        <div className="col-span-12 space-y-4 xl:col-span-4">
          <Panel
            title="Active Anomaly Feed"
            meta={`${open.length} OPEN ANOMALIES`}
            action={
              <Link
                to="/anomalies"
                className="font-mono text-[10px] uppercase text-primary hover:underline"
              >
                View Log →
              </Link>
            }
          >
            {open.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line/70 bg-panel2/30 px-3 py-8 text-center font-mono text-[11px] text-dim">
                GRID NOMINAL — ALL STATIONS WITHIN ADAPTIVE BASELINE
              </div>
            ) : (
              <div className="space-y-2">
                {open.slice(0, 4).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className="w-full rounded-lg border border-critical/35 bg-critical/6 p-3 text-left transition-colors hover:border-critical/60 hover:bg-critical/10"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="font-bold text-critical">{a.id}</span>
                      <StatusTag label={a.severity} tone="critical" />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="font-mono text-[12px] font-semibold text-foreground">
                        {a.stationId} · {a.type}
                      </span>
                      <span className={cn("font-mono text-[11px] font-bold", severityColor[a.severity])}>
                        {a.severityScore}%
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-dim flex items-center justify-between">
                      <span>{formatSimTime(a.detectedAt)} UTC</span>
                      <span className="text-primary font-medium">Click to inspect →</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <SimulationControls />
        </div>
      </div>

      {/* Six Core Capabilities */}
      <Panel
        title="Six Core Platform Capabilities"
        meta="SCIENTIFIC MONITORING ARCHITECTURE FOR AUTOMATIC WEATHER STATIONS"
      >
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {CAPABILITIES.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.title}
                to={c.link}
                className="group rounded-lg border border-line/60 bg-panel2/40 p-3.5 transition-all hover:border-primary/40 hover:bg-panel2/70"
              >
                <div className="flex items-center gap-2">
                  <div className="grid size-7 place-items-center rounded bg-primary/10 text-primary group-hover:bg-primary/20">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="text-[12px] font-bold text-foreground group-hover:text-primary transition-colors">
                    {c.title}
                  </div>
                </div>
                <div className="label-mono mt-2 text-[9px] text-dim leading-snug">{c.note}</div>
              </Link>
            );
          })}
        </div>
      </Panel>

      <AnomalyDrawer anomaly={selected} onClose={() => setSelected(null)} />
    </>
  );
}
