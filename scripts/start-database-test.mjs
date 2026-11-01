import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const wrangler = process.env.WRANGLER_CLI || resolve('node_modules/wrangler/bin/wrangler.js');
const state = resolve('.tmp-analysis/database-test-state');
async function run(args) {
  const child = spawn(process.execPath, args, { stdio: 'inherit', windowsHide: true });
  const code = await new Promise((r) => child.on('exit', r));
  if (code !== 0) throw new Error(`Command failed (${code})`);
}
await run(['node_modules/vite/bin/vite.js', 'build']);
await run(['node_modules/tsx/dist/cli.mjs', 'scripts/export-database.ts']);
// A separate local test store; never touches the remote database or development store.
writeFileSync(
  '.tmp-analysis/database-test.sql',
  readFileSync('migrations/0001_core.sql', 'utf8') +
    readFileSync('migrations/0002_credentials.sql', 'utf8') +
    'DELETE FROM user_credentials;' +
    '\nDELETE FROM audit_events; DELETE FROM plots; DELETE FROM zone_markets; DELETE FROM puc_allocations; DELETE FROM planting_zone;\n' +
    readFileSync('.tmp-analysis/seed.sql', 'utf8'),
);
await run([
  wrangler,
  'd1',
  'execute',
  'agritrace-db',
  '--local',
  '--persist-to',
  state,
  '--file',
  '.tmp-analysis/database-test.sql',
  '--json',
]);
await run([
  wrangler,
  'dev',
  '--local',
  '--persist-to',
  state,
  '--ip',
  '127.0.0.1',
  '--port',
  '8788',
]);
