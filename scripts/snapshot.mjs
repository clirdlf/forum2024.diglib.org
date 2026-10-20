import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { createSnapshot } from './lib/snapshot.mjs';
import { outputDirectory } from './lib/build-output.mjs';
const dirty = Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim());
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (process.env.SNAPSHOT_NAME && dirty)
  throw Error('Named release snapshots require a clean working tree');
const revision = process.env.SNAPSHOT_NAME || sourceCommit.slice(0, 12) + (dirty ? '-dirty' : '');
if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(revision)) throw Error('Invalid snapshot revision');
const env = { ...process.env, SITE_OUTPUT_DIR: '.cache/release-site' };
for (const script of ['scripts/build.mjs', 'scripts/verify.mjs']) {
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit', env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
const result = await createSnapshot({
  siteDir: outputDirectory(env),
  outputDir: path.join('dist/snapshots', revision),
  revision,
  sourceCommit,
  dirty,
  pathPrefix: env.SITE_PATH_PREFIX || '/',
});
console.log(`Verified snapshot: ${result.archive} (${result.files} files; ${result.bytes} bytes)`);
