import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Cpu,
  Flame,
  LayoutDashboard,
  MapPin,
  Menu,
  Network,
  Pause,
  Play,
  Radio,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SCENARIO_MAP } from "@/data/scenarios";
import { formatSimTime, useSimulation } from "@/services/simulationStore";
import { Dot } from "./primitives";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const NAV = [
  {
    group: "Observational Grid",
    items: [
      { to: "/", label: "Overview", icon: LayoutDashboard },
      { to: "/live-monitoring", label: "Live Monitoring", icon: Activity },
      { to: "/stations", label: "Stations", icon: Radio },
      { to: "/anomalies", label: "Anomalies", icon: AlertTriangle },
      { to: "/sensor-health", label: "Sensor Health", icon: ShieldAlert },
      { to: "/network-map", label: "Network Map", icon: Network },
    ],
  },
  {
    group: "Machine Intelligence",
    items: [
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/system-intelligence", label: "System Intelligence", icon: Cpu },
    ],
  },
] as const;

const TITLES: Record<string, { title: string; meta: string }> = {
  "/": { title: "Overview", meta: "AWS NETWORK · 8 NODES · REGION WEST" },
  "/live-monitoring": { title: "Live Monitoring", meta: "STREAMING TELEMETRY · 1.5s CYCLE" },
  "/stations": { title: "Stations", meta: "NODE REGISTRY & CURRENT OBSERVATIONS" },
  "/anomalies": { title: "Anomalies", meta: "DETECTION LOG & EVIDENCE BREAKDOWN" },
  "/sensor-health": { title: "Sensor Health", meta: "PREDICTIVE DEGRADATION TRACKING" },
  "/network-map": { title: "Network Map", meta: "SCHEMATIC GEOGRAPHIC TOPOLOGY" },
  "/analytics": { title: "Analytics", meta: "AGGREGATE TRENDS & DISTRIBUTIONS" },
  "/system-intelligence": { title: "System Intelligence", meta: "ADAPTIVE BASELINE & QC PIPELINE" },
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { anomalies, running, scenario, simTime, start, pause, reset, setScenario } =
    useSimulation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const openAnomalies = anomalies.filter((a) => a.status !== "RESOLVED");
  const openCount = openAnomalies.length;
  const page = TITLES[pathname] ?? {
    title: "A.T.M.O.S",
    meta: "Adaptive Tracking & Monitoring of Observational Sensors",
  };
  const scenarioDef = SCENARIO_MAP.get(scenario);
  const scenarioLabel = scenarioDef?.label ?? "Normal Conditions";
  const isSpikeActive = scenario === "temperature_spike";

  const renderNavLinks = () => (
    <div className="space-y-4">
      {NAV.map((group) => (
        <div key={group.group}>
          <div className="label-mono px-2 pt-2 pb-1.5 text-[10px] tracking-wider text-dim">
            {group.group}
          </div>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-primary/12 font-semibold text-primary ring-1 ring-primary/25"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      active
                        ? "text-primary"
                        : item.label === "Anomalies" && openCount > 0
                          ? "text-critical"
                          : "text-muted-foreground/80",
                    )}
                  />
                  <span>{item.label}</span>
                  {item.label === "Anomalies" && openCount > 0 && (
                    <span className="ml-auto inline-flex items-center rounded-full bg-critical/15 px-2 py-0.5 font-mono text-[10px] font-bold text-critical">
                      {openCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative flex min-h-screen bg-background text-foreground">
      {/* Subtle ambient lighting */}
      <div className="pointer-events-none fixed -top-40 -left-40 size-[540px] rounded-full bg-primary/6 blur-[130px]" />
      <div className="pointer-events-none fixed top-1/3 -right-40 size-[480px] rounded-full bg-degraded/5 blur-[130px]" />

      {/* Desktop Sidebar */}
      <aside className="relative z-20 hidden w-[250px] shrink-0 flex-col border-r border-line/70 bg-panel/60 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-line/70 px-5">
          <div className="grid size-9 place-items-center rounded-lg border border-primary/30 bg-primary/10 shadow-sm shadow-primary/10">
            <Radio className="size-4 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[14px] font-bold tracking-tight text-primary">
                A.T.M.O.S
              </span>
              <span className="rounded bg-primary/15 px-1 py-0.2 font-mono text-[9px] text-primary">
                SIH
              </span>
            </div>
            <div className="font-mono text-[10px] text-muted-foreground/80">Sensor Intelligence</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">{renderNavLinks()}</nav>

        {/* Quick Demo Trigger Box in Sidebar */}
        <div className="space-y-2 border-t border-line/70 p-3">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="flex items-center gap-1 text-primary">
                <Sparkles className="size-3 text-primary" /> SIH DEMO SCENARIO
              </span>
              <span className="text-dim">AWS-003</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              Inject 55°C heat spike on AWS-003 to test adaptive baseline & neighbor consensus.
            </p>
            <button
              onClick={() => setScenario("temperature_spike")}
              className={cn(
                "mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[11px] font-semibold transition-all",
                isSpikeActive
                  ? "border-critical/60 bg-critical/20 text-critical shadow-sm shadow-critical/20"
                  : "border-primary/40 bg-primary/15 text-primary hover:bg-primary/25",
              )}
            >
              <Flame className="size-3.5" />
              {isSpikeActive ? "Spike Active (55°C)" : "Trigger 55°C Spike"}
            </button>
          </div>

          <div className="rounded-lg border border-line/70 bg-panel2/60 p-2.5 font-mono text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-dim">SYSTEM STATUS</span>
              <span className="flex items-center gap-1.5 text-ok font-semibold">
                <Dot className="bg-ok" /> OPERATIONAL
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-dim">SIMULATION</span>
              <span className={running ? "text-primary font-semibold" : "text-dim"}>
                {running ? "STREAMING" : "PAUSED"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] border-line bg-panel p-0">
          <SheetHeader className="border-b border-line/70 p-4">
            <SheetTitle className="flex items-center gap-2.5 font-mono text-[14px] text-primary">
              <div className="grid size-8 place-items-center rounded border border-primary/30 bg-primary/10">
                <Radio className="size-4 text-primary" />
              </div>
              <div>
                <div>A.T.M.O.S</div>
                <div className="font-sans text-[10px] font-normal text-muted-foreground">
                  Adaptive Tracking & Monitoring
                </div>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="p-3">{renderNavLinks()}</div>
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line/70 bg-panel/40 px-4 backdrop-blur-xl sm:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open Navigation Menu"
            className="grid size-9 place-items-center rounded-md border border-line/70 bg-panel2/60 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <Menu className="size-4" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-bold tracking-tight">{page.title}</h1>
            <div className="label-mono mt-0.5 truncate text-dim">{page.meta}</div>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* Active Scenario Pill */}
            <div className="hidden items-center gap-2 rounded-md border border-line/70 bg-panel2/60 px-2.5 py-1.5 sm:flex">
              <Dot className={running ? "bg-primary" : "bg-dim"} />
              <span className="font-mono text-[11px] text-primary">{scenarioLabel}</span>
            </div>

            {/* Quick Play/Pause & Reset in header */}
            <div className="flex items-center gap-1 rounded-md border border-line/70 bg-panel2/60 p-0.5">
              <button
                onClick={running ? pause : start}
                title={running ? "Pause simulation stream" : "Start simulation stream"}
                className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              >
                {running ? <Pause className="size-3.5" /> : <Play className="size-3.5 text-primary" />}
              </button>
              <button
                onClick={reset}
                title="Reset simulation to initial state"
                className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>

            {/* Simulation Clock */}
            <div className="hidden items-center gap-2 rounded-md border border-line/70 bg-panel2/60 px-3 py-1.5 md:flex">
              <span className="label-mono">SIM TIME</span>
              <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground">
                {formatSimTime(simTime)}
              </span>
            </div>

            {/* Anomaly bell button */}
            <Link
              to="/anomalies"
              aria-label="View Anomalies"
              className={cn(
                "relative grid size-9 place-items-center rounded-md border transition-colors",
                openCount > 0
                  ? "border-critical/50 bg-critical/10 text-critical"
                  : "border-line/70 bg-panel2/60 text-muted-foreground hover:text-foreground",
              )}
            >
              <Bell className="size-4" />
              {openCount > 0 && (
                <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-critical font-mono text-[9px] font-bold text-background animate-pulse">
                  {openCount}
                </span>
              )}
            </Link>

            {/* User profile avatar */}
            <div className="flex items-center gap-2.5 border-l border-line/70 pl-3">
              <div className="grid size-8 place-items-center rounded-full border border-primary/30 bg-primary/10 font-mono text-[11px] font-bold text-primary">
                OP
              </div>
              <div className="hidden leading-tight xl:block">
                <div className="text-[12px] font-semibold">Duty Operator</div>
                <div className="label-mono text-[9px]">SIH Console 01</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-4 px-4 py-5 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
