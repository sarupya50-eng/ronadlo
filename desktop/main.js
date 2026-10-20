const { app, BrowserWindow, Menu, dialog, ipcMain, shell, session } = require("electron");
const { fork } = require("child_process");
const fs = require("fs");
const net = require("net");
const path = require("path");
const https = require("https");

const PREFERRED_PORT = 38417; // fixed so the saved library (localStorage) keeps the same origin

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

let win = null;
let serverProc = null;
let serverPort = null;
let quitting = false;
let mainStarted = false;

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

// ---------- config ----------
const configPath = () => path.join(app.getPath("userData"), "config.json");

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath(), "utf8"));
  } catch {
    return {};
  }
}

function writeConfig(cfg) {
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2));
}

const logPath = () => path.join(app.getPath("userData"), "server.log");

function readLogTail() {
  try {
    return fs.readFileSync(logPath(), "utf8").split("\n").slice(-15).join("\n");
  } catch {
    return "(no log)";
  }
}

// ---------- server ----------
function serverDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "server")
    : path.join(__dirname, "..", ".next", "standalone");
}

function isFree(port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once("error", () => resolve(false));
    s.once("listening", () => s.close(() => resolve(true)));
    s.listen(port, "127.0.0.1");
  });
}

async function pickPort() {
  if (await isFree(PREFERRED_PORT)) return PREFERRED_PORT;
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

function startServer(port, key) {
  const dir = serverDir();
  const script = path.join(dir, "server.js");

  if (!fs.existsSync(script)) {
    throw new Error("The app server files are missing:\n" + script);
  }

  fs.mkdirSync(app.getPath("userData"), { recursive: true });
  const out = fs.openSync(logPath(), "w");

  serverProc = fork(script, [], {
    cwd: dir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      YOUTUBE_API_KEY: key || "",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", out, out, "ipc"],
  });

  serverProc.on("exit", (code) => {
    serverProc = null;
    if (!quitting && code) {
      dialog.showErrorBox("Auralis server stopped", "Exit code " + code + "\n\n" + readLogTail());
    }
  });
}

function waitForServer(port, timeoutMs = 40000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      if (!serverProc) return reject(new Error("The server exited early.\n\n" + readLogTail()));
      if (Date.now() - start > timeoutMs) {
        return reject(new Error("The server took too long to start.\n\n" + readLogTail()));
      }
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        ok ? resolve() : setTimeout(attempt, 300);
      };
      const req = require("http").get({ host: "127.0.0.1", port, path: "/", timeout: 2000 }, (res) => {
        res.resume();
        finish(true);
      });
      req.on("timeout", () => {
        req.destroy();
        finish(false);
      });
      req.on("error", () => finish(false));
    };
    attempt();
  });
}

function stopServer() {
  if (serverProc) {
    try {
      serverProc.kill();
    } catch {}
    serverProc = null;
  }
}

// ---------- windows ----------
function createWindow(webPreferences = {}) {
  const w = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#000000",
    title: "Auralis",
    icon: path.join(__dirname, "build", "icon.png"),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      ...webPreferences,
    },
  });
  w.once("ready-to-show", () => w.show());
  w.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  return w;
}

function showSetup() {
  return new Promise((resolve) => {
    const s = createWindow({ preload: path.join(__dirname, "preload.js") });
    s.setSize(620, 620);
    s.setMinimumSize(520, 520);
    s.setMenu(null);
    let saved = false;
    ipcMain.once("auralis:saved", () => {
      saved = true;
      s.close();
    });
    s.on("closed", () => resolve(saved));
    s.loadFile(path.join(__dirname, "setup.html"));
  });
}

function checkKey(key) {
  return new Promise((resolve) => {
    const url =
      "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&q=test&key=" +
      encodeURIComponent(key);
    const req = https.get(url, { timeout: 8000 }, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => {
        if (res.statusCode === 200) return resolve({ ok: true });
        let msg = "HTTP " + res.statusCode;
        try {
          msg = JSON.parse(body).error.message || msg;
        } catch {}
        resolve({ ok: false, message: msg });
      });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, network: true, message: "Could not reach YouTube (timeout)." });
    });
    req.on("error", (e) => resolve({ ok: false, network: true, message: e.message }));
  });
}

ipcMain.handle("auralis:get-key", () => readConfig().youtubeApiKey || "");

ipcMain.handle("auralis:save-key", async (e, key, force) => {
  key = String(key || "").trim();
  if (!key) return { ok: false, message: "Paste your YouTube API key first." };
  if (!force) {
    const r = await checkKey(key);
    if (!r.ok) return { ok: false, canForce: true, message: r.message };
  }
  writeConfig({ ...readConfig(), youtubeApiKey: key });
  e.sender.send("auralis:done");
  setImmediate(() => ipcMain.emit("auralis:saved"));
  return { ok: true };
});

ipcMain.handle("auralis:open-link", (e, url) => {
  if (/^https:\/\//i.test(url)) shell.openExternal(url);
});

// ---------- main flow ----------
async function launch() {
  if (!readConfig().youtubeApiKey) {
    await showSetup();
    if (!readConfig().youtubeApiKey) return app.quit();
  }

  win = createWindow();
  mainStarted = true;
  win.loadFile(path.join(__dirname, "loading.html"));
  win.on("closed", () => (win = null));

  try {
    serverPort = await pickPort();
    startServer(serverPort, readConfig().youtubeApiKey);
    await waitForServer(serverPort);
    await win.loadURL("http://127.0.0.1:" + serverPort);
  } catch (err) {
    dialog.showErrorBox("Auralis could not start", String(err.message || err));
    quitting = true;
    stopServer();
    app.quit();
  }
}

function buildMenu() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "Auralis",
        submenu: [
          {
            label: "Change YouTube API key…",
            click: async () => {
              const saved = await showSetup();
              if (saved) {
                stopServer();
                try {
                  startServer(serverPort, readConfig().youtubeApiKey);
                  await waitForServer(serverPort);
                  if (win) win.reload();
                } catch (e) {
                  dialog.showErrorBox("Auralis", String(e.message || e));
                }
              }
            },
          },
          { type: "separator" },
          { role: "quit" },
        ],
      },
      {
        label: "View",
        submenu: [
          { role: "reload" },
          { role: "togglefullscreen" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { role: "resetZoom" },
          { type: "separator" },
          { role: "toggleDevTools" },
        ],
      },
    ])
  );
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => {
    cb(["media", "fullscreen", "clipboard-sanitized-write"].includes(permission));
  });
  buildMenu();
  launch();
});

app.on("before-quit", () => {
  quitting = true;
  stopServer();
});

app.on("window-all-closed", () => {
  // closing the setup window must not quit; launch() decides that itself
  if (mainStarted) app.quit();
});
