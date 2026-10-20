import { readFile, mkdir, rename, rm, access } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
export const exists = (file) =>
  access(file).then(
    () => true,
    () => false,
  );
export const digest = (value) => createHash('sha256').update(value).digest('hex');
export async function checksum(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
export function within(root, relative) {
  const file = path.resolve(root, relative);
  if (!file.startsWith(path.resolve(root) + path.sep))
    throw Error('Path escapes directory: ' + relative);
  return file;
}
export async function readVerified(root, record) {
  const data = await readFile(within(root, record.file));
  if (digest(data) !== record.sha256) throw Error('Capture checksum mismatch: ' + record.file);
  return data.toString('utf8');
}
// Every replacement is fully prepared first. Restore backups if a rename fails.
export async function replacePaths(entries, workspace) {
  const changed = [];
  try {
    for (const [i, entry] of entries.entries()) {
      await mkdir(path.dirname(entry.target), { recursive: true });
      const backup = path.join(workspace, 'backup-' + i);
      const hadTarget = await exists(entry.target);
      if (hadTarget) await rename(entry.target, backup);
      changed.push({ ...entry, backup, hadTarget });
      await rename(entry.staged, entry.target);
    }
  } catch (error) {
    for (const entry of changed.reverse()) {
      await rm(entry.target, { recursive: true, force: true });
      if (entry.hadTarget) await rename(entry.backup, entry.target);
    }
    throw error;
  }
}
export async function fingerprintInputs(files) {
  const inputs = [];
  for (const file of [...files].sort()) inputs.push({ file, sha256: await checksum(file) });
  return { inputs, key: digest(JSON.stringify(inputs)) };
}
