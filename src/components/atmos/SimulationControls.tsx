import { Flame, Gauge, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
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
          ? `STREAM ACTIVE · CYCLE #${tick} · ${speed}x SPEED`
          : `STREAM PAUSED · CYCLE #${tick}`
      }
    >
      {/* Primary 1-Click SIH Demo Action */}
      <button
        onClick={() => setScenario("temperature_spike")}
        className={cn(
          "w-full rounded-lg border p-3 text-left transition-all mb-3",
          scenario === "temperature_spike"
            ? "border-critical/60 bg-critical/15 text-critical ring-1 ring-critical/30 shadow-sm shadow-critical/10"
            : "border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[12px] font-bold">
            <Flame className="size-4 shrink-0" />
            PRIMARY SIH DEMO: 55°C SPIKE
          </div>
          <span className="rounded bg-primary/20 px-1.5 py-0.5 font-mono text-[9px] uppercase font-bold text-primary">
            AWS-003
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground font-sans">
          Fires 55.0°C spike on AWS-003 (+23.2°C delta) while neighbors remain normal. Tests
          adaptive baseline, 91% severity, 96% confidence & self-healing estimate.
        </p>
      </button>

      {/* Main Transport Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={running ? pause : start}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 font-mono text-[11px] tracking-wider uppercase font-semibold transition-colors",
            running
              ? "border-watch/40 bg-watch/10 text-watch hover:bg-watch/20"
              : "border-ok/40 bg-ok/10 text-ok hover:bg-ok/20",
          )}
        >
          {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {running ? "Pause" : "Resume"}
        </button>

        <button
          onClick={reset}
          className="flex items-center justify-center gap-1.5 rounded-md border border-line/70 bg-panel2/60 px-3 py-2 font-mono text-[11px] tracking-wider uppercase text-muted-foreground transition-colors hover:text-foreground hover:bg-panel2"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>

        {/* Speed toggle */}
        <div className="flex rounded-md border border-line/70 bg-panel2/60 p-0.5">
          {[1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={cn(
                "flex-1 rounded font-mono text-[10px] font-bold transition-colors",
                speed === s
                  ? "bg-primary text-primary-foreground"
                  : "text-dim hover:text-foreground",
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* All Scenarios Selector */}
      <div className="label-mono mt-4 mb-2 text-[10px] text-dim flex items-center justify-between">
        <span>Fault & Phenomenon Scenarios</span>
        <span className="text-[9px]">8 TOTAL</span>
      </div>

      <div className="grid gap-1.5 max-h-[320px] overflow-y-auto pr-1">
        {SCENARIOS.map((s) => {
          const active = scenario === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
              className={cn(
                "rounded-md border px-3 py-2 text-left transition-all",
                active
                  ? "border-primary/50 bg-primary/12 ring-1 ring-primary/25"
                  : "border-line/60 bg-panel2/40 hover:border-primary/30 hover:bg-panel2/70",
              )}
            >
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "text-[12px] font-bold font-mono",
                    active ? "text-primary" : "text-foreground",
                  )}
                >
                  {s.label}
                </div>
                <span className="font-mono text-[9px] text-dim">{s.target}</span>
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-dim leading-tight">
                {s.description}
              </div>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
