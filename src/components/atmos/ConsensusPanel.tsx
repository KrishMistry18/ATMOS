import { cn } from "@/lib/utils";
import { neighborsOf } from "@/data/stations";
import { useSimulation } from "@/services/simulationStore";
import { Panel, StatusTag } from "./primitives";

export function ConsensusPanel({ stationId }: { stationId: string }) {
  const { latest, assess } = useSimulation();
  const assessment = assess(stationId);
  const target = latest[stationId];
  const neighbors = neighborsOf(stationId, 4);

  return (
    <Panel title="Spatio-Temporal Consensus" meta={`TARGET ${stationId} · ${neighbors.length} NEIGHBOURS`}>
      <div className="space-y-2">
        <Row
          id={stationId}
          value={target?.temperature ?? 0}
          anomalous={assessment.anomalous}
          highlight
        />
        {neighbors.map((id) => (
          <Row
            key={id}
            id={id}
            value={latest[id]?.temperature ?? 0}
            anomalous={assess(id).anomalous}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-line/60 bg-panel2/50 p-3">
          <div className="label-mono">Regional Consensus</div>
          <div
            className={cn(
              "mt-1 font-mono text-[13px]",
              assessment.regionalConsensus === "EVENT" ? "text-event" : "text-ok",
            )}
          >
            {assessment.regionalConsensus}
          </div>
        </div>
        <div className="rounded-md border border-line/60 bg-panel2/50 p-3">
          <div className="label-mono">Spatial Disagreement</div>
          <div
            className={cn(
              "mt-1 font-mono text-[13px]",
              assessment.spatialDisagreement === "HIGH"
                ? "text-critical"
                : assessment.spatialDisagreement === "MODERATE"
                  ? "text-watch"
                  : "text-ok",
            )}
          >
            {assessment.spatialDisagreement}
          </div>
        </div>
      </div>

      <p className="mt-3 rounded-md border border-line/60 bg-background/40 px-3 py-2 text-[12px] text-muted-foreground">
        {assessment.regionalConsensus === "EVENT"
          ? "Neighbouring stations shifted together — treated as a genuine regional weather event, not a sensor fault."
          : assessment.anomalous
            ? `${stationId} disagrees with its neighbourhood by ${Math.abs(assessment.difference).toFixed(1)}°C — consistent with an isolated sensor anomaly.`
            : "All stations agree within the expected spatial envelope."}
      </p>
    </Panel>
  );
}

function Row({
  id,
  value,
  anomalous,
  highlight,
}: {
  id: string;
  value: number;
  anomalous: boolean;
  highlight?: boolean;
}) {
  const pct = Math.max(4, Math.min(100, ((value - 10) / 50) * 100));
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border px-2.5 py-2",
        anomalous ? "border-critical/40 bg-critical/10" : "border-line/60 bg-panel2/40",
        highlight && "ring-1 ring-primary/20",
      )}
    >
      <span
        className={cn("w-[68px] font-mono text-[11px]", anomalous ? "text-critical" : "text-muted-foreground")}
      >
        {id}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-background/80">
        <div
          className={cn("h-full rounded-full transition-all", anomalous ? "bg-critical" : "bg-ok")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn("w-16 text-right font-mono text-[11px]", anomalous ? "text-critical" : "text-foreground")}
      >
        {value.toFixed(1)}°C
      </span>
      <StatusTag label={anomalous ? "ANOM" : "NORMAL"} tone={anomalous ? "critical" : "ok"} />
    </div>
  );
}
