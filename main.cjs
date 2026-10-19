
const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = 3210;
const URL = `http://127.0.0.1:${PORT}`;

let server;
let logFile;

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  try {
    fs.appendFileSync(logFile, line);
  } catch {}
}

function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(URL, (res) => {
      res.resume();
      resolve(true);
    });

    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });

    req.on('error', () => resolve(false));
  });
}

async function waitForServer() {
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js server exited with code ${server.exitCode}`);
    }

    if (await checkServer()) return;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  throw new Error('Next.js did not start within 60 seconds.');
}

async function startApp() {
  logFile = path.join(app.getPath('userData'), 'startup.log');
  log('Starting Auralis Jamendo');

  const resources = process.resourcesPath;
  const node = path.join(resources, 'node-runtime', 'node.exe');
  const serverFile = path.join(resources, 'next-app', 'server.js');

  if (!fs.existsSync(node)) {
    throw new Error(`Bundled Node.js is missing:\n${node}`);
  }

  if (!fs.existsSync(serverFile)) {
    throw new Error(`Next.js server is missing:\n${serverFile}`);
  }

  server = spawn(node, [serverFile], {
    cwd: path.dirname(serverFile),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(PORT),
      HOSTNAME: '127.0.0.1'
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });

  server.stdout.on('data', data => log(`SERVER: ${data}`));
  server.stderr.on('data', data => log(`SERVER ERROR: ${data}`));
  server.on('error', error => log(`SPAWN ERROR: ${error.stack || error}`));
  server.on('exit', (code, signal) =>
    log(`SERVER EXIT: code=${code}, signal=${signal}`)
  );

  await waitForServer();

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    title: 'Auralis Jamendo'
  });

  win.once('ready-to-show', () => win.show());
  await win.loadURL(URL);
  log('App window opened successfully');
}

app.whenReady().then(async () => {
  try {
    await startApp();
  } catch (error) {
    if (logFile) log(`STARTUP FAILURE: ${error.stack || error}`);

    dialog.showErrorBox(
      'Auralis Jamendo could not start',
      `${error.message}\n\nLog file:\n${logFile || 'Unavailable'}`
    );
  }
});

app.on('before-quit', () => {
  if (server && server.exitCode === null) server.kill();
});

app.on('window-all-closed', () => app.quit());
