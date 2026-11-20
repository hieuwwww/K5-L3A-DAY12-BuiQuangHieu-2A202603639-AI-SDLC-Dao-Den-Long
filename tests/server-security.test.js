import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

test('dev server serves browser imports but never repository metadata', async () => {
  const child = spawn(process.execPath, ['scripts/serve.js'], {stdio: ['ignore', 'pipe', 'pipe']});
  try {
    await Promise.race([once(child.stdout, 'data'), once(child, 'exit').then(() => {throw Error('server exited');})]);
    const base = 'http://localhost:4173';
    assert.equal((await fetch(base + '/')).status, 200);
    assert.equal((await fetch(base + '/src/simulation.js')).status, 200);
    assert.equal((await fetch(base + '/node_modules/three/build/three.module.js')).status, 200);
    for (const path of ['/package.json', '/.git/config', '/docs/proof/phase-2.md']) {
      assert.equal((await fetch(base + path)).status, 404, `${path} must not be served`);
    }
  } finally {
    child.kill();
    await once(child, 'exit');
  }
});
