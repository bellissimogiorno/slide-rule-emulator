/** Publishing entry points must be executable applications, not README fallbacks.
 * Check real generated files and deliberately damaged builds in isolated folders.
 * These tests do not run GitHub's hosting service or a browser.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT, SITE_DIRECTORIES, build, buildHtml } from '../../tools/build.mjs';

const requiredFiles = ['index.html', '.nojekyll', 'docs/index.html',
    'docs/.nojekyll', 'dist/index.html', 'dist/.nojekyll'];

async function isolatedBuild(t) {
    const destination = await mkdtemp(join(tmpdir(), 'slide-rule-pages-'));
    t.after(() => rm(destination, { recursive: true, force: true }));
    await build({ destination });
    return destination;
}

test('every Pages publishing root contains the identical standalone emulator', async () => {
    assert.deepEqual(SITE_DIRECTORIES, ['.', 'docs', 'dist']);
    const html = await buildHtml();
    assert.match(html, /id="module-map" type="importmap"/);
    assert.match(html, /id="ruleCanvas"/);
    assert.doesNotMatch(html, /http-equiv=["']refresh/i);
    for (const directory of SITE_DIRECTORIES) {
        assert.equal(await readFile(join(ROOT, directory, 'index.html'), 'utf8'), html);
        assert.equal(await readFile(join(ROOT, directory, '.nojekyll'), 'utf8'), '');
    }
});

for (const name of requiredFiles) {
    test(`build check rejects a missing ${name} without recreating it`, async t => {
        const destination = await isolatedBuild(t);
        await rm(join(destination, name));
        await assert.rejects(build({ check: true, destination }), error =>
            error.message.includes(join(name) + ' is missing.'));
        await assert.rejects(access(join(destination, name)), { code: 'ENOENT' });
    });
    test(`build check rejects stale ${name} without overwriting it`, async t => {
        const destination = await isolatedBuild(t);
        const changed = 'Unrelated landing page or stale generated content.\n';
        await writeFile(join(destination, name), changed);
        await assert.rejects(build({ check: true, destination }), error =>
            error.message.includes(join(name) + ' is stale.'));
        assert.equal(await readFile(join(destination, name), 'utf8'), changed);
    });
}

test('a normal build refreshes all publishing roots and markers together', async t => {
    const destination = await isolatedBuild(t);
    for (const name of requiredFiles)
        await writeFile(join(destination, name), 'stale\n');
    const result = await build({ destination });
    assert.deepEqual(result.outputs, requiredFiles.map(name => join(name)));
    await build({ check: true, destination });
    const html = await buildHtml();
    for (const directory of SITE_DIRECTORIES) {
        assert.equal(await readFile(join(destination, directory, 'index.html'), 'utf8'), html);
        assert.equal(await readFile(join(destination, directory, '.nojekyll'), 'utf8'), '');
    }
});
