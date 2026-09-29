import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AnomalyRecord } from "@/lib/atmos/types";
import { cn } from "@/lib/utils";
import { formatSimDateTime } from "@/services/simulationStore";
import { EvidenceBars } from "./EvidenceBars";
import { Meter, StatusTag, severityColor } from "./primitives";

const EVIDENCE_LABELS = [
  "Adaptive baseline deviation",
  "High rate of change",
  "Spatial disagreement",
  "Multivariate inconsistency",
];

export function AnomalyDrawer({
  anomaly,
  onClose,
}: {
  anomaly: AnomalyRecord | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!anomaly} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-line bg-panel sm:max-w-[520px]"
      >
        {anomaly && (
          <>
            <SheetHeader className="space-y-1 border-b border-line/70 pb-4">
              <SheetTitle className="flex items-center gap-3 font-mono text-[15px] text-foreground">
                {anomaly.id}
                <StatusTag
                  label={anomaly.status === "RESOLVED" ? "RESOLVED" : "ANOMALOUS"}
                  tone={anomaly.status === "RESOLVED" ? "ok" : "critical"}
                />
              </SheetTitle>
              <p className="font-mono text-[11px] text-dim">
                {anomaly.stationId} · {formatSimDateTime(anomaly.detectedAt)} UTC (simulated)
              </p>
            </SheetHeader>

            <div className="space-y-5 px-4 pb-8">
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Type" value={anomaly.type} />
                <Stat
                  label="Severity"
                  value={`${anomaly.severityScore}%`}
                  className={severityColor[anomaly.severity]}
                />
                <Stat label="Confidence" value={`${anomaly.confidence}%`} />
              </div>

              <Block title="Primary reason">
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {anomaly.reason}
                </p>
              </Block>

              <Block title="Detection evidence">
                <EvidenceBars evidence={anomaly.evidence} />
                <ul className="mt-4 space-y-1.5">
                  {EVIDENCE_LABELS.map((label) => (
                    <li key={label} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <span className="text-ok">✓</span>
                      {label}
                    </li>
                  ))}
                </ul>
              </Block>

              <Block title="Observation vs estimate">
                <div className="grid grid-cols-3 gap-2">
                  <Reading label="Measured" value={`${anomaly.observed.toFixed(1)}°C`} tag="MEASURED" tone="critical" />
                  <Reading
                    label="Expected"
                    value={`${anomaly.expectedTemperature.toFixed(1)}°C`}
                    tag="BASELINE"
                    tone="neutral"
                  />
                  <Reading
                    label="Difference"
                    value={`${anomaly.difference > 0 ? "+" : ""}${anomaly.difference.toFixed(1)}°C`}
                    tag="DELTA"
                    tone="watch"
                  />
                </div>
              </Block>

              <Block title="Spatial check">
                <div className="space-y-2">
                  {anomaly.neighbors.map((n) => (
                    <div
                      key={n.stationId}
                      className="flex items-center justify-between rounded-md border border-line/60 bg-panel2/40 px-3 py-2"
                    >
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {n.stationId}
                      </span>
                      <span className="font-mono text-[11px] text-foreground">
                        {n.temperature.toFixed(1)}°C
                      </span>
                      <StatusTag label={n.normal ? "NORMAL" : "ANOM"} tone={n.normal ? "ok" : "critical"} />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between font-mono text-[11px]">
                  <span className="text-dim">REGIONAL CONSENSUS</span>
                  <span className={anomaly.regionalConsensus === "EVENT" ? "text-event" : "text-ok"}>
                    {anomaly.regionalConsensus}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
                  <span className="text-dim">SPATIAL DISAGREEMENT</span>
                  <span className="text-critical">{anomaly.spatialDisagreement}</span>
                </div>
              </Block>

              <Block title="Fault fingerprint">
                <div className="mb-2 font-mono text-[11px] text-dim">
                  LIKELY CAUSE · {anomaly.confidence}% CONFIDENCE
                </div>
                <ul className="space-y-1.5">
                  {anomaly.causes.map((c) => (
                    <li key={c} className="text-[12px] text-muted-foreground">
                      · {c}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 rounded-md border border-primary/25 bg-primary/10 px-3 py-2 text-[12px] text-primary">
                  Recommended: {anomaly.recommendation}
                </p>
              </Block>

              <Block title="Self-healing estimate">
                <p className="mb-3 text-[12px] text-muted-foreground">
                  The measured observation is never overwritten. The estimate is published alongside
                  it for downstream use.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Reading label="Measured" value={`${anomaly.observed.toFixed(1)}°C`} tag="MEASURED" tone="critical" />
                  <Reading
                    label="Estimated"
                    value={`${anomaly.recovery.estimated.toFixed(1)}°C`}
                    tag="ESTIMATED"
                    tone="ok"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-dim">
                  <span>{anomaly.recovery.method.toUpperCase()}</span>
                  <span className="text-ok">{anomaly.recovery.confidence}%</span>
                </div>
                <div className="mt-2">
                  <Meter value={anomaly.recovery.confidence} tone="bg-ok" />
                </div>
              </Block>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="label-mono mb-2">{title}</h3>
      <div className="rounded-lg border border-line/60 bg-panel2/40 p-3">{children}</div>
    </section>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-md border border-line/60 bg-panel2/40 p-2.5">
      <div className="label-mono">{label}</div>
      <div className={cn("mt-1 font-mono text-[12px] text-foreground", className)}>{value}</div>
    </div>
  );
}

function Reading({
  label,
  value,
  tag,
  tone,
}: {
  label: string;
  value: string;
  tag: string;
  tone: "critical" | "ok" | "neutral" | "watch";
}) {
  const toneClass = {
    critical: "text-critical",
    ok: "text-ok",
    watch: "text-watch",
    neutral: "text-foreground",
  }[tone];
  return (
    <div className="rounded-md border border-line/60 bg-background/40 p-2.5">
      <div className="label-mono">{label}</div>
      <div className={cn("mt-1 font-mono text-[15px] font-bold", toneClass)}>{value}</div>
      <div className="mt-1">
        <StatusTag label={tag} tone={tone === "neutral" ? "neutral" : tone} />
      </div>
    </div>
  );
}
