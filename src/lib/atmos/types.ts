export type HealthState = "HEALTHY" | "WATCH" | "DEGRADED" | "CRITICAL";

export type AnomalyType =
  | "SPIKE"
  | "DRIFT"
  | "FROZEN VALUE"
  | "SUDDEN DROP"
  | "CALIBRATION ERROR"
  | "INTERMITTENT FAILURE"
  | "MISSING PACKET"
  | "COMMUNICATION DELAY"
  | "REGIONAL WEATHER EVENT";

export type Severity = "Low" | "Moderate" | "High" | "Critical";

export interface Station {
  id: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
  /** schematic map position, percent */
  x: number;
  y: number;
  elevation: number;
  seed: number;
  baseTemp: number;
  basePressure: number;
  baseHumidity: number;
}

export interface Observation {
  stationId: string;
  tick: number;
  time: number;
  temperature: number;
  pressure: number;
  humidity: number;
  /** false when the packet never arrived */
  received: boolean;
  latencyMs: number;
  delayed: boolean;
}

export interface Evidence {
  baseline: number;
  spatial: number;
  rate: number;
  multivariate: number;
}

export interface Assessment {
  anomalous: boolean;
  type: AnomalyType;
  severity: Severity;
  severityScore: number;
  confidence: number;
  evidence: Evidence;
  reason: string;
  causes: string[];
  recommendation: string;
  expectedTemperature: number;
  difference: number;
  regionalConsensus: "NORMAL" | "EVENT";
  spatialDisagreement: "LOW" | "MODERATE" | "HIGH";
  recovery: {
    estimated: number;
    method: string;
    confidence: number;
  };
}

export interface AnomalyRecord extends Assessment {
  id: string;
  stationId: string;
  detectedAt: number;
  tick: number;
  observed: number;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  neighbors: { stationId: string; temperature: number; normal: boolean }[];
}

export interface StationHealth {
  stationId: string;
  score: number;
  state: HealthState;
  drift: "Low" | "Medium" | "High";
  noise: "Low" | "Medium" | "High";
  faultRate: number;
  communication: "Excellent" | "Stable" | "Intermittent" | "Poor";
  lastSeenTick: number;
  packetDelivery: number;
  latencyMs: number;
  missingPackets: number;
  delayedPackets: number;
}

export type ScenarioId =
  | "normal"
  | "temperature_spike"
  | "sensor_drift"
  | "frozen_sensor"
  | "sudden_drop"
  | "missing_packet"
  | "communication_delay"
  | "regional_event";
