import { useMemo, useState } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatSimTime, useSimulation } from "@/services/simulationStore";
import { baselineObservation } from "@/services/simulation";
import { STATION_MAP } from "@/data/stations";

type Metric = "temperature" | "pressure" | "humidity" | "all";

const METRICS: { id: Metric; label: string; unit: string; color: string }[] = [
  { id: "temperature", label: "TEMPERATURE (°C)", unit: "°C", color: "var(--chart-1)" },
  { id: "pressure", label: "PRESSURE (hPa)", unit: "hPa", color: "var(--chart-2)" },
  { id: "humidity", label: "HUMIDITY (%)", unit: "%", color: "var(--chart-3)" },
  { id: "all", label: "MULTIVARIATE", unit: "", color: "var(--chart-1)" },
];

export function TelemetryChart({
  stationId,
  height = 280,
}: {
  stationId: string;
  height?: number;
}) {
  const { history, assess, expectedFor } = useSimulation();
  const [metric, setMetric] = useState<Metric>("temperature");
  const station = STATION_MAP.get(stationId)!;
  const series = history[stationId] ?? [];
  const assessment = assess(stationId);
  const expectedNow = expectedFor(stationId);

  const data = useMemo(
    () =>
      series.slice(-48).map((o) => {
        const expected = baselineObservation(station, o.tick);
        const deviation = Math.abs(o.temperature - expected.temperature);
        const isAnomalous = deviation > 6 || !o.received || o.delayed;
        return {
          tick: o.tick,
          t: formatSimTime(o.time),
          temperature: o.received ? o.temperature : null,
          pressure: o.received ? o.pressure : null,
          humidity: o.received ? o.humidity : null,
          expectedTemp: expected.temperature,
          expectedMin: Math.round((expected.temperature - 2.5) * 10) / 10,
          expectedMax: Math.round((expected.temperature + 2.5) * 10) / 10,
          anomalyMarker: isAnomalous && o.received ? o.temperature : null,
          deviation: o.received ? Math.round((o.temperature - expected.temperature) * 10) / 10 : 0,
        };
      }),
    [series, station],
  );

  const latest = series[series.length - 1];
  const showTemp = metric === "temperature" || metric === "all";
  const showPres = metric === "pressure" || metric === "all";
  const showHum = metric === "humidity" || metric === "all";

  return (
    <div>
      {/* Top telemetry status ribbon */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line/50 pb-2.5">
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            <span className="text-dim">TEMP:</span>
            <span
              className={cn(
                "font-bold",
                assessment.anomalous ? "text-critical text-[13px]" : "text-primary",
              )}
            >
              {latest?.received ? `${latest.temperature.toFixed(1)}°C` : "MISSING"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-event" />
            <span className="text-dim">PRES:</span>
            <span className="font-bold text-foreground">
              {latest?.received ? `${latest.pressure.toFixed(1)} hPa` : "—"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-ok" />
            <span className="text-dim">HUM:</span>
            <span className="font-bold text-foreground">
              {latest?.received ? `${latest.humidity.toFixed(0)}%` : "—"}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 border-l border-line/60 pl-3">
            <span className="text-dim">BASELINE:</span>
            <span className="text-dim">{expectedNow.temperature.toFixed(1)}°C</span>
          </div>
        </div>

        {/* Metric mode toggle pills */}
        <div className="flex gap-1 rounded border border-line/70 bg-background/60 p-0.5">
          {METRICS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              className={cn(
                "rounded-sm px-2.5 py-1 font-mono text-[10px] transition-colors",
                metric === m.id
                  ? "bg-primary font-bold text-primary-foreground shadow-sm"
                  : "text-dim hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ height }} className="rounded-lg border border-line/60 bg-background/80 p-2.5">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -14 }}>
            <XAxis
              dataKey="t"
              tick={{ fontSize: 9, fill: "var(--dim)", fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--line)" }}
              minTickGap={35}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 9, fill: "var(--dim)", fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
              width={42}
              domain={["auto", "auto"]}
            />
            {showPres && !showTemp && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 9, fill: "var(--dim)", fontFamily: "var(--font-mono)" }}
                tickLine={false}
                axisLine={false}
                width={42}
                domain={["auto", "auto"]}
              />
            )}
            <Tooltip
              contentStyle={{
                background: "var(--panel2)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
              }}
              labelStyle={{ color: "var(--dim)" }}
            />

            {/* Station-specific adaptive baseline reference */}
            {showTemp && (
              <ReferenceLine
                yAxisId="left"
                y={expectedNow.temperature}
                stroke="var(--dim)"
                strokeDasharray="4 4"
                label={{
                  value: `adaptive baseline ${expectedNow.temperature.toFixed(1)}°C`,
                  fill: "var(--dim)",
                  fontSize: 9,
                  position: "insideBottomLeft",
                }}
              />
            )}

            {/* Temperature series */}
            {showTemp && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="temperature"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.14}
                strokeWidth={1.8}
                isAnimationActive={false}
                connectNulls={false}
              />
            )}

            {/* Pressure series */}
            {showPres && (
              <Line
                yAxisId={showTemp ? "left" : "right"}
                type="monotone"
                dataKey="pressure"
                stroke="var(--chart-2)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Humidity series */}
            {showHum && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="humidity"
                stroke="var(--chart-3)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Anomaly markers */}
            {showTemp && (
              <Scatter
                yAxisId="left"
                dataKey="anomalyMarker"
                fill="var(--critical)"
                shape="circle"
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between font-mono text-[9px] text-dim px-1">
        <span>● RED SCATTER = ANOMALOUS OBSERVATION BLIP</span>
        <span>DASHED LINE = STATION-SPECIFIC ADAPTIVE BASELINE</span>
      </div>
    </div>
  );
}
