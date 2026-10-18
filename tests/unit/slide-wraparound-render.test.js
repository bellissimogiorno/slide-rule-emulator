import test from 'node:test';
import assert from 'node:assert/strict';
import { updateSlideWraparound, refreshSlideWraparound } from '#ui/slide-wraparound.js';
import { visibleMarkBounds } from '#ui/mark-tooltips.js';
import { optimizeScaleLabels } from '#ui/labels.js';

// A small DOM fixture exercises element identity, deep-copy isolation and
// lifecycle transitions; actual geometry/paint is covered by the browser test.
class Element {
    constructor(classes = '', children = []) {
        this.classes = new Set(classes.split(' ').filter(Boolean));
        this.attributes = new Map(); this.dataset = {}; this.parentNode = null;
        this.style = { setProperty(name, value) { this[name] = value; } };
        this.children = []; this.textContent = '';
        this.classList = {
            add: (...names) => names.forEach(name => this.classes.add(name)),
            remove: (...names) => names.forEach(name => this.classes.delete(name)),
            contains: name => this.classes.has(name)
        };
        children.forEach(child => this.insertBefore(child, null));
    }
    querySelectorAll(selector) {
        const descendants = this.children.flatMap(child => [child, ...child.querySelectorAll('*')]);
        if (selector === '*') return descendants;
        if (selector === '.slide-mover:not(.slide-wraparound-copy)')
            return descendants.filter(child => child.classes.has('slide-mover') && !child.classes.has('slide-wraparound-copy'));
        return descendants.filter(child => child.classes.has(selector.slice(1)));
    }
    cloneNode(deep) {
        const copy = new Element([...this.classes].join(' '), deep ? this.children.map(child => child.cloneNode(true)) : []);
        copy.attributes = new Map(this.attributes); copy.dataset = { ...this.dataset };
        Object.assign(copy.style, this.style); copy.textContent = this.textContent;
        return copy;
    }
    insertBefore(child, next) {
        if (child.parentNode) child.remove();
        const index = next ? this.children.indexOf(next) : this.children.length;
        this.children.splice(index, 0, child); child.parentNode = this;
    }
    get nextSibling() { return this.parentNode?.children[this.parentNode.children.indexOf(this) + 1] || null; }
    remove() {
        if (!this.parentNode) return;
        this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1); this.parentNode = null;
    }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    hasAttribute(name) { return this.attributes.has(name); }
    removeAttribute(name) { this.attributes.delete(name); }
}

function fixture(classes = '') {
    const label = new Element('tick-label'); label.textContent = 'Polished label';
    const source = new Element('tick-mover slide-mover ' + classes, [label]);
    const stator = new Element('tick-mover', [new Element('tick-label')]);
    const gutter = new Element('scale-name');
    const pane = new Element('tick-pane', [source]);
    return { canvas: new Element('', [pane, stator, gutter]), source, label, stator, gutter, pane };
}

test('default-off motion leaves one original slide and does not move fixed content', () => {
    const { canvas, source, stator, gutter } = fixture();
    updateSlideWraparound(canvas, .35);
    assert.equal(source.style.transform, 'translateX(35.0000%)');
    assert.equal(canvas.querySelectorAll('.slide-wraparound-copy').length, 0);
    assert.equal(stator.style.transform, undefined); assert.equal(gutter.style.transform, undefined);
    assert.equal(source.classList.contains('slide-wraparound-tile'), false);
});

test('neighbouring periods remain exactly one graduated width apart across both motion directions', () => {
    const { canvas, source } = fixture();
    updateSlideWraparound(canvas, .35, true);
    const copies = canvas.querySelectorAll('.slide-wraparound-copy');
    assert.equal(copies.length, 2);
    for (const offset of [.35, -.45, 0, -.9, .9]) {
        updateSlideWraparound(canvas, offset, true);
        assert.equal(source.style.transform, `translateX(${(100 * offset).toFixed(4)}%)`);
        for (const copy of copies) {
            assert.ok(canvas.querySelectorAll('.slide-wraparound-copy').includes(copy), 'motion reuses the existing copy');
            assert.equal(copy.style.transform, `translateX(${(100 * (offset + Number(copy.dataset.wrapPeriod))).toFixed(4)}%)`);
            assert.equal(copy.classList.contains('slide-wraparound-tile'), true);
        }
    }
});

test('copies inherit polished labels and mark descriptions without duplicate DOM identities', () => {
    const { canvas, source, label } = fixture('root-stack-track');
    source.setAttribute('id', 'slide-source'); label.setAttribute('id', 'source-label');
    label.setAttribute('aria-describedby', 'markTooltip'); label.setAttribute('tabindex', '0');
    label.setAttribute('data-mark-tip', 'The gauge explanation'); label.setAttribute('title', '');
    updateSlideWraparound(canvas, -.2, true);
    const first = canvas.querySelectorAll('.slide-wraparound-copy')[0];
    label.classList.add('label-hidden'); label.style.transform = 'translateX(-12px)';
    label.textContent = 'Refined label';
    assert.equal(first.children[0].textContent, 'Polished label', 'source and copy are isolated');
    refreshSlideWraparound(canvas);
    for (const copy of canvas.querySelectorAll('.slide-wraparound-copy')) {
        assert.notEqual(copy, first);
        assert.equal(copy.getAttribute('aria-hidden'), 'true');
        assert.equal(copy.classList.contains('root-stack-track'), true);
        assert.equal(copy.children[0].textContent, 'Refined label');
        assert.equal(copy.children[0].classList.contains('label-hidden'), true);
        assert.equal(copy.children[0].style.transform, 'translateX(-12px)');
        assert.equal(copy.children[0].getAttribute('title'), 'The gauge explanation');
        for (const node of [copy, ...copy.querySelectorAll('*')])
            for (const name of ['id', 'tabindex', 'aria-describedby']) assert.equal(node.hasAttribute(name), false);
    }
    assert.equal(source.getAttribute('id'), 'slide-source');
});

test('disabling removes repetitions and clipping while preserving the current displacement', () => {
    const { canvas, source } = fixture();
    updateSlideWraparound(canvas, -.9, true);
    updateSlideWraparound(canvas, -.9, false);
    refreshSlideWraparound(canvas);
    assert.equal(canvas.querySelectorAll('.slide-wraparound-copy').length, 0);
    assert.equal(source.classList.contains('slide-wraparound-tile'), false);
    assert.equal(source.style.transform, 'translateX(-90.0000%)');
    updateSlideWraparound(canvas, -.9, true);
    assert.equal(canvas.querySelectorAll('.slide-wraparound-copy').length, 2);
});

test('replacing faces releases old copies and wraps every mover on both new faces', () => {
    const { canvas, source, pane } = fixture();
    updateSlideWraparound(canvas, .3, true);
    pane.remove();
    const types = ['syncro-track', '', 'root-stack-track', '', ''];
    const originals = types.map(classes => fixture(classes));
    originals.forEach(item => canvas.insertBefore(item.pane, null));
    updateSlideWraparound(canvas, -.3, true);
    assert.equal(pane.querySelectorAll('.slide-wraparound-copy').length, 0);
    assert.equal(source.classList.contains('slide-wraparound-tile'), false);
    assert.equal(canvas.querySelectorAll('.slide-wraparound-copy').length, 2 * originals.length);
    for (const item of originals) assert.equal(item.pane.querySelectorAll('.slide-wraparound-copy').length, 2);
});

test('label polishing visits original tracks and branches without measuring or changing repetitions', () => {
    let originalMeasurements = 0, originalDemotions = 0;
    const original = { closest: () => null,
        querySelectorAll: () => { originalMeasurements++; return []; } };
    const copy = { closest: () => ({}),
        querySelectorAll: () => assert.fail('the label solver must not measure a repeated track') };
    const originalTick = { closest: () => null, classList: { remove: () => originalDemotions++ } };
    const copiedTick = { closest: () => ({}), classList: { remove: () => assert.fail('polishing must not reset repeated ticks') } };
    const canvas = { querySelectorAll: selector => selector === '.unlabelled-major'
        ? [originalTick, copiedTick] : [original, copy] };
    optimizeScaleLabels(canvas, false);
    assert.equal(originalMeasurements, 3, 'ordinary labels plus both Syncro label lines');
    assert.equal(originalDemotions, 1);
});

const bounds = (left, right, top = 0, bottom = 20) => ({ left, right, top, bottom });
const mark = (box, pane, tile = null) => ({ getBoundingClientRect: () => box,
    closest: selector => {
        const rectangle = selector === '.tick-pane' ? pane : tile;
        return rectangle ? { getBoundingClientRect: () => rectangle } : null;
    } });

test('annotation hit areas exclude hidden periods and fixed end gutters', () => {
    const pane = bounds(100, 1100);
    assert.equal(visibleMarkBounds(mark(bounds(30, 60), pane, bounds(-750, 250))), null);
    assert.equal(visibleMarkBounds(mark(bounds(1110, 1140), pane, bounds(250, 1250))), null);
    assert.deepEqual(visibleMarkBounds(mark(bounds(90, 120), pane, bounds(-750, 250))), bounds(100, 120));
    assert.deepEqual(visibleMarkBounds(mark(bounds(240, 270), pane, bounds(-750, 250))), bounds(240, 250));
    assert.equal(visibleMarkBounds(mark(bounds(260, 290), pane, bounds(-750, 250))), null);
    assert.deepEqual(visibleMarkBounds(mark(bounds(400, 440), pane)), bounds(400, 440));
});
