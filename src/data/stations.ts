import type { Station } from "@/lib/atmos/types";

/** Deterministic AWS network used across the whole prototype. */
export const STATIONS: Station[] = [
  {
    id: "AWS-001",
    name: "Coastal Ridge",
    district: "Panaji North",
    lat: 15.512,
    lon: 73.836,
    x: 18,
    y: 22,
    elevation: 42,
    seed: 1.1,
    baseTemp: 30.4,
    basePressure: 1008.2,
    baseHumidity: 71,
  },
  {
    id: "AWS-002",
    name: "Harbour Point",
    district: "Panaji South",
    lat: 15.468,
    lon: 73.901,
    x: 36,
    y: 34,
    elevation: 18,
    seed: 2.3,
    baseTemp: 31.1,
    basePressure: 1009.1,
    baseHumidity: 69,
  },
  {
    id: "AWS-003",
    name: "Valley Station",
    district: "Ponda West",
    lat: 15.401,
    lon: 74.012,
    x: 52,
    y: 46,
    elevation: 96,
    seed: 3.7,
    baseTemp: 31.8,
    basePressure: 1007.6,
    baseHumidity: 68,
  },
  {
    id: "AWS-004",
    name: "Plateau Farm",
    district: "Ponda East",
    lat: 15.372,
    lon: 74.088,
    x: 66,
    y: 38,
    elevation: 142,
    seed: 4.9,
    baseTemp: 30.8,
    basePressure: 1006.9,
    baseHumidity: 72,
  },
  {
    id: "AWS-005",
    name: "River Basin",
    district: "Sanguem",
    lat: 15.298,
    lon: 74.141,
    x: 74,
    y: 58,
    elevation: 63,
    seed: 5.2,
    baseTemp: 31.5,
    basePressure: 1008.8,
    baseHumidity: 74,
  },
  {
    id: "AWS-006",
    name: "Forest Edge",
    district: "Canacona",
    lat: 15.204,
    lon: 74.03,
    x: 44,
    y: 70,
    elevation: 188,
    seed: 6.4,
    baseTemp: 29.6,
    basePressure: 1005.4,
    baseHumidity: 80,
  },
  {
    id: "AWS-007",
    name: "Airfield West",
    district: "Vasco",
    lat: 15.386,
    lon: 73.826,
    x: 24,
    y: 56,
    elevation: 27,
    seed: 7.8,
    baseTemp: 31.2,
    basePressure: 1009.4,
    baseHumidity: 66,
  },
  {
    id: "AWS-008",
    name: "Hill Relay",
    district: "Valpoi",
    lat: 15.53,
    lon: 74.14,
    x: 82,
    y: 22,
    elevation: 312,
    seed: 8.6,
    baseTemp: 28.9,
    basePressure: 1004.1,
    baseHumidity: 77,
  },
];

export const STATION_MAP = new Map(STATIONS.map((s) => [s.id, s]));

export const PRIMARY_STATION = "AWS-003";

/** Three closest stations, precomputed for the spatial consensus panel. */
export function neighborsOf(stationId: string, count = 3): string[] {
  const self = STATION_MAP.get(stationId);
  if (!self) return [];
  return STATIONS.filter((s) => s.id !== stationId)
    .map((s) => ({
      id: s.id,
      d: Math.hypot(s.lat - self.lat, s.lon - self.lon),
    }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map((s) => s.id);
}
