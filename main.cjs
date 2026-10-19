const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let server;
let win;
const port = 3210;
const url = `http://127.0.0.1:${port}`;

function waitForServer() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const timer = setInterval(async () => {
      if (server && server.exitCode !== null) {
        clearInterval(timer);
        reject(new Error('Next.js server exited unexpectedly'));
        return;
      }

      try {
        await fetch(url);
        clearInterval(timer);
        resolve();
      } catch {
        if (++attempts >= 120) {
          clearInterval(timer);
          reject(new Error('Next.js server startup timed out'));
        }
      }
    }, 500);
  });
}

app.whenReady().then(async () => {
  const resources = process.resourcesPath;
  const node = path.join(resources, 'node-runtime', 'node.exe');
  const serverFile = path.join(resources, 'next-app', 'server.js');

  server = spawn(node, [serverFile], {
    cwd: path.dirname(serverFile),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      HOSTNAME: '127.0.0.1'
    },
    stdio: 'ignore',
    windowsHide: true
  });

  try {
    await waitForServer();
    win = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      title: 'Auralis Jamendo'
    });
    await win.loadURL(url);
  } catch (error) {
    console.error(error);
    app.quit();
  }
});

app.on('before-quit', () => {
  if (server && server.exitCode === null) server.kill();
});

app.on('window-all-closed', () => app.quit());
