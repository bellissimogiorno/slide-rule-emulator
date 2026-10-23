#!/usr/bin/env node
/** Native acceptance for animated lessons on the actual self-contained page.
 * node tests/browser/tutorial.mjs [--output /writable/path] [--executable /chromium]
 * Missing native prerequisites are failures with zero executed cases, never DOM
 * substitution. --visual optionally records screenshots outside the release.
 */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPlaywright } from './playwright.mjs';
import { buildHtml } from '../../tools/build.mjs';
import { TUTORIAL_LESSONS } from '#tutorial/lessons.js';
import { TUTORIAL_SECTIONS } from '#tutorial/course.js';
import { TUTORIAL_LAYOUTS } from '#tutorial/programme.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { makeRuntimeScale } from '#core/mappings.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2), visual = args.includes('--visual');
function option(name, fallback) {
    const index = args.indexOf(name);
    if (index < 0) return fallback;
    assert(args[index + 1] && !args[index + 1].startsWith('--'), `${name} requires a value`);
    return args[index + 1];
}
const output = resolve(option('--output', join(root, 'qa/tutorial')));
const executablePath = option('--executable', process.env.CHROMIUM_EXECUTABLE);
await mkdir(output, { recursive: true });
const report = { mode: 'native Chromium HTTP', passed: false, nativeCases: 0, checks: [], errors: [],
    limitations: ['Single native browser; no claim about other engines, assistive technology or deployment.'] };
const record = () => writeFile(join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
const passed = async text => { report.nativeCases++; report.checks.push(text); await record(); console.log(text); };
const close = (actual, expected, tolerance = 1e-9) =>
    assert(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
let browser, server, staging;
try {
    report.stage = 'Playwright dependency';
    const { playwright, version, modulePath } = loadPlaywright();
    report.playwright = version; report.playwrightModule = modulePath;
    report.stage = 'Chromium launch';
    report.browserExecutable = executablePath || 'Playwright-managed Chromium headless shell';
    browser = await playwright.chromium.launch({ ...(executablePath ? { executablePath } : {}), args: ['--no-sandbox'] });
    report.browser = browser.version();
    report.stage = 'Generate application and serve local HTTP';
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
    const openPage = async (context, name = 'index.html') => {
        const page = await context.newPage(); page.setDefaultTimeout(15000);
        page.on('pageerror', error => report.errors.push(String(error)));
        page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
        assert.equal((await page.goto(`${origin}/${name}`)).status(), 200);
        await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
        await settle(page); return page;
    };
    const programme = page => page.evaluate(async () => (await import('#main.js')).application.getProgram());
    const expectProblem = async (page, problem) => {
        assert.equal(typeof problem, 'string'); assert(problem.trim());
        assert(await page.locator('#tutorialProblem').isVisible());
        assert.equal(await page.locator('#tutorialProblem').textContent(), problem);
    };
    const expectCaptions = async (page, layout) => {
        assert.equal(await page.locator('body').getAttribute('data-formulas'), 'true');
        const profile = TUTORIAL_LAYOUTS[layout];
        for (const id of ['topStator', 'slide', 'bottomStator'].flatMap(rail => profile[rail])) {
            const formula = page.locator(`#ruleCanvas [data-scale="${id}"] .legend-formula`);
            assert.equal(await formula.count(), 1, `${id} has a formula caption`);
            assert(await formula.isVisible(), `${id} formula is visible`);
            assert.equal(await formula.textContent(), BUILTIN_SCALES[id].formula);
            const geometry = await formula.evaluate(node => {
                const text = node.getBoundingClientRect(), gutter = node.closest('.scale-legend').getBoundingClientRect();
                const row = node.closest('.scale-row').getBoundingClientRect();
                return { left: text.left, right: text.right, top: text.top, bottom: text.bottom,
                    gutterLeft: gutter.left, gutterRight: gutter.right, rowTop: row.top, rowBottom: row.bottom,
                    fontSize: parseFloat(getComputedStyle(node).fontSize) };
            });
            assert(geometry.fontSize >= 10, `${id} formula retains the normal engraving size`);
            assert(geometry.left >= geometry.gutterLeft - 1 && geometry.right <= geometry.gutterRight + 1,
                `${id} formula fits its legend gutter`);
            assert(geometry.top >= geometry.rowTop - 1 && geometry.bottom <= geometry.rowBottom + 1,
                `${id} formula fits its teaching row`);
        }
    };
    const position = page => page.evaluate(() => ({
        slideOffset: Number(document.getElementById('slideRange').value) / 100,
        cursor: Number(document.getElementById('cursorRange').value) / 1000
    }));
    const move = async (page, target) => {
        for (const [id, value] of [['slideRange', target.slideOffset * 100], ['cursorRange', target.cursor * 1000]])
            await page.locator('#' + id).evaluate((input, value) => {
                input.value = String(value); input.dispatchEvent(new Event('input', { bubbles: true }));
            }, value);
        await settle(page);
    };
    const expectPosition = async (page, target, layout) => {
        const actual = await position(page);
        for (const field of ['slideOffset', 'cursor']) close(actual[field], target[field]);
        const boxes = await page.evaluate(() => {
            const face = document.querySelector('#ruleCanvas .rule-face-body');
            const pane = face.querySelector('.slide-rail .tick-pane').getBoundingClientRect();
            const cursor = face.querySelector('.cursor').getBoundingClientRect();
            const slide = face.querySelector('.slide-mover').getBoundingClientRect();
            return { left: pane.left, width: pane.width, cursor: cursor.left + cursor.width / 2, slide: slide.left };
        });
        close(boxes.cursor, boxes.left + target.cursor * boxes.width, 1);
        close(boxes.slide, boxes.left + target.slideOffset * boxes.width, 1);
        const profile = TUTORIAL_LAYOUTS[layout], rails = ['topStator', 'slide', 'bottomStator'];
        assert.deepEqual(await page.locator('#readout [data-readout-scale]').evaluateAll(nodes =>
            nodes.map(node => node.dataset.readoutScale)), rails.flatMap(rail => profile[rail]));
        for (const rail of rails) for (const id of profile[rail]) {
            const local = target.cursor - (rail === 'slide' ? target.slideOffset : 0);
            const scale = makeRuntimeScale(BUILTIN_SCALES[id]);
            const text = await page.locator(`#readout [data-readout-scale="${id}"] .value`).innerText();
            if (local < (scale.pMin ?? 0) - 1e-10 || local > (scale.pMax ?? 1) + 1e-10) {
                assert.match(text, /off scale/); continue;
            }
            const value = text.match(/^(?:Main:\s*)?(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/i);
            assert(value, `${id} has a numeric readout: ${text}`);
            const expected = scale.value(local);
            close(Number(value[1]), expected, .002 * Math.max(1, Math.abs(expected)));
        }
    };
    const finishMovement = async (page, step, lesson) => {
        await page.waitForFunction(() => document.getElementById('tutorialFeedback').textContent.startsWith('Movement complete.'));
        await expectPosition(page, step.target, lesson.layout);
        await expectProblem(page, lesson.problem);
    };
    const context = await browser.newContext({ viewport: { width: 1600, height: 1100 },
        reducedMotion: 'no-preference', acceptDownloads: true });
    report.stage = 'Native tutorial demonstrations and practice';
    try {
        const page = await openPage(context);
        await move(page, { slideOffset: -.123, cursor: .456 });
        await page.selectOption('#magnificationSelect', '1.25'); await settle(page);
        await page.locator('#motionStep [data-step="0.0005"]').click();
        await page.locator('#loupeButton').click();
        const beforeEdit = await programme(page);
        await page.locator('[data-action="add"][data-rail="topStator"]').click();
        await settle(page);
        const original = await programme(page), draft = '{"unapplied":"keep this exact draft"}';
        await page.waitForFunction(async expected => localStorage.getItem((await import('#version.js')).STORAGE_KEY) === JSON.stringify(expected), original);
        const stored = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage))));
        await page.locator('#jsonEditor').fill(draft);
        await page.locator('#tutorialButton').click();
        assert.equal(await page.locator('#tutorialSectionSelect option').count(), TUTORIAL_SECTIONS.length);
        assert.equal(await page.locator('#tutorialLessonSelect option').count(), TUTORIAL_SECTIONS[0].lessons.length);
        assert.match(await page.locator('#tutorialWatchButton').getAttribute('aria-describedby'), /\btutorialProblem\b/);
        assert.match(await page.locator('#tutorialStepHeading').getAttribute('aria-describedby'), /\btutorialProblem\b/);
        assert.deepEqual(await programme(page), original);
        for (const [index, item] of TUTORIAL_LESSONS.entries()) {
            if (await page.locator('#tutorialSectionSelect').inputValue() !== item.sectionId)
                await page.selectOption('#tutorialSectionSelect', item.sectionId);
            await page.selectOption('#tutorialLessonSelect', String(index));
            await expectProblem(page, item.problem);
            await page.locator('#tutorialWatchButton').click();
            await expectProblem(page, item.problem);
            assert.equal(await page.locator('#readout').getAttribute('aria-live'), 'off');
            const field = ['slideOffset', 'cursor'].find(field => item.start[field] !== item.steps[0].target[field]);
            assert(field, `${item.id} starts with a visible movement`);
            const start = item.start[field], end = item.steps[0].target[field];
            await page.waitForFunction(({ field, start, end }) => {
                const value = Number(document.getElementById(field === 'cursor' ? 'cursorRange' : 'slideRange').value)
                    / (field === 'cursor' ? 1000 : 100);
                const fraction = (value - start) / (end - start);
                return fraction > .05 && fraction < .95;
            }, { field, start, end });
            const moving = await position(page);
            assert((moving[field] - start) / (end - start) > 0 && (moving[field] - start) / (end - start) < 1);
            if (index === 0) {
                await page.locator('#tutorialPauseButton').click();
                const paused = await position(page); await page.waitForTimeout(100);
                assert.deepEqual(await position(page), paused, 'Paused native movement stays still');
                await page.locator('#tutorialPauseButton').click();
            }
            await finishMovement(page, item.steps[0], item);
            await expectCaptions(page, item.layout);
            for (const step of item.steps.slice(1)) {
                await page.locator('#tutorialNextButton').click(); await finishMovement(page, step, item);
            }
            if (visual) await page.screenshot({ path: join(output, `${item.id}.png`), fullPage: false });
            await page.locator('#tutorialTryButton').click();
            await expectProblem(page, item.practice.problem);
            await expectCaptions(page, item.layout);
            for (const [practiceIndex, step] of item.practice.steps.entries()) {
                const wrong = { ...step.target }, field = step.required[0], maximum = field === 'cursor' ? 1 : .9;
                wrong[field] += wrong[field] > maximum - .025 ? -.025 : .025;
                await move(page, wrong);
                await page.locator('#tutorialCheckButton').click();
                assert.equal(await page.locator('#tutorialFeedback').getAttribute('data-result'), 'retry');
                await move(page, step.target); await page.locator('#tutorialCheckButton').click();
                assert.equal(await page.locator('#tutorialFeedback').getAttribute('data-result'), 'success');
                await expectPosition(page, step.target, item.layout);
                await expectProblem(page, item.practice.problem);
                if (practiceIndex < item.practice.steps.length - 1) await page.locator('#tutorialPracticeNextButton').click();
            }
            assert.deepEqual(await programme(page), original, 'Tutorial coordinates never become the exported programme');
            assert.equal(await page.locator('#jsonEditor').inputValue(), draft);
            assert.equal(await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage)))), stored);
            assert.equal(await page.locator('#tutorialSessionProgress').innerText(),
                `This session: ${index + 1}/${TUTORIAL_LESSONS.length} demonstrated · ${index + 1}/${TUTORIAL_LESSONS.length} practised`);
            await passed(`${item.id}: real intermediate movement, ${item.layout} geometry/readouts and wrong/correct practice`);
            if (TUTORIAL_LESSONS[index + 1]?.sectionId !== item.sectionId && index < TUTORIAL_LESSONS.length - 1)
                assert.equal(await page.locator('#tutorialNextLessonButton').innerText(), 'Next section');
            if (index < TUTORIAL_LESSONS.length - 1) await page.locator('#tutorialNextLessonButton').click();
        }
        await page.locator('#tutorialFinishButton').click();
        assert.deepEqual(await programme(page), original);
        assert.equal(await page.locator('#jsonEditor').inputValue(), draft);
        assert.equal(await page.locator('#readout').getAttribute('aria-live'), 'polite');
        assert.equal(await page.locator('[data-tutorial-lock]').count(), 0);
        assert.equal(await page.locator('#magnificationSelect').inputValue(), '1.25');
        assert.equal(await page.locator('#motionStep [aria-pressed="true"]').getAttribute('data-step'), '0.0005');
        assert.equal(await page.locator('#loupeButton').getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('body').getAttribute('data-formulas'), String(original.showFormulas));
        const restored = await position(page); close(restored.slideOffset, original.slideOffset); close(restored.cursor, original.cursor);
        await passed('Closing restores original positions, draft, controls and readout announcements without storage changes');

        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.locator('#tutorialButton').click();
        await page.selectOption('#tutorialSectionSelect', TUTORIAL_LESSONS[1].sectionId);
        await page.selectOption('#tutorialLessonSelect', '1');
        await page.locator('#tutorialWatchButton').click();
        await expectProblem(page, TUTORIAL_LESSONS[1].problem);
        await expectPosition(page, TUTORIAL_LESSONS[1].steps[0].target, TUTORIAL_LESSONS[1].layout);
        assert(await page.locator('#tutorialPauseButton').isHidden());
        await page.locator('#tutorialReplayButton').click();
        await expectProblem(page, TUTORIAL_LESSONS[1].problem);
        await expectPosition(page, TUTORIAL_LESSONS[1].steps[0].target, TUTORIAL_LESSONS[1].layout);
        await passed('Reduced motion and replay show exact discrete steps without a running animation');
        const download = page.waitForEvent('download'); await page.locator('#saveHtmlButton').click();
        await writeFile(join(staging, 'configured.html'), await readFile(await (await download).path()));
        const fresh = await browser.newContext({ viewport: { width: 1600, height: 1100 } });
        try {
            const copy = await openPage(fresh, 'configured.html');
            assert.deepEqual(await programme(copy), original);
            assert(await copy.locator('#tutorialPanel').isHidden());
            assert.equal(await copy.locator('#tutorialProblem').textContent(), TUTORIAL_LESSONS[0].problem);
            assert.equal(await copy.locator('[data-tutorial-lock], [data-tutorial-live]').count(), 0);
            assert.equal(await copy.locator('#readout').getAttribute('aria-live'), 'polite');
            assert.equal(await copy.locator('#tutorialSectionSelect option').count(), TUTORIAL_SECTIONS.length);
            assert.equal(await copy.locator('#tutorialSectionSelect').inputValue(), TUTORIAL_SECTIONS[0].id);
            assert.equal(await copy.locator('#tutorialLessonSelect option').count(), TUTORIAL_SECTIONS[0].lessons.length);
            assert.equal(await copy.locator('#tutorialLessonSelect').inputValue(), '0');
            assert.equal(await copy.locator('#tutorialSessionProgress').innerText(),
                `This session: 0/${TUTORIAL_LESSONS.length} demonstrated · 0/${TUTORIAL_LESSONS.length} practised`);
            assert.equal(await copy.locator('.side-panel').getAttribute('inert'), null);
            assert.equal(await copy.locator('#loupeButton').getAttribute('aria-pressed'), 'false');
            assert.equal(await copy.locator('body').getAttribute('data-formulas'), String(original.showFormulas));
            await copy.locator('#tutorialButton').click();
            await expectProblem(copy, TUTORIAL_LESSONS[0].problem);
            await copy.locator('#tutorialWatchButton').click();
            await expectCaptions(copy, TUTORIAL_LESSONS[0].layout);
            assert.deepEqual(await programme(copy), original);
        } finally { await fresh.close(); }
        await passed('Configured download during a lesson opens the original programme with tutorial closed and controls unlocked');
        await page.locator('#tutorialCloseButton').click();
        await page.locator('[data-action="undo"][data-rail="topStator"]').click(); await settle(page);
        assert.deepEqual(await programme(page), beforeEdit, 'The original scale-edit Undo entry survives tutorial sessions');
        await passed('Original scale-edit Undo remains usable after tutorial and export');
        assert.deepEqual(report.errors, [], 'No uncaught exceptions or browser console errors');
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
