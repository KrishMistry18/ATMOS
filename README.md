# A.T.M.O.S — Adaptive Tracking & Monitoring of Observational Sensors

A.T.M.O.S is an intelligent monitoring and anomaly-detection console for Automatic Weather
Stations (AWS). It watches temperature (°C), atmospheric pressure (hPa) and relative humidity (%)
across a station network and separates normal observations, genuine regional weather events,
sensor faults, abnormal readings, communication problems and sensor degradation.

> **Prototype notice.** This build is a frontend-first demonstration. All telemetry is
> deterministic simulated data generated in the browser, and the intelligence layer is
> rule-based logic that represents the intended AI/ML pipeline. No trained model, backend,
> database or MQTT infrastructure is involved.

## Problem

AWS operators receive thousands of raw observations per day. A single 55°C reading can mean a
failing sensor, a genuine heat event, or a communication fault — and static thresholds cannot
tell them apart. Bad data silently contaminates forecasts and research datasets.

## Solution

A.T.M.O.S compares every observation against a station-specific adaptive baseline, cross-checks
it against neighbouring stations, tests it for physical consistency across parameters, classifies
the fault pattern, scores sensor health over time and publishes a recovery estimate beside — never
instead of — the measured value.

## Six core capabilities

1. **Adaptive Sensor Intelligence** — station-specific baselines instead of fixed thresholds.
2. **Physics-Aware Multivariate Fusion** — temperature, pressure and humidity checked together.
3. **Spatio-Temporal Weather Consensus** — isolated sensor fault vs. genuine regional event.
4. **Intelligent Fault & Communication Fingerprinting** — spike, drift, frozen value, packet loss.
5. **Predictive Sensor Health** — health score, drift, noise, fault rate, link quality.
6. **Explainable Self-Healing Quality Control** — evidence breakdown plus MEASURED/ESTIMATED badges.

## Pages

Overview · Live Monitoring · Stations · Anomalies · Sensor Health · Network Map · Analytics ·
System Intelligence.

## Architecture

```
src/data/        stations.ts, scenarios.ts        deterministic network + demo scenarios
src/services/    simulation.ts                    simulated observation generator
                 anomalyEngine.ts                 detection, evidence, severity, recovery
                 healthEngine.ts                  sensor health scoring
                 simulationStore.tsx              in-browser simulation loop + state
src/components/atmos/                             console shell, charts, drawers, panels
src/routes/                                       one route per page
```

Technology: TanStack Start (React 19), TanStack Router, Tailwind CSS v4 design tokens, Recharts,
Radix/shadcn primitives, TypeScript.

## Demo instructions

1. Open **Overview** — the network is healthy and telemetry is streaming.
2. In the **Simulation Mode** panel choose **Temperature Spike**.
3. AWS-003 jumps to 55°C while its neighbours stay near 31°C; the critical and active-anomaly
   counters rise.
4. Open **Anomalies** and click the new record to inspect evidence, spatial consensus, root cause,
   recommended action and the self-healing estimate.
5. Check **Sensor Health** for the degradation impact, and **Network Map** for the spatial view.
6. Use **Reset** to return the network to normal, or try Drift, Frozen Sensor, Sudden Drop,
   Missing Packet, Communication Delay and Regional Weather Event.
