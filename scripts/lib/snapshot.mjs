import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { zipSync, unzipSync, strToU8 } from 'fflate';
import { digest } from './files.mjs';
import { normalizePrefix } from './paths.mjs';
export async function createSnapshot({
  siteDir,
  outputDir,
  revision,
  sourceCommit = null,
  dirty = false,
  pathPrefix = '/',
}) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(revision)) throw Error('Invalid snapshot revision');
  pathPrefix = normalizePrefix(pathPrefix);
  const contents = {},
    files = [];
  async function walk(directory, relative = '') {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const name = relative + entry.name,
        filename = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(filename, name + '/');
      else if (entry.isFile()) {
        const bytes = await readFile(filename);
        contents[name] = new Uint8Array(bytes);
        files.push({ path: name, bytes: bytes.length, sha256: digest(bytes) });
      } else throw Error('Snapshot cannot include symbolic links or special files: ' + name);
    }
  }
  await walk(siteDir);
  if (!contents['index.html'] || !contents['CNAME'] || !contents['.nojekyll'])
    throw Error('Snapshot requires a complete built Pages site');
  if (contents.SHA256SUMS) throw Error('Built site already contains reserved SHA256SUMS');
  files.sort((a, b) => a.path.localeCompare(b.path));
  contents.SHA256SUMS = strToU8(files.map((f) => `${f.sha256}  ${f.path}\n`).join(''));
  const zip = zipSync(contents, { level: 0, mtime: new Date(1980, 0, 1) });
  // Round-trip validation catches a corrupt or incomplete ZIP before it is published.
  const restored = unzipSync(zip);
  for (const file of files)
    if (!restored[file.path] || digest(restored[file.path]) !== file.sha256)
      throw Error('Snapshot verification failed: ' + file.path);
  const metadata = {
    schemaVersion: 1,
    revision,
    sourceCommit,
    dirty,
    pathPrefix,
    domain: new TextDecoder().decode(contents.CNAME).trim(),
    files,
  };
  const manifest = JSON.stringify(metadata, null, 2) + '\n',
    name = `forum2024-${revision}.zip`;
  await mkdir(outputDir, { recursive: true });
  const archive = path.join(outputDir, name);
  await writeFile(archive, zip);
  await writeFile(path.join(outputDir, 'snapshot.json'), manifest);
  await writeFile(
    path.join(outputDir, 'SHA256SUMS'),
    `${digest(zip)}  ${name}\n${digest(manifest)}  snapshot.json\n`,
  );
  return { archive, files: files.length, bytes: zip.length };
}
