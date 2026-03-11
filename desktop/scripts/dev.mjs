/**
 * Development script for Boxcord Desktop.
 *
 * 1. Compiles TypeScript (main + preload)
 * 2. Starts Electron pointing at the Vite dev server
 *
 * Prerequisites: Vite dev server running on localhost:5173
 */

import { execSync, spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

console.log('🔨 Compiling TypeScript...');
execSync('npx tsc -p tsconfig.main.json && npx tsc -p tsconfig.preload.json', {
  stdio: 'inherit',
  cwd: root,
});

console.log('🚀 Starting Electron...');
const electron = spawn('npx', ['electron', '.'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    BOXCORD_URL: 'http://localhost:5173',
  },
  cwd: root,
});

electron.on('close', (code) => {
  process.exit(code ?? 0);
});
