import type { Observation, ScenarioId, Station } from "@/lib/atmos/types";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function round(v: number, p = 1) {
  const f = 10 ** p;
  return Math.round(v * f) / f;
}

/** Deterministic "expected" baseline behaviour of a healthy station at a given tick. */
export function baselineObservation(station: Station, tick: number) {
  const s = station.seed;
  const temperature =
    station.baseTemp + 1.6 * Math.sin((tick + s * 10) / 32) + 0.35 * Math.sin((tick * s) / 6);
  const pressure =
    station.basePressure + 2.2 * Math.sin((tick + s * 7) / 42) + 0.25 * Math.sin(tick / 3 + s);
  const humidity = clamp(
    station.baseHumidity - 1.5 * (temperature - station.baseTemp) + 1.8 * Math.sin((tick + s) / 33),
    45,
    92,
  );
  return {
    temperature: round(temperature, 1),
    pressure: round(pressure, 1),
    humidity: round(humidity, 1),
  };
}

export interface SimulateArgs {
  station: Station;
  tick: number;
  scenario: ScenarioId;
  scenarioStartTick: number;
  targetStation: string;
  startedAt: number;
  tickMs: number;
}

/** Applies the active scenario on top of the healthy baseline. */
export function simulateObservation({
  station,
  tick,
  scenario,
  scenarioStartTick,
  targetStation,
  startedAt,
  tickMs,
}: SimulateArgs): Observation {
  const base = baselineObservation(station, tick);
  const elapsed = Math.max(0, tick - scenarioStartTick);
  const isTarget = station.id === targetStation;

  const obs: Observation = {
    stationId: station.id,
    tick,
    time: startedAt + tick * tickMs,
    temperature: base.temperature,
    pressure: base.pressure,
    humidity: base.humidity,
    received: true,
    latencyMs: 140 + Math.round(60 * Math.abs(Math.sin(tick / 4 + station.seed))),
    delayed: false,
  };

  switch (scenario) {
    case "temperature_spike":
      if (isTarget) {
        // Primary SIH scenario: AWS-003 reports 55.0°C
        obs.temperature = 55.0;
        obs.humidity = 90.0; // multivariate inconsistency: hot air with anomalous high humidity
        obs.pressure = round(base.pressure + 6.2, 1);
      }
      break;

    case "sensor_drift":
      if (isTarget) {
        // Gradual calibration decay
        const drift = Math.min(9.2, elapsed * 0.45);
        obs.temperature = round(base.temperature + drift, 1);
        obs.humidity = round(clamp(base.humidity - drift * 0.4, 40, 95), 1);
      }
      break;

    case "frozen_sensor":
      if (isTarget) {
        // Sensor stuck at exactly one frozen observation
        const frozen = baselineObservation(station, scenarioStartTick);
        obs.temperature = frozen.temperature;
        obs.pressure = frozen.pressure;
        obs.humidity = frozen.humidity;
      }
      break;

    case "sudden_drop":
      if (isTarget) {
        // Sensor collapse / connector short
        obs.temperature = round(base.temperature - 17.4, 1);
        obs.humidity = round(clamp(base.humidity + 14, 40, 96), 1);
      }
      break;

    case "missing_packet":
      if (isTarget && elapsed % 2 === 1) {
        // Intermittent radio packet drop
        obs.received = false;
      }
      break;

    case "communication_delay":
      if (isTarget) {
        // High link latency buffer
        obs.latencyMs = 2100 + Math.round(400 * Math.abs(Math.sin(tick / 3)));
        obs.delayed = true;
      }
      break;

    case "regional_event":
      // Regional atmospheric cold front affects all stations with consistent physical coupling
      obs.temperature = round(base.temperature - 5.8, 1);
      obs.pressure = round(base.pressure - 11.4, 1);
      obs.humidity = round(clamp(base.humidity + 18, 40, 98), 1);
      break;

    default:
      break;
  }

  return obs;
}
