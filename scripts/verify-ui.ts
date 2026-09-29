import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\faee3c0a-6b60-42ae-9945-60eaf49b2848";

async function cdp() {
  const versionRes = await fetch("http://127.0.0.1:9222/json/list");
  const pages = await versionRes.json();
  let wsUrl = pages[0]?.webSocketDebuggerUrl;

  if (!wsUrl) {
    const newPage = await fetch("http://127.0.0.1:9222/json/new?http://localhost:8081/");
    const pageData = await newPage.json();
    wsUrl = pageData.webSocketDebuggerUrl;
  }

  const ws = new WebSocket(wsUrl);

  let id = 1;
  const pending = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id)!;
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));

  const send = (method: string, params: any = {}) => {
    return new Promise((resolve, reject) => {
      const reqId = id++;
      pending.set(reqId, { resolve, reject });
      ws.send(JSON.stringify({ id: reqId, method, params }));
    });
  };

  // Setup viewport & enable domains
  await send("Page.enable");
  await send("Runtime.enable");
  await send("DOM.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const takeScreenshot = async (filename: string) => {
    const res: any = await send("Page.captureScreenshot", { format: "png" });
    const buffer = Buffer.from(res.data, "base64");
    const filepath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    console.log(`Saved screenshot: ${filename} (${buffer.length} bytes)`);
    return filepath;
  };

  const evaluate = async (expression: string) => {
    const res: any = await send("Runtime.evaluate", { expression, returnByValue: true });
    return res.result?.value;
  };

  console.log("Navigating to Overview...");
  await send("Page.navigate", { url: "http://localhost:8081/" });
  await wait(2000);

  // 1. Dark Mode Overview
  await takeScreenshot("overview_redesign_dark.png");

  // 2. Test Light Mode Toggle
  console.log("Toggling to Light Mode...");
  await evaluate(`document.querySelector("button[title*='Switch to Light Mode']")?.click()`);
  await wait(1000);
  await takeScreenshot("overview_redesign_light.png");

  // Verify theme persisted
  const currentTheme = await evaluate(`localStorage.getItem("atmos-theme")`);
  console.log("Current localStorage theme:", currentTheme);

  // 3. Switch back to Dark theme for remaining inspection
  await evaluate(`document.querySelector("button[title*='Switch to Dark Mode']")?.click()`);
  await wait(500);

  // 4. Test Scroll Behavior
  console.log("Testing scroll behavior...");
  const scrollTest = await evaluate(`(() => {
    const sidebar = document.querySelector('aside');
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    const initialSidebarTop = sidebar?.getBoundingClientRect().top;
    const initialHeaderTop = header?.getBoundingClientRect().top;
    
    // Scroll the main content
    main?.scrollTo({ top: 500, behavior: 'instant' });
    
    const afterSidebarTop = sidebar?.getBoundingClientRect().top;
    const afterHeaderTop = header?.getBoundingClientRect().top;
    const mainScrollTop = main?.scrollTop;

    return {
      initialSidebarTop,
      afterSidebarTop,
      initialHeaderTop,
      afterHeaderTop,
      mainScrollTop,
      sidebarHeight: sidebar?.getBoundingClientRect().height,
      windowHeight: window.innerHeight
    };
  })()`);
  console.log("Scroll test result:", scrollTest);

  // 5. Test 55°C Spike Scenario
  console.log("Triggering 55°C Temperature Spike...");
  await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Trigger 55°C Spike'));
    btn?.click();
  })()`);
  await wait(1500);

  // Open Anomaly Drawer
  console.log("Opening Anomaly Detail Drawer...");
  await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Inspect Anomaly Evidence'));
    btn?.click();
  })()`);
  await wait(1500);
  await takeScreenshot("anomaly_drawer_redesign.png");

  // Close Drawer
  await evaluate(`(() => {
    const closeBtn = document.querySelector("button[data-radix-collection-item]") || document.querySelector("button.absolute");
    (closeBtn as HTMLElement)?.click();
  })()`);
  await wait(800);

  // 6. Navigate all routes and capture screenshots
  const routes = [
    { path: "/live-monitoring", name: "live_monitoring_redesign.png" },
    { path: "/stations", name: "stations_redesign.png" },
    { path: "/anomalies", name: "anomalies_redesign.png" },
    { path: "/sensor-health", name: "sensor_health_redesign.png" },
    { path: "/network-map", name: "network_map_redesign.png" },
    { path: "/analytics", name: "analytics_redesign.png" },
    { path: "/system-intelligence", name: "system_intelligence_redesign.png" },
  ];

  for (const r of routes) {
    console.log(`Navigating to ${r.path}...`);
    await send("Page.navigate", { url: `http://localhost:8081${r.path}` });
    await wait(1500);
    await takeScreenshot(r.name);
  }

  // Check console errors
  const consoleErrors = await evaluate(`window.__atmos_errors || []`);
  console.log("Console errors detected:", consoleErrors);

  ws.close();
  console.log("Verification completed successfully!");
}

cdp().catch(console.error);
