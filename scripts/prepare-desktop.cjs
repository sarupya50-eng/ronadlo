
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const standalone = path.join(root, '.next', 'standalone');
const desktop = path.join(root, 'desktop');
const nextApp = path.join(desktop, 'next-app');
const nodeRuntime = path.join(desktop, 'node-runtime');
const nodeExe = path.join(root, 'node_modules', 'node', 'bin', 'node.exe');

function requirePath(file, message) {
  if (!fs.existsSync(file)) {
    throw new Error(`${message}\nMissing path: ${file}`);
  }
}

requirePath(
  path.join(standalone, 'server.js'),
  'Next.js standalone server was not generated. Run npm run build first.'
);

requirePath(nodeExe, 'Bundled Windows Node.js runtime was not found.');

const projectModules = path.join(root, 'node_modules');
const nextPackage = path.join(projectModules, 'next', 'package.json');

requirePath(nextPackage, 'Next.js is missing from root node_modules.');

fs.rmSync(desktop, { recursive: true, force: true });
fs.mkdirSync(nextApp, { recursive: true });
fs.mkdirSync(nodeRuntime, { recursive: true });

// Copy the standalone server and its traced dependencies.
fs.cpSync(standalone, nextApp, { recursive: true });

// Ensure the Next.js package is available beside server.js.
const destinationModules = path.join(nextApp, 'node_modules');
fs.mkdirSync(destinationModules, { recursive: true });

fs.cpSync(
  path.join(projectModules, 'next'),
  path.join(destinationModules, 'next'),
  { recursive: true, force: true }
);

// Copy root dependencies too, preserving the package directory structure.
for (const name of fs.readdirSync(projectModules)) {
  if (name.startsWith('.')) continue;

  const source = path.join(projectModules, name);
  const destination = path.join(destinationModules, name);

  if (!fs.existsSync(destination)) {
    fs.cpSync(source, destination, {
      recursive: true,
      force: true,
      dereference: true
    });
  }
}

// Include static assets used by the Next.js server.
const staticDir = path.join(root, '.next', 'static');
if (fs.existsSync(staticDir)) {
  fs.cpSync(
    staticDir,
    path.join(nextApp, '.next', 'static'),
    { recursive: true }
  );
}

const publicDir = path.join(root, 'public');
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, path.join(nextApp, 'public'), {
    recursive: true
  });
}

// Bundle Node.js with the application.
fs.copyFileSync(nodeExe, path.join(nodeRuntime, 'node.exe'));

// Validate the actual packaged paths.
requirePath(
  path.join(nextApp, 'server.js'),
  'Packaged Next.js server is missing.'
);

requirePath(
  path.join(nextApp, 'node_modules', 'next', 'package.json'),
  'Next.js package was not copied into the desktop application.'
);

console.log('Desktop package prepared successfully.');
console.log('Server:', path.join(nextApp, 'server.js'));
console.log('Next.js:', path.join(nextApp, 'node_modules', 'next', 'package.json'));
console.log('Node.js:', path.join(nodeRuntime, 'node.exe'));
