import type { AnomalyRecord, HealthState, Observation, StationHealth } from "@/lib/atmos/types";
import { STATIONS } from "@/data/stations";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export interface HealthArgs {
  history: Record<string, Observation[]>;
  anomalies: AnomalyRecord[];
  tick: number;
}

export function stateFor(score: number): HealthState {
  if (score >= 88) return "HEALTHY";
  if (score >= 74) return "WATCH";
  if (score >= 55) return "DEGRADED";
  return "CRITICAL";
}

/**
 * 10. Sensor Health Scoring
 * Dynamically computes health based on anomaly frequency, drift, noise,
 * communication reliability, and recurring faults.
 */
export function calculateSensorHealth({ history, anomalies, tick }: HealthArgs): StationHealth[] {
  return STATIONS.map((station) => {
    const series = history[station.id] ?? [];
    const window = series.slice(-40);
    const received = window.filter((o) => o.received);
    const missing = window.length - received.length;
    const delayed = window.filter((o) => o.delayed).length;
    const stationAnomalies = anomalies.filter((a) => a.stationId === station.id);
    const openAnomalies = stationAnomalies.filter((a) => a.status !== "RESOLVED");
    const recent = stationAnomalies.filter((a) => tick - a.tick < 40);

    const temps = received.map((o) => o.temperature);
    const mean = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : station.baseTemp;
    const variance = temps.length
      ? temps.reduce((a, t) => a + (t - mean) ** 2, 0) / temps.length
      : 0;
    const noiseValue = Math.sqrt(variance);
    const driftValue = Math.abs(mean - station.baseTemp);

    // Active open anomalies penalize heavily and deteriorate with duration
    const openPenalty = openAnomalies.reduce((acc, a) => {
      const activeDuration = Math.min(25, Math.max(1, tick - a.tick));
      return acc + (a.severityScore * 0.35) + (activeDuration * 1.5);
    }, 0);

    const resolvedPenalty = recent.filter((a) => a.status === "RESOLVED").reduce(
      (acc, r) => acc + r.severityScore * 0.08,
      0,
    );

    const commsPenalty = missing * 6 + delayed * 3;
    const noisePenalty = noiseValue > 5 ? 18 : noiseValue > 2 ? 8 : 0;
    const driftPenalty = driftValue > 4 ? 20 : driftValue > 1.5 ? 9 : 0;

    const totalDeduction = openPenalty + resolvedPenalty + commsPenalty + noisePenalty + driftPenalty;
    const score = clamp(Math.round(98 - totalDeduction), 14, 98);

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
      noise: noiseValue > 5 ? "High" : noiseValue > 2.2 ? "Medium" : "Low",
      faultRate: Math.round((recent.length / Math.max(window.length, 1)) * 1000) / 10,
      communication:
        packetDelivery >= 99 && latency < 400
          ? "Excellent"
          : packetDelivery >= 94 && latency < 1500
            ? "Stable"
            : packetDelivery >= 80
              ? "Intermittent"
              : "Poor",
      lastSeenTick: lastReceived ? lastReceived.tick : tick,
      packetDelivery,
      latencyMs: latency,
      missingPackets: missing,
      delayedPackets: delayed,
    } satisfies StationHealth;
  });
}
