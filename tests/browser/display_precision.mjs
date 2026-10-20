#!/usr/bin/env node
/** Native Chromium regression for useful-digit precision and cursor containment.
 * Run: node tests/browser/display_precision.mjs
 * Options: --output /writable/path --executable /path/to/chromium
 * Serves a fresh self-contained build over local HTTP without changing dist/.
 * Uses the shared Playwright loader (docs/TESTING.md). Missing native
 * browser prerequisites produce a nonzero exit and a failed-prerequisite report.
 */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { loadPlaywright } from './playwright.mjs';
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
const output = resolve(option('--output', join(root, 'qa/display-precision')));
const executablePath = option('--executable', process.env.CHROMIUM_EXECUTABLE);
await mkdir(output, { recursive: true });
const report = { mode: 'native Chromium HTTP', passed: false, nativeCases: 0, checks: [],
    rendering: [], errors: [], limitations: ['Single native browser; does not verify other browsers or a live deployment.'] };
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
    const { playwright, version, modulePath } = loadPlaywright();
    report.playwright = version;
    report.playwrightModule = modulePath;
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
    const endpoint = async (page, id, expected) => {
        const text = await page.locator(`#ruleCanvas [data-scale="${id}"] .tick-label[data-pos="0.0000000"]`).first().getAttribute('data-label-text');
        assert.equal(text, expected, `${id} left endpoint`);
    };
    const read = (page, side, id) => page.locator(`#readout [data-readout-side="${side}"] [data-readout-scale="${id}"] .value`).innerText();
    const readings = page => page.locator('#readout .value').allTextContents();
    const withoutPrecision = program => { const { fullPrecision, ...rest } = program; return rest; };
    const geometry = page => page.evaluate(() => [...document.querySelectorAll('#ruleCanvas .tick, #ruleCanvas .syncro-tick')]
        .map(tick => [tick.closest('[data-scale]').dataset.scale, tick.dataset.pos, tick.dataset.kind]));
    const setPrecision = async (page, fullPrecision) => {
        const before = await state(page), beforeGeometry = await geometry(page);
        await page.locator('#fullPrecisionToggle').setChecked(fullPrecision);
        await settle(page);
        const after = await state(page);
        assert.equal(after.fullPrecision, fullPrecision);
        assert.deepEqual(withoutPrecision(after), withoutPrecision(before), 'Precision must preserve all positions and authored programme data');
        assert.deepEqual(await geometry(page), beforeGeometry, 'Precision must preserve every tick coordinate and kind');
    };
    const apply = async (page, program) => {
        await page.locator('#importJsonFile').setInputFiles({ name: 'precision.json', mimeType: 'application/json',
            buffer: Buffer.from(JSON.stringify(program)) });
        await page.waitForFunction(async expected => {
            const actual = (await import('#main.js')).application.getProgram();
            return document.getElementById('jsonStatus').textContent === 'JSON applied.'
                && actual.fullPrecision === expected.fullPrecision && actual.cursor === expected.cursor
                && actual.slideOffset === expected.slideOffset;
        }, program);
        await settle(page);
        assert.deepEqual(await state(page), program);
    };
    const download = async (page, selector) => {
        const event = page.waitForEvent('download');
        await page.locator(selector).click();
        return readFile(await (await event).path());
    };
    report.stage = 'Native precision and cursor layout checks';
    const context = await browser.newContext({ viewport: { width: 1800, height: 1200 }, acceptDownloads: true });
    try {
        const page = await newPage(context);
        await load(page);
        assert.equal((await state(page)).presetId, 'faber283n');
        assert.equal((await state(page)).fullPrecision, false);
        assert.equal(await page.locator('#fullPrecisionToggle').isChecked(), false);
        assert.equal(await page.locator('#fullPrecisionToggle').evaluate(input =>
            input.closest('label').previousElementSibling?.querySelector('input')?.id), 'compactScaleToggle');
        const labels = await page.evaluate(() => ['compactScaleToggle', 'fullPrecisionToggle'].map(id => {
            const bounds = document.getElementById(id).closest('label').getBoundingClientRect();
            return { top: bounds.top, bottom: bounds.bottom };
        }));
        assert(labels[1].top >= labels[0].bottom - 1, 'Precision option appears underneath Compact scale numbering');
        await page.selectOption('#sideSelect', '');
        await settle(page);
        assert.equal((await state(page)).viewMode, 'both');
        await endpoint(page, 'P', '0.995');
        await endpoint(page, 'LL0', '1.001001');
        await endpoint(page, 'LL01', '0.99');
        assert.match(await read(page, 'front', 'D'), /(?:Main: )?3\.162(?:\s|$)/);
        await passed('Faber-Castell front and back default to four useful digits; precision option follows Compact scale numbering');

        await page.locator('#cursorRange').evaluate(input => { input.value = '0'; input.dispatchEvent(new Event('input', { bubbles: true })); });
        await settle(page);
        for (const graduationMode of ['conventional', 'adaptive']) {
            await page.selectOption('#graduationModeSelect', graduationMode);
            await settle(page);
            await endpoint(page, 'LL01', '0.99');
            assert.match(await read(page, 'back', 'LL01'), /(?:Main: )?0\.99(?:\s|$)/);
        }
        await page.selectOption('#graduationModeSelect', 'conventional');
        await page.locator('#cursorRange').evaluate(input => { input.value = '500'; input.dispatchEvent(new Event('input', { bubbles: true })); });
        await settle(page);
        await passed('LL01 left endpoint and cursor readout both show 0.99 in conventional and adaptive graduation modes');

        await setPrecision(page, true);
        await endpoint(page, 'P', '0.99499');
        await endpoint(page, 'LL0', '1.0010005');
        assert.match(await read(page, 'front', 'D'), /(?:Main: )?3\.16228(?:\s|$)/);
        assert.equal(await page.locator('#cursorText').innerText(), '0.500000');
        await setPrecision(page, false);
        await page.locator('#cursorRange').evaluate(input => { input.value = '600'; input.dispatchEvent(new Event('input', { bubbles: true })); });
        await settle(page);
        assert.equal((await state(page)).cursor, .6);
        assert.equal(await page.locator('#cursorText').innerText(), '0.6');
        assert.match(await read(page, 'front', 'D'), /(?:Main: )?3\.981(?:\s|$)/);
        await page.locator('#slideRange').evaluate(input => { input.value = '10'; input.dispatchEvent(new Event('input', { bubbles: true })); });
        await settle(page);
        assert.equal((await state(page)).slideOffset, .1);
        assert.equal(await page.locator('#slideText').innerText(), '+0.1');
        assert.match(await read(page, 'front', 'C'), /(?:Main: )?3\.162(?:\s|$)/);
        await setPrecision(page, true);
        assert.match(await read(page, 'front', 'C'), /(?:Main: )?3\.16228(?:\s|$)/);
        assert.equal(await page.locator('#cursorText').innerText(), '0.600000');
        await passed('Toggle changes detailed endpoints and live stator/slide readouts while retaining exact positions and tick geometry');

        for (const width of [390, 768, 1800]) {
            await page.setViewportSize({ width, height: 1200 });
            await page.locator('#cursorRange').scrollIntoViewIfNeeded();
            await settle(page);
            const bounds = await page.locator('#cursorRange').evaluate(input => {
                const box = input.closest('.position-control'), track = input.closest('.position-track');
                const rect = node => { const r = node.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
                return { input: rect(input), box: rect(box), left: rect(track.querySelector('[data-nudge="-1"]')),
                    right: rect(track.querySelector('[data-nudge="1"]')), position: getComputedStyle(input).position };
            });
            assert(bounds.input.width > 0 && bounds.input.height > 0, 'Cursor range has nonzero dimensions');
            assert(bounds.input.left >= bounds.box.left && bounds.input.right <= bounds.box.right, 'Cursor range fits inside Cursor box');
            assert(bounds.input.top >= bounds.box.top && bounds.input.bottom <= bounds.box.bottom, 'Cursor range remains vertically inside Cursor box');
            assert(bounds.input.left >= bounds.left.right - 1 && bounds.input.right <= bounds.right.left + 1, 'Cursor range sits between both nudge arrows');
            assert.notEqual(bounds.position, 'absolute', 'Instrument cursor styling cannot position the range input');
            await page.screenshot({ path: join(output, `cursor-${width}.png`), fullPage: false });
            report.rendering.push({ width, ...bounds, passed: true });
        }
        await passed('Cursor range stays inside its box and between its arrows at 390, 768 and 1800 pixels');

        await page.setViewportSize({ width: 1800, height: 1200 });
        await settle(page);
        const expected = await state(page), expectedReadings = await readings(page);
        const json = await download(page, '#exportJsonButton');
        assert.deepEqual(JSON.parse(json), expected);
        await writeFile(join(staging, 'configured.html'), await download(page, '#saveHtmlButton'));
        // Wait for the actual saved record, not an arbitrary delay.
        await page.waitForFunction(async expected => {
            const { STORAGE_KEY } = await import('#version.js');
            return localStorage.getItem(STORAGE_KEY) === JSON.stringify(expected);
        }, expected);
        await page.reload();
        await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
        await settle(page);
        assert.deepEqual(await state(page), expected);
        assert.deepEqual(await readings(page), expectedReadings);
        for (const mode of ['json', 'html']) {
            const fresh = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
            try {
                const restored = await newPage(fresh);
                await load(restored, mode === 'html' ? 'configured.html' : 'index.html');
                if (mode === 'json') await apply(restored, JSON.parse(json));
                assert.deepEqual(await state(restored), expected, `${mode} restores the exact programme in a clean context`);
                assert.equal(await restored.locator('#fullPrecisionToggle').isChecked(), true);
                assert.deepEqual(await readings(restored), expectedReadings);
                await setPrecision(restored, false);
                await endpoint(restored, 'P', '0.995');
                await endpoint(restored, 'LL0', '1.001001');
                await endpoint(restored, 'LL01', '0.99');
            } finally { await fresh.close(); }
        }
        await passed('Precision, exact positions and readings survive reload, JSON import and configured HTML in clean contexts');
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
