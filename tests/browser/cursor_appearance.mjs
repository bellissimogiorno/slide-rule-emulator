#!/usr/bin/env node
/** Native Chromium checks for the programme-wide cursor appearance controls.
 * Run after `npm run build`: node tests/browser/cursor_appearance.mjs
 * Optional: --output /writable/path --executable /path/to/chromium
 * Uses the shared Playwright loader; see docs/TESTING.md for toolchain selection.
 * A missing browser is an explicit failed prerequisite, never a simulated pass.
 */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { loadPlaywright } from './playwright.mjs';
import { dirname, resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
function option(name, fallback) {
    const index = args.indexOf(name);
    if (index < 0) return fallback;
    assert(args[index + 1] && !args[index + 1].startsWith('--'), `${name} requires a value`);
    return args[index + 1];
}
const output = resolve(option('--output', join(root, 'qa/cursor-appearance')));
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
    const { playwright, version, modulePath } = loadPlaywright();
    report.playwright = version;
    report.playwrightModule = modulePath;
    report.stage = 'Chromium launch';
    report.browserExecutable = executablePath || 'Playwright-managed Chromium headless shell';
    browser = await playwright.chromium.launch({ ...(executablePath ? { executablePath } : {}), args: ['--no-sandbox'] });
    report.browser = browser.version();
    staging = await mkdtemp(join(output, 'http-'));
    await writeFile(join(staging, 'index.html'), await readFile(join(root, 'dist/index.html')));
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
        const response = await page.goto(`${origin}/${route}`);
        assert.equal(response.status(), 200);
        await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
        await settle(page);
    };
    const state = page => page.evaluate(async () => (await import('#main.js')).application.getProgram());
    const apply = async (page, program) => {
        await page.locator('#importJsonFile').setInputFiles({ name: 'appearance.json', mimeType: 'application/json',
            buffer: Buffer.from(JSON.stringify(program)) });
        await page.waitForFunction(async expected => {
            const actual = (await import('#main.js')).application.getProgram();
            return document.getElementById('jsonStatus').textContent === 'JSON applied.'
                && actual.cursor === expected.cursor && actual.slideOffset === expected.slideOffset
                && actual.cursorShape === expected.cursorShape && actual.cursorColour === expected.cursorColour;
        }, program);
        await settle(page);
        assert.deepEqual(await state(page), program);
    };
    const selected = async (page, shape, colour) => {
        for (const [attribute, expected] of [['data-cursor-shape', shape], ['data-cursor-colour', colour]]) {
            const buttons = page.locator(`[${attribute}]`);
            assert.equal(await page.locator(`[${attribute}][aria-pressed="true"]`).count(), 1,
                'Each group has exactly one visibly and programmatically selected button');
            for (const button of await buttons.all()) {
                const value = await button.getAttribute(attribute);
                assert.equal(await button.getAttribute('aria-pressed'), String(value === expected));
                assert.equal(await button.getAttribute('type'), 'button');
                assert.equal((await button.innerText()).trim().toLowerCase(), value,
                    'Every choice retains a readable name, independent of its colour');
            }
        }
    };
    const preferences = async (page, shape, colour) => {
        const before = await state(page);
        if (await page.locator('#cursorAppearance').evaluate(node => node.hidden))
            await page.locator('#cursorAppearanceButton').click();
        for (const selector of [`[data-cursor-shape="${shape}"]`, `[data-cursor-colour="${colour}"]`]) {
            const button = await page.locator(selector).elementHandle();
            await button.click();
            await settle(page);
            assert.equal(await button.evaluate(node => node.isConnected && node === document.activeElement), true,
                'Applying a choice keeps the same button focused');
            await button.dispose();
        }
        const after = await state(page);
        assert.equal(after.cursorShape, shape);
        assert.equal(after.cursorColour, colour);
        await selected(page, shape, colour);
        assert.deepEqual({ ...after, cursorShape: before.cursorShape, cursorColour: before.cursorColour }, before,
            'Changing appearance must preserve positions, scale definitions and all authored cursor metadata');
    };
    const snapshot = page => page.evaluate(async () => {
        const program = (await import('#main.js')).application.getProgram();
        const rounded = value => Math.round(value * 10000) / 10000 || 0;
        return [...document.querySelectorAll('#ruleCanvas .rule-face')].map(face => {
            const body = face.querySelector('.rule-face-body'), cursor = body.querySelector('.cursor');
            const bounds = cursor.getBoundingClientRect(), pane = body.querySelector('.tick-pane').getBoundingClientRect();
            const zoom = body.getBoundingClientRect().width / body.offsetWidth;
            return {
                side: face.dataset.side, width: rounded(bounds.width), zoom: rounded(zoom),
                positionError: rounded((bounds.left + bounds.width / 2) - (pane.left + program.cursor * pane.width)),
                mainColour: getComputedStyle(cursor, '::after').borderLeftColor,
                frame: ['clear', 'ivory', 'metal'].find(name => cursor.classList.contains(`cursor-frame-${name}`)) || null,
                caps: cursor.querySelectorAll('.cursor-cap').length,
                marks: [...cursor.querySelectorAll('.cursor-mark')].map(mark => ({
                    id: mark.dataset.cursorMark, offset: mark.dataset.cursorOffset,
                    rail: mark.dataset.cursorRail || null, row: mark.dataset.cursorRow || null,
                    colour: getComputedStyle(mark.querySelector('.cursor-mark-line')).borderLeftColor
                })),
                captions: [...cursor.querySelectorAll('.cursor-caption, .cursor-mark-label')].map(node => ({
                    text: node.textContent, colour: getComputedStyle(node).color
                })),
                readings: [...document.querySelectorAll(`#readout [data-readout-side="${face.dataset.side}"] .value`)]
                    .map(node => node.textContent)
            };
        });
    });
    const colours = { red: 'rgb(177, 27, 39)', black: 'rgb(40, 37, 31)',
        blue: 'rgb(26, 85, 152)', green: 'rgb(20, 96, 68)' };
    const contrast = (first, second) => {
        const luminance = colour => {
            const channels = colour.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
                value /= 255;
                return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
            });
            return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
        };
        const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
        return (values[0] + .05) / (values[1] + .05);
    };
    const check = (actual, original, shape, colour) => {
        assert.equal(actual.length, 2, 'Both faces must be rendered');
        for (let index = 0; index < actual.length; index++) {
            const face = actual[index], baseline = original[index];
            assert.equal(face.side, baseline.side);
            assert(Math.abs(face.positionError) < .8, 'Main hairline stays on the saved coordinate');
            assert.equal(face.mainColour, colour === 'instrument' ? baseline.mainColour : colours[colour]);
            if (shape === 'minimal') {
                assert.equal(face.frame, null);
                assert.equal(face.caps, 0);
                assert.deepEqual(face.marks, []);
                assert.deepEqual(face.captions, []);
                assert(Math.abs(face.width - 34 * face.zoom) < .8, 'Minimal retains the original narrow cursor');
                assert(face.readings.every(text => !text.startsWith('Main:')), 'Minimal removes auxiliary readout rows');
            } else {
                assert.equal(face.frame, baseline.frame);
                assert.equal(face.caps, baseline.caps);
                const withoutColour = marks => marks.map(({ colour, ...mark }) => mark);
                assert.deepEqual(withoutColour(face.marks), withoutColour(baseline.marks), 'Frame choice preserves calibrated strokes');
                face.marks.forEach((mark, i) => assert.equal(mark.colour,
                    colour === 'instrument' ? baseline.marks[i].colour : colours[colour]));
                assert.deepEqual(face.captions, baseline.captions, 'Hairline colour must not recolour inscriptions');
                assert.deepEqual(face.readings, baseline.readings, 'Frame and colour must not alter readings');
            }
        }
    };
    const checkLoupe = async page => {
        if (await page.locator('#loupeButton').getAttribute('aria-pressed') !== 'true')
            await page.locator('#loupeButton').click();
        const face = page.locator('#ruleCanvas .rule-face-body').first();
        await face.locator('.cursor').scrollIntoViewIfNeeded();
        const point = await face.evaluate(face => {
            const cursor = face.querySelector('.cursor').getBoundingClientRect();
            const slide = face.querySelector('.slide-rail').getBoundingClientRect();
            return { x: cursor.left + cursor.width / 2, y: slide.top + slide.height / 2 };
        });
        await page.mouse.move(point.x + 1, point.y);
        await page.mouse.move(point.x, point.y);
        await settle(page);
        assert(await page.locator('.rule-loupe').isVisible(), 'Loupe must show the selected cursor');
        const errors = await face.evaluate(source => {
            const copy = document.querySelector('.rule-loupe .loupe-copy'), errors = [];
            for (const selector of ['.cursor-cap', '.cursor-mark-line', '.cursor-caption', '.cursor-mark-label']) {
                const a = [...source.querySelectorAll(selector)], b = [...copy.querySelectorAll(selector)];
                if (a.length !== b.length) errors.push(`${selector}: stale loupe structure`);
                a.forEach((node, index) => {
                    if (!b[index]) return;
                    const paint = getComputedStyle(b[index]);
                    const expected = getComputedStyle(node);
                    if (selector === '.cursor-mark-line' && paint.backgroundColor !== expected.borderLeftColor)
                        errors.push('Stale auxiliary hairline colour');
                    if (selector.includes('caption') || selector.includes('label'))
                        if (paint.color !== expected.color) errors.push('Loupe changes inscription colour');
                });
            }
            const hairline = copy.querySelector('[data-loupe-decoration="after"]');
            const colour = getComputedStyle(source.querySelector('.cursor'), '::after').borderLeftColor;
            if (!hairline || !getComputedStyle(hairline).boxShadow.includes(colour)) errors.push('Stale main hairline colour');
            return errors;
        });
        assert.deepEqual(errors, []);
    };
    const download = async (page, selector, programmatic = false) => {
        const event = page.waitForEvent('download');
        if (programmatic) await page.locator(selector).evaluate(button => button.click());
        else await page.locator(selector).click();
        return readFile(await (await event).path());
    };
    report.stage = 'Native appearance tests';
    const context = await browser.newContext({ viewport: { width: 1800, height: 1200 }, acceptDownloads: true });
    try {
        const page = await newPage(context);
        await load(page);
        assert.equal(await page.locator('#cursorAppearance').evaluate(node => node.hidden), true, 'Appearance starts collapsed');
        assert.equal(await page.locator('#cursorShapeOptions').isVisible(), false);
        assert.equal(await page.locator('#cursorColourOptions').isVisible(), false);
        await passed('Appearance controls start collapsed and do not clutter the workbench');
        const controls = page.locator('[data-cursor-appearance-trigger]');
        assert.equal(await controls.count(), 2, 'Both access points share one appearance panel');
        assert.equal(await page.locator('#cursorAppearanceButton').evaluate(button =>
            button.previousElementSibling?.matches('a[href="#scaleLayout"]')), true,
        'Cursor appearance sits immediately beside Scale layout');
        assert.equal(await page.locator('#cursorAppearanceCompactButton').evaluate(button =>
            Boolean(button.closest('.position-control[data-motion="cursor"] .position-heading'))), true,
        'The compact appearance button belongs to the existing cursor heading');
        const closed = async () => {
            assert.equal(await page.locator('#cursorAppearance').isVisible(), false);
            for (const trigger of await controls.all()) assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
        };
        const box = page.locator('.position-control[data-motion="cursor"]');
        const dimensions = () => box.evaluate(node => ({ width: node.offsetWidth, height: node.offsetHeight }));
        const size = await dimensions();
        assert.equal(size.height, await page.locator('.position-control[data-motion="slideOffset"]').evaluate(node => node.offsetHeight),
            'The compact button does not make the cursor box taller than the unchanged slide box');
        await page.locator('#cursorAppearanceCompactButton').evaluate(button => button.style.display = 'none');
        assert.deepEqual(await dimensions(), size, 'The compact button adds no width or height to its box');
        await page.locator('#cursorAppearanceCompactButton').evaluate(button => button.style.removeProperty('display'));
        for (const id of ['cursorAppearanceButton', 'cursorAppearanceCompactButton']) {
            const trigger = page.locator(`#${id}`);
            await trigger.focus();
            await trigger.press('Enter');
            assert.equal(await page.locator('#cursorAppearance').isVisible(), true);
            assert.equal(await page.locator('[data-cursor-shape="instrument"]').evaluate(node => node === document.activeElement), true);
            for (const button of await controls.all()) assert.equal(await button.getAttribute('aria-expanded'), 'true');
            assert.deepEqual(await dimensions(), size, 'Opening the shared popup never grows the cursor box');
            await page.keyboard.press('Escape');
            await closed();
            assert.equal(await trigger.evaluate(node => node === document.activeElement), true, 'Escape returns focus to its invoker');
            await trigger.press('Enter');
            await page.keyboard.press('Shift+Tab');
            await closed();
            assert.equal(await trigger.evaluate(node => node === document.activeElement), true,
                'Shift+Tab from the first button returns to the actual invoker');
            await trigger.press('Space');
            assert.equal(await page.locator('#cursorAppearance').isVisible(), true, 'Space opens the same controls');
            for (const selector of [
                '[data-cursor-shape="minimal"]',
                ...['instrument', 'red', 'black', 'blue', 'green'].map(colour => `[data-cursor-colour="${colour}"]`)
            ]) {
                await page.keyboard.press('Tab');
                assert.equal(await page.locator(selector).evaluate(node => node === document.activeElement), true,
                    'Every choice is reachable in its visible order');
            }
            await page.keyboard.press('Tab');
            await closed();
            assert.equal(await page.locator('#cursorAppearance').evaluate(node => node.contains(document.activeElement)), false,
                'Tab leaves the popup without trapping or stealing focus');
        }
        await page.locator('#cursorAppearanceButton').click();
        await page.locator('#cursorAppearanceCompactButton').click();
        assert.equal(await page.locator('#cursorAppearance').isVisible(), true, 'The second access point reanchors the open panel');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#cursorAppearanceCompactButton').evaluate(node => node === document.activeElement), true);
        await page.locator('#cursorAppearanceButton').click();
        await page.locator('#presetLabel').click();
        await closed();
        await page.locator('#cursorAppearanceCompactButton').click();
        await page.locator('#sideSelect').focus();
        await closed();
        assert.equal(await page.locator('#sideSelect').evaluate(node => node === document.activeElement), true,
            'Outside focus is left alone');
        await page.locator('#cursorAppearanceCompactButton').click();
        const beforeButtons = await state(page);
        await page.locator('[data-cursor-shape="minimal"]').focus();
        await page.keyboard.press('Enter');
        await settle(page);
        await selected(page, 'minimal', beforeButtons.cursorColour);
        assert.equal(await page.locator('[data-cursor-shape="minimal"]').evaluate(node => node === document.activeElement), true,
            'Enter preserves focus on the chosen shape');
        assert.equal(await page.locator('#cursorAppearance').isVisible(), true, 'Button choices keep the panel open');
        await page.locator('[data-cursor-colour="blue"]').focus();
        await page.keyboard.press('Space');
        await settle(page);
        await selected(page, 'minimal', 'blue');
        assert.equal(await page.locator('[data-cursor-colour="blue"]').evaluate(node => node === document.activeElement), true,
            'Space preserves focus on the chosen colour');
        for (const key of ['ArrowDown', 'ArrowLeft', 'Home', 'End']) await page.keyboard.press(key);
        const afterButtons = await state(page);
        assert.equal(afterButtons.cursor, beforeButtons.cursor, 'Keys in the appearance panel do not move the instrument');
        assert.equal(afterButtons.slideOffset, beforeButtons.slideOffset);
        await page.keyboard.press('Escape');
        await closed();
        await page.locator('#cursorAppearanceButton').click();
        assert.equal(await page.locator('[data-cursor-shape="minimal"]').evaluate(node => node === document.activeElement), true,
            'Reopening focuses the selected shape');
        await page.keyboard.press('Shift+Tab');
        assert.equal(await page.locator('[data-cursor-shape="instrument"]').evaluate(node => node === document.activeElement), true,
            'Reverse tab visits the preceding shape button');
        await page.keyboard.press('Shift+Tab');
        await closed();
        assert.equal(await page.locator('#cursorAppearanceButton').evaluate(node => node === document.activeElement), true);
        await preferences(page, beforeButtons.cursorShape, beforeButtons.cursorColour);
        assert.equal(await page.locator('[data-cursor-shape]').count(), 2, 'Only Instrument and Minimal are offered');
        assert.equal(await page.locator('[data-cursor-colour]').count(), 5, 'Instrument and the four explicit colours are offered');
        assert.equal(await page.locator('#cursorAppearance select').count(), 0, 'Appearance choices are buttons');
        for (const id of ['cursorShapeOptions', 'cursorColourOptions']) {
            const group = page.locator(`#${id}`);
            assert.equal(await group.getAttribute('role'), 'group');
            assert.equal(await group.evaluate(node => {
                const label = document.getElementById(node.getAttribute('aria-labelledby'));
                return Boolean(label?.textContent.trim());
            }), true, 'Every button group has a visible accessible label');
        }
        for (const [name, expected] of Object.entries(colours)) {
            const button = page.locator(`[data-cursor-colour="${name}"]`);
            assert.equal(await button.evaluate(node => getComputedStyle(node).backgroundColor), expected,
                'Named buttons use the same colours as the hairlines');
            const labelColour = await button.evaluate(node => getComputedStyle(node).color);
            assert.equal(labelColour, 'rgb(255, 255, 255)', 'Colour buttons keep white labels');
            assert(contrast(expected, labelColour) >= 4.5, 'Colour button labels meet normal-text contrast');
            await button.click();
            assert.equal(await button.evaluate(node => getComputedStyle(node).textDecorationLine.includes('underline')), true,
                'Selection is visible without relying on colour perception');
        }
        await preferences(page, beforeButtons.cursorShape, beforeButtons.cursorColour);
        await page.keyboard.press('Escape');
        await closed();
        await passed('Both entry points share one panel without box growth; labelled colour buttons, exclusive pressed states, noncolour selection, Enter, Space, Tab, Escape and outside dismissal');
        // Dense engraved cursor, neutral multi-line cursor and original digital cursor.
        for (const model of ['faber284n', 'graphoplex690a', 'classic']) {
            await page.selectOption('#presetSelect', model);
            await page.click('#loadPresetButton');
            await page.selectOption('#sideSelect', '');
            await preferences(page, 'instrument', 'instrument');
            await apply(page, { ...await state(page), cursor: .5, slideOffset: .037, magnification: 1 });
            const original = await snapshot(page);
            for (const shape of ['instrument', 'minimal']) {
                for (const colour of ['instrument', 'red', 'black', 'blue', 'green']) {
                    await preferences(page, shape, colour);
                    check(await snapshot(page), original, shape, colour);
                }
                await checkLoupe(page);
            }
            await preferences(page, 'instrument', 'instrument');
            assert.deepEqual(await snapshot(page), original, 'Instrument restores the original cursor and readings exactly');
            await page.locator('#loupeButton').click();
            await passed(`${model}: all 10 shape/colour combinations on both faces, unchanged positions and inscriptions, restored readings and live loupe`);
        }
        // Explicit inline labels exercise the older editable-programme format.
        // The front deliberately has no tone: an authored auxiliary cursor has
        // the neutral fallback, unlike the original simple digital red cursor.
        const custom = await state(page);
        custom.presetId = 'custom';
        custom.modelLabel = 'Cursor inscription regression';
        for (const [name, side] of Object.entries(custom.sides)) {
            side.cursorMarks = [
                { id: 'inline-default', label: 'Authored default caption', offset: -.02 },
                { id: 'inline-red', label: 'Authored red caption', offset: .02, labelTone: 'red' }
            ];
            if (name === 'back') side.cursorLineTone = 'red';
            else delete side.cursorLineTone;
        }
        await apply(page, custom);
        const originalCustom = await snapshot(page);
        for (const shape of ['instrument', 'minimal']) {
            for (const colour of ['instrument', 'red', 'black', 'blue', 'green']) {
                await preferences(page, shape, colour);
                check(await snapshot(page), originalCustom, shape, colour);
            }
            await checkLoupe(page);
        }
        await preferences(page, 'instrument', 'instrument');
        assert.deepEqual(await snapshot(page), originalCustom);
        await page.locator('#loupeButton').click();
        await passed('Custom visible inline labels retain neutral/red authored colours, including an implicit neutral advanced cursor');
        await preferences(page, 'minimal', 'red');
        const ids = await page.evaluate(async () => Object.keys((await import('#catalog/presets.js')).PRESETS));
        for (const id of ids) {
            await page.selectOption('#presetSelect', id);
            await page.click('#loadPresetButton');
            await settle(page);
            const program = await state(page);
            assert.equal(program.cursorShape, 'minimal');
            assert.equal(program.cursorColour, 'red');
            await selected(page, 'minimal', 'red');
        }
        await passed(`Shape and colour preferences survive loading all ${ids.length} presets`);
        await page.selectOption('#presetSelect', 'faber284n');
        await page.click('#loadPresetButton');
        await page.selectOption('#sideSelect', '');
        await apply(page, { ...await state(page), cursor: .5, slideOffset: .037, magnification: 1 });
        for (const width of [390, 1800]) {
            await page.setViewportSize({ width, height: 1200 });
            // Resizing may close the transient popup; open it explicitly before
            // measuring visible controls rather than accepting zero rectangles.
            await preferences(page, 'minimal', 'red');
            const cursorBox = await dimensions();
            assert.equal(cursorBox.height, await page.locator('.position-control[data-motion="slideOffset"]').evaluate(node => node.offsetHeight),
                'The cursor box keeps its original height at each viewport');
            assert.equal(await page.locator('#cursorAppearance').evaluate(panel => {
                const rect = panel.getBoundingClientRect();
                return rect.width > 0 && rect.left >= 0 && rect.right <= innerWidth
                    && rect.top >= 0 && rect.bottom <= innerHeight;
            }), true, 'The shared popup fits wholly inside the viewport');
            const controlOverflow = await page.locator('#cursorAppearance').evaluate(panel => {
                const box = panel.getBoundingClientRect();
                return [...panel.querySelectorAll('button')].some(button => {
                    const bounds = button.getBoundingClientRect();
                    return bounds.left < box.left - 1 || bounds.right > box.right + 1;
                });
            });
            assert.equal(controlOverflow, false, 'Appearance buttons fit inside their panel at narrow widths');
            for (const font of ['Arial, sans-serif', 'Georgia, serif', 'monospace']) {
                await page.evaluate(font => document.documentElement.style.setProperty('--engraving-font', font), font);
                for (const magnification of [.75, 2]) {
                    await page.selectOption('#magnificationSelect', String(magnification));
                    await preferences(page, 'instrument', 'instrument');
                    const baseline = await snapshot(page);
                    for (const shape of ['minimal']) {
                        await preferences(page, shape, 'red');
                        check(await snapshot(page), baseline, shape, 'red');
                    }
                    report.rendering.push({ width, font, magnification, shapes: ['instrument', 'minimal'], passed: true });
                }
            }
        }
        await page.setViewportSize({ width: 1800, height: 1200 });
        await page.evaluate(() => document.documentElement.style.removeProperty('--engraving-font'));
        await page.selectOption('#magnificationSelect', '1');
        await preferences(page, 'minimal', 'red');
        const cursor = page.locator('#ruleCanvas .cursor').first();
        await cursor.scrollIntoViewIfNeeded();
        const bounds = await cursor.boundingBox();
        const pane = await page.locator('#ruleCanvas .top-stator .tick-pane').first().boundingBox();
        const before = await state(page), x = bounds.x + bounds.width / 2, y = bounds.y + bounds.height / 2;
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 24, y, { steps: 6 });
        await page.mouse.up();
        await settle(page);
        const after = await state(page);
        assert(Math.abs(after.cursor - before.cursor - 24 / pane.width) < .0001, 'Minimal cursor drags by the engraved scale distance');
        assert.equal(after.slideOffset, before.slideOffset);
        assert.deepEqual(after.sides, before.sides);
        for (const position of [0, 1]) {
            await apply(page, { ...after, cursor: position });
            for (const face of await snapshot(page)) assert(Math.abs(face.positionError) < .8, 'Minimal endpoints are not clamped by its width');
        }
        await apply(page, after);
        await passed('Narrow and desktop viewports, 75% and 200% magnification, three font families, minimal drag and both endpoints');
        const expected = await state(page);
        assert.deepEqual(JSON.parse(await download(page, '#exportJsonButton')), expected);
        // Activate export without an outside pointer/focus event: the saved
        // document must hide its transient panel even if the live one is open.
        await preferences(page, expected.cursorShape, expected.cursorColour);
        assert.equal(await page.locator('#cursorAppearance').isVisible(), true);
        await writeFile(join(staging, 'configured.html'), await download(page, '#saveHtmlButton', true));
        const expectedDrawing = await snapshot(page);
        await page.reload();
        await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
        await settle(page);
        assert.deepEqual(await state(page), expected, 'Page reload restores preferences and positions');
        assert.deepEqual(await snapshot(page), expectedDrawing);
        for (const mode of ['json', 'html']) {
            const fresh = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
            try {
                const restored = await newPage(fresh);
                await load(restored, mode === 'html' ? 'configured.html' : 'index.html');
                if (mode === 'json') await apply(restored, expected);
                assert.equal(await restored.locator('#cursorAppearance').evaluate(node => node.hidden), true,
                    'A fresh document keeps the appearance panel collapsed');
                assert.deepEqual(await state(restored), expected, `${mode} restores in a clean browser context`);
                await selected(restored, 'minimal', 'red');
                for (const trigger of await restored.locator('[data-cursor-appearance-trigger]').all())
                    assert.equal(await trigger.getAttribute('aria-expanded'), 'false', 'Export/reload resets both transient triggers');
                assert.deepEqual(await snapshot(restored), expectedDrawing);
                await preferences(restored, 'instrument', 'instrument');
                assert((await snapshot(restored))[0].marks.length > 0, 'Saved programme retains the hidden historical cursor');
            } finally { await fresh.close(); }
        }
        await passed('Reload, exported JSON and configured HTML preserve preferences and hidden historical profiles in clean contexts');
        assert.deepEqual(report.errors, [], 'No uncaught exceptions or browser console errors');
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
