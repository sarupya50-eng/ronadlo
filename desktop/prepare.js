// Builds the Next.js app as a self-contained server and gets it ready to be
// packed into the Windows app. Works on Windows, macOS and Linux.
//
//   node prepare.js              build + copy
//   node prepare.js --skip-build reuse the existing .next build

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

if (!process.argv.includes("--skip-build")) {
  console.log("Building the web app (standalone)...");

  const result = spawnSync("npm run build", {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ELECTRON_BUILD: "1", NEXT_TELEMETRY_DISABLED: "1" },
  });

  if (result.status !== 0) {
    console.error("The web app build failed. Fix the error above and try again.");
    process.exit(result.status || 1);
  }
}

if (!fs.existsSync(path.join(standalone, "server.js"))) {
  console.error(
    "Missing .next/standalone/server.js. Build with ELECTRON_BUILD=1 so Next.js creates it."
  );
  process.exit(1);
}

// The standalone server needs the static files and public folder next to it
fs.cpSync(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), {
  recursive: true,
});

if (fs.existsSync(path.join(root, "public"))) {
  fs.cpSync(path.join(root, "public"), path.join(standalone, "public"), {
    recursive: true,
  });
}

// Image optimisation binaries for other systems are dead weight (Auralis does
// not use next/image), so drop them.
const imgDir = path.join(standalone, "node_modules", "@img");

if (fs.existsSync(imgDir)) {
  for (const name of fs.readdirSync(imgDir)) {
    if (/linux|darwin/.test(name) && process.platform !== "linux" && process.platform !== "darwin") {
      fs.rmSync(path.join(imgDir, name), { recursive: true, force: true });
    }
  }
}

// Building a Windows app from Linux/macOS: drop binaries that cannot run on Windows
if (process.platform !== "win32" && fs.existsSync(imgDir)) {
  for (const name of fs.readdirSync(imgDir)) {
    fs.rmSync(path.join(imgDir, name), { recursive: true, force: true });
  }
}

console.log("Ready:", standalone);
