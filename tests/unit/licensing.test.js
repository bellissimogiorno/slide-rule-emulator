/** Licence metadata and offline-distribution checks. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, buildHtml } from '../../tools/build.mjs';

test('package and lockfile declare the MIT licence', async () => {
    const pkg = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));
    const lock = JSON.parse(await readFile(join(ROOT, 'package-lock.json'), 'utf8'));
    assert.equal(pkg.license, 'MIT');
    assert.equal(lock.packages[''].license, pkg.license);
    assert.equal(pkg.private, true, 'retain the accidental npm-publication guard');
    const licence = await readFile(join(ROOT, 'LICENSE'), 'utf8');
    assert.match(licence, /^MIT License\n/);
    assert.match(licence, /Copyright \(c\) 2026 Murdoch J\. Gabbay/);
    assert.match(licence, /Permission is hereby granted, free of charge/);
    assert.match(licence, /FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT/);
});

test('standalone build embeds the complete licence once inside the document head', async () => {
    const licence = (await readFile(join(ROOT, 'LICENSE'), 'utf8')).trimEnd();
    const notice = '<!--\n' + licence + '\n-->';
    const html = await buildHtml();
    const head = html.match(/<head>(.*?)<\/head>/s)?.[1];
    assert.ok(head?.includes(notice), 'configured copies clone and retain the document head');
    assert.equal(html.split(notice).length, 2, 'exactly one full licence notice');
    assert.ok(!html.includes('<!-- LICENCE_NOTICE -->'), 'no unexpanded build marker');
});
