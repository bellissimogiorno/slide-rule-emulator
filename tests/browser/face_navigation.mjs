#!/usr/bin/env node
/** Native acceptance for grouped view controls and direct face navigation.
 * node tests/browser/face_navigation.mjs --output /writable/report/directory
 * The runner builds into temporary HTTP staging, never installs dependencies
 * or browsers, and reports missing prerequisites as zero native cases.
 */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPlaywright } from './playwright.mjs';
import { buildHtml } from '../../tools/build.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
function option(name, fallback) {
    const index = args.indexOf(name);
    if (index < 0) return fallback;
    assert(args[index + 1] && !args[index + 1].startsWith('--'), `${name} requires a value`);
    return args[index + 1];
}
const output = resolve(option('--output', join(root, 'qa/face-navigation')));
const executablePath = option('--executable', process.env.CHROMIUM_EXECUTABLE);
await mkdir(output, { recursive: true });
const report = { mode: 'native Chromium HTTP', passed: false, nativeCases: 0, checks: [], errors: [],
    limitations: ['Single native browser; no claim about other engines, assistive technology or deployment.'] };
const record = () => writeFile(join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
const passed = async message => { report.nativeCases++; report.checks.push(message); await record(); console.log(message); };
let browser, server, staging;
try {
    report.stage = 'Playwright dependency';
    const { playwright, version, modulePath } = loadPlaywright();
    report.playwright = version; report.playwrightModule = modulePath;
    report.stage = 'Chromium launch';
    report.browserExecutable = executablePath || 'Playwright-managed Chromium headless shell';
    browser = await playwright.chromium.launch({ ...(executablePath ? { executablePath } : {}), args: ['--no-sandbox'] });
    report.browser = browser.version();
    report.stage = 'Build application and serve local HTTP';
    staging = await mkdtemp(join(output, 'http-'));
    await writeFile(join(staging, 'index.html'), await buildHtml());
    server = createServer(async (request, response) => {
        const name = new URL(request.url, 'http://localhost').pathname.slice(1) || 'index.html';
        if (name === 'favicon.ico') { response.writeHead(204); response.end(); return; }
        try {
            assert(name === basename(name), 'Only staged files may be served');
            const html = await readFile(join(staging, name));
            response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); response.end(html);
        } catch { response.writeHead(404); response.end('Not found'); }
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const origin = `http://127.0.0.1:${server.address().port}`;
    const settle = page => page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const programme = page => page.evaluate(async () => (await import('#main.js')).application.getProgram());
    const position = page => page.evaluate(() => ({
        slideOffset: Number(document.getElementById('slideRange').value) / 100,
        cursor: Number(document.getElementById('cursorRange').value) / 1000
    }));
    const move = async (page, coordinates) => {
        for (const [id, value] of [['slideRange', coordinates.slideOffset * 100], ['cursorRange', coordinates.cursor * 1000]])
            await page.locator('#' + id).evaluate((input, value) => {
                input.value = String(value); input.dispatchEvent(new Event('input', { bubbles: true }));
            }, value);
        await settle(page);
    };
    const open = async (context, name = 'index.html') => {
        const page = await context.newPage(); page.setDefaultTimeout(15000);
        page.on('pageerror', error => report.errors.push(String(error)));
        page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
        assert.equal((await page.goto(`${origin}/${name}`)).status(), 200);
        await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
        await settle(page); return page;
    };
    const end = (page, side) => page.locator(`[data-rule-flip="${side}"]`);
    const expectFlip = async (page, action) => {
        const before = await programme(page), coordinates = await position(page);
        await action(); await settle(page);
        const after = await programme(page);
        const keys = Object.keys(before.sides), index = keys.indexOf(before.activeSide);
        assert.equal(after.activeSide, keys[(index + 1) % keys.length]);
        assert.deepEqual(await position(page), coordinates);
        assert.deepEqual({ ...after, activeSide: before.activeSide }, before,
            'Flipping changes only the selected face');
    };
    const context = await browser.newContext({ viewport: { width: 1600, height: 1100 },
        reducedMotion: 'reduce', acceptDownloads: true });
    report.stage = 'Native view grouping and face actions';
    try {
        const page = await open(context);
        const groups = await page.evaluate(() => {
            const ids = ['sideSelect', 'flipButton', 'bothSidesButton', 'magnificationSelect',
                'loupeButton', 'cursorAppearanceButton', 'resetButton'];
            const controls = [...document.querySelector('.view-controls').querySelectorAll('button, select')];
            return { order: controls.map(node => node.id).filter(id => ids.includes(id)),
                side: ['sideSelect', 'flipButton', 'bothSidesButton'].every(id =>
                    document.getElementById(id).closest('.side-controls')),
                resetUnlocked: !document.getElementById('resetButton').closest('.layout-actions') };
        });
        assert.deepEqual(groups.order, ['sideSelect', 'flipButton', 'bothSidesButton', 'magnificationSelect',
            'loupeButton', 'cursorAppearanceButton', 'resetButton']);
        assert(groups.side && groups.resetUnlocked);
        const geometry = await page.evaluate(() => {
            const buttons = [...document.querySelectorAll('[data-rule-flip]')];
            const panes = [...document.querySelectorAll('#ruleCanvas .tick-pane, #ruleCanvas .scale-name, #ruleCanvas .scale-legend')]
                .map(node => node.getBoundingClientRect());
            return buttons.map(node => {
                const box = node.getBoundingClientRect();
                return { width: box.width, height: box.height,
                    overlapsContent: panes.some(other => box.left < other.right - .5 && box.right > other.left + .5
                        && box.top < other.bottom - .5 && box.bottom > other.top + .5) };
            });
        });
        assert.equal(geometry.length, 2);
        for (const button of geometry) {
            assert(button.width > 0 && button.height > 0, 'Both end actions have real visible geometry');
            assert.equal(button.overlapsContent, false, 'End actions do not cover scales or captions');
        }
        await passed('Side controls keep their requested order; end actions do not cover labels, captions or graduations');

        await move(page, { slideOffset: .123, cursor: .789 });
        const draft = '{"unapplied":"retain this draft across face changes"}';
        await page.locator('#jsonEditor').fill(draft);
        await expectFlip(page, () => page.locator('#flipButton').click());
        assert.equal(await page.locator('#jsonEditor').inputValue(), draft);
        await page.locator('#ruleCanvas').focus();
        await expectFlip(page, () => page.keyboard.press('f'));
        await page.locator('#slideRange').focus();
        await expectFlip(page, () => page.keyboard.press('f'));
        await page.locator('#cursorRange').focus();
        await expectFlip(page, () => page.keyboard.press('f'));
        await passed('Toolbar and local F shortcut change the face once, preserving coordinates, programme data and an unapplied draft');

        for (const side of ['left', 'right']) {
            await expectFlip(page, () => end(page, side).click());
            await end(page, side).focus();
            await expectFlip(page, () => page.keyboard.press('Space'));
            assert.equal(await end(page, side).evaluate(node => document.activeElement === node), true,
                'Native keyboard activation retains the static end button focus');
            const before = await position(page);
            await page.keyboard.press('ArrowLeft'); await settle(page);
            assert.deepEqual(await position(page), before, 'Arrow keys on a flip button do not move the cursor or slide');
        }
        await passed('Both end actions support click and native Space activation with retained focus and isolated arrow keys');

        const unchanged = await programme(page);
        for (const props of [{ repeat: true }, { isComposing: true }, { ctrlKey: true }, { metaKey: true },
            { altKey: true }, { shiftKey: true }]) {
            await page.locator('#ruleCanvas').evaluate((node, props) => node.dispatchEvent(new KeyboardEvent('keydown',
                { key: 'f', bubbles: true, cancelable: true, ...props })), props);
            assert.deepEqual(await programme(page), unchanged);
        }
        for (const selector of ['#jsonEditor', '#presetSelect', '#sideSelect', '#magnificationSelect',
            '#slidePresetButton', '#cursorAppearanceCompactButton', '#tutorialButton']) {
            await page.locator(selector).evaluate(node => node.dispatchEvent(new KeyboardEvent('keydown',
                { key: 'f', bubbles: true, cancelable: true })));
            assert.deepEqual(await programme(page), unchanged, `F stays local and leaves ${selector} alone`);
        }
        await page.locator('#ruleCanvas').evaluate(node => {
            const event = new KeyboardEvent('keydown', { key: 'f', bubbles: true, cancelable: true });
            event.preventDefault(); node.dispatchEvent(event);
        });
        assert.deepEqual(await programme(page), unchanged);
        await passed('Repeated, modified, composed and already-handled keys are ignored, as are editor/menu targets');

        await page.locator('#ruleCanvas').scrollIntoViewIfNeeded();
        const pane = await page.locator('#ruleCanvas .slide-rail .tick-pane').first().boundingBox();
        const activeSide = (await programme(page)).activeSide;
        await page.mouse.move(pane.x + pane.width * .5, pane.y + pane.height / 2);
        await page.mouse.down();
        await page.keyboard.press('f');
        assert.equal((await programme(page)).activeSide, activeSide, 'F cannot replace the face mid-drag');
        await page.mouse.move(pane.x + pane.width * .5 + 25, pane.y + pane.height / 2, { steps: 4 });
        await page.mouse.up(); await settle(page);
        assert.equal((await programme(page)).activeSide, activeSide, 'An ordinary slide drag does not flip');
        await page.locator('#bothSidesButton').click(); await settle(page);
        assert.equal(await page.locator('#ruleCanvas .rule-face').count(), 2);
        assert(await page.locator('#flipButton').isDisabled());
        for (const side of ['left', 'right']) assert(await end(page, side).isDisabled());
        await page.locator('#ruleCanvas').focus();
        const both = await programme(page); await page.keyboard.press('f');
        assert.deepEqual(await programme(page), both);
        await page.locator('#bothSidesButton').click(); await settle(page);
        await page.selectOption('#presetSelect', 'classic');
        await page.locator('#loadPresetButton').click(); await settle(page);
        const classic = await programme(page);
        if (Object.keys(classic.sides).length !== 1) {
            const single = { ...classic, viewMode: 'single', activeSide: Object.keys(classic.sides)[0],
                sides: { [Object.keys(classic.sides)[0]]: Object.values(classic.sides)[0] } };
            await page.locator('#jsonEditor').fill(JSON.stringify(single));
            await page.locator('#applyJsonButton').click(); await settle(page);
        }
        assert(await page.locator('#flipButton').isDisabled());
        for (const side of ['left', 'right']) assert(await end(page, side).isDisabled());
        const single = await programme(page);
        await page.locator('#ruleCanvas').focus(); await page.keyboard.press('f');
        assert.deepEqual(await programme(page), single);
        await passed('Ordinary drags never flip; active drags, both-sides view and single-face programmes disable every flip route');

        await page.selectOption('#presetSelect', 'faber283n');
        await page.locator('#loadPresetButton').click(); await settle(page);
        await move(page, { slideOffset: -.234, cursor: .678 });
        const original = await programme(page);
        await page.locator('#tutorialButton').click(); await page.locator('#tutorialWatchButton').click(); await settle(page);
        assert(await page.locator('#resetButton').isEnabled());
        assert.equal(await page.locator('#resetButton').evaluate(node => !!node.closest('[inert]')), false);
        for (const side of ['left', 'right']) assert(await end(page, side).isDisabled());
        await page.locator('#ruleCanvas').focus(); await page.keyboard.press('f');
        assert.deepEqual(await programme(page), original, 'Training never becomes the exported programme');
        await page.locator('#resetButton').click(); await settle(page);
        assert.deepEqual(await position(page), { slideOffset: 0, cursor: .5 });
        assert.deepEqual(await programme(page), original);
        const download = page.waitForEvent('download'); await page.locator('#saveHtmlButton').click();
        await writeFile(join(staging, 'configured.html'), await readFile(await (await download).path()));
        const fresh = await browser.newContext({ viewport: { width: 1600, height: 1100 } });
        try {
            const copy = await open(fresh, 'configured.html');
            assert.deepEqual(await programme(copy), original);
            assert(await copy.locator('#tutorialPanel').isHidden());
            for (const side of ['left', 'right']) assert(await end(copy, side).isEnabled());
            await expectFlip(copy, () => end(copy, 'right').click());
        } finally { await fresh.close(); }
        await page.locator('#tutorialCloseButton').click(); await settle(page);
        assert.deepEqual(await programme(page), original);
        await passed('Tutorial locking protects every flip route, leaves Reset usable, and configured copies restore working face actions');

        for (const width of [390, 760, 1600]) {
            await page.setViewportSize({ width, height: 1000 }); await settle(page);
            assert((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1,
                'The page itself does not acquire horizontal overflow');
            for (const id of ['sideSelect', 'flipButton', 'bothSidesButton', 'magnificationSelect',
                'cursorAppearanceButton', 'resetButton', 'tutorialButton'])
                assert(await page.locator('#' + id).isVisible(), `${id} stays available at ${width}px`);
            await expectFlip(page, () => end(page, 'left').click());
        }
        await passed('Grouped controls and direct face actions remain usable at narrow, intermediate and wide viewports');
        assert.deepEqual(report.errors, [], 'No browser console errors or uncaught exceptions');
    } finally { await context.close(); }
    report.passed = true;
} catch (error) {
    report.failedPrerequisite = ['Playwright dependency', 'Chromium launch'].includes(report.stage);
    report.failure = error.stack || String(error); console.error(report.failure); process.exitCode = 1;
} finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (browser) await browser.close();
    if (staging) await rm(staging, { recursive: true, force: true });
    await record();
}
