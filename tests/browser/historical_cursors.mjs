#!/usr/bin/env node
/** Exercise every catalogue cursor in real Chromium over local HTTP.
 *
 * Run after `npm run build`:
 *   node tests/browser/historical_cursors.mjs --output qa/historical-cursors
 * Optional: --executable /path/to/chromium --visual
 * Uses the shared Playwright loader; see docs/TESTING.md for toolchain selection.
 * Browser/dependency setup failures are recorded as failed checks. No simulated
 * DOM fallback can substitute for this native rendering/input/download test.
 */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { loadPlaywright } from './playwright.mjs';
import { dirname, resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const flags = process.argv.slice(2);
function option(name, fallback) {
    const index = flags.indexOf(name);
    if (index < 0) return fallback;
    assert(flags[index + 1] && !flags[index + 1].startsWith('--'), `${name} requires a value`);
    return flags[index + 1];
}
const output = resolve(option('--output', join(root, 'qa/historical-cursors')));
const executablePath = option('--executable', process.env.CHROMIUM_EXECUTABLE);
const visual = flags.includes('--visual');
await mkdir(output, { recursive: true });
const report = { mode: 'native Chromium HTTP', node: process.version, passed: false,
    functional: [], rendering: [], errors: [],
    limitations: ['Single browser on local HTTP; not a cross-browser or live Pages deployment test.'] };
const record = () => writeFile(join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
const passed = async message => { report.functional.push(message); await record(); console.log(message); };
let browser, server, staging;
try {
    report.stage = 'Playwright dependency';
    const { playwright, version, modulePath } = loadPlaywright();
    report.playwright = version;
    report.playwrightModule = modulePath;
    report.browserExecutable = executablePath || 'Playwright-managed Chromium headless shell';
    report.stage = 'Chromium launch';
    browser = await playwright.chromium.launch({ ...(executablePath ? { executablePath } : {}), args: ['--no-sandbox'] });
    report.browser = browser.version();
    report.stage = 'Native HTTP tests';
    staging = await mkdtemp(join(output, 'http-'));
    await writeFile(join(staging, 'index.html'), await readFile(join(root, 'dist/index.html')));
    await writeFile(join(staging, 'favicon.ico'), '');
    server = createServer(async (request, response) => {
        const name = new URL(request.url, 'http://localhost').pathname.slice(1) || 'index.html';
        try {
            assert(name === basename(name), 'Only staged files are served');
            const body = await readFile(join(staging, name));
            response.writeHead(200, { 'content-type': name.endsWith('.html') ? 'text/html; charset=utf-8' : 'image/x-icon' });
            response.end(body);
        } catch { response.writeHead(404); response.end('Not found'); }
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const origin = `http://127.0.0.1:${server.address().port}`;
    const geometry = await readFile(join(root, 'tests/browser/cursor_geometry.js'), 'utf8');
    const newPage = async context => {
        const page = await context.newPage();
        page.setDefaultTimeout(15000);
        page.on('pageerror', error => report.errors.push(String(error)));
        page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
        return page;
    };
    const settle = page => page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const load = async (page, route = 'index.html') => {
        const response = await page.goto(`${origin}/${route}`);
        assert.equal(response.status(), 200);
        await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
        await settle(page);
    };
    const state = page => page.evaluate(async () => (await import('#main.js')).application.getProgram());
    const apply = async (page, program) => {
        await page.locator('#importJsonFile').setInputFiles({ name: 'cursor-check.json', mimeType: 'application/json',
            buffer: Buffer.from(JSON.stringify(program)) });
        await page.waitForFunction(async expected => {
            const actual = (await import('#main.js')).application.getProgram();
            return document.getElementById('jsonStatus').textContent === 'JSON applied.'
                && actual.cursor === expected.cursor && actual.slideOffset === expected.slideOffset
                && actual.magnification === expected.magnification && actual.presetId === expected.presetId;
        }, program);
        await settle(page);
        assert.deepEqual(await state(page), program);
    };
    const measure = async page => {
        const result = await page.evaluate(geometry);
        assert.deepEqual(result.failures, []);
        assert(result.faces.length > 0, 'At least one face must be rendered');
        return result.faces;
    };
    const checkLoupe = async (page, sideName) => {
        const toggle = page.locator('#loupeButton');
        if (await toggle.getAttribute('aria-pressed') !== 'true') await toggle.click();
        const face = page.locator(`#ruleCanvas [data-side="${sideName}"] .rule-face-body`);
        await face.locator('.slide-rail').scrollIntoViewIfNeeded();
        const point = await face.evaluate(face => {
            const cursor = face.querySelector('.cursor').getBoundingClientRect();
            const slide = face.querySelector('.slide-rail').getBoundingClientRect();
            return { x: cursor.left + cursor.width / 2, y: slide.top + slide.height / 2 };
        });
        await page.mouse.move(point.x + 1, point.y);
        await page.mouse.move(point.x, point.y);
        await settle(page);
        assert(await page.locator('.rule-loupe').isVisible(), 'Reading lens must appear');
        const result = await face.evaluate(source => {
            const copy = document.querySelector('.rule-loupe .loupe-copy');
            const checks = [];
            for (const selector of ['.cursor', '.cursor-window', '.cursor-cap', '.cursor-caption', '.cursor-mark-line']) {
                const originals = [...source.querySelectorAll(selector)];
                const duplicates = [...copy.querySelectorAll(selector)];
                if (originals.length !== duplicates.length) checks.push(`${selector}: clone count differs`);
                originals.forEach((element, index) => {
                    const duplicate = duplicates[index];
                    if (!duplicate) return;
                    const a = element.getBoundingClientRect(), b = duplicate.getBoundingClientRect();
                    if (Math.abs(b.width - 2.5 * a.width) > .2 || Math.abs(b.height - 2.5 * a.height) > .2) {
                        checks.push(`${selector}: lens does not preserve geometry at 2.5x`);
                    }
                });
            }
            const clipping = copy.querySelector('.cursor-window');
            if (clipping && getComputedStyle(clipping).overflow !== 'hidden') checks.push('Lens loses cursor clipping');
            const sourceFractions = [...source.querySelectorAll('.caption-fraction > span:first-child')];
            const outputFractions = [...copy.querySelectorAll('.caption-fraction > span:first-child')];
            sourceFractions.forEach((element, index) => {
                const paint = outputFractions[index] && getComputedStyle(outputFractions[index]).boxShadow;
                if (!paint || paint === 'none' || !paint.includes(getComputedStyle(element).borderBottomColor)) {
                    checks.push('Lens loses engraved fraction bar');
                }
            });
            return checks;
        });
        assert.deepEqual(result, []);
        await toggle.click();
        await settle(page);
    };
    const download = async (page, selector) => {
        const event = page.waitForEvent('download');
        await page.locator(selector).click();
        return readFile(await (await event).path());
    };
    const context = await browser.newContext({ viewport: { width: 1800, height: 1200 }, acceptDownloads: true });
    try {
        const page = await newPage(context);
        await load(page);
        const ids = await page.evaluate(async () => Object.keys((await import('#catalog/presets.js')).PRESETS));
        report.presets = ids;
        for (const model of ids) {
            await page.selectOption('#presetSelect', model);
            await page.click('#loadPresetButton');
            await page.selectOption('#sideSelect', '');
            await settle(page);
            const original = await state(page);
            const baseline = { ...original, cursor: .5, slideOffset: 0 };
            await apply(page, baseline);
            for (const width of [390, 1800]) {
                await page.setViewportSize({ width, height: 1200 });
                for (const magnification of [.75, 1, 2]) {
                    await page.selectOption('#magnificationSelect', String(magnification));
                    await settle(page);
                    const faces = await measure(page);
                    report.rendering.push({ model, width, magnification, faces, passed: true });
                    if (visual && width === 1800 && magnification === 1) {
                        await page.locator('#ruleCanvas').screenshot({ path: join(output, `${model}.png`) });
                    }
                }
            }
            await page.setViewportSize({ width: 1800, height: 1200 });
            for (const position of [0, .5, 1]) {
                await apply(page, { ...baseline, cursor: position });
                await measure(page);
            }
            await apply(page, baseline);
            // Drag actual engraved strokes and cap surfaces; movement must
            // preserve the grab offset and keep the two sides linked.
            const targets = [await page.locator('#ruleCanvas .cursor-grip').count() ? '.cursor-grip' : '.cursor',
                '.cursor-mark', '.cursor-cap'];
            for (const selector of targets) {
                const target = page.locator(`#ruleCanvas ${selector}`).first();
                if (!await target.count()) continue;
                await target.scrollIntoViewIfNeeded();
                const bounds = await target.boundingBox();
                const side = await target.evaluate(node => node.closest('.rule-face').dataset.side);
                const pane = await page.locator(`#ruleCanvas [data-side="${side}"] .top-stator .tick-pane`).first().boundingBox();
                const before = await state(page);
                const x = bounds.x + bounds.width / 2, y = bounds.y + bounds.height / 2;
                await page.mouse.move(x, y);
                await page.mouse.down();
                await page.mouse.move(x + 24, y, { steps: 6 });
                await page.mouse.up();
                await settle(page);
                const after = await state(page);
                assert(Math.abs(after.cursor - before.cursor - 24 / pane.width) < .0001, `${model} ${selector} drag`);
                assert.equal(after.slideOffset, before.slideOffset);
                assert.deepEqual(after.sides, before.sides);
                await measure(page);
                await apply(page, baseline);
            }
            for (const sideName of Object.keys(baseline.sides)) await checkLoupe(page, sideName);
            const exported = await download(page, '#exportJsonButton');
            const expected = JSON.parse(exported);
            assert.deepEqual(expected, await state(page));
            const saved = await download(page, '#saveHtmlButton');
            const route = `${model}-configured.html`;
            await writeFile(join(staging, route), saved);
            for (const restore of ['json', 'html']) {
                const fresh = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
                try {
                    const restored = await newPage(fresh);
                    await load(restored, restore === 'html' ? route : 'index.html');
                    if (restore === 'json') await apply(restored, expected);
                    assert.deepEqual(await state(restored), expected);
                    await measure(restored);
                } finally { await fresh.close(); }
            }
            await passed(`${model}: responsive and magnified cursor geometry, unclamped endpoints, pointer drags, magnifying lens, JSON and saved HTML restore`);
        }
        assert.deepEqual(report.errors, [], 'No uncaught browser exceptions or console errors');
        await passed(`All ${ids.length} catalogue presets completed native cursor regression checks`);
    } finally { await context.close(); }
    report.passed = true;
} catch (error) {
    report.failure = error.stack || String(error);
    console.error(report.failure);
    process.exitCode = 1;
} finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (browser) await browser.close();
    if (staging) await rm(staging, { recursive: true, force: true });
    await record();
}
