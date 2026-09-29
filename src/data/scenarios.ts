import type { ScenarioId } from "@/lib/atmos/types";

export interface ScenarioDef {
  id: ScenarioId;
  label: string;
  description: string;
  target: string | "ALL";
}

export const SCENARIOS: ScenarioDef[] = [
  {
    id: "normal",
    label: "Normal Conditions",
    description: "All stations report within their adaptive baselines.",
    target: "ALL",
  },
  {
    id: "temperature_spike",
    label: "Temperature Spike",
    description: "AWS-003 reports 55°C while neighbours stay normal.",
    target: "AWS-003",
  },
  {
    id: "sensor_drift",
    label: "Sensor Drift",
    description: "AWS-003 slowly drifts away from its baseline.",
    target: "AWS-003",
  },
  {
    id: "frozen_sensor",
    label: "Frozen Sensor",
    description: "AWS-003 repeats an identical value every cycle.",
    target: "AWS-003",
  },
  {
    id: "sudden_drop",
    label: "Sudden Drop",
    description: "AWS-003 collapses far below the local consensus.",
    target: "AWS-003",
  },
  {
    id: "missing_packet",
    label: "Missing Packet",
    description: "Packets from AWS-003 stop arriving intermittently.",
    target: "AWS-003",
  },
  {
    id: "communication_delay",
    label: "Communication Delay",
    description: "AWS-003 packets arrive with heavy latency.",
    target: "AWS-003",
  },
  {
    id: "regional_event",
    label: "Regional Weather Event",
    description: "A genuine front moves across the whole network.",
    target: "ALL",
  },
];

export const SCENARIO_MAP = new Map(SCENARIOS.map((s) => [s.id, s]));
