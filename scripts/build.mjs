import { spawnSync } from 'node:child_process';
import { cleanOutput } from './lib/build-output.mjs';
await cleanOutput();
const result = spawnSync(
  process.execPath,
  ['node_modules/@11ty/eleventy/cmd.cjs', ...process.argv.slice(2)],
  { stdio: 'inherit', env: process.env },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
