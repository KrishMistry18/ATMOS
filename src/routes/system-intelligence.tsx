import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Flame,
  Layers,
  Pause,
  Play,
  Radio,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { Meter, Panel, StatusTag } from "@/components/atmos/primitives";
import { EvidenceBars } from "@/components/atmos/EvidenceBars";
import { STATIONS, STATION_MAP } from "@/data/stations";
import { SCENARIOS } from "@/data/scenarios";
import { useSimulation } from "@/services/simulationStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/system-intelligence")({
  head: () => ({
    meta: [
      { title: "System Intelligence — A.T.M.O.S Scientific Pipeline" },
      {
        name: "description",
        content:
          "How A.T.M.O.S reasons: station-specific adaptive baselines, multivariate fusion, fault fingerprinting and self-healing estimates.",
      },
      {
        property: "og:title",
        content: "System Intelligence — A.T.M.O.S Scientific Pipeline",
      },
      {
        property: "og:description",
        content:
          "Station-specific adaptive baselines, fault fingerprinting and self-healing quality control.",
      },
    ],
  }),
  component: SystemIntelligence,
});

const PIPELINE_STEPS = [
  {
    step: "01",
    title: "Raw Telemetry",
    desc: "Ingestion of temperature, pressure, humidity & frame latency",
  },
  {
    step: "02",
    title: "Adaptive Baseline",
    desc: "Station-specific diurnal model evaluated at current hour",
  },
  {
    step: "03",
    title: "Multivariate Evidence",
    desc: "Rate of change & thermodynamic inter-variable coupling",
  },
  {
    step: "04",
    title: "Spatial Consensus",
    desc: "Cross-referencing 3 nearest nodes to verify regional coherence",
  },
  {
    step: "05",
    title: "Anomaly Classification",
    desc: "Fingerprinting fault signatures vs genuine meteorological events",
  },
  {
    step: "06",
    title: "Sensor Health",
    desc: "Updating predictive degradation score & noise variance",
  },
  {
    step: "07",
    title: "Explainable Action",
    desc: "Synthesizing QC reconstruction without corrupting raw data",
  },
];

function SystemIntelligence() {
  const {
    latest,
    assess,
    expectedFor,
    adaptiveBaselineFor,
    anomalies,
    running,
    scenario,
    setScenario,
    start,
    pause,
    reset,
  } = useSimulation();
  const [stationId, setStationId] = useState("AWS-003");

  const currentStation = STATION_MAP.get(stationId)!;
  const obs = latest[stationId]!;
  const expected = expectedFor(stationId);
  const assessment = assess(stationId);
  const baseline = adaptiveBaselineFor(stationId);

  const activeAnomaly = anomalies.find(
    (a) => a.stationId === stationId && a.status !== "RESOLVED",
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              System Intelligence
            </h2>
            <p className="text-[13px] text-muted-foreground">
              Adaptive Baselines • Multivariate Detection • Spatial Consensus
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-muted-foreground uppercase">
              Target Station:
            </span>
            <select
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-semibold text-foreground shadow-xs focus:ring-1 focus:ring-primary"
            >
              {STATIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CURRENT INTELLIGENCE STATE */}
      <Panel
        title={`Current Intelligence State: ${stationId} — ${currentStation.name}`}
        meta={`Station elevation: ${currentStation.elevation}m MSL • Lat: ${currentStation.lat.toFixed(3)}°N, Lon: ${currentStation.lon.toFixed(3)}°E`}
        action={
          <StatusTag
            label={assessment.anomalous ? "ANOMALOUS" : "NORMAL"}
            tone={assessment.anomalous ? "critical" : "ok"}
          />
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="text-[11px] font-medium text-muted-foreground">Current Observation</div>
            <div className={cn("font-mono text-2xl font-bold mt-1", assessment.anomalous ? "text-critical" : "text-foreground")}>
              {obs?.received ? `${obs.temperature.toFixed(1)}°C` : "MISSING"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Real-time Telemetry</div>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="text-[11px] font-medium text-muted-foreground">Adaptive Baseline</div>
            <div className="font-mono text-2xl font-bold text-foreground mt-1">
              {baseline.historicalMean.toFixed(1)}°C
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Diurnal Expectation</div>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="text-[11px] font-medium text-muted-foreground">Expected Range</div>
            <div className="font-mono text-base font-bold text-foreground mt-2 truncate">
              {baseline.expectedMin.toFixed(1)}°C – {baseline.expectedMax.toFixed(1)}°C
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">3σ Confidence Bounds</div>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="text-[11px] font-medium text-muted-foreground">Baseline Deviation</div>
            <div className={cn("font-mono text-2xl font-bold mt-1", assessment.difference > 5 ? "text-critical" : "text-foreground")}>
              {assessment.difference > 0 ? "+" : ""}{assessment.difference.toFixed(1)}°C
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Delta departure</div>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="text-[11px] font-medium text-muted-foreground">Status</div>
            <div className={cn("text-2xl font-bold mt-1", assessment.anomalous ? "text-critical" : "text-ok")}>
              {assessment.anomalous ? "ANOMALOUS" : "NORMAL"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Consensus Verified</div>
          </div>
        </div>
      </Panel>

      {/* POLISHED VISUAL INTELLIGENCE PIPELINE */}
      <Panel
        title="Automated Intelligence Pipeline"
        meta="Sequential 7-stage analytical flow from raw sensor observation to explainable quality control"
      >
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-7">
          {PIPELINE_STEPS.map((step, idx) => (
            <div
              key={step.step}
              className="relative flex flex-col justify-between rounded-xl border border-border bg-card p-3.5 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 font-mono text-[11px] font-bold text-primary">
                    {step.step}
                  </span>
                  {idx < PIPELINE_STEPS.length - 1 && (
                    <ArrowRight className="hidden lg:block size-3.5 text-muted-foreground/60" />
                  )}
                </div>
                <div className="text-[12px] font-bold text-foreground mt-2">{step.title}</div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{step.desc}</p>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-ok">
                <CheckCircle2 className="size-3" />
                <span>Active</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-12 gap-5">
        {/* MULTIVARIATE EVIDENCE */}
        <div className="col-span-12 lg:col-span-6 space-y-5">
          <Panel
            title="Multivariate Evidence Breakdown"
            meta={`Diagnostic weights for ${stationId} under current conditions`}
          >
            {activeAnomaly ? (
              <div className="space-y-4">
                <EvidenceBars evidence={activeAnomaly.evidence} />

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/70 text-[12px]">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <span className="text-muted-foreground text-[11px]">Baseline Deviation</span>
                    <div className="font-mono text-lg font-bold text-foreground mt-0.5">
                      {activeAnomaly.evidence.baseline}%
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <span className="text-muted-foreground text-[11px]">Spatial Disagreement</span>
                    <div className="font-mono text-lg font-bold text-foreground mt-0.5">
                      {activeAnomaly.evidence.spatial}%
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <span className="text-muted-foreground text-[11px]">Rate of Change</span>
                    <div className="font-mono text-lg font-bold text-foreground mt-0.5">
                      {activeAnomaly.evidence.rate}%
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <span className="text-muted-foreground text-[11px]">Multivariate Consistency</span>
                    <div className="font-mono text-lg font-bold text-foreground mt-0.5">
                      {activeAnomaly.evidence.multivariate}%
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="text-muted-foreground">Adaptive Baseline Alignment</span>
                      <span className="font-mono font-bold text-foreground">98%</span>
                    </div>
                    <Meter value={98} tone="bg-ok" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="text-muted-foreground">Spatial Agreement</span>
                      <span className="font-mono font-bold text-foreground">95%</span>
                    </div>
                    <Meter value={95} tone="bg-ok" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="text-muted-foreground">Rate of Change Stability</span>
                      <span className="font-mono font-bold text-foreground">99%</span>
                    </div>
                    <Meter value={99} tone="bg-ok" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="text-muted-foreground">Multivariate Thermodynamic Coupling</span>
                      <span className="font-mono font-bold text-foreground">97%</span>
                    </div>
                    <Meter value={97} tone="bg-ok" />
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground leading-relaxed">
                  All multivariate indicators are within 95%+ confidence envelopes. To observe the full diagnostic evidence cascade, trigger the 55°C Temperature Spike scenario below.
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* SIMULATION CENTER */}
        <div className="col-span-12 lg:col-span-6 space-y-5">
          <Panel
            title="Simulation Center"
            meta="Inject and test fault signatures and meteorological phenomena"
          >
            {/* Primary scenario: 55°C Temperature Spike */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-xs mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] font-bold text-foreground">
                  <Flame className="size-4.5 text-critical" />
                  <span>Primary SIH Scenario: 55°C Temperature Spike</span>
                </div>
                <span className="font-mono text-[11px] font-semibold text-primary">AWS-003</span>
              </div>
              <p className="mt-1.5 text-[12px] text-muted-foreground leading-relaxed">
                Applies a severe +23.2°C anomaly to AWS-003 while surrounding stations remain within normal bounds. Validates adaptive baseline divergence, spatial disagreement, and self-healing recovery.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => setScenario("temperature_spike")}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors shadow-xs",
                    scenario === "temperature_spike"
                      ? "bg-critical text-white font-bold"
                      : "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  {scenario === "temperature_spike" ? "Spike Active (55°C)" : "Trigger 55°C Spike"}
                </button>
              </div>
            </div>

            {/* Transport controls */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={running ? pause : start}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors",
                  running
                    ? "border-watch/40 bg-watch/10 text-watch"
                    : "border-primary/40 bg-primary/10 text-primary",
                )}
              >
                {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                {running ? "Pause" : "Resume"}
              </button>
              <button
                onClick={reset}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-[12px] font-semibold text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </button>
              <button
                onClick={() => setScenario("normal")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-[12px] font-semibold text-ok"
              >
                Normal
              </button>
            </div>

            {/* All Scenarios List */}
            <div className="text-[11px] font-semibold text-muted-foreground uppercase mb-2">
              All Simulation Scenarios (8 Total)
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 max-h-[250px] overflow-y-auto pr-1">
              {SCENARIOS.map((s) => {
                const active = scenario === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setScenario(s.id)}
                    className={cn(
                      "rounded-lg border p-2.5 text-left transition-all",
                      active
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20"
                        : "border-border bg-card hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-foreground">{s.label}</span>
                      <span className="font-mono text-[9px] text-muted-foreground">{s.target}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate mt-0.5">{s.description}</div>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
