import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  HelpCircle,
  Radio,
  ShieldAlert,
  Sparkles,
  Wrench,
  XCircle,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AnomalyRecord } from "@/lib/atmos/types";
import { cn } from "@/lib/utils";
import { formatSimDateTime, useSimulation } from "@/services/simulationStore";
import { EvidenceBars } from "./EvidenceBars";
import { Meter, StatusTag, severityColor, stateColor } from "./primitives";

export function AnomalyDrawer({
  anomaly,
  onClose,
}: {
  anomaly: AnomalyRecord | null;
  onClose: () => void;
}) {
  const { acknowledgeAnomaly, resolveAnomaly } = useSimulation();

  return (
    <Sheet open={!!anomaly} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-line bg-panel p-0 sm:max-w-[560px]"
      >
        {anomaly && (
          <div className="flex flex-col">
            <SheetHeader className="sticky top-0 z-20 space-y-1.5 border-b border-line/70 bg-panel/95 px-6 py-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2.5 font-mono text-[16px] font-bold text-foreground">
                  <AlertTriangle className="size-4 text-critical" />
                  {anomaly.id}
                </SheetTitle>
                <div className="flex items-center gap-2">
                  <StatusTag
                    label={anomaly.status}
                    tone={
                      anomaly.status === "RESOLVED"
                        ? "ok"
                        : anomaly.status === "ACKNOWLEDGED"
                          ? "watch"
                          : "critical"
                    }
                  />
                  {anomaly.status === "OPEN" && (
                    <button
                      onClick={() => acknowledgeAnomaly(anomaly.id)}
                      className="rounded border border-watch/40 bg-watch/10 px-2 py-0.5 font-mono text-[10px] font-medium text-watch hover:bg-watch/20"
                    >
                      Acknowledge
                    </button>
                  )}
                  {anomaly.status !== "RESOLVED" && (
                    <button
                      onClick={() => resolveAnomaly(anomaly.id)}
                      className="rounded border border-ok/40 bg-ok/10 px-2 py-0.5 font-mono text-[10px] font-medium text-ok hover:bg-ok/20"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-dim">
                <span className="text-foreground font-semibold">{anomaly.stationId}</span>
                <span>·</span>
                <span>{formatSimDateTime(anomaly.detectedAt)} UTC</span>
                <span>·</span>
                <span>Tick #{anomaly.tick}</span>
              </div>
            </SheetHeader>

            <div className="space-y-5 px-6 py-5">
              {/* Top Key Metrics */}
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="Anomaly Type" value={anomaly.type} />
                <StatCard
                  label="Severity"
                  value={`${anomaly.severityScore}%`}
                  subtext={anomaly.severity.toUpperCase()}
                  className={severityColor[anomaly.severity]}
                />
                <StatCard
                  label="Confidence"
                  value={`${anomaly.confidence}%`}
                  subtext="CONSENSUS MATCH"
                  className="text-primary"
                />
              </div>

              {/* Primary Reason & Root Cause */}
              <Section title="Root Cause Analysis">
                <div className="rounded-lg border border-line/60 bg-panel2/40 p-3.5">
                  <div className="flex items-center gap-2 font-mono text-[12px] font-bold text-foreground">
                    <span className="grid size-5 place-items-center rounded bg-critical/15 text-critical text-[11px]">
                      !
                    </span>
                    Root Cause: {anomaly.causes[0] ?? "Probable sensor anomaly"}
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                    {anomaly.reason}
                  </p>

                  {anomaly.causes.length > 1 && (
                    <div className="mt-3 border-t border-line/40 pt-2.5">
                      <div className="label-mono mb-1.5 text-[9px]">Differential Diagnostics</div>
                      <ul className="space-y-1 font-mono text-[11px] text-dim">
                        {anomaly.causes.map((cause, i) => (
                          <li key={cause} className="flex items-center gap-1.5">
                            <span className="size-1 rounded-full bg-primary/60" />
                            <span className={i === 0 ? "text-foreground font-medium" : ""}>
                              {cause}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-3 flex items-start gap-2 rounded-md border border-primary/25 bg-primary/8 p-2.5 text-[12px] text-primary">
                    <Wrench className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Recommended Action: </span>
                      {anomaly.recommendation}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Measured vs Reconstructed Estimate */}
              <Section title="Observation Comparison (Never Overwritten)">
                <div className="grid grid-cols-3 gap-2">
                  <ComparisonCard
                    label="Measured"
                    value={`${anomaly.observed.toFixed(1)}°C`}
                    tag="RAW TELEMETRY"
                    tone="critical"
                  />
                  <ComparisonCard
                    label="Expected Baseline"
                    value={`${anomaly.expectedTemperature.toFixed(1)}°C`}
                    tag="ADAPTIVE BASELINE"
                    tone="neutral"
                  />
                  <ComparisonCard
                    label="Deviation"
                    value={`${anomaly.difference > 0 ? "+" : ""}${anomaly.difference.toFixed(1)}°C`}
                    tag="DELTA"
                    tone="watch"
                  />
                </div>
              </Section>

              {/* Explainable Self-Healing Recovery Estimate */}
              <Section title="Self-Healing Quality Control Estimate">
                <div className="rounded-lg border border-ok/30 bg-ok/5 p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] tracking-wider uppercase text-ok font-bold">
                        Reconstructed Value
                      </span>
                      <div className="font-mono text-2xl font-bold text-ok">
                        {anomaly.recovery.estimated.toFixed(1)}°C
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[10px] text-dim">ESTIMATE CONFIDENCE</span>
                      <div className="font-mono text-lg font-bold text-foreground">
                        {anomaly.recovery.confidence}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <Meter value={anomaly.recovery.confidence} tone="bg-ok" />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-ok/20 pt-2 font-mono text-[11px] text-dim">
                    <span>SYNTHESIS ALGORITHM</span>
                    <span className="text-foreground font-medium">{anomaly.recovery.method}</span>
                  </div>

                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    A.T.M.O.S preserves strict data provenance: raw measured telemetry (55.0°C) is
                    permanently retained, while the reconstructed consensus estimate (31.8°C) is
                    published alongside for forecast models.
                  </p>
                </div>
              </Section>

              {/* Evidence Breakdown */}
              <Section title="Multivariate Detection Evidence">
                <div className="rounded-lg border border-line/60 bg-panel2/40 p-3.5">
                  <EvidenceBars evidence={anomaly.evidence} />

                  <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-[10px]">
                    <EvidenceRow
                      label="Baseline Deviation"
                      value={`${anomaly.evidence.baseline}%`}
                      active={anomaly.evidence.baseline > 50}
                    />
                    <EvidenceRow
                      label="Spatial Disagreement"
                      value={`${anomaly.evidence.spatial}%`}
                      active={anomaly.evidence.spatial > 50}
                    />
                    <EvidenceRow
                      label="Rate of Change"
                      value={`${anomaly.evidence.rate}%`}
                      active={anomaly.evidence.rate > 50}
                    />
                    <EvidenceRow
                      label="Multivariate Physics"
                      value={`${anomaly.evidence.multivariate}%`}
                      active={anomaly.evidence.multivariate > 50}
                    />
                  </div>
                </div>
              </Section>

              {/* Spatial Weather Consensus Cross-Check */}
              <Section title="Spatial Weather Consensus">
                <div className="rounded-lg border border-line/60 bg-panel2/40 p-3.5">
                  <div className="space-y-1.5">
                    {anomaly.neighbors.map((n) => (
                      <div
                        key={n.stationId}
                        className="flex items-center justify-between rounded border border-line/50 bg-background/50 px-2.5 py-1.5 font-mono text-[11px]"
                      >
                        <span className="text-muted-foreground">{n.stationId}</span>
                        <span className="font-semibold text-foreground">
                          {n.temperature.toFixed(1)}°C
                        </span>
                        <StatusTag
                          label={n.normal ? "NORMAL" : "ANOM"}
                          tone={n.normal ? "ok" : "critical"}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line/40 pt-2.5 font-mono text-[11px]">
                    <div>
                      <div className="text-dim text-[10px]">REGIONAL CONSENSUS</div>
                      <div
                        className={cn(
                          "font-bold mt-0.5",
                          anomaly.regionalConsensus === "EVENT" ? "text-event" : "text-ok",
                        )}
                      >
                        {anomaly.regionalConsensus}
                      </div>
                    </div>
                    <div>
                      <div className="text-dim text-[10px]">SPATIAL DISAGREEMENT</div>
                      <div
                        className={cn(
                          "font-bold mt-0.5",
                          anomaly.spatialDisagreement === "HIGH"
                            ? "text-critical"
                            : anomaly.spatialDisagreement === "MODERATE"
                              ? "text-watch"
                              : "text-ok",
                        )}
                      >
                        {anomaly.spatialDisagreement}
                      </div>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Sensor Health Impact */}
              {anomaly.healthImpact && (
                <Section title="Predictive Sensor Health Impact">
                  <div className="rounded-lg border border-line/60 bg-panel2/40 p-3.5">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded border border-line/50 bg-background/40 p-2 text-center">
                        <div className="label-mono text-[9px]">Prior Score</div>
                        <div className="font-mono text-sm font-bold text-foreground">
                          {anomaly.healthImpact.priorScore}
                        </div>
                      </div>
                      <div className="rounded border border-critical/30 bg-critical/5 p-2 text-center">
                        <div className="label-mono text-[9px] text-critical">Penalty Drop</div>
                        <div className="font-mono text-sm font-bold text-critical">
                          -{anomaly.healthImpact.scoreDrop} pts
                        </div>
                      </div>
                      <div className="rounded border border-line/50 bg-background/40 p-2 text-center">
                        <div className="label-mono text-[9px]">Projected Score</div>
                        <div
                          className={cn(
                            "font-mono text-sm font-bold",
                            stateColor[anomaly.healthImpact.riskCategory],
                          )}
                        >
                          {anomaly.healthImpact.projectedScore} (
                          {anomaly.healthImpact.riskCategory})
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between font-mono text-[10px] text-dim">
                      <span>Noise Variance Multiplier:</span>
                      <span className="text-watch font-semibold">
                        {anomaly.healthImpact.varianceMultiplier}x
                      </span>
                    </div>
                  </div>
                </Section>
              )}

              {/* Audit & Evidence Timeline */}
              {anomaly.auditTrail && anomaly.auditTrail.length > 0 && (
                <Section title="Verification & Audit Trail">
                  <div className="rounded-lg border border-line/60 bg-panel2/40 p-3.5">
                    <div className="space-y-3 font-mono text-[11px]">
                      {anomaly.auditTrail.map((step, idx) => (
                        <div key={step.id} className="relative flex items-start gap-2.5">
                          <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-background border border-line text-[9px] font-bold">
                            {idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground">{step.label}</span>
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.2 text-[9px] font-semibold",
                                  step.status === "pass"
                                    ? "bg-ok/15 text-ok"
                                    : step.status === "warn"
                                      ? "bg-watch/15 text-watch"
                                      : "bg-critical/15 text-critical",
                                )}
                              >
                                {step.result}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground font-sans">
                              {step.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Section>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="label-mono mb-2 text-[10px] tracking-wider text-dim">{title}</h3>
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  className,
}: {
  label: string;
  value: string;
  subtext?: string;
  className?: string;
}) {
  return (
    <div className="rounded-lg border border-line/60 bg-panel2/40 p-2.5">
      <div className="label-mono text-[9px]">{label}</div>
      <div className={cn("mt-1 font-mono text-base font-bold", className)}>{value}</div>
      {subtext && <div className="font-mono text-[9px] text-dim mt-0.5">{subtext}</div>}
    </div>
  );
}

function ComparisonCard({
  label,
  value,
  tag,
  tone,
}: {
  label: string;
  value: string;
  tag: string;
  tone: "critical" | "neutral" | "watch";
}) {
  const toneClasses = {
    critical: "text-critical",
    neutral: "text-foreground",
    watch: "text-watch",
  }[tone];
  return (
    <div className="rounded-lg border border-line/60 bg-background/50 p-2.5 text-center">
      <div className="label-mono text-[9px]">{label}</div>
      <div className={cn("mt-1 font-mono text-lg font-bold", toneClasses)}>{value}</div>
      <div className="mt-1">
        <StatusTag label={tag} tone={tone === "neutral" ? "neutral" : tone} />
      </div>
    </div>
  );
}

function EvidenceRow({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded bg-background/40 px-2 py-1">
      <span className="text-dim flex items-center gap-1">
        {active ? <span className="text-ok">✓</span> : <span className="text-dim">·</span>}
        {label}
      </span>
      <span className={cn("font-bold", active ? "text-primary" : "text-dim")}>{value}</span>
    </div>
  );
}
