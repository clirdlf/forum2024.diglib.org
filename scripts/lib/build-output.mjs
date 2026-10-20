import path from 'node:path';
import { rm, mkdir } from 'node:fs/promises';
// Cleanup is limited to the default generated site or a single disposable cache directory.
export function outputDirectory(env = process.env, root = process.cwd()) {
  const output = env.SITE_OUTPUT_DIR || '_site';
  if (output !== '_site' && !/^\.cache\/[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(output))
    throw Error('Invalid build output directory: ' + output);
  return path.resolve(root, output);
}
export async function cleanOutput(env = process.env, root = process.cwd()) {
  const output = outputDirectory(env, root);
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  return output;
}
