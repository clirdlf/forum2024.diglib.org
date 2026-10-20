import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditAccessibility } from '../scripts/lib/accessibility-audit.mjs';
const valid =
  '<html lang="en"><body><main><h1>Page</h1><h4 role="heading" aria-level="2">Section</h4><button id="control" aria-controls="panel">Open</button><section id="panel" aria-labelledby="control"></section></main></body></html>';
test('generated accessibility audit accepts corrected semantic headings and resolving references', () => {
  assert.deepEqual(auditAccessibility(valid), []);
});
test('generated accessibility audit rejects duplicate IDs, missing landmarks, heading gaps and dangling ARIA', () => {
  const errors = auditAccessibility(
    '<html><body><h2>No title</h2><h4>Gap</h4><button id="x" aria-controls="missing" aria-labelledby="gone">Open</button><div id="x"></div></body></html>',
  );
  for (const message of [
    'Duplicate ID',
    'main landmark',
    'primary heading',
    'Heading level',
    'aria-controls',
    'aria-labelledby',
  ])
    assert.ok(
      errors.some((e) => e.includes(message)),
      message,
    );
});
test('generated accessibility audit rejects multiple primary headings and main landmarks', () => {
  const errors = auditAccessibility('<main><h1>One</h1></main><div role="main"><h1>Two</h1></div>');
  assert.ok(errors.some((e) => e.includes('main landmark')));
  assert.ok(errors.some((e) => e.includes('primary heading')));
});
