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

## Getting Started Locally

```bash
# Install dependencies
bun install   # or npm install

# Start development server
bun dev       # or npm run dev

# Run typecheck
bun x tsc --noEmit

# Production build
bun run build # or npm run build
```

## Vercel Deployment

The application is pre-configured for Vercel deployment:
- **Build Command**: `bun run build` (or `npm run build` with `NITRO_PRESET=vercel`)
- **Output Directory**: `.output` / `.vercel/output`
- **Framework Preset**: Other / Vite / Nitro

## Primary SIH Demo Flow

1. Open **Overview** — observe the nominal 8-station telemetry grid streaming every 1.5s.
2. Click **"Trigger 55°C Spike"** (or select **Temperature Spike** in the control panel).
3. **AWS-003** jumps to **55.0°C** (+23.2°C deviation) while neighboring stations stay normal (~31.1°C).
4. The **Active Anomalies** KPI increases, the live banner highlights the spike, and station health drops.
5. Click **"Inspect Anomaly Detail"** to review:
   - **Type**: SPIKE
   - **Severity**: 91%
   - **Confidence**: 96%
   - **Adaptive Baseline**: Expected ~31.8°C vs Observed 55.0°C (+23.2°C delta)
   - **Evidence**: Adaptive baseline deviation (97%), High rate of change (92%), Spatial disagreement (94%), Multivariate inconsistency (82%)
   - **Root Cause**: Probable sensor anomaly
   - **Recommended Action**: Inspect sensor; verify calibration and local conditions
   - **Spatial Consensus**: Target anomalous, neighbors normal, spatial disagreement HIGH
   - **Sensor Health Impact**: Score drop (-24 pts), projected WATCH/DEGRADED state
   - **Self-Healing QC Reconstruction**: Measured 55.0°C preserved; Estimated 31.8°C (93% confidence)
   - **Audit Timeline**: Step-by-step verification trace from T-0ms to T+88ms.
6. Navigate to **Stations**, **Sensor Health**, **Network Map**, **Analytics**, and **System Intelligence** to verify network-wide reactivity.
7. Click **Reset** to return the grid to normal, or test the remaining fault scenarios (Drift, Frozen Sensor, Sudden Drop, Missing Packet, Communication Delay, Regional Weather Event).
