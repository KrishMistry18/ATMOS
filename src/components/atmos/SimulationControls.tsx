import { Flame, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCENARIOS } from "@/data/scenarios";
import { useSimulation } from "@/services/simulationStore";
import { Panel } from "./primitives";

export function SimulationControls({ compact = false }: { compact?: boolean }) {
  const { running, speed, scenario, setScenario, start, pause, reset, setSpeed, tick } =
    useSimulation();

  return (
    <Panel
      title="Simulation Control Engine"
      meta={
        running
          ? `Stream Active • Cycle #${tick} • ${speed}x Speed`
          : `Stream Paused • Cycle #${tick}`
      }
    >
      {/* Primary 1-Click SIH Demo Action */}
      <button
        onClick={() => setScenario("temperature_spike")}
        className={cn(
          "w-full rounded-xl border p-3.5 text-left transition-all mb-3.5 shadow-xs",
          scenario === "temperature_spike"
            ? "border-critical/40 bg-critical/10 text-critical ring-1 ring-critical/20"
            : "border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] font-bold">
            <Flame className="size-4 shrink-0 text-critical" />
            <span>PRIMARY SIH DEMO: 55°C SPIKE</span>
          </div>
          <span className="rounded bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
            AWS-003
          </span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
          Injects a 55.0°C spike (+23.2°C delta) while neighbors remain normal. Tests
          adaptive baseline, 91% severity, 96% confidence & self-healing estimate.
        </p>
      </button>

      {/* Main Transport Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={running ? pause : start}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors shadow-xs",
            running
              ? "border-watch/40 bg-watch/10 text-watch hover:bg-watch/20"
              : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
          )}
        >
          {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {running ? "Pause" : "Resume"}
        </button>

        <button
          onClick={reset}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground hover:bg-muted shadow-xs"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>

        {/* Speed toggle */}
        <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
          {[1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={cn(
                "flex-1 rounded-md text-[11px] font-semibold transition-colors",
                speed === s
                  ? "bg-card text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* All Scenarios Selector */}
      <div className="mt-4 mb-2 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
        <span>Fault & Phenomenon Scenarios</span>
        <span>8 Scenarios</span>
      </div>

      <div className="grid gap-1.5 max-h-[300px] overflow-y-auto pr-1">
        {SCENARIOS.map((s) => {
          const active = scenario === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-left transition-all",
                active
                  ? "border-primary/50 bg-primary/10 ring-1 ring-primary/20"
                  : "border-border bg-card/60 hover:border-primary/30 hover:bg-muted/60",
              )}
            >
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "text-[12px] font-semibold",
                    active ? "text-primary" : "text-foreground",
                  )}
                >
                  {s.label}
                </div>
                <span className="font-mono text-[10px] text-muted-foreground font-medium">
                  {s.target}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                {s.description}
              </div>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
