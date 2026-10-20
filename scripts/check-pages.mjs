// Exercise the same archive under a project-site URL without changing source.
import { spawnSync } from 'node:child_process';
for (const command of ['build', 'verify']) {
  const result = spawnSync('pnpm', [command], {
    stdio: 'inherit',
    env: {
      ...process.env,
      SITE_PATH_PREFIX: '/archive-preview/',
      SITE_OUTPUT_DIR: '.cache/pages-site',
    },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
