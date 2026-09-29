import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Layers,
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
        className="w-full overflow-y-auto border-l border-border bg-card p-0 sm:max-w-[580px] shadow-2xl"
      >
        {anomaly && (
          <div className="flex flex-col">
            {/* Drawer Header */}
            <SheetHeader className="sticky top-0 z-20 space-y-2 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2.5 text-[17px] font-bold text-foreground">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-critical/10 text-critical">
                    <AlertTriangle className="size-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{anomaly.id}</span>
                      <span className="text-[12px] font-medium text-muted-foreground">
                        • {anomaly.stationId}
                      </span>
                    </div>
                  </div>
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
                      className="rounded-md border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-accent transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  {anomaly.status !== "RESOLVED" && (
                    <button
                      onClick={() => resolveAnomaly(anomaly.id)}
                      className="rounded-md bg-ok px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-ok/90 transition-colors shadow-xs"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Clock className="size-3.5" />
                <span>{formatSimDateTime(anomaly.detectedAt)} UTC</span>
                <span>•</span>
                <span>Cycle Tick #{anomaly.tick}</span>
                <span>•</span>
                <span className="font-semibold text-foreground">{anomaly.type}</span>
              </div>
            </SheetHeader>

            <div className="space-y-6 px-6 py-6">
              {/* Primary Metric Highlights: 6-grid */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl border border-critical/30 bg-critical/5 p-3">
                  <span className="text-[11px] font-medium text-muted-foreground">Observed</span>
                  <div className="font-mono text-xl font-bold text-critical mt-0.5">
                    {anomaly.observed.toFixed(1)}°C
                  </div>
                  <span className="text-[10px] text-critical/80 font-medium">Raw Sensor Reading</span>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <span className="text-[11px] font-medium text-muted-foreground">Expected Baseline</span>
                  <div className="font-mono text-xl font-bold text-foreground mt-0.5">
                    {anomaly.expectedTemperature.toFixed(1)}°C
                  </div>
                  <span className="text-[10px] text-muted-foreground">Adaptive Model</span>
                </div>

                <div className="rounded-xl border border-watch/30 bg-watch/5 p-3">
                  <span className="text-[11px] font-medium text-muted-foreground">Deviation</span>
                  <div className="font-mono text-xl font-bold text-watch mt-0.5">
                    {anomaly.difference > 0 ? "+" : ""}{anomaly.difference.toFixed(1)}°C
                  </div>
                  <span className="text-[10px] text-watch/80 font-medium">Baseline Departure</span>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <span className="text-[11px] font-medium text-muted-foreground">Severity</span>
                  <div className={cn("text-xl font-bold mt-0.5", severityColor[anomaly.severity])}>
                    {anomaly.severityScore}%
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    {anomaly.severity}
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <span className="text-[11px] font-medium text-muted-foreground">Confidence</span>
                  <div className="text-xl font-bold text-primary mt-0.5">
                    {anomaly.confidence}%
                  </div>
                  <span className="text-[10px] text-muted-foreground">Consensus Match</span>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <span className="text-[11px] font-medium text-muted-foreground">Classification</span>
                  <div className="text-[13px] font-bold text-foreground mt-1 truncate">
                    Probable Sensor Anomaly
                  </div>
                  <span className="text-[10px] text-muted-foreground">Isolated Defect</span>
                </div>
              </div>

              {/* OBSERVATION COMPARISON (NEVER OVERWRITTEN) */}
              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold tracking-tight text-foreground uppercase">
                    Observation Data Integrity (Never Overwritten)
                  </h3>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Provenance Locked
                  </span>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-[12px] leading-relaxed text-muted-foreground">
                    A.T.M.O.S strictly preserves scientific provenance: the measured value (
                    <strong className="text-critical font-mono font-bold">{anomaly.observed.toFixed(1)}°C</strong>
                    ) is permanently archived in the raw telemetry log, while the synthesized consensus estimate (
                    <strong className="text-ok font-mono font-bold">{anomaly.recovery.estimated.toFixed(1)}°C</strong>
                    ) is served in parallel to forecast systems.
                  </p>
                </div>
              </section>

              {/* SELF-HEALING / RECONSTRUCTION ESTIMATE */}
              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold tracking-tight text-foreground uppercase">
                    Self-Healing / Quality Control Reconstruction
                  </h3>
                  <span className="text-[11px] font-semibold text-ok">Confidence: {anomaly.recovery.confidence}%</span>
                </div>
                <div className="rounded-xl border border-ok/30 bg-ok/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-medium text-muted-foreground">Estimated Reconstructed Value</div>
                      <div className="font-mono text-3xl font-bold text-ok mt-0.5">
                        {anomaly.recovery.estimated.toFixed(1)}°C
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-medium text-muted-foreground">Observed Raw Value</div>
                      <div className="font-mono text-xl font-bold text-critical mt-0.5 line-through decoration-critical/60">
                        {anomaly.observed.toFixed(1)}°C
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                      <span>Spatial Reconstruction Confidence</span>
                      <span className="font-semibold text-foreground">{anomaly.recovery.confidence}%</span>
                    </div>
                    <Meter value={anomaly.recovery.confidence} tone="bg-ok" />
                  </div>

                  <div className="flex items-center justify-between border-t border-ok/20 pt-2 text-[11px]">
                    <span className="text-muted-foreground">Reconstruction Method:</span>
                    <span className="font-semibold text-foreground">{anomaly.recovery.method}</span>
                  </div>
                </div>
              </section>

              {/* MULTIVARIATE EVIDENCE */}
              <section className="space-y-2.5">
                <h3 className="text-[13px] font-semibold tracking-tight text-foreground uppercase">
                  Multivariate Detection Evidence
                </h3>
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <EvidenceBars evidence={anomaly.evidence} />

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/70 text-[11px]">
                    <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2">
                      <span className="text-muted-foreground">Adaptive Baseline:</span>
                      <span className="font-mono font-bold text-foreground">{anomaly.evidence.baseline}%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2">
                      <span className="text-muted-foreground">Spatial Disagreement:</span>
                      <span className="font-mono font-bold text-foreground">{anomaly.evidence.spatial}%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2">
                      <span className="text-muted-foreground">Rate of Change:</span>
                      <span className="font-mono font-bold text-foreground">{anomaly.evidence.rate}%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2">
                      <span className="text-muted-foreground">Multivariate Consistency:</span>
                      <span className="font-mono font-bold text-foreground">{anomaly.evidence.multivariate}%</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* SPATIAL CONTEXT */}
              <section className="space-y-2.5">
                <h3 className="text-[13px] font-semibold tracking-tight text-foreground uppercase">
                  Spatial Context & Neighbor Consensus
                </h3>
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
                    <div className="rounded-lg border border-critical/30 bg-critical/5 p-2.5 text-center">
                      <div className="text-[10px] text-muted-foreground font-medium">Target Station</div>
                      <div className="text-[12px] font-bold text-critical mt-0.5">ANOMALOUS</div>
                    </div>
                    <div className="rounded-lg border border-ok/30 bg-ok/5 p-2.5 text-center">
                      <div className="text-[10px] text-muted-foreground font-medium">Neighbor Stations</div>
                      <div className="text-[12px] font-bold text-ok mt-0.5">NORMAL</div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/40 p-2.5 text-center">
                      <div className="text-[10px] text-muted-foreground font-medium">Regional Consensus</div>
                      <div className="text-[12px] font-bold text-ok mt-0.5">{anomaly.regionalConsensus}</div>
                    </div>
                    <div className="rounded-lg border border-critical/30 bg-critical/5 p-2.5 text-center">
                      <div className="text-[10px] text-muted-foreground font-medium">Spatial Disagreement</div>
                      <div className="text-[12px] font-bold text-critical mt-0.5">{anomaly.spatialDisagreement}</div>
                    </div>
                  </div>

                  {/* Neighbor stations list */}
                  <div className="space-y-1.5 pt-1">
                    {anomaly.neighbors.map((n) => (
                      <div
                        key={n.stationId}
                        className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-[12px]"
                      >
                        <span className="font-medium text-foreground">{n.stationId}</span>
                        <span className="font-mono text-foreground font-semibold">
                          {n.temperature.toFixed(1)}°C
                        </span>
                        <StatusTag
                          label={n.normal ? "NORMAL" : "ANOMALOUS"}
                          tone={n.normal ? "ok" : "critical"}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ROOT CAUSE ANALYSIS & ACTIONS */}
              <section className="space-y-2.5">
                <h3 className="text-[13px] font-semibold tracking-tight text-foreground uppercase">
                  Root Cause & Operational Recommendation
                </h3>
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-critical/15 text-critical text-[11px] font-bold">
                      !
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-foreground">
                        {anomaly.causes[0] ?? "Probable sensor anomaly"}
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                        {anomaly.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-[12px] text-primary">
                    <Wrench className="size-4 shrink-0 mt-0.5 text-primary" />
                    <div>
                      <span className="font-semibold text-foreground">Recommended Action: </span>
                      <span className="text-muted-foreground">{anomaly.recommendation}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* AUDIT TRAIL */}
              {anomaly.auditTrail && anomaly.auditTrail.length > 0 && (
                <section className="space-y-2.5">
                  <h3 className="text-[13px] font-semibold tracking-tight text-foreground uppercase">
                    Verification & Audit Trail
                  </h3>
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    {anomaly.auditTrail.map((step, idx) => (
                      <div key={step.id} className="flex items-start gap-3">
                        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-[10px] font-bold text-muted-foreground">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-semibold text-foreground">{step.label}</span>
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[10px] font-semibold",
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
                          <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                            {step.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
