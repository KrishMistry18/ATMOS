import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AdaptiveBaseline,
  AnomalyRecord,
  Assessment,
  Observation,
  ScenarioId,
  StationHealth,
} from "@/lib/atmos/types";
import { STATIONS, PRIMARY_STATION, neighborsOf } from "@/data/stations";
import { SCENARIO_MAP } from "@/data/scenarios";
import { baselineObservation, simulateObservation } from "@/services/simulation";
import { detectAnomaly } from "@/services/anomalyEngine";
import { calculateSensorHealth } from "@/services/healthEngine";

/** Fixed simulated epoch keeps server and client render identical. */
export const SIM_EPOCH = Date.UTC(2026, 0, 14, 8, 0, 0);
export const BASE_TICK_MS = 1500;
const HISTORY = 90;
const WARMUP = 48;

interface SimState {
  tick: number;
  scenario: ScenarioId;
  scenarioStartTick: number;
  history: Record<string, Observation[]>;
  anomalies: AnomalyRecord[];
  anomalySeq: number;
}

function targetOf(scenario: ScenarioId) {
  const def = SCENARIO_MAP.get(scenario);
  return def && def.target !== "ALL" ? def.target : "__ALL__";
}

function assessStation(
  stationId: string,
  tick: number,
  observations: Record<string, Observation>,
  history: Record<string, Observation[]>,
): Assessment {
  const station = STATIONS.find((s) => s.id === stationId)!;
  const expected = baselineObservation(station, tick);
  const neighbors = neighborsOf(stationId).map((id) => {
    const n = STATIONS.find((s) => s.id === id)!;
    return {
      observation: observations[id]!,
      expectedTemperature: baselineObservation(n, tick).temperature,
    };
  });
  return detectAnomaly({
    station,
    observation: observations[stationId]!,
    expected,
    history: history[stationId] ?? [],
    neighbors,
  });
}

function step(state: SimState): SimState {
  const tick = state.tick + 1;
  const target = targetOf(state.scenario);

  const observations: Record<string, Observation> = {};
  for (const station of STATIONS) {
    observations[station.id] = simulateObservation({
      station,
      tick,
      scenario: state.scenario,
      scenarioStartTick: state.scenarioStartTick,
      targetStation: target === "__ALL__" ? "" : target,
      startedAt: SIM_EPOCH,
      tickMs: BASE_TICK_MS,
    });
    if (state.scenario === "regional_event") {
      observations[station.id] = simulateObservation({
        station,
        tick,
        scenario: "regional_event",
        scenarioStartTick: state.scenarioStartTick,
        targetStation: station.id,
        startedAt: SIM_EPOCH,
        tickMs: BASE_TICK_MS,
      });
    }
  }

  const history: Record<string, Observation[]> = {};
  for (const station of STATIONS) {
    const prev = state.history[station.id] ?? [];
    history[station.id] = [...prev, observations[station.id]!].slice(-HISTORY);
  }

  let anomalies = state.anomalies;
  let seq = state.anomalySeq;
  const added: AnomalyRecord[] = [];

  for (const station of STATIONS) {
    const assessment = assessStation(station.id, tick, observations, state.history);
    const open = anomalies.find((a) => a.stationId === station.id && a.status !== "RESOLVED");

    if (assessment.anomalous) {
      if (!open) {
        seq += 1;
        added.push({
          ...assessment,
          id: `ANM-${1041 + seq}`,
          stationId: station.id,
          detectedAt: SIM_EPOCH + tick * BASE_TICK_MS,
          tick,
          observed: observations[station.id]!.temperature,
          status: "OPEN",
          neighbors: neighborsOf(station.id).map((id) => ({
            stationId: id,
            temperature: observations[id]!.temperature,
            normal: !assessStation(id, tick, observations, state.history).anomalous,
          })),
        });
      } else if (open.type === assessment.type) {
        anomalies = anomalies.map((a) =>
          a.id === open.id
            ? {
                ...a,
                ...assessment,
                id: a.id,
                stationId: a.stationId,
                detectedAt: a.detectedAt,
                tick: a.tick,
                status: a.status,
                observed: observations[station.id]!.temperature,
                neighbors: a.neighbors,
              }
            : a,
        );
      }
    } else if (open && tick - open.tick > 2) {
      anomalies = anomalies.map((a) => (a.id === open.id ? { ...a, status: "RESOLVED" } : a));
    }
  }

  return {
    tick,
    scenario: state.scenario,
    scenarioStartTick: state.scenarioStartTick,
    history,
    anomalies: [...added, ...anomalies].slice(0, 80),
    anomalySeq: seq,
  };
}

function initialState(): SimState {
  let state: SimState = {
    tick: 0,
    scenario: "normal",
    scenarioStartTick: 0,
    history: Object.fromEntries(STATIONS.map((s) => [s.id, []])),
    anomalies: [],
    anomalySeq: 0,
  };
  for (let i = 0; i < WARMUP; i += 1) state = step(state);
  return state;
}

interface SimContextValue {
  tick: number;
  running: boolean;
  speed: number;
  scenario: ScenarioId;
  history: Record<string, Observation[]>;
  latest: Record<string, Observation>;
  anomalies: AnomalyRecord[];
  health: StationHealth[];
  healthById: Record<string, StationHealth>;
  simTime: number;
  assess: (stationId: string) => Assessment;
  expectedFor: (stationId: string) => { temperature: number; pressure: number; humidity: number };
  adaptiveBaselineFor: (stationId: string) => AdaptiveBaseline;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  setScenario: (id: ScenarioId) => void;
  acknowledgeAnomaly: (id: string) => void;
  resolveAnomaly: (id: string) => void;
}

const SimContext = createContext<SimContextValue | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SimState>(initialState);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!running) return;
    const intervalMs = Math.round(BASE_TICK_MS / speed);
    const id = setInterval(() => setState((s) => step(s)), intervalMs);
    return () => clearInterval(id);
  }, [running, speed]);

  const setScenario = useCallback((scenario: ScenarioId) => {
    setState((s) => ({ ...s, scenario, scenarioStartTick: s.tick }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState());
    setRunning(true);
  }, []);

  const acknowledgeAnomaly = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      anomalies: s.anomalies.map((a) => (a.id === id ? { ...a, status: "ACKNOWLEDGED" } : a)),
    }));
  }, []);

  const resolveAnomaly = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      anomalies: s.anomalies.map((a) => (a.id === id ? { ...a, status: "RESOLVED" } : a)),
    }));
  }, []);

  const value = useMemo<SimContextValue>(() => {
    const latest: Record<string, Observation> = {};
    for (const station of STATIONS) {
      const series = state.history[station.id] ?? [];
      latest[station.id] = series[series.length - 1]!;
    }
    const health = calculateSensorHealth({
      history: state.history,
      anomalies: state.anomalies,
      tick: state.tick,
    });

    const expectedFor = (stationId: string) => {
      const st = STATIONS.find((s) => s.id === stationId)!;
      return baselineObservation(st, state.tick);
    };

    const adaptiveBaselineFor = (stationId: string): AdaptiveBaseline => {
      const st = STATIONS.find((s) => s.id === stationId)!;
      const exp = expectedFor(stationId);
      const obs = latest[stationId];
      const currentVal = obs?.received ? obs.temperature : exp.temperature;
      return {
        historicalMean: st.baseTemp,
        expectedMin: Math.round((exp.temperature - 2.8) * 10) / 10,
        expectedMax: Math.round((exp.temperature + 2.8) * 10) / 10,
        recentTrend: "Diurnal tracking (+0.2°C/hr)",
        volatility: 0.35,
        currentValue: currentVal,
        deviation: Math.round((currentVal - exp.temperature) * 10) / 10,
      };
    };

    return {
      tick: state.tick,
      running,
      speed,
      scenario: state.scenario,
      history: state.history,
      latest,
      anomalies: state.anomalies,
      health,
      healthById: Object.fromEntries(health.map((h) => [h.stationId, h])),
      simTime: SIM_EPOCH + state.tick * BASE_TICK_MS,
      assess: (stationId: string) =>
        assessStation(
          stationId,
          state.tick,
          latest,
          Object.fromEntries(
            Object.entries(state.history).map(([id, series]) => [id, series.slice(0, -1)]),
          ),
        ),
      expectedFor,
      adaptiveBaselineFor,
      start: () => setRunning(true),
      pause: () => setRunning(false),
      reset,
      setSpeed,
      setScenario,
      acknowledgeAnomaly,
      resolveAnomaly,
    };
  }, [state, running, speed, reset, setScenario, acknowledgeAnomaly, resolveAnomaly]);

  return <SimContext.Provider value={value}>{children}</SimContext.Provider>;
}

export function useSimulation() {
  const ctx = useContext(SimContext);
  if (!ctx) throw new Error("useSimulation must be used inside SimulationProvider");
  return ctx;
}

export function formatSimTime(ms: number) {
  return new Date(ms).toISOString().slice(11, 19);
}

export function formatSimDateTime(ms: number) {
  return new Date(ms).toISOString().slice(0, 19).replace("T", " ");
}

export { PRIMARY_STATION };
