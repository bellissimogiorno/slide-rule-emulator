import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_SCALES as scales } from '#catalog/scales.js';
import { generateTicks } from '#core/ticks/index.js';
import { dedupeTicks } from '#core/ticks/common.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { gaugeDescription, foldedIndexDescription } from '#core/mark-descriptions.js';
import { renderTick, renderSyncroTick } from '#ui/tick-markup.js';
import { createMarkTooltips } from '#ui/mark-tooltips.js';
import { close } from './helpers.js';
const ticks = id => generateTicks(scales[id], makeRuntimeScale(scales[id]), 1600);

test('every built-in gauge, anchor and folded index has a non-empty explanatory tooltip', () => {
    let total = 0;
    for (const def of Object.values(scales)) {
        if (!def.gauges?.length && !def.anchor && !def.type.startsWith('folded')) continue;
        for (const tick of ticks(def.id)) if (tick.kind === 'gauge' || def.type.startsWith('folded') && [0, 1].includes(tick.pos)) {
            assert.ok(tick.title?.length > 20, `${def.id}: ${tick.label}`); total++;
        }
    }
    assert.ok(total > 25);
});

test('c means circle-diameter factor, not speed of light; e is Euler, pi is circumference ratio', () => {
    const marks = ticks('D');
    const c = marks.find(t => t.label === 'c');
    close(c.value ** 2 * Math.PI, 4);
    assert.match(c.title, /Circle-diameter factor/); assert.match(c.title, /Not the speed of light/);
    const e = marks.find(t => t.label === 'e'); close(Math.log(e.value), 1); assert.match(e.title, /Euler/);
    const pi = marks.find(t => t.label === '\u03c0'); close(pi.value, Math.PI); assert.match(pi.title, /circumference/);
    for (const id of ['F5100_J', 'F5100_K', 'F5100_P', 'F5100_Q']) assert.match(ticks(id).find(t => t.label === 'c').title, /Circle-diameter/);
});

test('folded constant tips distinguish pi, 10/pi and 1/M = ln(10)', () => {
    assert.match(ticks('CF').find(t => t.pos === 0).title, /Pi, the circumference/);
    for (const id of ['CIF', 'DIF']) {
        const mark = ticks(id).find(t => t.pos === 0);
        close(mark.value * Math.PI, 10); assert.match(mark.title, /10\/pi/);
    }
    const mark = ticks('CFM').find(t => t.pos === 0);
    close(mark.value, 1 / Math.log10(Math.E)); assert.match(mark.title, /1\/M = ln\(10\)/);
    assert.doesNotMatch(foldedIndexDescription({ fold: 2, foldLabel: '\u03c0' }, 2), /circumference/);
});

test('Pickett R and .785 describe both the constant and its decade-adjusted mark', () => {
    const r = ticks('P14_C').find(t => t.label === 'R'); close(r.value * 10 * Math.PI, 180);
    assert.match(r.title, /57.295/); assert.match(r.title, /5.729/);
    const area = ticks('P14_B').find(t => t.label === '.785'); close(area.value / 100, Math.PI / 4);
    assert.match(area.title, /diameter squared/); assert.match(area.title, /78.539/);
});

test('arcminute and arcsecond indices are not confused with the marked ST angle', () => {
    const R = 180 / Math.PI, rt = makeRuntimeScale(scales.P14_ST);
    for (const [label, perDegree, decade] of [['\u2032', 60, 1e3], ['\u2033', 3600, 1e5]]) {
        const mark = ticks('P14_ST').find(t => t.label === label);
        const decimalMantissa = 10 ** rt.pos(mark.value);
        close(decimalMantissa * decade, perDegree * R);
        assert.match(mark.title, /conversion index/); assert.match(mark.title, /not at 1 arc/);
        const factorText = Number(mark.title.match(/= (0\.\d+) radians/)[1]);
        close(factorText, 1 / (perDegree * R), 1e-11, 0);
    }
});

test('alignment T is not claimed to be a fixed temperature; chemical C remains carbon', () => {
    assert.match(ticks('BB_HM').find(t => t.label === 'T').title, /not a fixed temperature/);
    const carbon = ticks('CHEM_CH_AM').find(t => t.label === 'C');
    assert.ok(carbon); assert.match(carbon.title, /^C: 12\.011/); assert.doesNotMatch(carbon.title, /Circle-diameter/);
    assert.match(gaugeDescription({ label: 'c', value: 3 }), /User-defined/);
});

test('annotation data survives coincident graduation deduplication', () => {
    const result = dedupeTicks([{ pos: .3, value: 2, kind: 'index', label: '2' }, { pos: .3, value: 2, kind: 'gauge', label: 'x', title: 'An explanatory title' }]);
    assert.equal(result.length, 1); assert.equal(result[0].title, 'An explanatory title');
});

test('manual descriptions cannot inject HTML into ordinary or shared tick markup', () => {
    const mark = { pos: .5, value: 2, label: 'x', positiveLabel: 'x', negativeLabel: 'y', title: '"><img src=x onerror=alert(1)>' };
    for (const render of [renderTick, renderSyncroTick]) {
        const text = render(mark);
        assert.ok(!text.includes('<img')); assert.match(text, /data-mark-tip="&quot;&gt;&lt;img/);
    }
});

// The tooltip controller uses geometry even when cursor glass receives the
// pointer. Supply only the browser surfaces it needs, with explicit frame and
// mutation delivery so these interaction checks do not require Chromium.
function tooltipHarness() {
    const frames = new Map(), marks = [];
    let nextFrame = 0, notifyMutation;
    const pane = { getBoundingClientRect: () => ({ left: 0, right: 200, top: 0, bottom: 80 }) };
    const node = () => {
        const attributes = new Map();
        return Object.assign(new EventTarget(), {
            dataset: {}, style: {}, offsetWidth: 240, offsetHeight: 48, isConnected: true,
            setAttribute: (name, value) => attributes.set(name, value),
            getAttribute: name => attributes.get(name) ?? null,
            removeAttribute: name => attributes.delete(name),
            remove() { this.isConnected = false; }
        });
    };
    const window = Object.assign(new EventTarget(), {
        innerWidth: 800, innerHeight: 600,
        requestAnimationFrame(callback) { frames.set(++nextFrame, callback); return nextFrame; },
        cancelAnimationFrame: id => frames.delete(id),
        getComputedStyle: () => ({ display: 'block' }),
        MutationObserver: class {
            constructor(callback) { notifyMutation = callback; }
            observe() {}
            disconnect() { notifyMutation = null; }
        }
    });
    let tooltip;
    const document = Object.assign(new EventTarget(), {
        defaultView: window, createElement: node, body: { append(element) { tooltip = element; } }
    });
    const canvas = Object.assign(new EventTarget(), { querySelectorAll: () => marks });
    const controller = new AbortController();
    createMarkTooltips({ document, canvas, signal: controller.signal });
    return {
        tooltip,
        addMark(text, bounds, classes = []) {
            const mark = node();
            mark.dataset.markTip = text;
            mark.setAttribute('title', text);
            mark.classList = { contains: name => classes.includes(name) };
            mark.getBoundingClientRect = () => bounds;
            mark.closest = selector => selector === '.tick-pane' ? pane : null;
            marks.push(mark); notifyMutation();
            return mark;
        },
        pointer(type, x, buttons = 0) {
            canvas.dispatchEvent(Object.assign(new Event(type), { clientX: x, clientY: 30, buttons }));
            for (const [id, callback] of frames) { frames.delete(id); callback(); }
        },
        remove(mark) {
            marks.splice(marks.indexOf(mark), 1); mark.remove(); notifyMutation();
        },
        destroy: () => controller.abort()
    };
}

test('hover explains the yellow seam over a constant and preserves nearby constant help', t => {
    const ui = tooltipHarness(); t.after(ui.destroy);
    const constant = ui.addMark('Pi: circumference divided by diameter.', { left: 90, right: 120, top: 20, bottom: 40 });
    const seam = ui.addMark('Wraparound slide: repeated slide boundary.', { left: 100, right: 105, top: 0, bottom: 80 }, ['slide-wraparound-seam']);

    ui.pointer('pointermove', 102);
    assert.equal(ui.tooltip.hidden, false);
    assert.equal(ui.tooltip.textContent, seam.dataset.markTip);
    assert.equal(seam.getAttribute('aria-describedby'), 'markTooltip');
    assert.equal(seam.getAttribute('title'), '');
    assert.equal(constant.getAttribute('aria-describedby'), null);

    // Two pixels outside the bar is still within its hover tolerance, but the
    // pointer is visibly on the constant, whose explanation should win here.
    ui.pointer('pointermove', 107);
    assert.equal(ui.tooltip.textContent, constant.dataset.markTip);
    assert.equal(constant.getAttribute('aria-describedby'), 'markTooltip');
    assert.equal(seam.getAttribute('aria-describedby'), null);
    assert.equal(seam.getAttribute('title'), seam.dataset.markTip);
});

test('wraparound help dismisses during dragging and when the highlight is removed', t => {
    const ui = tooltipHarness(); t.after(ui.destroy);
    const seam = ui.addMark('Wraparound slide: use Scale layout to switch it on or off.', { left: 100, right: 105, top: 0, bottom: 80 }, ['slide-wraparound-seam']);
    ui.pointer('pointermove', 102);
    assert.equal(ui.tooltip.hidden, false);
    ui.pointer('pointerdown', 102, 1);
    assert.equal(ui.tooltip.hidden, true);
    assert.equal(seam.getAttribute('aria-describedby'), null);
    ui.pointer('pointermove', 102, 1);
    assert.equal(ui.tooltip.hidden, true);
    ui.pointer('pointerup', 102);
    assert.equal(ui.tooltip.hidden, false);

    ui.remove(seam);
    assert.equal(ui.tooltip.hidden, true);
    assert.equal(seam.getAttribute('aria-describedby'), null);
    ui.pointer('pointermove', 102);
    assert.equal(ui.tooltip.hidden, true);
});
