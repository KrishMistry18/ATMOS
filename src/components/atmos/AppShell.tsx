import { Link, useRouterState } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SCENARIO_MAP } from "@/data/scenarios";
import { formatSimTime, useSimulation } from "@/services/simulationStore";
import { Dot } from "./primitives";

const NAV = [
  {
    group: "Monitor",
    items: [
      { to: "/", label: "Overview" },
      { to: "/live-monitoring", label: "Live Monitoring" },
      { to: "/stations", label: "Stations" },
      { to: "/anomalies", label: "Anomalies" },
      { to: "/sensor-health", label: "Sensor Health" },
      { to: "/network-map", label: "Network Map" },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { to: "/analytics", label: "Analytics" },
      { to: "/system-intelligence", label: "System Intelligence" },
    ],
  },
] as const;

const TITLES: Record<string, { title: string; meta: string }> = {
  "/": { title: "Overview", meta: "AWS NETWORK · 8 NODES · REGION WEST" },
  "/live-monitoring": { title: "Live Monitoring", meta: "STREAMING TELEMETRY · 1.5s CYCLE" },
  "/stations": { title: "Stations", meta: "NODE REGISTRY & CURRENT OBSERVATIONS" },
  "/anomalies": { title: "Anomalies", meta: "DETECTION LOG & EVIDENCE" },
  "/sensor-health": { title: "Sensor Health", meta: "PREDICTIVE DEGRADATION TRACKING" },
  "/network-map": { title: "Network Map", meta: "SCHEMATIC GEOGRAPHIC LAYOUT" },
  "/analytics": { title: "Analytics", meta: "AGGREGATE TRENDS & DISTRIBUTIONS" },
  "/system-intelligence": { title: "System Intelligence", meta: "ADAPTIVE BASELINE PIPELINE" },
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { anomalies, running, scenario, simTime } = useSimulation();
  const open = anomalies.filter((a) => a.status !== "RESOLVED").length;
  const page = TITLES[pathname] ?? { title: "A.T.M.O.S", meta: "" };
  const scenarioLabel = SCENARIO_MAP.get(scenario)?.label ?? "Normal Conditions";

  return (
    <div className="relative flex min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed -top-40 -left-40 size-[520px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none fixed top-1/3 -right-40 size-[460px] rounded-full bg-degraded/5 blur-[120px]" />

      <aside className="relative z-10 hidden w-[236px] shrink-0 flex-col border-r border-line/70 bg-panel/60 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-line/70 px-5">
          <div className="grid size-8 place-items-center rounded-md border border-primary/20 bg-primary/10">
            <Dot className="bg-primary" />
          </div>
          <div className="leading-none">
            <div className="text-[13px] font-bold tracking-tight text-primary">A.T.M.O.S</div>
            <div className="label-mono mt-1">Sensor Grid</div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {NAV.map((group) => (
            <div key={group.group}>
              <div className="label-mono px-2 pt-3 pb-2">{group.group}</div>
              {group.items.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors",
                      active
                        ? "bg-primary/10 font-medium text-primary ring-1 ring-primary/20"
                        : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        active
                          ? "bg-primary"
                          : item.label === "Anomalies" && open
                            ? "bg-critical"
                            : "bg-dim",
                      )}
                    />
                    {item.label}
                    {item.label === "Anomalies" && open > 0 && (
                      <span className="ml-auto rounded bg-critical/15 px-1.5 py-0.5 font-mono text-[10px] text-critical">
                        {open}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="space-y-2 px-3 pb-4">
          <div className="rounded-lg border border-line/70 bg-panel2/60 p-3">
            <div className="flex items-center justify-between">
              <span className="label-mono">System</span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-ok">
                <Dot className="bg-ok" /> ONLINE
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[10px]">
              <span className="text-dim">SIM MODE</span>
              <span className={running ? "text-primary" : "text-dim"}>
                {running ? "ACTIVE" : "PAUSED"}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[10px]">
              <span className="text-dim">VERSION</span>
              <span className="text-muted-foreground">v0.9.3-demo</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line/70 bg-panel/40 px-4 backdrop-blur-xl sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-bold tracking-tight">{page.title}</h1>
            <div className="label-mono mt-0.5 truncate">{page.meta}</div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-md border border-line/70 bg-panel2/60 px-3 py-1.5 md:flex">
              <Dot className={running ? "bg-primary" : "bg-dim"} />
              <span className="font-mono text-[11px] text-primary">{scenarioLabel}</span>
            </div>
            <div className="hidden items-center gap-2 rounded-md border border-line/70 bg-panel2/60 px-3 py-1.5 sm:flex">
              <span className="label-mono">Last update</span>
              <span className="font-mono text-[11px] tabular-nums">{formatSimTime(simTime)}</span>
            </div>
            <button
              aria-label="Notifications"
              className="relative grid size-9 place-items-center rounded-md border border-line/70 bg-panel2/60 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Bell className="size-4" />
              {open > 0 && (
                <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-critical font-mono text-[9px] text-background">
                  {open}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2.5 border-l border-line/70 pl-3">
              <div className="grid size-8 place-items-center rounded-full border border-primary/20 bg-primary/10 font-mono text-[11px] font-bold text-primary">
                OP
              </div>
              <div className="hidden leading-tight sm:block">
                <div className="text-[12px] font-medium">Duty Operator</div>
                <div className="label-mono">Console 01</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-4 px-4 py-5 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
