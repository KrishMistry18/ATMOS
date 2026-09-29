import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Meter, Panel, StatusTag } from "@/components/atmos/primitives";
import { EvidenceBars } from "@/components/atmos/EvidenceBars";
import { SimulationControls } from "@/components/atmos/SimulationControls";
import { STATIONS } from "@/data/stations";
import { useSimulation } from "@/services/simulationStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/system-intelligence")({
  head: () => ({
    meta: [
      { title: "System Intelligence — A.T.M.O.S" },
      {
        name: "description",
        content:
          "How A.T.M.O.S reasons: station-specific adaptive baselines, multivariate fusion, fault fingerprinting and self-healing estimates.",
      },
      { property: "og:title", content: "System Intelligence — A.T.M.O.S" },
      {
        property: "og:description",
        content: "Adaptive baselines, fault fingerprinting and self-healing estimates.",
      },
    ],
  }),
  component: SystemIntelligence,
});

function SystemIntelligence() {
  const { latest, assess, expectedFor } = useSimulation();
  const [stationId, setStationId] = useState("AWS-003");
  const obs = latest[stationId]!;
  const expected = expectedFor(stationId);
  const assessment = assess(stationId);
  const station = STATIONS.find((s) => s.id === stationId)!;

  const pipeline = [
    { label: "Historical Baseline", value: `${station.baseTemp.toFixed(1)}°C seasonal mean` },
    { label: "Station Pattern", value: `Diurnal fit · ${station.district}` },
    { label: "Current Observation", value: obs.received ? `${obs.temperature.toFixed(1)}°C` : "NO PACKET" },
    {
      label: "Deviation Score",
      value: `${assessment.difference > 0 ? "+" : ""}${assessment.difference.toFixed(1)}°C`,
    },
  ];

  return (
    <div className="grid grid-cols-12 gap-4">
      <Panel
        className="col-span-12 xl:col-span-8"
        title="Adaptive Sensor Intelligence"
        meta="STATION-SPECIFIC ADAPTIVE BASELINE — NOT A STATIC THRESHOLD"
        action={
          <select
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
            className="rounded-md border border-line/70 bg-panel2/60 px-2 py-1 font-mono text-[11px] text-foreground"
          >
            {STATIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}
              </option>
            ))}
          </select>
        }
      >
        <div className="grid gap-2 sm:grid-cols-4">
          {pipeline.map((p, i) => (
            <div key={p.label} className="relative rounded-lg border border-line/60 bg-panel2/40 p-3">
              <div className="label-mono">
                STEP {i + 1} — {p.label}
              </div>
              <div className="mt-1.5 font-mono text-[12px] text-foreground">{p.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Fact label="Current" value={obs.received ? `${obs.temperature.toFixed(1)}°C` : "—"} tone="text-critical" />
          <Fact label="Expected" value={`${expected.temperature.toFixed(1)}°C`} />
          <Fact
            label="Baseline deviation"
            value={`${assessment.difference > 0 ? "+" : ""}${assessment.difference.toFixed(1)}°C`}
            tone="text-watch"
          />
          <Fact label="Time-of-day context" value="Normal" />
          <Fact
            label="Historical range"
            value={`${(station.baseTemp - 3).toFixed(0)}–${(station.baseTemp + 3).toFixed(0)}°C`}
          />
          <Fact
            label="Status"
            value={assessment.anomalous ? "Abnormal" : "Within baseline"}
            tone={assessment.anomalous ? "text-critical" : "text-ok"}
          />
        </div>
      </Panel>

      <div className="col-span-12 space-y-4 xl:col-span-4">
        <Panel title="Detection Evidence" meta="EVIDENCE CONTRIBUTION — RULE-BASED">
          <EvidenceBars evidence={assessment.evidence} />
        </Panel>
        <SimulationControls />
      </div>

      <Panel className="col-span-12 lg:col-span-6" title="Fault Fingerprinting" meta="PATTERN CLASSIFICATION">
        <div className="flex items-center gap-2">
          <StatusTag label={assessment.type} tone={assessment.anomalous ? "critical" : "ok"} />
          <span className="font-mono text-[11px] text-dim">
            CONFIDENCE {assessment.confidence}%
          </span>
        </div>
        <div className="mt-3">
          <Meter value={assessment.confidence} tone="bg-primary" />
        </div>
        <div className="label-mono mt-4 mb-1.5">Likely cause</div>
        <p className="text-[12px] text-muted-foreground">
          {assessment.anomalous ? assessment.reason : "Observation agrees with the adaptive baseline."}
        </p>
        {assessment.causes.length > 0 && (
          <>
            <div className="label-mono mt-4 mb-1.5">Possible causes</div>
            <ul className="space-y-1">
              {assessment.causes.map((c) => (
                <li key={c} className="text-[12px] text-muted-foreground">
                  · {c}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="mt-3 rounded-md border border-primary/25 bg-primary/10 px-3 py-2 text-[12px] text-primary">
          Recommended: {assessment.recommendation}
        </p>
      </Panel>

      <Panel
        className="col-span-12 lg:col-span-6"
        title="Explainable Self-Healing QC"
        meta="THE MEASURED VALUE IS NEVER REPLACED"
      >
        <div className="grid grid-cols-2 gap-2">
          <Fact
            label="Measured"
            value={obs.received ? `${obs.temperature.toFixed(1)}°C` : "NO PACKET"}
            tone="text-critical"
            tag="MEASURED"
          />
          <Fact
            label="Estimated"
            value={`${assessment.recovery.estimated.toFixed(1)}°C`}
            tone="text-ok"
            tag="ESTIMATED"
          />
        </div>
        <dl className="mt-4 space-y-2 font-mono text-[11px]">
          <div className="flex items-center justify-between border-b border-line/40 pb-2">
            <dt className="text-dim">RECOVERY METHOD</dt>
            <dd className="text-foreground">{assessment.recovery.method}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-line/40 pb-2">
            <dt className="text-dim">RECOVERY CONFIDENCE</dt>
            <dd className="text-ok">{assessment.recovery.confidence}%</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-dim">REGIONAL CONSENSUS</dt>
            <dd className={assessment.regionalConsensus === "EVENT" ? "text-event" : "text-ok"}>
              {assessment.regionalConsensus}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-[12px] text-muted-foreground">
          Estimates are published beside the raw observation so downstream users always see what was
          measured and what was reconstructed.
        </p>
      </Panel>
    </div>
  );
}

function Fact({
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
    <div className="rounded-md border border-line/60 bg-panel2/40 p-3">
      <div className="label-mono">{label}</div>
      <div className={cn("mt-1 font-mono text-[14px] font-bold text-foreground", tone)}>{value}</div>
      {tag && (
        <div className="mt-1.5">
          <StatusTag label={tag} tone={tag === "MEASURED" ? "critical" : "ok"} />
        </div>
      )}
    </div>
  );
}
