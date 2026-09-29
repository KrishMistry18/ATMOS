import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Cpu,
  Layers,
  Radio,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { Meter, Panel, StatusTag } from "@/components/atmos/primitives";
import { EvidenceBars } from "@/components/atmos/EvidenceBars";
import { SimulationControls } from "@/components/atmos/SimulationControls";
import { STATIONS, STATION_MAP } from "@/data/stations";
import { useSimulation } from "@/services/simulationStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/system-intelligence")({
  head: () => ({
    meta: [
      { title: "System Intelligence — A.T.M.O.S Adaptive Baseline & QC Pipeline" },
      {
        name: "description",
        content:
          "How A.T.M.O.S reasons: station-specific adaptive baselines, multivariate fusion, fault fingerprinting and self-healing estimates.",
      },
      {
        property: "og:title",
        content: "System Intelligence — A.T.M.O.S Adaptive Baseline & QC Pipeline",
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

function SystemIntelligence() {
  const { latest, assess, expectedFor, adaptiveBaselineFor } = useSimulation();
  const [stationId, setStationId] = useState("AWS-003");

  const currentStation = STATION_MAP.get(stationId)!;
  const obs = latest[stationId]!;
  const expected = expectedFor(stationId);
  const assessment = assess(stationId);
  const baseline = adaptiveBaselineFor(stationId);

  const pipeline = [
    {
      step: "01",
      label: "Station Adaptive Baseline",
      value: `${baseline.historicalMean.toFixed(1)}°C historical diurnal mean`,
      detail: `Specific to ${currentStation.name} (${currentStation.elevation}m MSL)`,
    },
    {
      step: "02",
      label: "Diurnal Expected Range",
      value: `${baseline.expectedMin.toFixed(1)}°C – ${baseline.expectedMax.toFixed(1)}°C`,
      detail: `Dynamic 3-sigma statistical confidence envelope`,
    },
    {
      step: "03",
      label: "Current Telemetry",
      value: obs?.received ? `${obs.temperature.toFixed(1)}°C` : "PACKET MISSING",
      detail: obs?.received ? `Latency: ${obs.latencyMs}ms` : "Radio timeout",
    },
    {
      step: "04",
      label: "Station Deviation",
      value: `${assessment.difference > 0 ? "+" : ""}${assessment.difference.toFixed(1)}°C`,
      detail: assessment.anomalous ? "Severe departure from baseline" : "Within normal bounds",
    },
  ];

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Station-Specific Adaptive Baseline Engine */}
      <Panel
        className="col-span-12 xl:col-span-8"
        title="Adaptive Sensor Intelligence"
        meta="STATION-SPECIFIC ADAPTIVE BASELINE — NOT A STATIC THRESHOLD"
        action={
          <div className="flex items-center gap-2">
            <span className="label-mono text-[9px] text-dim">STATION:</span>
            <select
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className="rounded-md border border-line/70 bg-panel2/60 px-2.5 py-1 font-mono text-[11px] font-semibold text-foreground"
            >
              {STATIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.name}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {/* Pipeline Step Cards */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {pipeline.map((p) => (
            <div
              key={p.step}
              className="relative rounded-lg border border-line/60 bg-panel2/40 p-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between font-mono text-[10px] text-primary">
                  <span>STEP {p.step}</span>
                  <span className="text-[9px] text-dim">{p.label}</span>
                </div>
                <div className="mt-1 font-mono text-[13px] font-bold text-foreground">
                  {p.value}
                </div>
              </div>
              <div className="label-mono mt-2 text-[9px] text-dim border-t border-line/30 pt-1.5">
                {p.detail}
              </div>
            </div>
          ))}
        </div>

        {/* Adaptive Baseline Detailed Metric Matrix */}
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          <FactCard
            label="Current Observation"
            value={obs?.received ? `${obs.temperature.toFixed(1)}°C` : "—"}
            tone={assessment.anomalous ? "text-critical" : "text-primary"}
            tag="OBSERVED"
          />
          <FactCard
            label="Station-Specific Baseline"
            value={`${expected.temperature.toFixed(1)}°C`}
            tag="EXPECTED"
          />
          <FactCard
            label="Baseline Deviation"
            value={`${assessment.difference > 0 ? "+" : ""}${assessment.difference.toFixed(1)}°C`}
            tone={assessment.anomalous ? "text-watch" : "text-ok"}
            tag={assessment.anomalous ? "DEVIATION" : "NOMINAL"}
          />
          <FactCard
            label="Expected Range Envelope"
            value={`${baseline.expectedMin.toFixed(1)}°C – ${baseline.expectedMax.toFixed(1)}°C`}
          />
          <FactCard label="Recent Micro-Trend" value={baseline.recentTrend} />
          <FactCard
            label="Baseline Compliance"
            value={assessment.anomalous ? "Baseline Exceeded" : "Within Envelope"}
            tone={assessment.anomalous ? "text-critical font-bold" : "text-ok font-bold"}
          />
        </div>

        <div className="mt-4 rounded-lg border border-line/60 bg-background/50 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          <strong className="text-primary">CORE ARCHITECTURAL PRINCIPLE: </strong>
          Static thresholds (e.g. fixed 45°C alarm) fail across varied microclimates. A.T.M.O.S
          computes a continuous, station-specific adaptive baseline tailored to each sensor's historical
          thermal inertia, elevation ({currentStation.elevation}m), and diurnal solar flux.
        </div>
      </Panel>

      {/* Right Column: Multi-Evidence & Simulation Controls */}
      <div className="col-span-12 space-y-4 xl:col-span-4">
        <Panel
          title="Multivariate Detection Evidence"
          meta="COMPOSITE WEIGHTING ACROSS 4 INDEPENDENT SENSORS & MODELS"
        >
          <EvidenceBars evidence={assessment.evidence} />

          <div className="mt-3.5 space-y-1.5 border-t border-line/40 pt-2.5 font-mono text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-dim">Baseline Weight (40%):</span>
              <span className="text-foreground font-bold">{assessment.evidence.baseline}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dim">Spatial Weight (30%):</span>
              <span className="text-foreground font-bold">{assessment.evidence.spatial}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dim">Rate of Change (15%):</span>
              <span className="text-foreground font-bold">{assessment.evidence.rate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dim">Multivariate Physics (15%):</span>
              <span className="text-foreground font-bold">
                {assessment.evidence.multivariate}%
              </span>
            </div>
          </div>
        </Panel>

        <SimulationControls />
      </div>

      {/* Intelligent Fault Fingerprinting Card */}
      <Panel
        className="col-span-12 lg:col-span-6"
        title="Intelligent Fault Fingerprinting"
        meta="PATTERN RECOGNITION & ROOT CAUSE IDENTIFICATION"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusTag
              label={assessment.type}
              tone={assessment.anomalous ? "critical" : "ok"}
            />
            <span className="font-mono text-[11px] text-dim">
              CONFIDENCE {assessment.confidence}%
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold text-foreground">
            Severity: {assessment.severityScore}%
          </span>
        </div>

        <div className="mt-3">
          <Meter value={assessment.confidence} tone="bg-primary" />
        </div>

        <div className="label-mono mt-4 mb-1 text-[9px] text-dim">Diagnosed Root Cause</div>
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          {assessment.anomalous
            ? assessment.reason
            : "Station telemetry tracks within the expected adaptive baseline envelope."}
        </p>

        {assessment.causes.length > 0 && (
          <div className="mt-3 border-t border-line/40 pt-2.5">
            <div className="label-mono mb-1 text-[9px] text-dim">Diagnostic Fault Signatures</div>
            <ul className="space-y-1 font-mono text-[11px] text-muted-foreground">
              {assessment.causes.map((c) => (
                <li key={c} className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-primary" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3.5 flex items-start gap-2 rounded-md border border-primary/25 bg-primary/10 p-2.5 text-[12px] text-primary">
          <Wrench className="size-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Recommended Action: </span>
            {assessment.recommendation}
          </div>
        </div>
      </Panel>

      {/* Explainable Self-Healing Quality Control Card */}
      <Panel
        className="col-span-12 lg:col-span-6"
        title="Explainable Self-Healing Quality Control"
        meta="MEASURED VALUE PRESERVED · RECONSTRUCTED ESTIMATE PUBLISHED"
      >
        <div className="grid grid-cols-2 gap-2.5">
          <FactCard
            label="Measured Telemetry (Raw)"
            value={obs?.received ? `${obs.temperature.toFixed(1)}°C` : "MISSING"}
            tone="text-critical"
            tag="MEASURED"
          />
          <FactCard
            label="Reconstructed Value"
            value={`${assessment.recovery.estimated.toFixed(1)}°C`}
            tone="text-ok"
            tag="ESTIMATED"
          />
        </div>

        <dl className="mt-4 space-y-2 font-mono text-[11px]">
          <div className="flex items-center justify-between border-b border-line/40 pb-2">
            <dt className="text-dim">RECOVERY METHOD</dt>
            <dd className="text-foreground font-semibold">{assessment.recovery.method}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-line/40 pb-2">
            <dt className="text-dim">RECOVERY CONFIDENCE</dt>
            <dd className="text-ok font-bold">{assessment.recovery.confidence}%</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-dim">DATA PROVENANCE GUARANTEE</dt>
            <dd className="text-primary font-semibold">Never overwritten</dd>
          </div>
        </dl>

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground font-sans">
          Downstream meteorological ingestion models receive both the un-tampered raw sensor reading
          and the reconstructed estimate flagged with confidence metadata, maintaining data integrity
          for numerical weather prediction (NWP) without risk of corrupted inputs.
        </p>
      </Panel>
    </div>
  );
}

function FactCard({
  label,
  value,
  tone,
  tag,
}: {
  label: string;
  value: string;
  tone?: string;
  tag?: string;
}) {
  return (
    <div className="rounded-lg border border-line/60 bg-panel2/40 p-3">
      <div className="label-mono text-[9px] text-dim">{label}</div>
      <div className={cn("mt-1 font-mono text-base font-bold text-foreground", tone)}>{value}</div>
      {tag && (
        <div className="mt-1.5">
          <StatusTag
            label={tag}
            tone={tag === "MEASURED" || tag === "DEVIATION" ? "critical" : tag === "ESTIMATED" || tag === "NOMINAL" ? "ok" : "neutral"}
          />
        </div>
      )}
    </div>
  );
}
