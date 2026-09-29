import type { Evidence } from "@/lib/atmos/types";
import { Meter } from "./primitives";

const ROWS: { key: keyof Evidence; label: string; tone: string }[] = [
  { key: "baseline", label: "Adaptive Baseline", tone: "bg-primary" },
  { key: "spatial", label: "Spatial Disagreement", tone: "bg-event" },
  { key: "rate", label: "Rate of Change", tone: "bg-degraded" },
  { key: "multivariate", label: "Multivariate Consistency", tone: "bg-ok" },
];

export function EvidenceBars({ evidence }: { evidence: Evidence }) {
  return (
    <div className="space-y-3">
      {ROWS.map((row) => (
        <div key={row.key}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground">{row.label}</span>
            <span className="font-mono text-[11px] text-foreground">{evidence[row.key]}%</span>
          </div>
          <Meter value={evidence[row.key]} tone={row.tone} />
        </div>
      ))}
    </div>
  );
}
