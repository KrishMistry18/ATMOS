import type {
  AnomalyType,
  Assessment,
  Evidence,
  Observation,
  Severity,
  Station,
} from "@/lib/atmos/types";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number, p = 1) => Math.round(v * 10 ** p) / 10 ** p;

export interface AssessArgs {
  station: Station;
  observation: Observation;
  expected: { temperature: number; pressure: number; humidity: number };
  history: Observation[];
  neighbors: { observation: Observation; expectedTemperature: number }[];
}

export function generateEvidence(args: AssessArgs): Evidence {
  const { observation, expected, history, neighbors } = args;
  const deviation = observation.temperature - expected.temperature;
  const neighbourDeviation = meanNeighbourDeviation(neighbors);
  const spatialGap = Math.abs(deviation - neighbourDeviation);
  const prev = history[history.length - 1];
  const rate = prev ? Math.abs(observation.temperature - prev.temperature) : 0;

  // Physics-aware: hot air normally carries less relative humidity.
  const humidityExpectedShift = -1.6 * deviation;
  const humidityActualShift = observation.humidity - expected.humidity;
  const multivariateGap = Math.abs(humidityActualShift - humidityExpectedShift);

  return {
    baseline: clamp(Math.round((Math.abs(deviation) / 24) * 100), 0, 99),
    spatial: clamp(Math.round((spatialGap / 24) * 100), 0, 99),
    rate: clamp(Math.round((rate / 20) * 100), 0, 99),
    multivariate: clamp(Math.round((multivariateGap / 26) * 100), 0, 99),
  };
}

function meanNeighbourDeviation(neighbors: AssessArgs["neighbors"]) {
  const live = neighbors.filter((n) => n.observation.received);
  if (!live.length) return 0;
  return (
    live.reduce((acc, n) => acc + (n.observation.temperature - n.expectedTemperature), 0) /
    live.length
  );
}

function isFrozen(history: Observation[], current: Observation) {
  const recent = [...history.slice(-3), current];
  if (recent.length < 4) return false;
  return recent.every(
    (o) =>
      o.temperature === recent[0]!.temperature &&
      o.pressure === recent[0]!.pressure &&
      o.humidity === recent[0]!.humidity,
  );
}

export function classifyFault(args: AssessArgs): {
  type: AnomalyType;
  anomalous: boolean;
  causes: string[];
  recommendation: string;
} {
  const { observation, expected, history, neighbors } = args;
  const deviation = observation.temperature - expected.temperature;
  const neighbourDeviation = meanNeighbourDeviation(neighbors);
  const prev = history[history.length - 1];
  const rate = prev ? Math.abs(observation.temperature - prev.temperature) : 0;

  if (!observation.received) {
    return {
      type: "MISSING PACKET",
      anomalous: true,
      causes: ["Radio link interruption", "Power cycling at the station", "Gateway packet loss"],
      recommendation: "Check the uplink and gateway logs for this station.",
    };
  }
  if (observation.delayed) {
    return {
      type: "COMMUNICATION DELAY",
      anomalous: true,
      causes: ["Congested backhaul", "Weak signal strength", "Buffering at the datalogger"],
      recommendation: "Inspect link quality and datalogger transmit buffer.",
    };
  }
  if (isFrozen(history, observation)) {
    return {
      type: "FROZEN VALUE",
      anomalous: true,
      causes: ["Sensor stuck at last value", "Datalogger cache not refreshing", "ADC failure"],
      recommendation: "Power-cycle the sensor and verify the acquisition loop.",
    };
  }
  if (Math.abs(neighbourDeviation) > 3.5 && Math.abs(deviation - neighbourDeviation) < 2.5) {
    return {
      type: "REGIONAL WEATHER EVENT",
      anomalous: true,
      causes: ["Frontal passage", "Convective system", "Genuine regional change"],
      recommendation: "No sensor action required — flag as a genuine weather event.",
    };
  }
  if (deviation > 8 && rate > 6) {
    return {
      type: "SPIKE",
      anomalous: true,
      causes: ["Sensor malfunction", "Calibration issue", "Local environmental disturbance"],
      recommendation: "Inspect sensor; verify calibration and local conditions.",
    };
  }
  if (deviation < -8) {
    return {
      type: "SUDDEN DROP",
      anomalous: true,
      causes: ["Sensor disconnection", "Water ingress", "Reference voltage fault"],
      recommendation: "Inspect wiring and sensor enclosure for ingress or disconnection.",
    };
  }
  if (Math.abs(deviation) > 3 && rate < 1.2) {
    return {
      type: "DRIFT",
      anomalous: true,
      causes: ["Gradual sensor ageing", "Calibration decay", "Thermal bias in the enclosure"],
      recommendation: "Schedule recalibration; compare against a reference sensor.",
    };
  }
  if (Math.abs(deviation) > 2.2) {
    return {
      type: "CALIBRATION ERROR",
      anomalous: true,
      causes: ["Offset error", "Post-maintenance mis-configuration"],
      recommendation: "Re-apply calibration coefficients for this station.",
    };
  }
  return {
    type: "SPIKE",
    anomalous: false,
    causes: [],
    recommendation: "No action required.",
  };
}

export function calculateSeverity(evidence: Evidence, type: AnomalyType): number {
  const weighted =
    evidence.baseline * 0.4 +
    evidence.spatial * 0.3 +
    evidence.rate * 0.15 +
    evidence.multivariate * 0.15;
  const floor =
    type === "MISSING PACKET" ? 58 : type === "COMMUNICATION DELAY" ? 46 : type === "DRIFT" ? 52 : 0;
  return clamp(Math.round(Math.max(weighted, floor)), 1, 99);
}

export function calculateConfidence(evidence: Evidence, type: AnomalyType): number {
  const agreeing = [
    evidence.baseline > 40,
    evidence.spatial > 40,
    evidence.rate > 40,
    evidence.multivariate > 40,
  ].filter(Boolean).length;
  const base = type === "MISSING PACKET" || type === "COMMUNICATION DELAY" ? 94 : 68 + agreeing * 8;
  return clamp(Math.round(base), 55, 98);
}

function severityLabel(score: number): Severity {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 35) return "Moderate";
  return "Low";
}

export function generateRecoveryEstimate(args: AssessArgs) {
  const { expected, neighbors, history } = args;
  const neighbourDeviation = meanNeighbourDeviation(neighbors);
  const temporal = history.length
    ? history.slice(-5).reduce((a, o) => a + o.temperature, 0) / history.slice(-5).length
    : expected.temperature;
  const spatial = expected.temperature + neighbourDeviation;
  return {
    estimated: round(temporal * 0.35 + spatial * 0.65, 1),
    method: "Temporal + Neighbor Consensus",
    confidence: neighbors.some((n) => n.observation.received) ? 93 : 71,
  };
}

export function detectAnomaly(args: AssessArgs): Assessment {
  const evidence = generateEvidence(args);
  const fault = classifyFault(args);
  const severityScore = calculateSeverity(evidence, fault.type);
  const deviation = args.observation.temperature - args.expected.temperature;
  const neighbourDeviation = meanNeighbourDeviation(args.neighbors);
  const spatialGap = Math.abs(deviation - neighbourDeviation);
  const regional = fault.type === "REGIONAL WEATHER EVENT";

  const reason = !args.observation.received
    ? "No observation packet was received in this reporting window."
    : regional
      ? "All neighbouring stations shifted together — consistent with a genuine regional event."
      : fault.type === "FROZEN VALUE"
        ? "The station has repeated an identical observation across consecutive cycles."
        : fault.type === "COMMUNICATION DELAY"
          ? "Packets are arriving far outside the expected latency envelope."
          : `Temperature is ${deviation > 0 ? "far above" : "far below"} the station baseline while neighbouring stations remain stable.`;

  return {
    anomalous: fault.anomalous,
    type: fault.type,
    severity: severityLabel(severityScore),
    severityScore,
    confidence: calculateConfidence(evidence, fault.type),
    evidence,
    reason,
    causes: fault.causes,
    recommendation: fault.recommendation,
    expectedTemperature: args.expected.temperature,
    difference: round(deviation, 1),
    regionalConsensus: regional ? "EVENT" : "NORMAL",
    spatialDisagreement: spatialGap > 8 ? "HIGH" : spatialGap > 3 ? "MODERATE" : "LOW",
    recovery: generateRecoveryEstimate(args),
  };
}
