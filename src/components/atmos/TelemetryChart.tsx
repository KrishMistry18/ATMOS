import { useMemo, useState } from "react";
import {
  Area,
  ComposedChart,
  Line,
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
  { id: "temperature", label: "TEMP", unit: "°C", color: "var(--chart-1)" },
  { id: "pressure", label: "PRES", unit: "hPa", color: "var(--chart-2)" },
  { id: "humidity", label: "HUM", unit: "%", color: "var(--chart-3)" },
  { id: "all", label: "ALL", unit: "", color: "var(--chart-1)" },
];

export function TelemetryChart({ stationId, height = 264 }: { stationId: string; height?: number }) {
  const { history, assess } = useSimulation();
  const [metric, setMetric] = useState<Metric>("temperature");
  const station = STATION_MAP.get(stationId)!;
  const series = history[stationId] ?? [];
  const assessment = assess(stationId);

  const data = useMemo(
    () =>
      series.slice(-45).map((o) => {
        const expected = baselineObservation(station, o.tick);
        const anomalous = Math.abs(o.temperature - expected.temperature) > 6 || !o.received;
        return {
          t: formatSimTime(o.time),
          temperature: o.received ? o.temperature : null,
          pressure: o.received ? o.pressure : null,
          humidity: o.received ? o.humidity : null,
          expected: expected.temperature,
          marker: anomalous && metric !== "pressure" ? o.temperature : null,
        };
      }),
    [series, station, metric],
  );

  const latest = series[series.length - 1];
  const showTemp = metric === "temperature" || metric === "all";
  const showPres = metric === "pressure" || metric === "all";
  const showHum = metric === "humidity" || metric === "all";

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span className="text-primary">{latest?.temperature.toFixed(1)}°C</span>
          <span className="text-event">{latest?.pressure.toFixed(1)} hPa</span>
          <span className="text-ok">{latest?.humidity.toFixed(1)}%</span>
        </div>
        <div className="flex gap-1 rounded border border-line/70 bg-background/50 p-0.5">
          {METRICS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              className={cn(
                "rounded-sm px-3 py-1 font-mono text-[10px] transition-colors",
                metric === m.id
                  ? "bg-primary font-bold text-primary-foreground"
                  : "text-dim hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height }} className="rounded-lg border border-line/60 bg-background/70 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <XAxis
              dataKey="t"
              tick={{ fontSize: 9, fill: "var(--dim)", fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--line)" }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "var(--dim)", fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
              width={44}
              domain={["auto", "auto"]}
            />
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
            {showTemp && (
              <ReferenceLine
                y={assessment.expectedTemperature}
                stroke="var(--dim)"
                strokeDasharray="4 4"
                label={{
                  value: `baseline ${assessment.expectedTemperature.toFixed(1)}°C`,
                  fill: "var(--dim)",
                  fontSize: 9,
                  position: "insideBottomLeft",
                }}
              />
            )}
            {showTemp && (
              <Area
                type="monotone"
                dataKey="temperature"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.12}
                strokeWidth={1.6}
                isAnimationActive={false}
                connectNulls={false}
              />
            )}
            {showPres && (
              <Line
                type="monotone"
                dataKey="pressure"
                stroke="var(--chart-2)"
                strokeWidth={1.4}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {showHum && (
              <Line
                type="monotone"
                dataKey="humidity"
                stroke="var(--chart-3)"
                strokeWidth={1.4}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {showTemp && (
              <Scatter dataKey="marker" fill="var(--critical)" shape="circle" isAnimationActive={false} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
