import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const screenshotsDir = path.join(projectRoot, 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\temp', 'chrome_cdp_' + Date.now());
const cdpPort = 9222;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('Launching headless Chrome for screenshots...');
  const chromeProcess = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      `--remote-debugging-port=${cdpPort}`,
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ],
    { stdio: 'ignore', detached: false }
  );

  // Wait for CDP port to open
  let connected = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://localhost:${cdpPort}/json/version`);
      if (res.ok) {
        connected = true;
        break;
      }
    } catch {
      await sleep(300);
    }
  }

  if (!connected) {
    console.error('Failed to connect to Chrome CDP.');
    chromeProcess.kill();
    process.exit(1);
  }

  console.log('Connected to Chrome DevTools Protocol.');

  const targets = [
    { name: 'home', route: '/' },
    { name: 'login', route: '/login' },
    { name: 'dashboard', route: '/dashboard' },
    { name: 'investments', route: '/investments' },
    { name: 'analytics', route: '/analytics' },
  ];

  const viewports = [
    { name: 'desktop', width: 1280, height: 800, isMobile: false },
    { name: 'mobile', width: 390, height: 844, isMobile: true },
  ];

  const themes = ['light', 'dark'];

  try {
    for (const target of targets) {
      for (const vp of viewports) {
        for (const theme of themes) {
          const filename = `${target.name}-${vp.name}-${theme}.png`;
          const filepath = path.join(screenshotsDir, filename);

          // Create new tab via CDP
          const newTabRes = await fetch(`http://localhost:${cdpPort}/json/new?http://localhost:4173${target.route}`, {
            method: 'PUT',
          });
          const targetInfo = await newTabRes.json();
          const wsUrl = targetInfo.webSocketDebuggerUrl;

          await new Promise((resolve, reject) => {
            const ws = new WebSocket(wsUrl);
            let msgId = 1;

            const send = (method, params = {}) => {
              const id = msgId++;
              ws.send(JSON.stringify({ id, method, params }));
              return id;
            };

            ws.onopen = async () => {
              send('Page.enable');

              // Set viewport
              send('Emulation.setDeviceMetricsOverride', {
                width: vp.width,
                height: vp.height,
                deviceScaleFactor: 1,
                mobile: vp.isMobile,
              });

              // Wait 1.5s for page to render and react hydration
              await sleep(1500);

              // Apply theme via document class and localStorage
              send('Runtime.evaluate', {
                expression: `
                  if ('${theme}' === 'dark') {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('theme', 'dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('theme', 'light');
                  }
                `,
              });

              await sleep(400);

              // Capture screenshot
              send('Page.captureScreenshot', { format: 'png' });
            };

            ws.onmessage = async (evt) => {
              const data = JSON.parse(evt.data);
              if (data.result && data.result.data) {
                // Screenshot data received
                fs.writeFileSync(filepath, Buffer.from(data.result.data, 'base64'));
                console.log(`Saved screenshot: ${filename} (${(fs.statSync(filepath).size / 1024).toFixed(1)} KB)`);
                ws.close();
                // Close target tab
                await fetch(`http://localhost:${cdpPort}/json/close/${targetInfo.id}`);
                resolve();
              }
            };

            ws.onerror = (err) => {
              console.error(`WebSocket error for ${filename}:`, err);
              reject(err);
            };
          });
        }
      }
    }
  } finally {
    chromeProcess.kill();
    console.log('All screenshots captured successfully.');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

