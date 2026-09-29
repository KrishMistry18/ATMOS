import type { AnomalyRecord, HealthState, Observation, StationHealth } from "@/lib/atmos/types";
import { STATIONS } from "@/data/stations";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export interface HealthArgs {
  history: Record<string, Observation[]>;
  anomalies: AnomalyRecord[];
  tick: number;
}

function stateFor(score: number): HealthState {
  if (score >= 88) return "HEALTHY";
  if (score >= 74) return "WATCH";
  if (score >= 55) return "DEGRADED";
  return "CRITICAL";
}

export function calculateSensorHealth({ history, anomalies, tick }: HealthArgs): StationHealth[] {
  return STATIONS.map((station) => {
    const series = history[station.id] ?? [];
    const window = series.slice(-40);
    const received = window.filter((o) => o.received);
    const missing = window.length - received.length;
    const delayed = window.filter((o) => o.delayed).length;
    const stationAnomalies = anomalies.filter((a) => a.stationId === station.id);
    const recent = stationAnomalies.filter((a) => tick - a.tick < 40);

    const temps = received.map((o) => o.temperature);
    const mean = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : station.baseTemp;
    const variance = temps.length
      ? temps.reduce((a, t) => a + (t - mean) ** 2, 0) / temps.length
      : 0;
    const noiseValue = Math.sqrt(variance);
    const driftValue = Math.abs(mean - station.baseTemp);

    const severityPenalty = recent.reduce((a, r) => a + r.severityScore * 0.32, 0);
    const commsPenalty = missing * 5 + delayed * 2.5;
    const score = clamp(Math.round(99 - severityPenalty - commsPenalty), 12, 99);

    const packetDelivery = window.length
      ? Math.round(((window.length - missing) / window.length) * 1000) / 10
      : 100;
    const latency = received.length
      ? Math.round(received.reduce((a, o) => a + o.latencyMs, 0) / received.length)
      : 0;
    const lastReceived = [...received].reverse()[0];

    return {
      stationId: station.id,
      score,
      state: stateFor(score),
      drift: driftValue > 4 ? "High" : driftValue > 1.8 ? "Medium" : "Low",
      noise: noiseValue > 6 ? "High" : noiseValue > 2.4 ? "Medium" : "Low",
      faultRate: Math.round((recent.length / Math.max(window.length, 1)) * 1000) / 10,
      communication:
        packetDelivery >= 99 && latency < 400
          ? "Excellent"
          : packetDelivery >= 95 && latency < 1500
            ? "Stable"
            : packetDelivery >= 85
              ? "Intermittent"
              : "Poor",
      lastSeenTick: lastReceived ? lastReceived.tick : 0,
      packetDelivery,
      latencyMs: latency,
      missingPackets: missing,
      delayedPackets: delayed,
    } satisfies StationHealth;
  });
}
