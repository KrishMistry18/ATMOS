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
      meta={`Target Node: ${stationId} (${targetStation?.name}) • 3 Nearest Regional Neighbors`}
      action={
        <span className="text-[11px] font-medium text-muted-foreground">Cluster Radius: ~18 km</span>
      }
    >
      {/* 3 Summary Cards: Regional Consensus, Target Station, Spatial Disagreement */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-4">
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-muted-foreground">Regional Consensus</div>
          <div
            className={cn(
              "mt-1.5 text-[15px] font-bold flex items-center gap-1.5",
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
          <div className="mt-1 text-[11px] text-muted-foreground">Cluster Behavior</div>
        </div>

        <div
          className={cn(
            "rounded-xl border p-3.5 shadow-xs",
            isAnomalous
              ? "border-critical/40 bg-critical/5 text-critical"
              : "border-border bg-card",
          )}
        >
          <div className="text-[11px] font-medium text-muted-foreground">Target Station</div>
          <div
            className={cn(
              "mt-1.5 text-[15px] font-bold flex items-center gap-1.5",
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
          <div className="mt-1 text-[11px] text-muted-foreground">{stationId} Status</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-muted-foreground">Spatial Disagreement</div>
          <div
            className={cn(
              "mt-1.5 text-[15px] font-bold",
              spatialDisagreement === "HIGH"
                ? "text-critical"
                : spatialDisagreement === "MODERATE"
                  ? "text-watch"
                  : "text-ok",
            )}
          >
            {spatialDisagreement}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Neighbor Divergence</div>
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

        <div className="pt-2 text-[11px] font-medium text-muted-foreground">
          Cross-Referenced Nearest Nodes:
        </div>

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
      <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3.5 text-[12px] leading-relaxed text-muted-foreground">
        {regionalConsensus === "EVENT" ? (
          <span className="text-event font-medium">
            <strong>SYNTHESIS:</strong> All stations across the cluster have shifted in tandem
            (-5.8°C temp / -11.4 hPa pressure). This is classified as a genuine regional weather event;
            no sensor fault ticket is generated.
          </span>
        ) : isAnomalous ? (
          <span>
            <strong className="text-critical font-semibold">Spatial Conflict Detected: </strong>
            Station {stationId} reports an extreme reading ({targetObs?.temperature.toFixed(1)}°C)
            which sharply departs from neighboring stations (mean {neighbors.map((n) => `${n}: ${latest[n]?.temperature.toFixed(1)}°C`).join(", ")})
            by +{Math.abs(assessment.difference).toFixed(1)}°C. High spatial disagreement confirms this as an
            isolated sensor defect rather than a regional meteorological front.
          </span>
        ) : (
          <span className="text-ok font-medium">
            <strong>Spatial Consensus Nominal:</strong> Target station and all 3 neighboring nodes agree within
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
        "flex flex-wrap sm:flex-nowrap items-center gap-3 rounded-lg border p-3 transition-all",
        anomalous
          ? "border-critical/30 bg-critical/5 shadow-xs"
          : "border-border bg-card",
        highlight && "ring-1 ring-primary/40",
      )}
    >
      <div className="w-[120px] shrink-0">
        <div className="flex items-center gap-1.5">
          <span className={cn("font-mono text-[12px] font-bold", anomalous ? "text-critical" : "text-foreground")}>
            {id}
          </span>
          {isTarget && (
            <span className="rounded bg-primary/15 px-1.5 py-0.2 text-[9px] font-semibold text-primary">
              TARGET
            </span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground truncate">{name}</div>
      </div>

      <div className="hidden md:block w-24 shrink-0 text-[11px] text-muted-foreground truncate">
        {district}
      </div>

      <div className="flex-1 min-w-[120px] flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all duration-500", anomalous ? "bg-critical" : "bg-ok")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 text-[12px]">
        <span className={cn("w-14 text-right font-mono font-bold", anomalous ? "text-critical" : "text-foreground")}>
          {value.toFixed(1)}°C
        </span>
        <span className={cn("w-12 text-right font-mono text-[11px]", delta > 0 ? "text-watch" : "text-muted-foreground")}>
          {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}°
        </span>
        <StatusTag label={anomalous ? "ANOMALOUS" : "NORMAL"} tone={anomalous ? "critical" : "ok"} />
      </div>
    </div>
  );
}
