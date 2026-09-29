import { cn } from "@/lib/utils";
import type { HealthState, Severity } from "@/lib/atmos/types";
import type { ReactNode } from "react";

export const stateColor: Record<HealthState, string> = {
  HEALTHY: "text-ok",
  WATCH: "text-watch",
  DEGRADED: "text-degraded",
  CRITICAL: "text-critical",
};

export const stateDot: Record<HealthState, string> = {
  HEALTHY: "bg-ok",
  WATCH: "bg-watch",
  DEGRADED: "bg-degraded",
  CRITICAL: "bg-critical",
};

export const severityColor: Record<Severity, string> = {
  Low: "text-muted-foreground",
  Moderate: "text-watch",
  High: "text-degraded",
  Critical: "text-critical",
};

export function Panel({
  title,
  meta,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("console-panel rise-in p-4", className)}>
      {(title || action) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-[13px] font-semibold tracking-tight uppercase text-primary/85">
                {title}
              </h2>
            )}
            {meta && <div className="label-mono mt-0.5">{meta}</div>}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function Dot({ className }: { className?: string }) {
  return <span className={cn("size-1.5 rounded-full pulse-dot", className)} />;
}

export function StatusTag({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "ok" | "watch" | "degraded" | "critical" | "event";
}) {
  const tones: Record<string, string> = {
    neutral: "border-line text-muted-foreground bg-panel2/60",
    ok: "border-ok/30 text-ok bg-ok/10",
    watch: "border-watch/30 text-watch bg-watch/10",
    degraded: "border-degraded/30 text-degraded bg-degraded/10",
    critical: "border-critical/40 text-critical bg-critical/10",
    event: "border-event/30 text-event bg-event/10",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase",
        tones[tone],
      )}
    >
      {label}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  note?: string;
  tone?: "neutral" | "ok" | "watch" | "degraded" | "critical";
}) {
  const valueTone: Record<string, string> = {
    neutral: "text-foreground",
    ok: "text-ok",
    watch: "text-watch",
    degraded: "text-degraded",
    critical: "text-critical",
  };
  return (
    <div
      className={cn(
        "rise-in rounded-lg border p-3.5 transition-colors",
        tone === "critical"
          ? "border-critical/30 bg-critical/5"
          : "border-line/70 bg-panel/60 hover:border-primary/30",
      )}
    >
      <div className="label-mono">{label}</div>
      <div className={cn("mt-2 font-mono text-2xl font-bold tabular-nums", valueTone[tone])}>
        {value}
      </div>
      {note && <div className="mt-1 font-mono text-[10px] text-dim">{note}</div>}
    </div>
  );
}

export function Meter({ value, tone = "bg-primary" }: { value: number; tone?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/80">
      <div
        className={cn("h-full rounded-full transition-all duration-500", tone)}
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-line/70 bg-panel2/30 py-10 text-center">
      <p className="font-mono text-[11px] tracking-wider uppercase text-dim">{message}</p>
    </div>
  );
}
