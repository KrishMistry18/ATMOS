import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Flame,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { KpiCard, Panel, StatusTag, severityColor, stateColor } from "@/components/atmos/primitives";
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
      { title: "Overview — A.T.M.O.S Weather & Sensor Intelligence" },
      {
        name: "description",
        content:
          "Network-wide state of the Automatic Weather Station grid: station health, live telemetry, active anomalies and spatial consensus.",
      },
      { property: "og:title", content: "Overview — A.T.M.O.S Weather & Sensor Intelligence" },
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
    note: "Station-specific baseline models replace rigid threshold alarms",
    icon: TrendingUp,
  },
  {
    title: "Multivariate Physics Coupling",
    link: "/system-intelligence",
    note: "Thermodynamic validation across temperature, pressure and humidity",
    icon: Sparkles,
  },
  {
    title: "Spatio-Temporal Weather Consensus",
    link: "/network-map",
    note: "Differentiates isolated hardware faults from authentic regional fronts",
    icon: Radio,
  },
  {
    title: "Intelligent Fault Fingerprinting",
    link: "/anomalies",
    note: "Identifies thermal spikes, drift, frozen telemetry and link drops",
    icon: AlertTriangle,
  },
  {
    title: "Predictive Sensor Health Scoring",
    link: "/sensor-health",
    note: "Continuous fleet degradation and noise variance index",
    icon: ShieldAlert,
  },
  {
    title: "Explainable Self-Healing QC",
    link: "/anomalies",
    note: "Publishes reconstructed estimates without overwriting raw observations",
    icon: ArrowRight,
  },
] as const;

function Overview() {
  const { health, anomalies, latest, tick, scenario, assess } = useSimulation();
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
      {/* Platform Executive Header */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                A.T.M.O.S
              </h2>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                Meteorological Operations
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground max-w-2xl">
              Adaptive Tracking & Monitoring of Observational Sensors — an enterprise intelligence platform
              providing continuous telemetry validation, spatial cross-verification, and automated quality control
              for Automatic Weather Station networks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-right">
              <div className="text-[11px] text-muted-foreground font-medium">Network Status</div>
              <div className="flex items-center gap-1.5 text-[13px] font-bold text-ok">
                <span className="size-2 rounded-full bg-ok" />
                Operational
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary SIH Demo Scenario Live Banner (When Active) */}
      {isSpikeScenario && (
        <div className="rounded-xl border border-critical/40 bg-gradient-to-r from-critical/10 via-critical/5 to-card p-4 shadow-sm animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-critical/15 text-critical">
                <Flame className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-[13px] font-bold text-foreground">
                  <span className="text-critical uppercase font-semibold">Active Demonstration:</span>
                  <span>AWS-003 Temperature Spike (55.0°C)</span>
                </div>
                <div className="text-[12px] text-muted-foreground mt-0.5">
                  Adaptive baseline: ~31.8°C (Deviation: +23.2°C) • Severity: 91% • Confidence: 96% • Estimated Recovery: 31.8°C
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const spikeAnomaly = anomalies.find(
                  (a) => a.stationId === "AWS-003" && a.status !== "RESOLVED",
                );
                if (spikeAnomaly) setSelected(spikeAnomaly);
              }}
              className="rounded-lg bg-critical px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-critical/90 shadow-xs"
            >
              Inspect Anomaly Evidence →
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Active Stations"
          value={STATIONS.length}
          note="Online telemetric nodes"
          icon={Radio}
          tone="primary"
        />
        <KpiCard
          label="Healthy"
          value={counts.healthy}
          note="Within adaptive baseline"
          icon={ShieldCheck}
          tone="ok"
        />
        <KpiCard
          label="Warnings"
          value={counts.watch + counts.degraded}
          note="Elevated noise / drift"
          icon={AlertTriangle}
          tone={counts.watch + counts.degraded > 0 ? "watch" : "neutral"}
        />
        <KpiCard
          label="Critical"
          value={counts.critical}
          note="Service required"
          icon={AlertCircle}
          tone={counts.critical > 0 ? "critical" : "neutral"}
        />
        <KpiCard
          label="Active Anomalies"
          value={open.length}
          note={`${anomalies.length} total logged`}
          icon={Activity}
          tone={open.length > 0 ? "critical" : "ok"}
        />
      </div>

      {/* LIVE NETWORK STATUS TABLE */}
      <Panel
        title="Live Network Status"
        meta="Real-time multi-parameter observations across all 8 Automatic Weather Stations"
        action={
          <Link
            to="/stations"
            className="text-[12px] font-semibold text-primary hover:underline"
          >
            View All Stations →
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-border/80 text-[11px] font-semibold text-muted-foreground uppercase">
                <th className="py-2.5 px-3">Station</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Temperature</th>
                <th className="py-2.5 px-3">Pressure</th>
                <th className="py-2.5 px-3">Humidity</th>
                <th className="py-2.5 px-3">Health</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {STATIONS.map((station) => {
                const obs = latest[station.id];
                const stationHealth = health.find((h) => h.stationId === station.id);
                const assessment = assess(station.id);
                const isAnomalous = assessment.anomalous;

                return (
                  <tr
                    key={station.id}
                    className={cn(
                      "transition-colors hover:bg-muted/40",
                      isAnomalous && "bg-critical/5 font-medium",
                    )}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                      {station.id}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-foreground">{station.name}</div>
                      <div className="text-[10px] text-muted-foreground">{station.district}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {obs?.received ? (
                        <span className={cn(isAnomalous ? "font-bold text-critical" : "text-foreground")}>
                          {obs.temperature.toFixed(1)}°C
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">
                      {obs?.received ? `${obs.pressure.toFixed(1)} hPa` : "—"}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">
                      {obs?.received ? `${obs.humidity.toFixed(0)}%` : "—"}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-mono font-bold", stateColor[stationHealth?.state ?? "HEALTHY"])}>
                          {stationHealth?.score ?? 100}
                        </span>
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              stationHealth?.state === "HEALTHY"
                                ? "bg-ok"
                                : stationHealth?.state === "WATCH"
                                  ? "bg-watch"
                                  : "bg-critical",
                            )}
                            style={{ width: `${stationHealth?.score ?? 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusTag
                        label={isAnomalous ? "ANOMALOUS" : stationHealth?.state ?? "HEALTHY"}
                        tone={isAnomalous ? "critical" : stationHealth?.state === "HEALTHY" ? "ok" : "watch"}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Main Grid: Telemetry & Active Anomalies / Controls */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left Column: Network Telemetry & Spatial Consensus */}
        <div className="col-span-12 space-y-5 xl:col-span-8">
          <Panel
            title="Network Telemetry"
            meta={`Station ${focusStation} (${STATIONS.find((s) => s.id === focusStation)?.name}) • Live Continuous Stream`}
          >
            <TelemetryChart stationId={focusStation} />
          </Panel>

          <ConsensusPanel stationId={focusStation} />
        </div>

        {/* Right Column: Active Anomalies & Simulation Controls */}
        <div className="col-span-12 space-y-5 xl:col-span-4">
          <Panel
            title="Active Anomalies"
            meta={`${open.length} unresolved incidents`}
            action={
              <Link
                to="/anomalies"
                className="text-[12px] font-semibold text-primary hover:underline"
              >
                View Log →
              </Link>
            }
          >
            {open.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center">
                <CheckCircle2 className="size-8 text-ok mb-2" />
                <div className="text-[13px] font-semibold text-foreground">Network Nominal</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  All station observations match adaptive baseline models.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {open.slice(0, 4).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className="w-full rounded-xl border border-critical/30 bg-critical/5 p-3.5 text-left transition-colors hover:border-critical/60 hover:bg-critical/10 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-mono font-bold text-critical">{a.id}</span>
                      <StatusTag label={a.severity} tone="critical" />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-foreground">
                        {a.stationId} • {a.type}
                      </span>
                      <span className={cn("text-[12px] font-bold font-mono", severityColor[a.severity])}>
                        {a.severityScore}%
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-mono">{formatSimTime(a.detectedAt)} UTC</span>
                      <span className="text-primary font-medium">Inspect details →</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <SimulationControls />
        </div>
      </div>

      {/* SYSTEM INTELLIGENCE SUMMARY */}
      <Panel
        title="System Intelligence Summary"
        meta="Six core methodological pillars of the A.T.M.O.S weather monitoring platform"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {CAPABILITIES.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.title}
                to={c.link}
                className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/30 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="size-4" />
                  </div>
                  <div className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
                    {c.title}
                  </div>
                </div>
                <div className="mt-2 text-[12px] text-muted-foreground leading-relaxed">{c.note}</div>
              </Link>
            );
          })}
        </div>
      </Panel>

      <AnomalyDrawer anomaly={selected} onClose={() => setSelected(null)} />
    </>
  );
}
