
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const standalone = path.join(root, '.next', 'standalone');
const desktop = path.join(root, 'desktop');
const nextApp = path.join(desktop, 'next-app');
const nodeRuntime = path.join(desktop, 'node-runtime');
const nodeExe = path.join(root, 'node_modules', 'node', 'bin', 'node.exe');

if (!fs.existsSync(path.join(standalone, 'server.js'))) {
  throw new Error('Missing standalone server. Run npm run build first.');
}

if (!fs.existsSync(nodeExe)) {
  throw new Error(`Missing Windows Node.js runtime: ${nodeExe}`);
}

fs.rmSync(desktop, { recursive: true, force: true });
fs.mkdirSync(nextApp, { recursive: true });
fs.mkdirSync(nodeRuntime, { recursive: true });

// Copy the standalone Next.js server and its traced dependencies.
fs.cpSync(standalone, nextApp, { recursive: true });

// Ensure the Next.js package and its dependencies are present.
fs.cpSync(
  path.join(root, 'node_modules'),
  path.join(nextApp, 'node_modules'),
  { recursive: true, force: true }
);

// Include browser assets and public files.
const staticDir = path.join(root, '.next', 'static');
if (fs.existsSync(staticDir)) {
  fs.cpSync(staticDir, path.join(nextApp, '.next', 'static'), {
    recursive: true
  });
}

const publicDir = path.join(root, 'public');
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, path.join(nextApp, 'public'), {
    recursive: true
  });
}

fs.copyFileSync(nodeExe, path.join(nodeRuntime, 'node.exe'));

if (!fs.existsSync(path.join(nextApp, 'node_modules', 'next', 'package.json'))) {
  throw new Error('Next.js is still missing from the packaged application.');
}

console.log('Desktop package prepared with Next.js dependencies.');
