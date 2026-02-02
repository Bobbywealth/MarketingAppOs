// Diagnostic script to test npm install behavior for optional dependencies
// Run this INSIDE the Docker container

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// #region agent log
fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'npm-diagnose.js:1',
    message: 'NPM install diagnostic started',
    data: { 
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      timestamp: Date.now(),
      sessionId: 'debug-session'
    }
  }),
}).catch(() => {});
// #endregion

// #region agent log
fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'npm-diagnose.js:2',
    message: 'Checking current node_modules state',
    data: { 
      nodeModulesExists: fs.existsSync(path.join(__dirname, 'node_modules')),
      sessionId: 'debug-session'
    }
  }),
}).catch(() => {});
// #endregion

console.log('=== NPM Install Diagnostic ===');
console.log(`Node.js: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log('');

// Check if @rollup/rollup-linux-x64-gnu exists
const rollupGnuPath = path.join(__dirname, 'node_modules/@rollup/rollup-linux-x64-gnu');
const hasRollupGnu = fs.existsSync(rollupGnuPath);

console.log(`@rollup/rollup-linux-x64-gnu exists: ${hasRollupGnu}`);

// #region agent log
fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'npm-diagnose.js:3',
    message: 'Checking rollup-linux-x64-gnu',
    data: { 
      hasRollupLinuxX64Gnu: hasRollupGnu,
      sessionId: 'debug-session'
    }
  }),
}).catch(() => {});
// #endregion

// Check @rollup/rollup-linux-musl-x64 if it exists (Alpine alternative)
const rollupMuslPath = path.join(__dirname, 'node_modules/@rollup/rollup-linux-musl-x64');
const hasRollupMusl = fs.existsSync(rollupMuslPath);

console.log(`@rollup/rollup-linux-musl-x64 exists: ${hasRollupMusl}`);

// #region agent log
fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'npm-diagnose.js:4',
    message: 'Checking musl variant',
    data: { 
      hasRollupLinuxMuslX64: hasRollupMusl,
      sessionId: 'debug-session'
    }
  }),
}).catch(() => {});
// #endregion

// List all @rollup/ packages
console.log('');
console.log('All @rollup/ packages:');

try {
  const entries = fs.readdirSync(path.join(__dirname, 'node_modules'), { withFileTypes: true });
  const rollupPackages = entries
    .filter(e => e.isDirectory() && e.name.startsWith('@rollup'))
    .map(e => e.name);
  
  console.log(rollupPackages.join(', '));
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'npm-diagnose.js:5',
      message: 'All @rollup/ packages listed',
      data: { 
        rollupPackages,
        sessionId: 'debug-session'
      }
    }),
  }).catch(() => {});
  // #endregion
  
  if (!hasRollupGnu && !hasRollupMusl) {
    console.log('');
    console.log('ERROR: Neither glibc nor musl rollup binary is installed!');
    console.log('This explains the MODULE_NOT_FOUND error.');
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'npm-diagnose.js:6',
        message: 'HYPOTHESIS CONFIRMED: Missing native binary package',
        data: { 
          hypothesisId: 'H2',
          confirmed: true,
          sessionId: 'debug-session'
        }
      }),
    }).catch(() => {});
    // #endregion
  }
} catch (e) {
  console.log(`Error: ${e.message}`);
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'npm-diagnose.js:7',
      message: 'Error listing packages',
      data: { 
        error: e.message,
        sessionId: 'debug-session'
      }
    }),
  }).catch(() => {});
  // #endregion
}

// #region agent log
fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'npm-diagnose.js:8',
    message: 'NPM diagnostic completed',
    data: { 
      completed: true,
      sessionId: 'debug-session'
    }
  }),
}).catch(() => {});
// #endregion
