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
    <section className={cn("console-panel rise-in p-5 transition-shadow", className)}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            {title && (
              <h2 className="text-[14px] font-semibold tracking-tight text-foreground">
                {title}
              </h2>
            )}
            {meta && <div className="mt-0.5 text-[11px] font-normal text-muted-foreground">{meta}</div>}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function Dot({ className }: { className?: string }) {
  return <span className={cn("size-2 rounded-full pulse-dot inline-block", className)} />;
}

export function StatusTag({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "ok" | "watch" | "degraded" | "critical" | "event" | "primary";
}) {
  const tones: Record<string, string> = {
    neutral: "border-border text-muted-foreground bg-muted/60",
    primary: "border-primary/30 text-primary bg-primary/10",
    ok: "border-ok/30 text-ok bg-ok/10",
    watch: "border-watch/30 text-watch bg-watch/10",
    degraded: "border-degraded/30 text-degraded bg-degraded/10",
    critical: "border-critical/30 text-critical bg-critical/10",
    event: "border-event/30 text-event bg-event/10",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-normal",
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
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  note?: string;
  icon?: any;
  tone?: "neutral" | "ok" | "watch" | "degraded" | "critical" | "primary";
}) {
  const valueTone: Record<string, string> = {
    neutral: "text-foreground",
    primary: "text-primary",
    ok: "text-ok",
    watch: "text-watch",
    degraded: "text-degraded",
    critical: "text-critical",
  };

  const iconBg: Record<string, string> = {
    neutral: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    ok: "bg-ok/10 text-ok",
    watch: "bg-watch/10 text-watch",
    degraded: "bg-degraded/10 text-degraded",
    critical: "bg-critical/10 text-critical",
  };

  return (
    <div
      className={cn(
        "rise-in rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 shadow-xs",
        tone === "critical" && "border-critical/30 bg-critical/5",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <div className={cn("flex size-7 items-center justify-center rounded-lg", iconBg[tone])}>
            <Icon className="size-3.5" />
          </div>
        )}
      </div>
      <div className={cn("mt-2 text-2xl font-bold tracking-tight", valueTone[tone])}>
        {value}
      </div>
      {note && <div className="mt-1 text-[11px] text-muted-foreground">{note}</div>}
    </div>
  );
}

export function Meter({ value, tone = "bg-primary" }: { value: number; tone?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all duration-500", tone)}
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
      <p className="text-[13px] font-medium text-muted-foreground">{message}</p>
    </div>
  );
}
