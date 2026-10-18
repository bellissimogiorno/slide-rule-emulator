#!/usr/bin/env node
/** Native Chromium regression for the Slide box's immediate layout chooser.
 * Run: node tests/browser/slide_preset.mjs
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
const output = resolve(option('--output', join(root, 'qa/slide-preset')));
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
    const selected = async (page, id) => {
        assert.equal(await page.locator('#presetSelect').inputValue(), id, 'Main menu reflects the applied layout');
        assert.equal(await page.locator('#slidePresetSelect').inputValue(), id, 'Slide menu reflects the applied layout');
    };
    const open = async page => {
        assert.equal(await page.locator('#slidePresetPanel').isVisible(), false);
        await page.locator('#slidePresetButton').click();
        assert.equal(await page.locator('#slidePresetPanel').isVisible(), true);
        assert.equal(await page.locator('#slidePresetButton').getAttribute('aria-expanded'), 'true');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'slidePresetSelect');
    };
    const closed = async (page, focus = false) => {
        assert.equal(await page.locator('#slidePresetPanel').isVisible(), false);
        assert.equal(await page.locator('#slidePresetButton').getAttribute('aria-expanded'), 'false');
        if (focus) assert.equal(await page.evaluate(() => document.activeElement.id), 'slidePresetButton');
    };
    const apply = async (page, program) => {
        await page.locator('#importJsonFile').setInputFiles({ name: 'slide-preset.json', mimeType: 'application/json',
            buffer: Buffer.from(JSON.stringify(program)) });
        await page.waitForFunction(async expected => {
            const actual = (await import('#main.js')).application.getProgram();
            return document.getElementById('jsonStatus').textContent === 'JSON applied.'
                && JSON.stringify(actual) === JSON.stringify(expected);
        }, program);
        await settle(page);
        assert.deepEqual(await state(page), program);
    };
    report.stage = 'Native Slide preset checks';
    const context = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
    try {
        const page = await newPage(context);
        await load(page);
        const presets = await page.evaluate(async () => (await import('#catalog/presets.js')).PRESETS);
        assert.equal(Object.keys(presets).length, 25, 'Exercise the complete current catalogue');
        const menus = await page.evaluate(() => ['presetSelect', 'slidePresetSelect'].map(id => {
            const select = document.getElementById(id);
            return { size: select.size, groups: [...select.querySelectorAll('optgroup')].map(group =>
                ({ label: group.label, values: [...group.querySelectorAll('option')].map(option => option.value) })),
                options: [...select.options].map(option => ({ value: option.value, label: option.textContent })) };
        }));
        assert(menus[1].size <= 1, 'Slide chooser is a native dropdown');
        assert.deepEqual(menus[1].groups, menus[0].groups);
        assert.deepEqual(menus[1].options, menus[0].options);
        assert.equal(menus[1].options.length, 26, '25 named presets plus Custom / current layout');
        await selected(page, (await state(page)).presetId);
        await passed('Slide and main selectors contain all 25 presets in identical groups, plus Custom / current layout');

        const beforeKeys = await state(page);
        await page.locator('#slidePresetButton').focus();
        for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End', '1', '4', 'm'])
            await page.locator('#slidePresetButton').press(key);
        assert.deepEqual(await state(page), beforeKeys, 'Trigger keys must not move the slide or cursor');
        assert.equal(await page.locator('#loupeButton').getAttribute('aria-pressed'), 'false');
        await page.locator('#slidePresetButton').press('Enter');
        assert.equal(await page.locator('#slidePresetPanel').isVisible(), true);
        await page.locator('#slidePresetSelect').press('Escape');
        await closed(page, true);
        await open(page);
        await page.locator('#motionHelp').click();
        await closed(page);
        await open(page);
        await page.locator('#cursorAppearanceCompactButton').click();
        await closed(page);
        assert.equal(await page.locator('#cursorAppearance').isVisible(), true);
        await page.locator('#slidePresetButton').click();
        assert.equal(await page.locator('#cursorAppearance').isVisible(), false);
        assert.equal(await page.locator('#slidePresetPanel').isVisible(), true);
        await page.locator('#slidePresetSelect').press('Escape');
        await closed(page, true);
        await passed('Trigger keys leave motion alone; Enter opens, Escape restores focus, outside click and Cursor popup dismiss');

        const customScale = { id: 'PRESET_TEST', type: 'expression', min: 1, max: 100,
            pos: 'log10(x)/2', value: '10^(2*p)' };
        const imported = { ...await state(page), presetId: 'custom', modelLabel: 'Preset regression custom layout',
            fullPrecision: true, cursorShape: 'minimal', cursorColour: 'blue',
            customScales: [customScale], cursor: .31, slideOffset: .07 };
        imported.sides.front.bottomStator.push('PRESET_TEST');
        await apply(page, imported);
        await selected(page, 'custom');
        for (const [id, preset] of Object.entries(presets)) {
            // Non-default positions prove that the ordinary preset-load path ran.
            await page.locator('#slideRange').evaluate(input => { input.value = '7'; input.dispatchEvent(new Event('input', { bubbles: true })); });
            await page.locator('#cursorRange').evaluate(input => { input.value = '310'; input.dispatchEvent(new Event('input', { bubbles: true })); });
            await open(page);
            await page.selectOption('#slidePresetSelect', id);
            await settle(page);
            await closed(page, true);
            await selected(page, id);
            const actual = await state(page);
            assert.equal(actual.presetId, id);
            assert.deepEqual(actual.sides, preset.sides, `${id}: full preset replaces both faces immediately`);
            assert.equal(actual.activeSide, Object.keys(preset.sides)[0]);
            assert.equal(actual.slideOffset, 0);
            assert.equal(actual.cursor, .5);
            assert.equal(actual.fullPrecision, true);
            assert.equal(actual.cursorShape, 'minimal');
            assert.equal(actual.cursorColour, 'blue');
            assert.deepEqual(actual.customScales, [customScale]);
        }
        await passed('Every preset applies immediately, synchronizes both selectors, resets positions and preserves precision, cursor preferences and custom definitions');

        const beforePending = await state(page);
        await page.selectOption('#presetSelect', 'faber283n');
        assert.deepEqual(await state(page), beforePending, 'Main selector continues staging until Load preset');
        await open(page);
        assert.equal(await page.locator('#slidePresetSelect').inputValue(), beforePending.presetId,
            'Slide chooser reflects applied state, not the pending main choice');
        await page.locator('#slidePresetSelect').press('Escape');
        assert.equal(await page.locator('#presetSelect').inputValue(), 'faber283n', 'Dismissal preserves the staged main choice');
        await page.locator('#loadPresetButton').click();
        await selected(page, 'faber283n');
        assert.deepEqual((await state(page)).sides, presets.faber283n.sides);
        await apply(page, imported);
        await selected(page, 'custom');
        await passed('Main Load preset and JSON import synchronize the Slide selector; pending main choices remain unapplied');

        for (const width of [390, 768, 1800]) {
            await page.setViewportSize({ width, height: 1200 });
            await open(page);
            await settle(page);
            const bounds = await page.evaluate(() => {
                const rect = node => { const r = node.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
                const trigger = document.getElementById('slidePresetButton');
                return { trigger: rect(trigger), card: rect(trigger.closest('.position-control')),
                    panel: rect(document.getElementById('slidePresetPanel')), select: rect(document.getElementById('slidePresetSelect')),
                    cursorHeight: document.querySelector('.position-control[data-motion="cursor"]').getBoundingClientRect().height };
            });
            assert(bounds.trigger.left >= bounds.card.left && bounds.trigger.right <= bounds.card.right,
                'Compact arrow remains inside Slide box');
            assert.equal(bounds.card.height, bounds.cursorHeight, 'Slide and Cursor boxes retain matching heights');
            assert(bounds.panel.width > 0 && bounds.panel.height > 0 && bounds.panel.left >= 0
                && bounds.panel.right <= width && bounds.panel.top >= 0 && bounds.panel.bottom <= 1200,
                'Popup remains wholly inside viewport');
            assert(bounds.select.left >= bounds.panel.left && bounds.select.right <= bounds.panel.right,
                'Native selector fits the popup');
            await page.screenshot({ path: join(output, `slide-preset-${width}.png`), fullPage: false });
            report.rendering.push({ width, ...bounds, passed: true });
            await page.locator('#slidePresetSelect').press('Escape');
        }
        await passed('Compact arrow and popup fit at 390, 768 and 1800 pixels without changing motion-card height');

        const expected = await state(page);
        await open(page);
        // Export while open without outside pointer/focus events hiding the live
        // popup first: export itself must reset this transient presentation.
        const configuredHtml = await page.evaluate(async () => {
            const { standaloneHtml } = await import('#ui/files.js');
            const { application } = await import('#main.js');
            return standaloneHtml(document, application.getProgram());
        });
        assert.equal(await page.locator('#slidePresetPanel').isVisible(), true, 'Export does not mutate the live popup');
        await writeFile(join(staging, 'configured.html'), configuredHtml);
        await page.waitForFunction(async expected => {
            const { STORAGE_KEY } = await import('#version.js');
            return localStorage.getItem(STORAGE_KEY) === JSON.stringify(expected);
        }, expected);
        await page.reload();
        await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
        await settle(page);
        assert.deepEqual(await state(page), expected);
        await selected(page, 'custom');
        await closed(page);
        const fresh = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
        try {
            const restored = await newPage(fresh);
            await load(restored, 'configured.html');
            assert.deepEqual(await state(restored), expected, 'Standalone restores exact seed in a clean context');
            await selected(restored, 'custom');
            await closed(restored);
            await open(restored);
            await restored.selectOption('#slidePresetSelect', 'classic');
            await selected(restored, 'classic');
            assert.deepEqual((await state(restored)).sides, presets.classic.sides, 'Restored chooser remains functional');
        } finally { await fresh.close(); }
        await passed('Reload and configured standalone restore the exact programme with the popup closed and chooser functional');
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
