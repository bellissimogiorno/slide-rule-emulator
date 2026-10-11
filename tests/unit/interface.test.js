import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MOTION_STEPS, motionStepShortcut, movedPosition } from '#ui/motion.js';
import { createStepControls, stepIndexAt } from '#ui/step-controls.js';
import { PAGE_THEMES, PAGE_THEME_STORAGE_KEY, normalisePageTheme, loadPageTheme, savePageTheme, bindPageThemes } from '#ui/page-theme.js';

for (const [i, step] of MOTION_STEPS.entries()) {
    test(`precision shortcut ${i + 1}: selects ${step} without needing a modifier`, () => {
        assert.equal(motionStepShortcut({ key: String(i + 1) }), step);
        for (const flag of ['defaultPrevented', 'isComposing', 'ctrlKey', 'metaKey', 'altKey', 'shiftKey'])
            assert.equal(motionStepShortcut({ key: String(i + 1), [flag]: true }), null);
    });
}
test('precision shortcuts reject unrelated keys', () => {
    for (const key of ['', '0', '5', 'ArrowLeft', 'toString', '1.0', '11'])
        assert.equal(motionStepShortcut({ key }), null);
});
test('four requested steps and Faster clamping', () => {
    assert.deepEqual(MOTION_STEPS, [.005, .001, .0005, .0001]);
    assert.ok(Math.abs(movedPosition(.2, 'cursor', { delta: .005 }) - .205) < 1e-15);
    assert.equal(movedPosition(.999, 'cursor', { delta: .005 }), 1);
    assert.equal(movedPosition(-.899, 'slideOffset', { delta: -.005 }), -.9);
});

class Button extends EventTarget {
    constructor(data) { super(); this.dataset = data; this.attributes = {}; }
    setAttribute(name, value) { this.attributes[name] = value; }
}
function precisionFixture() {
    const buttons = MOTION_STEPS.map(step => new Button({ step: String(step) }));
    const document = { activeElement: null };
    const target = { focusCalls: 0, focus(options) { assert.equal(options.preventScroll, true); this.focusCalls++; document.activeElement = this; } };
    const lifetime = new AbortController();
    const changes = [];
    const rail = new EventTarget();
    rail.style = { setProperty: (key, value) => { rail[key] = value; } };
    rail.getBoundingClientRect = () => ({ left: 100, width: 400 });
    rail.setPointerCapture = id => { rail.captured = id; };
    rail.releasePointerCapture = () => { rail.captured = null; };
    const element = { ownerDocument: document, querySelectorAll: () => buttons, querySelector: () => rail };
    const controls = createStepControls({ element, signal: lifetime.signal, returnTarget: () => target, onChange: value => changes.push(value) });
    return { buttons, document, target, lifetime, controls, changes, rail };
}
test('step buttons expose exactly one pressed choice and preserve live motion focus', () => {
    const f = precisionFixture();
    f.document.activeElement = f.target;
    for (const [i, b] of f.buttons.entries()) {
        b.dispatchEvent(new Event('click'));
        assert.equal(f.controls.value, MOTION_STEPS[i]);
        assert.equal(f.buttons.filter(b => b.attributes['aria-pressed'] === 'true').length, 1);
        assert.equal(f.target.focusCalls, 0, 'already focused control must not be blurred/refocused');
    }
});
test('Tab/keyboard button activation returns to the last motion focus stop', () => {
    const f = precisionFixture();
    f.document.activeElement = f.buttons[3];
    f.buttons[3].dispatchEvent(new Event('click'));
    assert.equal(f.document.activeElement, f.target);
    assert.equal(f.target.focusCalls, 1);
    assert.equal(f.controls.value, .0001);
});
function pointer(rail, type, props = {}) {
    const event = Object.assign(new Event(type, { cancelable: true }),
        { button: 0, isPrimary: true, pointerId: 7, clientX: 450, ...props });
    rail.dispatchEvent(event);
    return event;
}
test('detent hit regions round to four exact choices, including track edges', () => {
    for (const [x, index] of [[0,0], [100,0], [199.9,0], [200,1], [299.9,1], [300,2], [400,3], [700,3]])
        assert.equal(stepIndexAt(x,100,400), index);
    for (const width of [0, -10, NaN, Infinity]) assert.equal(stepIndexAt(150,100,width), 1);
});
test('primary pointer selects and drags the shared grip without changing focus', () => {
    const f = precisionFixture(); f.document.activeElement = f.target;
    assert.equal(f.rail['--step-index'], '1');
    assert.ok(pointer(f.rail, 'pointerdown').defaultPrevented);
    assert.equal(f.controls.value, .0001);
    assert.equal(f.rail.captured, 7);
    pointer(f.rail, 'pointermove', { clientX: 110 });
    assert.equal(f.controls.value, .005);
    pointer(f.rail, 'pointermove', { pointerId: 8, clientX: 450 });
    assert.equal(f.controls.value, .005);
    pointer(f.rail, 'pointerup');
    assert.equal(f.rail.captured, null);
    assert.equal(f.target.focusCalls, 0);
    // A click referring to the drag's starting stop must not undo its end.
    f.buttons[3].dispatchEvent(Object.assign(new Event('click'), { detail: 1 }));
    assert.equal(f.controls.value, .005);
    f.buttons[3].dispatchEvent(Object.assign(new Event('click'), { detail: 0 }));
    assert.equal(f.controls.value, .0001);
});
test('secondary pointers and context clicks leave precision alone', () => {
    for (const props of [{ button: 2 }, { isPrimary: false }]) {
        const f = precisionFixture();
        assert.equal(pointer(f.rail, 'pointerdown', props).defaultPrevented, false);
        assert.equal(f.controls.value, .001);
    }
});
test('cancelled step drag restores its original detent; abort releases capture', () => {
    const f = precisionFixture();
    pointer(f.rail, 'pointerdown'); pointer(f.rail, 'pointercancel');
    assert.equal(f.controls.value, .001);
    pointer(f.rail, 'pointerdown'); f.lifetime.abort();
    assert.equal(f.rail.captured, null);
    pointer(f.rail, 'pointermove', { clientX: 110 });
    assert.equal(f.controls.value, .0001);
});
test('aborting precision controls removes handlers, and invalid selection remains safe', () => {
    const f = precisionFixture();
    f.controls.select('invalid'); assert.equal(f.controls.value, .001);
    f.lifetime.abort(); f.buttons[3].dispatchEvent(new Event('click'));
    assert.equal(f.controls.value, .001); assert.equal(f.target.focusCalls, 0);
});

function store(initial) {
    const values = new Map(initial ? [[PAGE_THEME_STORAGE_KEY, initial]] : []);
    return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
for (const theme of PAGE_THEMES) {
    test(`page theme ${theme}: recognised, saved and loaded independently`, () => {
        const storage = store();
        assert.equal(normalisePageTheme(theme), theme);
        assert.equal(loadPageTheme(() => storage, theme), theme);
        assert.equal(savePageTheme(() => storage, theme), true);
        assert.equal(loadPageTheme(() => storage, 'light'), theme);
        assert.equal(storage.values.size, 1);
    });
}
test('theme validates stored and embedded choices rather than trusting arbitrary strings', () => {
    for (const invalid of ['solarized', 'invalid', '__proto__', '', null, { theme: 'dark' }]) {
        assert.equal(normalisePageTheme(invalid), 'light');
        assert.equal(loadPageTheme(() => store(invalid), 'dark'), 'dark');
    }
    assert.equal(loadPageTheme(() => store('solarised'), 'dark'), 'solarised');
});
test('denied storage does not prevent selecting a session theme', () => {
    const denied = () => { throw new Error('denied'); };
    assert.equal(loadPageTheme(denied, 'dark'), 'dark');
    assert.equal(savePageTheme(denied, 'dark'), false);
});
test('page-theme listeners respect application lifetime and report storage failure once', () => {
    const root = { dataset: { pageTheme: 'dark' } };
    const buttons = PAGE_THEMES.map(pageTheme => new Button({ pageTheme }));
    const window = { get localStorage() { throw new Error('denied'); } };
    const document = { documentElement: root, defaultView: window, querySelectorAll: () => buttons };
    const lifetime = new AbortController(); let warnings = 0;
    bindPageThemes(document, { signal: lifetime.signal, onStorageFailure: () => warnings++ });
    assert.equal(root.dataset.pageTheme, 'dark');
    buttons[2].dispatchEvent(new Event('click')); assert.equal(root.dataset.pageTheme, 'solarised');
    buttons[0].dispatchEvent(new Event('click')); assert.equal(root.dataset.pageTheme, 'light');
    assert.equal(warnings, 1);
    lifetime.abort(); buttons[1].dispatchEvent(new Event('click'));
    assert.equal(root.dataset.pageTheme, 'light');
});
test('step and page-theme template controls are native labelled buttons, not menus', async () => {
    const html = await readFile(new URL('../../src/index.html', import.meta.url), 'utf8');
    assert.doesNotMatch(html, /<select[^>]+id="motionStep"/);
    assert.match(html, /id="motionStep"[^>]+role="group"[^>]+aria-labelledby="motionStepLabel"/);
    assert.equal((html.match(/<button[^>]+data-step=/g) || []).length, 4);
    for (const step of MOTION_STEPS) assert.ok(html.includes(`data-step="${step}"`));
    for (const theme of PAGE_THEMES) assert.match(html, new RegExp(`<button[^>]+data-page-theme="${theme}"[^>]+aria-pressed=`));
});

const themeCss = await readFile(new URL('../../src/styles/page-themes.css', import.meta.url), 'utf8');
function tokens(selector) {
    const block = themeCss.slice(themeCss.indexOf(selector)).match(/\{([^}]+)\}/)[1];
    return Object.fromEntries([...block.matchAll(/--ui-([\w-]+):\s*(#[0-9a-f]{6});/g)].map(m => [m[1], m[2]]));
}
function luminance(hex) {
    const rgb = hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
function contrast(a, b) {
    const v = [luminance(a), luminance(b)].sort((a, b) => a - b);
    return (v[1] + .05) / (v[0] + .05);
}
for (const theme of PAGE_THEMES) {
    test(`page theme ${theme}: ordinary, muted and state text maintain 4.5:1 contrast`, () => {
        const v = tokens(theme === 'light' ? ':root {' : `:root[data-page-theme="${theme}"]`);
        for (const [ink, bg] of [['ink','bg'], ['muted','panel'], ['muted','card'], ['ink','control'], ['ink','code'], ['ink','motion-bottom'], ['on-primary','primary'], ['selected-ink','selected'], ['danger','panel'], ['success','panel'], ['warning-ink','warning']])
            assert.ok(contrast(v[ink], v[bg]) >= 4.5, `${ink} on ${bg}: ${contrast(v[ink], v[bg])}`);
        assert.ok(contrast(v.focus, v.panel) >= 3);
    });
}
test('page stylesheet cannot alter instrument materials or graduation geometry', () => {
    assert.doesNotMatch(themeCss, /--(?:paper|scale-ink|inverse-ink|number-size|row-h|label-w)\s*:/);
    assert.doesNotMatch(themeCss, /\.(?:tick|scale-row|rule-canvas|rule-shell)\b/);
});
