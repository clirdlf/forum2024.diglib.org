import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { replacePaths, fingerprintInputs } from '../scripts/lib/files.mjs';
test('failed staged replacement restores all previous files', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'dlf-transaction-'));
  try {
    const work = path.join(root, 'work');
    await mkdir(work);
    const a = path.join(root, 'a'),
      b = path.join(root, 'b'),
      next = path.join(work, 'next');
    await writeFile(a, 'old a');
    await writeFile(b, 'old b');
    await writeFile(next, 'new a');
    await assert.rejects(
      replacePaths(
        [
          { staged: next, target: a },
          { staged: path.join(work, 'missing'), target: b },
        ],
        work,
      ),
    );
    assert.equal(await readFile(a, 'utf8'), 'old a');
    assert.equal(await readFile(b, 'utf8'), 'old b');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('input fingerprints bind caches to input bytes with stable ordering', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'dlf-inputs-'));
  try {
    const a = path.join(root, 'a'),
      b = path.join(root, 'b');
    await writeFile(a, 'one');
    await writeFile(b, 'two');
    const first = await fingerprintInputs([a, b]);
    assert.equal((await fingerprintInputs([b, a])).key, first.key);
    await writeFile(a, 'changed');
    assert.notEqual((await fingerprintInputs([a, b])).key, first.key);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
