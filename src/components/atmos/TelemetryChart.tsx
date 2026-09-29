import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
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

const METRICS: { id: Metric; label: string; unit: string }[] = [
  { id: "temperature", label: "Temperature (°C)", unit: "°C" },
  { id: "pressure", label: "Pressure (hPa)", unit: "hPa" },
  { id: "humidity", label: "Humidity (%)", unit: "%" },
  { id: "all", label: "Multivariate View", unit: "" },
];

export function TelemetryChart({
  stationId,
  height = 300,
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
      {/* Top Telemetry Status Ribbon */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="flex flex-wrap items-center gap-4 text-[12px]">
          {/* Temperature */}
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-primary" />
            <span className="font-medium text-muted-foreground">Temperature:</span>
            <span
              className={cn(
                "font-mono font-semibold",
                assessment.anomalous ? "text-critical font-bold text-[13px]" : "text-primary",
              )}
            >
              {latest?.received ? `${latest.temperature.toFixed(1)}°C` : "MISSING"}
            </span>
          </div>

          {/* Pressure */}
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-secondary" />
            <span className="font-medium text-muted-foreground">Pressure:</span>
            <span className="font-mono font-semibold text-foreground">
              {latest?.received ? `${latest.pressure.toFixed(1)} hPa` : "—"}
            </span>
          </div>

          {/* Humidity */}
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-ok" />
            <span className="font-medium text-muted-foreground">Humidity:</span>
            <span className="font-mono font-semibold text-foreground">
              {latest?.received ? `${latest.humidity.toFixed(0)}%` : "—"}
            </span>
          </div>

          {/* Baseline info */}
          <div className="hidden items-center gap-1.5 border-l border-border pl-3 sm:flex">
            <span className="text-muted-foreground">Baseline:</span>
            <span className="font-mono text-muted-foreground">
              {expectedNow.temperature.toFixed(1)}°C
            </span>
          </div>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
          {METRICS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                metric === m.id
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ height }} className="rounded-xl border border-border bg-card/50 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.6} />
            <XAxis
              dataKey="t"
              tick={{ fontSize: 10, fill: "var(--dim)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--line)" }}
              minTickGap={35}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: "var(--dim)" }}
              tickLine={false}
              axisLine={false}
              width={40}
              domain={["auto", "auto"]}
            />
            {showPres && !showTemp && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: "var(--dim)" }}
                tickLine={false}
                axisLine={false}
                width={45}
                domain={["auto", "auto"]}
              />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--panel)",
                borderColor: "var(--line)",
                borderRadius: "0.75rem",
                fontSize: "12px",
                color: "var(--foreground)",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              labelStyle={{ fontWeight: "600", color: "var(--foreground)" }}
            />

            {/* Station Adaptive Baseline Reference Line */}
            {showTemp && (
              <ReferenceLine
                yAxisId="left"
                y={expectedNow.temperature}
                stroke="var(--dim)"
                strokeDasharray="4 4"
                label={{
                  value: `Baseline ${expectedNow.temperature.toFixed(1)}°C`,
                  fill: "var(--dim)",
                  fontSize: 10,
                  position: "insideBottomLeft",
                }}
              />
            )}

            {/* Temperature series: Enterprise Blue */}
            {showTemp && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="temperature"
                name="Temperature (°C)"
                stroke="var(--color-primary)"
                fill="var(--color-primary)"
                fillOpacity={0.12}
                strokeWidth={2}
                isAnimationActive={false}
                connectNulls={false}
              />
            )}

            {/* Pressure series: Cyan */}
            {showPres && (
              <Line
                yAxisId={showTemp ? "left" : "right"}
                type="monotone"
                dataKey="pressure"
                name="Pressure (hPa)"
                stroke="var(--color-secondary)"
                strokeWidth={1.8}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Humidity series: Green */}
            {showHum && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="humidity"
                name="Humidity (%)"
                stroke="var(--ok)"
                strokeWidth={1.8}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Anomaly scatter markers: Red */}
            {showTemp && (
              <Scatter
                yAxisId="left"
                name="Anomaly Incident"
                dataKey="anomalyMarker"
                fill="var(--critical)"
                shape="circle"
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-critical" />
          Red markers indicate detected anomalies exceeding adaptive baseline
        </span>
        <span>Dashed line indicates station diurnal baseline</span>
      </div>
    </div>
  );
}
