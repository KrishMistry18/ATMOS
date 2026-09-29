import type { Observation, ScenarioId, Station } from "@/lib/atmos/types";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Deterministic "expected" behaviour of a healthy station at a given tick. */
export function baselineObservation(station: Station, tick: number) {
  const s = station.seed;
  const temperature =
    station.baseTemp + 1.8 * Math.sin((tick + s * 10) / 28) + 0.45 * Math.sin((tick * s) / 5);
  const pressure =
    station.basePressure + 2.4 * Math.sin((tick + s * 7) / 40) + 0.3 * Math.sin(tick / 3 + s);
  const humidity = clamp(
    station.baseHumidity - 1.6 * (temperature - station.baseTemp) + 2 * Math.sin((tick + s) / 33),
    45,
    92,
  );
  return {
    temperature: round(temperature, 1),
    pressure: round(pressure, 1),
    humidity: round(humidity, 1),
  };
}

function round(v: number, p = 1) {
  const f = 10 ** p;
  return Math.round(v * f) / f;
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
        obs.temperature = round(55 + 0.4 * Math.sin(tick / 2), 1);
        obs.humidity = round(clamp(90 + 1.5 * Math.sin(tick / 3), 80, 96), 1);
        obs.pressure = round(base.pressure + 6.5 * Math.sin(tick / 2), 1);
      }
      break;
    case "sensor_drift":
      if (isTarget) {
        obs.temperature = round(base.temperature + Math.min(9.5, elapsed * 0.45), 1);
        obs.humidity = round(clamp(base.humidity - Math.min(8, elapsed * 0.3), 40, 95), 1);
      }
      break;
    case "frozen_sensor":
      if (isTarget) {
        const frozen = baselineObservation(station, scenarioStartTick);
        obs.temperature = frozen.temperature;
        obs.pressure = frozen.pressure;
        obs.humidity = frozen.humidity;
      }
      break;
    case "sudden_drop":
      if (isTarget) {
        obs.temperature = round(base.temperature - 17.4, 1);
        obs.humidity = round(clamp(base.humidity + 12, 40, 96), 1);
      }
      break;
    case "missing_packet":
      if (isTarget && elapsed % 3 === 0) {
        obs.received = false;
      }
      break;
    case "communication_delay":
      if (isTarget) {
        obs.latencyMs = 1900 + Math.round(500 * Math.abs(Math.sin(tick / 3)));
        obs.delayed = true;
      }
      break;
    case "regional_event":
      obs.temperature = round(base.temperature - 5.6, 1);
      obs.pressure = round(base.pressure - 11.2, 1);
      obs.humidity = round(clamp(base.humidity + 17, 40, 97), 1);
      break;
    default:
      break;
  }

  return obs;
}
