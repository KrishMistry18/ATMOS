import { cn } from "@/lib/utils";
import { STATION_MAP, neighborsOf } from "@/data/stations";
import { useSimulation } from "@/services/simulationStore";
import { Panel, StatusTag } from "./primitives";
import { AlertCircle, CheckCircle, Radio } from "lucide-react";

export function ConsensusPanel({ stationId }: { stationId: string }) {
  const { latest, assess, expectedFor } = useSimulation();
  const assessment = assess(stationId);
  const targetStation = STATION_MAP.get(stationId);
  const targetObs = latest[stationId];
  const targetExpected = expectedFor(stationId);
  const neighbors = neighborsOf(stationId, 3);

  const isAnomalous = assessment.anomalous;
  const regionalConsensus = assessment.regionalConsensus;
  const spatialDisagreement = assessment.spatialDisagreement;

  return (
    <Panel
      title="Spatio-Temporal Weather Consensus"
      meta={`TARGET: ${stationId} (${targetStation?.name}) · 3 NEAREST NEIGHBORS`}
      action={
        <span className="font-mono text-[10px] text-dim">RADIUS ~18 KM</span>
      }
    >
      {/* 3 Summary Cards: Regional Consensus, Target Station, Spatial Disagreement */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="rounded-lg border border-line/60 bg-panel2/50 p-3">
          <div className="label-mono text-[9px]">Regional Consensus</div>
          <div
            className={cn(
              "mt-1 font-mono text-[14px] font-bold flex items-center gap-1.5",
              regionalConsensus === "EVENT" ? "text-event" : "text-ok",
            )}
          >
            {regionalConsensus === "EVENT" ? (
              <AlertCircle className="size-4 shrink-0 text-event" />
            ) : (
              <CheckCircle className="size-4 shrink-0 text-ok" />
            )}
            {regionalConsensus}
          </div>
          <div className="mt-1 font-mono text-[9px] text-dim">SURROUNDING GRID</div>
        </div>

        <div
          className={cn(
            "rounded-lg border p-3",
            isAnomalous
              ? "border-critical/40 bg-critical/10"
              : "border-line/60 bg-panel2/50",
          )}
        >
          <div className="label-mono text-[9px]">Target Station</div>
          <div
            className={cn(
              "mt-1 font-mono text-[14px] font-bold flex items-center gap-1.5",
              isAnomalous ? "text-critical" : "text-ok",
            )}
          >
            {isAnomalous ? (
              <AlertCircle className="size-4 shrink-0 text-critical" />
            ) : (
              <CheckCircle className="size-4 shrink-0 text-ok" />
            )}
            {isAnomalous ? "ANOMALOUS" : "NORMAL"}
          </div>
          <div className="mt-1 font-mono text-[9px] text-dim">{stationId} STATE</div>
        </div>

        <div className="rounded-lg border border-line/60 bg-panel2/50 p-3">
          <div className="label-mono text-[9px]">Spatial Disagreement</div>
          <div
            className={cn(
              "mt-1 font-mono text-[14px] font-bold",
              spatialDisagreement === "HIGH"
                ? "text-critical"
                : spatialDisagreement === "MODERATE"
                  ? "text-watch"
                  : "text-ok",
            )}
          >
            {spatialDisagreement}
          </div>
          <div className="mt-1 font-mono text-[9px] text-dim">NEIGHBOR VARIANCE</div>
        </div>
      </div>

      {/* Target and Neighbors Table / Rows */}
      <div className="space-y-2">
        <StationRow
          id={stationId}
          name={targetStation?.name ?? stationId}
          district={targetStation?.district ?? ""}
          value={targetObs?.received ? targetObs.temperature : targetExpected.temperature}
          expected={targetExpected.temperature}
          anomalous={isAnomalous}
          highlight
          isTarget
        />

        <div className="label-mono pt-1 text-[9px] text-dim">Cross-Referenced Nearest Nodes:</div>

        {neighbors.map((id) => {
          const st = STATION_MAP.get(id);
          const obs = latest[id];
          const exp = expectedFor(id);
          const nAssess = assess(id);
          return (
            <StationRow
              key={id}
              id={id}
              name={st?.name ?? id}
              district={st?.district ?? ""}
              value={obs?.received ? obs.temperature : exp.temperature}
              expected={exp.temperature}
              anomalous={nAssess.anomalous}
              isTarget={false}
            />
          );
        })}
      </div>

      {/* Narrative Synthesis */}
      <div className="mt-3.5 rounded-lg border border-line/60 bg-background/50 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
        {regionalConsensus === "EVENT" ? (
          <span className="text-event">
            <strong>SYNTHESIS:</strong> All stations across the cluster have shifted in tandem
            (-5.8°C temp / -11.4 hPa pressure). This is classified as a genuine regional weather event;
            no sensor fault ticket is generated.
          </span>
        ) : isAnomalous ? (
          <span>
            <strong className="text-critical">SPATIAL CONFLICT DETECTED: </strong>
            Station {stationId} reports an extreme reading ({targetObs?.temperature.toFixed(1)}°C)
            which departs from nearby stations (mean {neighbors.map((n) => `${n}: ${latest[n]?.temperature.toFixed(1)}°C`).join(", ")})
            by +{Math.abs(assessment.difference).toFixed(1)}°C. High spatial disagreement proves this is an
            isolated sensor defect, not regional weather.
          </span>
        ) : (
          <span className="text-ok">
            <strong>SPATIAL HARMONY:</strong> Target station and all 3 neighboring nodes agree within
            acceptable spatial dispersion limits (variance &lt; 1.2°C).
          </span>
        )}
      </div>
    </Panel>
  );
}

function StationRow({
  id,
  name,
  district,
  value,
  expected,
  anomalous,
  highlight,
  isTarget,
}: {
  id: string;
  name: string;
  district: string;
  value: number;
  expected: number;
  anomalous: boolean;
  highlight?: boolean;
  isTarget?: boolean;
}) {
  const delta = Math.round((value - expected) * 10) / 10;
  const pct = Math.max(5, Math.min(100, ((value - 15) / 45) * 100));

  return (
    <div
      className={cn(
        "flex flex-wrap sm:flex-nowrap items-center gap-3 rounded-lg border p-2.5 transition-all",
        anomalous
          ? "border-critical/40 bg-critical/8 shadow-sm shadow-critical/5"
          : "border-line/60 bg-panel2/40",
        highlight && "ring-1 ring-primary/40",
      )}
    >
      <div className="w-[110px] shrink-0 font-mono">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[12px] font-bold", anomalous ? "text-critical" : "text-foreground")}>
            {id}
          </span>
          {isTarget && (
            <span className="rounded bg-primary/20 px-1 py-0.2 text-[8px] font-bold text-primary">
              TARGET
            </span>
          )}
        </div>
        <div className="text-[10px] text-dim truncate">{name}</div>
      </div>

      <div className="hidden md:block w-20 shrink-0 font-mono text-[10px] text-dim truncate">
        {district}
      </div>

      <div className="flex-1 min-w-[120px] flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-background/80 border border-line/40">
          <div
            className={cn("h-full rounded-full transition-all duration-500", anomalous ? "bg-critical" : "bg-ok")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
        <span className={cn("w-14 text-right font-bold", anomalous ? "text-critical" : "text-foreground")}>
          {value.toFixed(1)}°C
        </span>
        <span className={cn("w-14 text-right text-[10px]", delta > 0 ? "text-watch" : "text-dim")}>
          {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}°
        </span>
        <StatusTag label={anomalous ? "ANOMALOUS" : "NORMAL"} tone={anomalous ? "critical" : "ok"} />
      </div>
    </div>
  );
}
