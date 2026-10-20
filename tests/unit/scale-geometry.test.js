import test from 'node:test';
import assert from 'node:assert/strict';
import { createScaleGeometry } from '#ui/scale-geometry.js';
import { DEFAULT_LABEL_W } from '#version.js';

function fixture({ pane = null, label = '80px', legend = '20px', width = 1000, magnification = 1 } = {}) {
    const face = {
        offsetWidth: 1000,
        getBoundingClientRect: () => ({ left: 30, width: 1000 * magnification }),
        querySelector: selector => selector === '.tick-pane' ? pane : null
    };
    const canvas = {
        ownerDocument: { defaultView: { getComputedStyle: () => ({ getPropertyValue: property => property === '--label-w' ? label : legend }) } },
        clientWidth: width,
        getBoundingClientRect: () => ({ left: 30, width: width * magnification }),
        querySelector: selector => selector === '.rule-face-body' ? face : pane
    };
    let programme = { magnification };
    return { face, canvas, replaceProgramme: next => { programme = next; },
        ...createScaleGeometry({ canvas, getMagnification: () => programme.magnification }) };
}

test('measured panes expose local engraving coordinates and screen coordinates at each magnification', () => {
    for (const magnification of [.75, 1, 1.25, 1.5, 2]) {
        const pane = { getBoundingClientRect: () => ({ left: 30 + 80 * magnification, width: 900 * magnification }) };
        const f = fixture({ pane, magnification });
        assert.deepEqual(f.getScaleGeometry(), { left: 80, width: 900,
            screenLeft: 30 + 80 * magnification, screenWidth: 900 * magnification });
        assert.equal(f.getScalePixelWidth(), 900);
    }
});

test('an explicit second face uses its own pane rather than the first face geometry', () => {
    const f = fixture();
    const pane = { getBoundingClientRect: () => ({ left: 212, width: 1200 }) };
    const secondFace = {
        offsetWidth: 1000,
        getBoundingClientRect: () => ({ left: 100, width: 1500 }),
        querySelector: () => pane
    };
    const geometry = f.getScaleGeometry(secondFace);
    assert.equal(geometry.left, 112 / 1.5);
    assert.equal(geometry.width, 800);
    assert.equal(geometry.screenLeft, 212);
    assert.equal(geometry.screenWidth, 1200);
});

test('empty faces use CSS gutters and read magnification again after a programme replacement', () => {
    const f = fixture();
    assert.deepEqual(f.getScaleGeometry(), { left: 80, width: 900, screenLeft: 110, screenWidth: 900 });
    f.replaceProgramme({ magnification: 2 });
    assert.deepEqual(f.getScaleGeometry(), { left: 80, width: 900, screenLeft: 190, screenWidth: 1800 });
    assert.equal(f.getScalePixelWidth(), 900);
});

test('pre-render canvases and invalid CSS gutters retain the initial fallback geometry', () => {
    const f = fixture({ label: '', legend: 'auto' });
    f.canvas.querySelector = () => null;
    assert.deepEqual(f.getScaleGeometry(), { left: DEFAULT_LABEL_W, width: 1000 - DEFAULT_LABEL_W,
        screenLeft: 30 + DEFAULT_LABEL_W, screenWidth: 1000 - DEFAULT_LABEL_W });
    assert.equal(f.getScalePixelWidth(), 1000 - DEFAULT_LABEL_W);
    const narrow = fixture({ width: 50 });
    assert.deepEqual(narrow.getScaleGeometry(), { left: 80, width: 1, screenLeft: 110, screenWidth: 1 });
    assert.equal(narrow.getScalePixelWidth(), 1);
});
