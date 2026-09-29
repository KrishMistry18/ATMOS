import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Cpu,
  Flame,
  LayoutDashboard,
  Menu,
  Moon,
  Network,
  Pause,
  Play,
  Radio,
  RotateCcw,
  ShieldAlert,
  Sun,
  CloudSun,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SCENARIO_MAP } from "@/data/scenarios";
import { formatSimTime, useSimulation } from "@/services/simulationStore";
import { useTheme } from "@/services/themeContext";
import { Dot } from "./primitives";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const NAV_SECTIONS = [
  {
    group: "OBSERVATIONAL NETWORK",
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
    group: "INTELLIGENCE",
    items: [
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/system-intelligence", label: "System Intelligence", icon: Cpu },
    ],
  },
] as const;

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Overview", subtitle: "AWS Network • 8 Monitoring Stations" },
  "/live-monitoring": { title: "Live Monitoring", subtitle: "Real-time Telemetry & Ingestion Stream" },
  "/stations": { title: "Stations", subtitle: "Observational Network & Telemetry Baselines" },
  "/anomalies": { title: "Anomalies", subtitle: "Incident Management & Quality Control Log" },
  "/sensor-health": { title: "Sensor Health", subtitle: "Fleet Degradation & Predictive Reliability" },
  "/network-map": { title: "Network Map", subtitle: "Geospatial Sensor Distribution & Consensus" },
  "/analytics": { title: "Analytics", subtitle: "Network Performance, Trends & Incident Lifecycle" },
  "/system-intelligence": { title: "System Intelligence", subtitle: "Adaptive Baselines • Multivariate Detection • Spatial Consensus" },
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { anomalies, running, scenario, simTime, start, pause, reset, setScenario } =
    useSimulation();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const openAnomalies = anomalies.filter((a) => a.status !== "RESOLVED");
  const openCount = openAnomalies.length;
  const page = PAGE_META[pathname] ?? {
    title: "A.T.M.O.S",
    subtitle: "Adaptive Tracking & Monitoring of Observational Sensors",
  };
  const scenarioDef = SCENARIO_MAP.get(scenario);
  const scenarioLabel = scenarioDef?.label ?? "Normal Conditions";
  const isSpikeActive = scenario === "temperature_spike";

  const renderNavLinks = () => (
    <div className="space-y-6">
      {NAV_SECTIONS.map((section) => (
        <div key={section.group}>
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {section.group}
          </div>
          <div className="space-y-1">
            {section.items.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-all",
                    active
                      ? "bg-primary/10 text-primary font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active
                          ? "text-primary"
                          : item.label === "Anomalies" && openCount > 0
                            ? "text-critical"
                            : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.label === "Anomalies" && openCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-critical/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-critical">
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
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased select-none-if-needed">
      {/* ========================================================
          FIXED SIDEBAR (Always 100vh, never disappears on scroll)
         ======================================================== */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        {/* Top Branding */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <CloudSun className="size-5" />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-[15px] font-bold tracking-tight text-foreground">
                A.T.M.O.S
              </span>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                PRO
              </span>
            </div>
            <div className="truncate text-[11px] font-medium text-muted-foreground">
              Adaptive Sensor Intelligence
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">{renderNavLinks()}</nav>

        {/* Bottom Section: SIH Quick Action & Status */}
        <div className="shrink-0 space-y-2.5 border-t border-border p-3.5 bg-card">
          {/* Quick SIH Demo Box */}
          <div className="rounded-lg border border-border bg-muted/50 p-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Flame className="size-3.5 text-primary" />
                SIH Demo Spike
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">AWS-003</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
              Inject 55°C temperature spike to test spatial consensus.
            </p>
            <button
              onClick={() => setScenario("temperature_spike")}
              className={cn(
                "mt-2 flex w-full items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
                isSpikeActive
                  ? "bg-critical text-destructive-foreground shadow-xs"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs",
              )}
            >
              <Flame className="size-3" />
              {isSpikeActive ? "Spike Active (55°C)" : "Trigger 55°C Spike"}
            </button>
          </div>

          {/* System & Simulation Status */}
          <div className="rounded-lg border border-border bg-panel2 p-2.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">SYSTEM STATUS</span>
              <span className="flex items-center gap-1.5 font-semibold text-ok">
                <Dot className="bg-ok" /> Operational
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-muted-foreground font-medium">SIMULATION</span>
              <span className={cn("font-semibold", running ? "text-primary" : "text-muted-foreground")}>
                {running ? "Running" : "Paused"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-r border-border bg-card p-0">
          <SheetHeader className="border-b border-border p-5 text-left">
            <SheetTitle className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <CloudSun className="size-5" />
              </div>
              <div>
                <div className="text-[15px] font-bold text-foreground">A.T.M.O.S</div>
                <div className="text-[11px] font-normal text-muted-foreground">
                  Adaptive Sensor Intelligence
                </div>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="p-3.5 overflow-y-auto">{renderNavLinks()}</div>
        </SheetContent>
      </Sheet>

      {/* ========================================================
          MAIN WRAPPER (Header + Independently Scrollable Content)
         ======================================================== */}
      <div className="flex flex-1 flex-col h-screen min-w-0 overflow-hidden">
        {/* ========================================================
            TOP HEADER (Sticky, always visible)
           ======================================================== */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open Navigation Menu"
              className="flex size-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            >
              <Menu className="size-4" />
            </button>

            {/* Current Page Title & Subtitle */}
            <div className="min-w-0">
              <h1 className="truncate text-[16px] font-bold tracking-tight text-foreground">
                {page.title}
              </h1>
              <p className="truncate text-[11px] font-medium text-muted-foreground">
                {page.subtitle}
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active Scenario Indicator */}
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-1.5 text-[12px] md:flex">
              <Dot className={running ? "bg-primary" : "bg-muted-foreground"} />
              <span className="font-medium text-foreground">{scenarioLabel}</span>
            </div>

            {/* Simulation Controls: Play / Pause / Reset */}
            <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
              <button
                onClick={running ? pause : start}
                title={running ? "Pause simulation stream" : "Start simulation stream"}
                className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                {running ? <Pause className="size-3.5" /> : <Play className="size-3.5 text-primary" />}
              </button>
              <button
                onClick={reset}
                title="Reset simulation to initial state"
                className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>

            {/* Simulation Clock */}
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 lg:flex">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">SIM TIME</span>
              <span className="font-mono text-[12px] font-medium tabular-nums text-foreground">
                {formatSimTime(simTime)}
              </span>
            </div>

            {/* Notifications / Anomaly Bell */}
            <Link
              to="/anomalies"
              aria-label="View Anomalies"
              className={cn(
                "relative flex size-8 items-center justify-center rounded-lg border transition-colors",
                openCount > 0
                  ? "border-critical/40 bg-critical/10 text-critical"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Bell className="size-4" />
              {openCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-critical font-mono text-[9px] font-bold text-white shadow-xs">
                  {openCount}
                </span>
              )}
            </Link>

            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
              className="flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {theme === "dark" ? (
                <Sun className="size-4 text-amber-400" />
              ) : (
                <Moon className="size-4 text-slate-700" />
              )}
            </button>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2.5 border-l border-border pl-2 sm:pl-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 font-sans text-[11px] font-bold text-primary">
                OP
              </div>
              <div className="hidden leading-tight xl:block">
                <div className="text-[12px] font-semibold text-foreground">Duty Operator</div>
                <div className="text-[10px] text-muted-foreground">Regional Command</div>
              </div>
            </div>
          </div>
        </header>

        {/* ========================================================
            MAIN CONTENT AREA (Independently scrollable)
           ======================================================== */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
