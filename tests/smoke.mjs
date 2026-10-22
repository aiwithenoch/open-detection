import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [index, app, styles] = await Promise.all([
  readFile(path.join(root, 'dist/index.html'), 'utf8'),
  readFile(path.join(root, 'dist/app.js'), 'utf8'),
  readFile(path.join(root, 'dist/styles.css'), 'utf8'),
]);

assert.match(index, /id="app"/);
assert.match(index, /data-open-detection-asset/);
assert.match(index, /20261022-logo-1/);
assert.match(app, /const MIN_WORDS = 125/);
assert.match(app, /const MAX_WORDS = 50000/);
assert.match(app, /const MAX_FILE_BYTES = 50 \* 1024 \* 1024/);
assert.match(app, /const MAX_CHECKS = 100/);
assert.match(app, /data-action="history-page"/);
assert.match(app, /aria-labelledby="modal-title"/);
assert.match(app, /function brandMark\(\)/);
assert.match(app, /demo@example\.test/);
assert.doesNotMatch(app, /aiwithenoch@gmail\.com/i);
assert.doesNotMatch(app, /draftlens/i);
assert.doesNotMatch(app, /dashboard\/api|docs\/api/i);
assert.doesNotMatch(app, /developer dashboard/i);
assert.match(styles, /\.resource-cards/);
assert.match(styles, /\.check-input-message/);

execFileSync(process.execPath, ['--check', path.join(root, 'dist/app.js')], { cwd: root, stdio: 'pipe' });
console.log('Open Detection smoke checks passed.');
