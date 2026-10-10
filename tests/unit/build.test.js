import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT, buildHtml, sourceFiles } from '../../tools/build.mjs';
test('deterministic single-file build embeds every source module unchanged', async () => {
    const a = await buildHtml(), b = await buildHtml();
    assert.equal(a, b);
    const map = JSON.parse(a.match(/<script id="module-map" type="importmap">(.*?)<\/script>/s)[1]).imports;
    assert.equal(Object.keys(map).length, (await sourceFiles()).length);
    for (const [specifier, data] of Object.entries(map)) {
        assert.ok(data.startsWith('data:text/javascript;base64,'));
        const actual = Buffer.from(data.split(',')[1], 'base64').toString();
        const original = await readFile(join(ROOT, 'src', specifier.slice(1)), 'utf8');
        assert.equal(actual, original + '\n//# sourceURL=slide-rule/' + specifier.slice(1) + '\n');
    }
    assert.ok(!a.includes('{{VERSION}}'));
    assert.ok(!/<script[^>]+src=/.test(a));
    assert.equal((a.match(/id="embedded-program"/g) || []).length, 1);
});
test('local preview serves only its explicit routes and supported methods', { timeout: 15000 }, async () => {
    const child = spawn(process.execPath, ['tools/serve.mjs', '--dev'], { cwd: ROOT, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', chunk => { stderr += chunk; });
    try {
        const url = await new Promise((resolve, reject) => {
            let text = '';
            child.stdout.on('data', chunk => {
                text += chunk;
                const match = text.match(/http:\/\/127\.0\.0\.1:\d+/);
                if (match)
                    resolve(match[0]);
            });
            child.on('exit', code => reject(new Error(`Preview exited ${code}: ${stderr}`)));
            child.on('error', reject);
        });
        const response = await fetch(url);
        assert.equal(response.status, 200);
        assert.match(response.headers.get('content-type'), /text\/html/);
        assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
        assert.match(await response.text(), /module-map/);
        assert.equal((await fetch(url + '/src/main.js')).status, 404);
        assert.equal((await fetch(url + '/%2e%2e/package.json')).status, 404);
        assert.equal((await fetch(url, { method: 'POST' })).status, 405);
        const head = await fetch(url, { method: 'HEAD' });
        assert.equal(head.status, 200);
        assert.equal(await head.text(), '');
    }
    finally {
        child.kill('SIGTERM');
        await new Promise(resolve => child.once('exit', resolve));
    }
});
