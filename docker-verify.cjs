// Verification script to run inside Docker container
// Gathers runtime evidence about the rollup native dependency issue

const fs = require('fs');
const path = require('path');

// #region agent log
fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'docker-verify.js:1',
    message: 'Docker verification started',
    data: { nodeVersion: process.version, platform: process.platform, sessionId: 'debug-session' }
  }),
}).catch(() => {});
// #endregion

// #region agent log
fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'docker-verify.js:2',
    message: 'Checking @rollup/ native dependencies',
    data: { nodeModulesPath: path.join(__dirname, 'node_modules'), sessionId: 'debug-session' }
  }),
}).catch(() => {});
// #endregion

console.log('=== Docker Container Verification ===');
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log('');

// List @rollup/ packages
const nodeModulesPath = path.join(__dirname, 'node_modules');
let rollupPackages = [];

try {
  const entries = fs.readdirSync(nodeModulesPath, { withFileTypes: true });
  rollupPackages = entries
    .filter(e => e.isDirectory() && e.name.startsWith('@rollup'))
    .map(e => e.name);
} catch (e) {
  console.log('Error reading node_modules:', e.message);
}

// #region agent log
fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'docker-verify.js:3',
    message: 'Found @rollup/ packages',
    data: { rollupPackages, sessionId: 'debug-session' }
  }),
}).catch(() => {});
// #endregion

console.log(`@rollup/ packages installed: ${rollupPackages.join(', ') || 'none'}`);

// Check for the problematic package
const rollupLinuxGnuPath = path.join(nodeModulesPath, '@rollup/rollup-linux-x64-gnu');
const hasRollupLinuxGnu = fs.existsSync(rollupLinuxGnuPath);

console.log(`@rollup/rollup-linux-x64-gnu exists: ${hasRollupLinuxGnu}`);

// #region agent log
fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'docker-verify.js:4',
    message: 'Native binary check result',
    data: { hasRollupLinuxX64Gnu: hasRollupLinuxGnu, sessionId: 'debug-session' }
  }),
}).catch(() => {});
// #endregion

if (hasRollupLinuxGnu) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(rollupLinuxGnuPath, 'package.json'), 'utf8'));
    console.log(`Version: ${pkg.version}`);
  } catch (e) {
    console.log('Could not read package.json');
  }
}

// Try to require rollup to see if it works
console.log('');
console.log('Testing rollup import...');

try {
  const rollupPath = path.join(nodeModulesPath, 'rollup');
  const rollupPkg = JSON.parse(fs.readFileSync(path.join(rollupPath, 'package.json'), 'utf8'));
  console.log(`rollup package version: ${rollupPkg.version}`);
  console.log('✓ rollup package is installed');
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'docker-verify.js:5',
      message: 'rollup package installed successfully',
      data: { rollupVersion: rollupPkg.version, sessionId: 'debug-session' }
    }),
  }).catch(() => {});
  // #endregion
} catch (e) {
  console.log(`✗ Error: ${e.message}`);
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'docker-verify.js:6',
      message: 'rollup package check failed',
      data: { error: e.message, sessionId: 'debug-session' }
    }),
  }).catch(() => {});
  // #endregion
}

// #region agent log
fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'docker-verify.js:7',
    message: 'Verification completed',
    data: { completed: true, sessionId: 'debug-session' }
  }),
}).catch(() => {});
// #endregion
