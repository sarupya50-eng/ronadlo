const fs = require('fs');
const path = require('path');

const root = process.cwd();
const standalone = path.join(root, '.next', 'standalone');
const desktop = path.join(root, 'desktop');
const nextApp = path.join(desktop, 'next-app');
const nodeRuntime = path.join(desktop, 'node-runtime');
const nodeExe = path.join(root, 'node_modules', 'node', 'bin', 'node.exe');

if (!fs.existsSync(path.join(standalone, 'server.js'))) {
  throw new Error('Standalone server not found. Run npm run build first.');
}
if (!fs.existsSync(nodeExe)) {
  throw new Error('Windows Node.js runtime not found. Run this script on Windows.');
}

fs.rmSync(desktop, { recursive: true, force: true });
fs.mkdirSync(nextApp, { recursive: true });
fs.mkdirSync(nodeRuntime, { recursive: true });

fs.cpSync(standalone, nextApp, { recursive: true });
fs.cpSync(
  path.join(root, '.next', 'static'),
  path.join(nextApp, '.next', 'static'),
  { recursive: true }
);

const publicDir = path.join(root, 'public');
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, path.join(nextApp, 'public'), { recursive: true });
}

fs.copyFileSync(nodeExe, path.join(nodeRuntime, 'node.exe'));
console.log('Desktop package prepared.');
