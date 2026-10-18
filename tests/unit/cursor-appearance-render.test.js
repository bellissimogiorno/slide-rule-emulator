import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRESETS } from '#catalog/presets.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { CURSOR_COLOURS, cursorAppearanceSide } from '#model/cursor-appearance.js';
import { cursorCapClasses, renderCursor } from '#ui/cursor-marks.js';
import { renderReadout } from '#ui/readout.js';
import { createReadoutView } from '#ui/readout-view.js';

const programme = sides => ({ activeSide: 'front', viewMode: 'both',
    cursor: .5, slideOffset: 0, cursorShape: 'instrument', cursorColour: 'instrument', sides });

test('minimal cursor removes every instrument housing and auxiliary reading on both faces, then restores them', () => {
    for (const [id, preset] of Object.entries(PRESETS)) {
        const state = programme(preset.sides);
        const original = renderReadout(state, BUILTIN_SCALES);
        const authored = JSON.stringify(preset.sides);
        state.cursorShape = 'minimal';
        const mainOnly = structuredClone(state);
        for (const side of Object.values(mainOnly.sides)) delete side.cursorMarks;
        mainOnly.cursorShape = 'instrument';
        assert.equal(renderReadout(state, BUILTIN_SCALES), renderReadout(mainOnly, BUILTIN_SCALES), id);
        for (const [face, side] of Object.entries(preset.sides)) {
            const projected = cursorAppearanceSide(side, state);
            const html = renderCursor(projected, 'cursor');
            assert.equal(cursorCapClasses(projected), '', `${id}/${face}: no reserved cap space`);
            assert.doesNotMatch(html, /cursor-window|has-auxiliary|cursor-cap|cursor-grip|data-cursor-|cursor-frame/, `${id}/${face}: original narrow cursor`);
            assert.match(html, /^<div id="cursor" class="cursor(?: cursor-lines-(?:red|neutral))?(?: cursor-colour-(?:red|black))?"><\/div>$/);
        }
        state.cursorShape = 'instrument';
        assert.equal(renderReadout(state, BUILTIN_SCALES), original, `${id}: restored readings`);
        assert.equal(JSON.stringify(preset.sides), authored, `${id}: authored cursor unchanged`);
    }
});

test('explicit colour changes only the cursor colour class, retaining instrument marks and captions', () => {
    for (const preset of Object.values(PRESETS)) for (const side of Object.values(preset.sides)) {
        const original = renderCursor(side, 'cursor');
        for (const cursorColour of Object.keys(CURSOR_COLOURS).filter(colour => colour !== 'instrument')) {
            const projected = cursorAppearanceSide(side, { cursorColour });
            const html = renderCursor(projected, 'cursor');
            assert.match(html, new RegExp(` cursor-colour-${cursorColour}`));
            assert.equal(html.replace(` cursor-colour-${cursorColour}`, ''), original);
        }
    }
});

test('changing shape preserves implicit red for a plain cursor and implicit black for an advanced cursor', () => {
    const plain = { topStator: [], slide: [], bottomStator: ['D'] };
    const advanced = { ...plain, cursorMarks: [{ id: 'right', label: 'Right', offset: .1 }] };
    assert.doesNotMatch(renderCursor(plain, 'cursor'), /has-auxiliary/);
    assert.match(renderCursor(advanced, 'cursor'), /has-auxiliary/);
    for (const [side, colour] of [[plain, 'red'], [advanced, 'black']]) {
        const html = renderCursor(cursorAppearanceSide(side, { cursorShape: 'minimal', cursorColour: 'instrument' }), 'cursor');
        assert.match(html, new RegExp(`cursor-colour-${colour}`), 'preserve original fallback in Minimal');
        assert.doesNotMatch(html, /has-auxiliary|data-cursor-mark/);
        assert.equal(side.cursorColour, undefined, 'inferred colour is display-only');
    }
});

test('Instrument retains authored frame, strokes, captions and readings for every hairline colour', () => {
    for (const [id, preset] of Object.entries(PRESETS)) {
        const state = programme(preset.sides);
        const original = renderReadout(state, BUILTIN_SCALES);
        for (const cursorColour of Object.keys(CURSOR_COLOURS)) {
            state.cursorColour = cursorColour;
            assert.equal(renderReadout(state, BUILTIN_SCALES), original, `${id}/${cursorColour}`);
            for (const side of Object.values(preset.sides)) {
                const projected = cursorAppearanceSide(side, state);
                const html = renderCursor(projected, 'cursor');
                if (side.cursorFrame) assert.match(html, new RegExp(`cursor-frame-${side.cursorFrame}`));
                else assert.doesNotMatch(html, /cursor-frame-/);
                assert.strictEqual(projected.cursorMarks, side.cursorMarks);
                assert.strictEqual(projected.cursorCaptions, side.cursorCaptions);
            }
        }
    }
});

test('hairline colours cannot leak into inline inscriptions and remain visible in forced colours', () => {
    const css = readFileSync(new URL('../../src/styles/cursor.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const declarations = selector => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
        .filter(([, selectors]) => selectors.trim().split(/,\s*/).includes(selector))
        .map(([, , body]) => body).join('\n');
    assert.match(declarations('.cursor-mark-label'), /color:\s*var\(--cursor-caption-color,\s*#28251f\)/);
    assert.match(declarations('.cursor-lines-red'), /--cursor-caption-color:\s*#9b3325/);
    assert.match(declarations('.cursor-lines-neutral'), /--cursor-caption-color:\s*#28251f/);
    for (const colour of ['red', 'black', 'blue', 'green']) {
        assert.match(declarations(`.cursor-colour-${colour}`), /--cursor-line-color:/);
        assert.doesNotMatch(declarations(`.cursor-colour-${colour}`), /--cursor-caption-color:/);
    }
    assert.match(declarations('.cursor-mark.red-caption .cursor-mark-label'), /color:\s*#9b1923/);
    assert.match(css, /@media \(forced-colors: active\)\s*\{\s*\.cursor::after, \.cursor\.has-auxiliary::after\s*\{\s*border-left-color:\s*CanvasText/);
});

// A small DOM double exercises the live view's retained card records rather
// than only the static HTML renderer. It implements the operations that the
// reading view uses, including replacement of multi-value spans on rebuild.
function readingRoot() {
    let html = '', cards = [], builds = 0;
    function valueElement(text = '') {
        return { children: [], ownText: text,
            get textContent() { return this.children.length ? this.children.map(child => child.textContent).join('') : this.ownText; },
            set textContent(value) { this.ownText = value; this.children = []; },
            get lastChild() { return this.children.at(-1); },
            append(child) { child.parent = this; this.children.push(child); },
            remove() { this.parent.children.splice(this.parent.children.indexOf(this), 1); }
        };
    }
    return {
        get builds() { return builds; },
        get values() { return cards.map(card => card.querySelector('.value')); },
        get innerHTML() { return html; },
        set innerHTML(markup) {
            html = markup; builds++;
            cards = [...markup.matchAll(/<div class="(readout-card[^"]*)" data-readout-scale="([^"]+)"><span class="scale-id">[^<]*<\/span><div class="value[^"]*">([\s\S]*?)<\/div><\/div>/g)].map(([, classes, scale, contents]) => {
                const names = new Set(classes.split(' ')), value = valueElement();
                const spans = [...contents.matchAll(/<span>([^<]*)<\/span>/g)];
                if (spans.length) spans.forEach(([, text]) => value.append(valueElement(text)));
                else value.textContent = contents;
                return { dataset: { readoutScale: scale },
                    classList: { contains: name => names.has(name), toggle: (name, on) => on ? names.add(name) : names.delete(name) },
                    querySelector: () => value,
                    closest: selector => ({ dataset: selector === '[data-readout-rail]' ? { readoutRail: 'bottomStator' } : { readoutSide: 'front' } })
                };
            });
        },
        querySelectorAll: () => cards,
        ownerDocument: { createElement: () => valueElement() }
    };
}

test('live readouts discard hidden auxiliary marks and restore them after minimal mode during motion', () => {
    const side = { topStator: [], slide: [], bottomStator: ['D'],
        cursorMarks: [{ id: 'right', label: 'Right', offset: .1 }] };
    const state = programme({ front: side }), root = readingRoot(), view = createReadoutView(root);
    const readings = () => root.values[0].children.map(child => child.textContent);
    view.update(state, BUILTIN_SCALES);
    assert.deepEqual(readings(), ['Main: 3.162', 'Right: 3.981']);
    state.cursor = .6;
    view.update(state, BUILTIN_SCALES);
    assert.deepEqual(readings(), ['Main: 3.981', 'Right: 5.012']);
    assert.equal(root.builds, 1, 'motion updates retained cards');
    state.cursorShape = 'minimal';
    view.update(state, BUILTIN_SCALES);
    assert.equal(root.values[0].textContent, '3.981');
    assert.equal(root.values[0].children.length, 0, 'no hidden auxiliary value spans');
    state.cursor = .7;
    view.update(state, BUILTIN_SCALES);
    assert.equal(root.values[0].textContent, '5.012');
    assert.equal(root.builds, 2);
    state.cursorShape = 'instrument';
    view.update(state, BUILTIN_SCALES);
    assert.deepEqual(readings(), ['Main: 5.012', 'Right: 6.31']);
    assert.equal(root.builds, 3, 'restoring marks invalidates the cached minimal cards');
    state.cursorColour = 'red'; state.cursor = 1;
    view.update(state, BUILTIN_SCALES);
    assert.deepEqual(readings(), ['Main: 10', 'Right: off scale']);
    assert.equal(root.builds, 3, 'hairline colour does not change numerical coordinates');
});
