#!/usr/bin/env node
/** Native Chromium regression for repeated slide imagery and its persisted option.
 * Run: node tests/browser/slide_wraparound.mjs
 * Options: --output /writable/path --executable /path/to/chromium
 * Builds into temporary HTTP staging without changing published HTML. Uses
 * local Playwright or CODEX_PRIMARY_RUNTIME_NODE_MODULES; never downloads it
 * or a browser. Missing native prerequisites are a nonzero, reported failure.
 */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHtml } from '../../tools/build.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
function option(name, fallback) {
    const index = args.indexOf(name);
    if (index < 0) return fallback;
    assert(args[index + 1] && !args[index + 1].startsWith('--'), `${name} requires a value`);
    return args[index + 1];
}
const output = resolve(option('--output', join(root, 'qa/slide-wraparound')));
const executablePath = option('--executable', process.env.CHROMIUM_EXECUTABLE);
await mkdir(output, { recursive: true });
const report = { mode: 'native Chromium HTTP', passed: false, nativeCases: 0,
    checks: [], rendering: [], errors: [],
    limitations: ['Single native browser over local HTTP; not a cross-browser or live deployment test.'] };
const record = () => writeFile(join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
const passed = async message => {
    report.nativeCases++;
    report.checks.push(message);
    await record();
    console.log(message);
};
let browser, server, staging;
try {
    report.stage = 'Playwright dependency';
    const require = createRequire(import.meta.url);
    let playwright;
    try { playwright = require('playwright'); }
    catch (error) {
        if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw error;
        playwright = require(join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
    }
    report.stage = 'Chromium launch';
    report.browserExecutable = executablePath || 'Playwright-managed Chromium headless shell';
    browser = await playwright.chromium.launch({ ...(executablePath ? { executablePath } : {}), args: ['--no-sandbox'] });
    report.browser = browser.version();
    report.stage = 'Generate application and serve local HTTP';
    staging = await mkdtemp(join(output, 'http-'));
    await writeFile(join(staging, 'index.html'), await buildHtml());
    await writeFile(join(staging, 'favicon.ico'), '');
    server = createServer(async (request, response) => {
        const name = new URL(request.url, 'http://localhost').pathname.slice(1) || 'index.html';
        try {
            assert(name === basename(name), 'Only staged files may be served');
            const content = await readFile(join(staging, name));
            response.writeHead(200, { 'content-type': name.endsWith('.html') ? 'text/html; charset=utf-8' : 'image/x-icon' });
            response.end(content);
        } catch { response.writeHead(404); response.end('Not found'); }
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const origin = `http://127.0.0.1:${server.address().port}`;
    const settle = page => page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const newPage = async context => {
        const page = await context.newPage();
        page.setDefaultTimeout(15000);
        page.on('pageerror', error => report.errors.push(String(error)));
        page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
        return page;
    };
    const load = async (page, route = 'index.html') => {
        assert.equal((await page.goto(`${origin}/${route}`)).status(), 200);
        await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
        await settle(page);
    };
    const state = page => page.evaluate(async () => (await import('#main.js')).application.getProgram());
    const withoutWrap = programme => { const { slideWraparound, ...rest } = programme; return rest; };
    const copyCount = page => page.locator('#ruleCanvas .slide-wraparound-copy').count();
    const stators = page => page.locator('#ruleCanvas .top-stator, #ruleCanvas .bottom-stator')
        .evaluateAll(nodes => nodes.map(node => node.innerHTML));
    const read = (page, side, rail, id) => page.locator(`#readout [data-readout-side="${side}"] [data-readout-rail="${rail}"] [data-readout-scale="${id}"] .value`).innerText();
    const apply = async (page, programme) => {
        await page.locator('#importJsonFile').setInputFiles({ name: 'slide-wraparound.json', mimeType: 'application/json',
            buffer: Buffer.from(JSON.stringify(programme)) });
        await page.waitForFunction(async expected => {
            const actual = (await import('#main.js')).application.getProgram();
            return document.getElementById('jsonStatus').textContent === 'JSON applied.'
                && JSON.stringify(actual) === JSON.stringify(expected);
        }, programme);
        await settle(page);
        assert.deepEqual(await state(page), programme);
    };
    const move = async (page, offset, cursor) => {
        await page.locator('#slideRange').evaluate((input, value) => {
            input.value = String(value * 100); input.dispatchEvent(new Event('input', { bubbles: true }));
        }, offset);
        await page.locator('#cursorRange').evaluate((input, value) => {
            input.value = String(value * 1000); input.dispatchEvent(new Event('input', { bubbles: true }));
        }, cursor);
        await settle(page);
        assert.equal((await state(page)).slideOffset, offset);
        assert.equal((await state(page)).cursor, cursor);
    };
    const toggle = async (page, enabled) => {
        const before = await state(page), fixed = await stators(page);
        await page.locator('#slideWraparoundToggle').setChecked(enabled);
        await settle(page);
        const after = await state(page);
        assert.equal(after.slideWraparound, enabled);
        assert.deepEqual(withoutWrap(after), withoutWrap(before), 'Toggle preserves exact positions and all other programme data');
        assert.deepEqual(await stators(page), fixed, 'Toggle does not change stator engraving');
        if (!enabled) assert.equal(await copyCount(page), 0, 'Disabled restores a single unwrapped slide');
    };
    const copies = async page => {
        const result = await page.locator('#ruleCanvas .slide-mover:not(.slide-wraparound-copy)').evaluateAll(sources => sources.map(source => {
            // Hover intentionally suppresses a native title on just the active
            // mark, and copied imagery intentionally has no duplicate IDs.
            // Compare the engraving plus data-mark-tip, excluding those
            // transient/accessibility identities rather than pointer state.
            const engraving = node => {
                const clone = node.cloneNode(true);
                for (const element of [clone, ...clone.querySelectorAll('*')])
                    for (const name of ['id', 'tabindex', 'title', 'aria-describedby', 'aria-labelledby'])
                        element.removeAttribute(name);
                return clone.innerHTML;
            };
            const box = source.getBoundingClientRect();
            return { width: box.width, tiles: [...source.parentElement.children]
                .filter(node => node.classList.contains('slide-wraparound-copy')).map(copy => {
                    const rect = copy.getBoundingClientRect();
                    return { period: Number(copy.dataset.wrapPeriod), hidden: copy.getAttribute('aria-hidden'),
                        equal: engraving(source) === engraving(copy), width: rect.width, delta: rect.left - box.left,
                        clipping: getComputedStyle(copy).overflowX };
                }) };
        }));
        assert(result.length > 0, 'The current layout has moving scales');
        for (const source of result) {
            assert(source.width > 0, 'Source has actual browser geometry');
            assert.deepEqual(source.tiles.map(tile => tile.period).sort(), [-1, 1]);
            for (const tile of source.tiles) {
                assert.equal(tile.hidden, 'true', 'Repeated imagery is hidden from accessibility duplication');
                assert.equal(tile.equal, true, 'Copies include the exact polished scale imagery');
                assert.equal(tile.clipping, 'hidden', 'Each tile clips lettering at its own seam');
                assert(Math.abs(tile.width - source.width) < .1);
                assert(Math.abs(tile.delta - tile.period * source.width) < .2, 'Copies are exactly one track apart');
            }
        }
        assert.equal(await page.locator('#ruleCanvas .top-stator .slide-wraparound-copy, #ruleCanvas .bottom-stator .slide-wraparound-copy').count(), 0);
    };
    const visibleCopy = async (page, offset) => {
        const period = offset > 0 ? -1 : 1;
        const result = await page.locator(`#ruleCanvas [data-side="front"] [data-scale="C"] .slide-wraparound-copy[data-wrap-period="${period}"]`)
            .evaluate(copy => {
                const pane = copy.closest('.tick-pane').getBoundingClientRect();
                const source = copy.parentElement.querySelector('.slide-mover:not(.slide-wraparound-copy)');
                const sourceTicks = [...source.querySelectorAll('.tick')];
                const copyTicks = [...copy.querySelectorAll('.tick')];
                const visible = copyTicks.map((tick, i) => ({ tick: tick.getBoundingClientRect(),
                    original: sourceTicks[i].getBoundingClientRect() })).filter(({ tick }) =>
                    tick.left > pane.left + 2 && tick.right < pane.right - 2);
                return { count: visible.length, originalOutside: visible.every(({ original }) =>
                    original.right < pane.left || original.left > pane.right) };
            });
        assert(result.count > 0, 'Graduations from the opposite end visibly fill the blank region');
        assert.equal(result.originalOutside, true, 'Visible repeated graduations correspond to clipped source graduations');
    };
    const dragCopy = async (page, offset) => {
        // Keep the cursor away from the repeated area so the pointer hits the
        // slide itself, and use real mouse events with browser pointer capture.
        await move(page, offset, offset > 0 ? .9 : .1);
        const pane = page.locator('#ruleCanvas [data-side="front"] [data-scale="C"] .tick-pane');
        await pane.scrollIntoViewIfNeeded();
        const box = await pane.boundingBox();
        assert(box && box.width > 0 && box.height > 0);
        const x = box.x + box.width * (offset > 0 ? .15 : .85), y = box.y + box.height * .5;
        const hit = await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('.slide-wraparound-copy'), { x, y });
        assert.equal(hit, true, 'Drag starts on the repeated image');
        const before = await state(page), fixed = await stators(page), dx = (offset > 0 ? 1 : -1) * box.width * .05;
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + dx, y, { steps: 5 });
        await page.mouse.up();
        await settle(page);
        const after = await state(page);
        assert(Math.abs(after.slideOffset - (before.slideOffset + dx / box.width)) < .002,
            'Dragging a repeated tile moves the real slide by the pointer displacement');
        assert.equal(after.cursor, before.cursor);
        assert.equal(after.slideWraparound, true);
        assert.deepEqual(await stators(page), fixed);
        await copies(page);
    };
    const download = async (page, selector) => {
        const event = page.waitForEvent('download');
        await page.locator(selector).click();
        return readFile(await (await event).path());
    };
    report.stage = 'Native slide wraparound checks';
    const context = await browser.newContext({ viewport: { width: 1800, height: 1400 }, acceptDownloads: true });
    try {
        const page = await newPage(context);
        await load(page);
        assert.equal((await state(page)).slideWraparound, false);
        assert.equal(await page.locator('#slideWraparoundToggle').isChecked(), false);
        assert.equal(await copyCount(page), 0);
        assert.equal(await page.locator('#slideWraparoundToggle').evaluate(input =>
            input.closest('label').previousElementSibling?.querySelector('input')?.id), 'fullPrecisionToggle');
        const optionBounds = await page.evaluate(() => ['fullPrecisionToggle', 'slideWraparoundToggle'].map(id => {
            const rect = document.getElementById(id).closest('label').getBoundingClientRect();
            return { top: rect.top, bottom: rect.bottom };
        }));
        assert(optionBounds[1].top >= optionBounds[0].bottom - 1);
        await passed('Wraparound defaults off and its checkbox sits directly below Extended decimal precision');

        const fixture = { ...await state(page), presetId: 'custom', viewMode: 'both', activeSide: 'front',
            cursorShape: 'minimal', cursor: .1, slideOffset: .4, magnification: 1,
            sides: {
                front: { name: 'Front', topStator: ['A'], slide: ['B', 'C'], bottomStator: ['D'] },
                back: { name: 'Back', topStator: ['A'], slide: ['CI'], bottomStator: ['DI'] }
            } };
        await apply(page, fixture);
        assert.equal(await read(page, 'front', 'slide', 'C'), 'off scale');
        assert.equal(await read(page, 'back', 'slide', 'CI'), 'off scale');
        const dBefore = await read(page, 'front', 'bottomStator', 'D');
        await toggle(page, true);
        await copies(page);
        await visibleCopy(page, .4);
        assert.equal(await read(page, 'front', 'slide', 'C'), '5.012');
        assert.equal(await read(page, 'back', 'slide', 'CI'), '1.995');
        assert.equal(await read(page, 'front', 'bottomStator', 'D'), dBefore);
        await page.locator('#ruleCanvas').screenshot({ path: join(output, 'wraparound-right.png') });
        await dragCopy(page, .4);
        await passed('Sliding right repeats leftward imagery on both faces, readouts match, stators stay fixed and repeated imagery can be dragged');

        await move(page, -.4, .9);
        await copies(page);
        await visibleCopy(page, -.4);
        assert.equal(await read(page, 'front', 'slide', 'C'), '1.995');
        assert.equal(await read(page, 'back', 'slide', 'CI'), '5.012');
        await page.locator('#ruleCanvas').screenshot({ path: join(output, 'wraparound-left.png') });
        await dragCopy(page, -.4);
        await move(page, -.4, .9);
        await toggle(page, false);
        assert.equal(await read(page, 'front', 'slide', 'C'), 'off scale');
        assert.equal(await read(page, 'back', 'slide', 'CI'), 'off scale');
        await toggle(page, true);
        await move(page, 0, 0);
        assert.equal(await read(page, 'front', 'slide', 'C'), '1');
        await move(page, 0, 1);
        assert.equal(await read(page, 'front', 'slide', 'C'), '10', 'Original right endpoint retains its own value');
        await passed('Sliding left fills the right gap; disabling restores blank space and off-scale readings; original endpoints remain distinct');

        await page.locator('#slidePresetButton').click();
        await page.selectOption('#slidePresetSelect', 'faber283n');
        await settle(page);
        assert.equal((await state(page)).slideWraparound, true);
        assert.equal(await page.locator('#slideWraparoundToggle').isChecked(), true);
        await copies(page);
        await page.selectOption('#sideSelect', 'back');
        await settle(page);
        await copies(page);
        await page.locator('#flipButton').click();
        await settle(page);
        await copies(page);
        await page.selectOption('#magnificationSelect', '1.5');
        await settle(page);
        await copies(page);
        assert.equal((await state(page)).slideWraparound, true);
        await passed('Preset replacement, individual faces, flipping and 150% magnification retain working wraparound');

        const expected = await state(page);
        const exported = JSON.parse((await download(page, '#exportJsonButton')).toString('utf8'));
        assert.deepEqual(exported, expected, 'JSON download includes the enabled preference');
        await toggle(page, false);
        await apply(page, exported);
        await copies(page);
        await page.waitForFunction(async expected => {
            const { STORAGE_KEY } = await import('#version.js');
            return localStorage.getItem(STORAGE_KEY) === JSON.stringify(expected);
        }, expected);
        await page.reload();
        await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
        await settle(page);
        assert.deepEqual(await state(page), expected);
        assert.equal(await page.locator('#slideWraparoundToggle').isChecked(), true);
        await copies(page);
        await writeFile(join(staging, 'configured.html'), await download(page, '#saveHtmlButton'));
        const fresh = await browser.newContext({ viewport: { width: 1800, height: 1400 } });
        try {
            const restored = await newPage(fresh);
            await load(restored, 'configured.html');
            assert.deepEqual(await state(restored), expected);
            assert.equal(await restored.locator('#slideWraparoundToggle').isChecked(), true);
            await copies(restored);
            await toggle(restored, false);
        } finally { await fresh.close(); }
        await passed('JSON download/import, browser reload and configured standalone restore wraparound and keep its toggle functional');
        assert.deepEqual(report.errors, [], 'No uncaught exceptions or browser console errors');
    } finally { await context.close(); }
    report.passed = true;
} catch (error) {
    report.failedPrerequisite = ['Playwright dependency', 'Chromium launch'].includes(report.stage);
    report.failure = error.stack || String(error);
    console.error(report.failure);
    process.exitCode = 1;
} finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (browser) await browser.close();
    if (staging) await rm(staging, { recursive: true, force: true });
    await record();
}
