import test from 'node:test';
import assert from 'node:assert/strict';
import { createLoupeDrawing } from '#ui/loupe-renderer.js';
import { createLoupeFixture, styleSnapshot } from '../helpers/loupe-dom.js';

const pixels = (node, name) => parseFloat(node.style.getPropertyValue(name));
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} differs from ${expected}`);

for (const zoom of [.75, 1, 1.25, 1.5, 2]) {
    test(`real loupe painter retains independently measured geometry and final-size text at ${zoom}x`, () => {
        const fixture = createLoupeFixture({ zoom });
        const drawing = createLoupeDrawing(fixture.face);
        const factor = zoom * 2.5;
        assert.deepEqual(drawing.size, { width: 800, height: 240 });
        near(pixels(drawing.element, 'width'), 800 * factor);
        near(pixels(drawing.element, 'height'), 240 * factor);
        const tick = drawing.element.querySelectorAll('.tick')[0];
        near(pixels(tick, 'width'), factor);
        near(pixels(tick, 'height'), 15 * factor);
        near(pixels(tick, 'left'), 0);
        near(pixels(tick, 'top'), 25 * factor);
        assert.equal(tick.style.getPropertyValue('background-color'), 'rgb(165, 28, 40)');
        assert.equal(tick.style.getPropertyValue('forced-color-adjust'), 'none');
        const baseline = drawing.element.querySelectorAll('.baseline')[0];
        near(pixels(baseline, 'width'), 720 * factor);
        near(pixels(baseline, 'height'), factor);
        assert.equal(baseline.style.getPropertyValue('background-color'), 'rgb(14, 44, 65)');
        const label = drawing.element.querySelectorAll('.tick-label')[0];
        near(pixels(label, 'font-size'), 11 * factor);
        near(pixels(label, 'letter-spacing'), .2 * factor);
        const text = label.children[0];
        assert.equal(text.textContent, '1.25');
        near(pixels(text, 'font-size'), 11 * factor);
        near(pixels(text, 'line-height'), 14 * factor);
        near(pixels(text, 'left'), 0);
        near(pixels(text, 'top'), 0);
        assert.equal(text.style.getPropertyValue('font-family'), '"Fixture; Narrow", sans-serif', 'bulk CSS must preserve semicolons inside quoted values');
        assert.equal(text.style.getPropertyValue('text-underline-offset'), factor + 'px');
        for (const node of [drawing.element, ...drawing.element.querySelectorAll('*')]) {
            for (const item of node.style.values.values()) assert.equal(item.priority, 'important');
            assert.equal(node.style.getPropertyValue('transform') || 'none', 'none');
        }
    });
}

test('real painter retains hidden and omitted text, materialises cursor decoration and strips focus/popups', () => {
    const fixture = createLoupeFixture();
    const drawing = createLoupeDrawing(fixture.face);
    const hidden = drawing.element.querySelectorAll('.label-hidden')[0];
    assert.equal(hidden.style.getPropertyValue('visibility'), 'hidden');
    assert.equal(hidden.childNodes.length, 0, 'suppressed text cannot be recreated visibly');
    const omitted = drawing.element.querySelectorAll('.omitted')[0];
    assert.equal(omitted.style.getPropertyValue('display'), 'none');
    assert.equal(omitted.childNodes.length, 0);
    const cursor = drawing.element.querySelectorAll('.cursor')[0];
    const before = cursor.children.find(node => node.dataset.loupeDecoration === 'before');
    const after = cursor.children.find(node => node.dataset.loupeDecoration === 'after');
    near(pixels(before, 'left'), 4.5 * fixture.zoom * 2.5);
    near(pixels(before, 'width'), fixture.zoom * 2.5);
    near(pixels(before, 'height'), 240 * fixture.zoom * 2.5);
    assert.equal(before.style.getPropertyValue('background-color'), 'rgb(177, 27, 39)');
    assert.ok(after.style.getPropertyValue('box-shadow').includes('rgb(177, 27, 39)'));
    for (const node of [drawing.element, ...drawing.element.querySelectorAll('*')])
        for (const attribute of ['id', 'tabindex', 'title', 'aria-describedby', 'aria-labelledby'])
            assert.equal(node.getAttribute(attribute), null, attribute);
    assert.equal(fixture.face.getAttribute('id'), 'source-face', 'source DOM must be unchanged');
    assert.equal(fixture.firstTick.getAttribute('title'), 'Constant mark');
});

test('measuring real motion precedes every copy mutation and preserves fractional movement', () => {
    const fixture = createLoupeFixture();
    const drawing = createLoupeDrawing(fixture.face);
    const movingCopy = drawing.element.querySelectorAll('.slide-mover')[0];
    const cursorCopy = drawing.element.querySelectorAll('.cursor')[0];
    const fixedBefore = styleSnapshot(drawing.element.querySelectorAll('.tick')[0]);
    const movingBefore = pixels(movingCopy, 'left'), cursorBefore = pixels(cursorCopy, 'left');
    fixture.shift(fixture.mover, 7.125);
    fixture.shift(fixture.cursor, -3.5);
    fixture.environment.reset();
    const positions = drawing.measureMotion();
    assert.ok(fixture.environment.operations.length > 0);
    assert.ok(fixture.environment.operations.every(event => event.kind === 'rectRead'));
    const readCount = fixture.environment.operations.length;
    drawing.place(15.75, -9.5, positions);
    assert.ok(fixture.environment.operations.slice(readCount).every(event => event.kind.startsWith('style')),
        'place must not read source layout after writing the copy');
    near(pixels(movingCopy, 'left'), movingBefore + 7.125 * 2.5);
    near(pixels(cursorCopy, 'left'), cursorBefore - 3.5 * 2.5);
    assert.deepEqual(styleSnapshot(drawing.element.querySelectorAll('.tick')[0]), fixedBefore);
    assert.equal(drawing.element.style.getPropertyValue('transform'), 'translate(15.75px, -9.5px)');
    assert.equal(drawing.element.style.getPropertyValue('left'), '0px');
    assert.equal(drawing.element.style.getPropertyValue('top'), '0px');
});

test('pointer-only positioning has constant work and stationary frames make no style mutations', () => {
    const counts = [];
    for (const strokes of [10, 5000]) {
        const fixture = createLoupeFixture({ strokes });
        const drawing = createLoupeDrawing(fixture.face);
        drawing.place(10, 20, drawing.measureMotion());
        fixture.environment.reset();
        drawing.place(11, 22);
        counts.push(fixture.environment.counts());
        assert.equal(fixture.environment.counts().rectRead, 0);
        assert.equal(fixture.environment.counts().computedStyleRead, 0);
        assert.equal(fixture.environment.counts().styleSetProperty, 1);
        fixture.environment.reset();
        drawing.place(11, 22, drawing.measureMotion());
        const stationary = fixture.environment.counts();
        assert.ok(stationary.rectRead > 0 && stationary.rectRead < 9, 'shared parents need only one measurement');
        assert.equal(stationary.styleSetProperty, 0);
        assert.equal(stationary.styleCssText, 0);
    }
    assert.deepEqual(counts[0], counts[1], 'pointer-only work must not grow with the number of ticks');
});

test('constructing dense native-size paint makes one complete style assignment per painted node', () => {
    const fixture = createLoupeFixture({ strokes: 5000 });
    const drawing = createLoupeDrawing(fixture.face);
    const counts = fixture.environment.counts();
    assert.equal(counts.styleSetProperty, 0);
    assert.equal(counts.styleCssText, 1 + drawing.element.querySelectorAll('*').length);
    assert.equal(drawing.element.querySelectorAll('.tick').length, 5000);
});
