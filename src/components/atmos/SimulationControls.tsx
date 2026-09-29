import { Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCENARIOS } from "@/data/scenarios";
import { useSimulation } from "@/services/simulationStore";
import { Panel } from "./primitives";

export function SimulationControls({ compact = false }: { compact?: boolean }) {
  const { running, scenario, setScenario, start, pause, reset } = useSimulation();

  return (
    <Panel
      title="Simulation Mode"
      meta={running ? "STREAM RUNNING · 1.5s CYCLE" : "STREAM PAUSED"}
      className={compact ? "" : ""}
    >
      <div className="flex gap-2">
        <button
          onClick={running ? pause : start}
          className="flex flex-1 items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 font-mono text-[11px] tracking-wider uppercase text-primary transition-colors hover:bg-primary/20"
        >
          {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {running ? "Pause" : "Start"}
        </button>
        <button
          onClick={reset}
          className="flex items-center justify-center gap-2 rounded-md border border-line/70 bg-panel2/60 px-3 py-2 font-mono text-[11px] tracking-wider uppercase text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>

      <div className="label-mono mt-4 mb-2">Scenario Injection</div>
      <div className="grid gap-1.5">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => setScenario(s.id)}
            className={cn(
              "rounded-md border px-3 py-2 text-left transition-colors",
              scenario === s.id
                ? "border-primary/40 bg-primary/10"
                : "border-line/60 bg-panel2/40 hover:border-primary/25",
            )}
          >
            <div
              className={cn(
                "text-[12px] font-medium",
                scenario === s.id ? "text-primary" : "text-foreground",
              )}
            >
              {s.label}
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-dim">{s.description}</div>
          </button>
        ))}
      </div>
    </Panel>
  );
}
