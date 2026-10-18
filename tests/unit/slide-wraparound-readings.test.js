import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_SCALES as scales } from '#catalog/scales.js';
import { DEFAULT_STATE } from '#catalog/defaults.js';
import { wrapSlidePosition, scaleReadings, cursorScaleReadings } from '#ui/readout-values.js';
import { renderReadout } from '#ui/readout.js';
import { createReadoutView } from '#ui/readout-view.js';

const read = (p, wraparound = true, def = scales.C) =>
    cursorScaleReadings(def, p, scales, [], .5, false, wraparound);
const state = () => ({ ...structuredClone(DEFAULT_STATE), activeSide: 'front', viewMode: 'single',
    cursor: .25, slideOffset: .5, sides: {
        front: { topStator: ['D'], slide: ['C'], bottomStator: ['DI'] }
    } });

test('slide copies repeat by one track length, preserving the original left and right indices', () => {
    assert.deepEqual(read(0).texts, ['1']);
    assert.deepEqual(read(1).texts, ['10']);
    assert.deepEqual(read(-.25).texts, ['5.623']);
    assert.deepEqual(read(1.25).texts, ['1.778']);
    assert.deepEqual(read(-2.25).texts, ['5.623']);
    assert.deepEqual(read(3.25).texts, ['1.778']);
    for (const p of [0, .125, .5, .875, 1]) assert.equal(wrapSlidePosition(p), p);
    assert.equal(read(-.25, false).outside, true);
    assert.equal(read(1.25, false).outside, true);
    assert.equal(cursorScaleReadings(scales.C, -.25, scales).outside, true, 'old calls remain unwrapped');
    assert.deepEqual(read(-Number.EPSILON).texts, ['1']);
    assert.deepEqual(read(1 + Number.EPSILON).texts, ['10']);
});

test('each auxiliary hairline wraps its own slide coordinate; off-track hairlines stay off scale', () => {
    const marks = [
        { label: 'Left index', offset: .25 },
        { label: 'Middle', offset: -.25 },
        { label: 'Outside right', offset: .6 },
        { label: 'Outside left', offset: -.6 }
    ];
    assert.deepEqual(cursorScaleReadings(scales.C, -.25, scales, marks, .5, false, true).texts,
        ['Main: 5.623', 'Left index: 1', 'Middle: 3.162', 'Outside right: off scale', 'Outside left: off scale']);
    assert.deepEqual(cursorScaleReadings(scales.C, .75, scales,
        [{ label: 'Right index', offset: .25 }, { label: 'Wrapped', offset: .5 }], .25, false, true).texts,
    ['Main: 5.623', 'Right index: 10', 'Wrapped: 1.778']);
});

test('blank regions of partial scales remain blank after wrapping', () => {
    const partial = { ...scales.C, pMin: .2, pMax: .8 };
    assert.equal(read(-.125, true, partial).outside, true, 'copy position .875 is outside the engraved domain');
    assert.equal(read(1.125, true, partial).outside, true, 'copy position .125 is outside the engraved domain');
    assert.deepEqual(read(-.25, true, partial).texts, ['5.623']);
    assert.deepEqual(read(1.25, true, partial).texts, ['1.778']);
});

test('root banks, composite, segmented, paired and chemical reference scales read the copied engraving', () => {
    for (const id of ['PICKETT_CBRT', 'T', 'CHEM_M1_XW', 'PN3LL0', 'CHEM_CH_AM']) {
        for (const p of [.125, .5, .875]) {
            const expected = scaleReadings(scales[id], p, scales);
            assert.deepEqual(read(p - 1, true, scales[id]), expected, `${id}: right-hand copy`);
            assert.deepEqual(read(p + 1, true, scales[id]), expected, `${id}: left-hand copy`);
        }
    }
    const paired = { ...scales.C, pairedProduct: 1 };
    assert.deepEqual(read(-.5, true, paired).texts, ['Primary: 3.162', 'Secondary: 0.3162']);
    assert.deepEqual(cursorScaleReadings(scales.C, -.5, scales, [], .5, true, true).texts, ['3.16228']);
});

function parseCards(html) {
    return [...html.matchAll(/<section class="readout-rail" data-readout-rail="([^"]+)"[\s\S]*?<\/section>/g)]
        .flatMap(([section, rail]) => [...section.matchAll(/<div class="(readout-card[^"]*)" data-readout-scale="([^"]+)"><span class="scale-id">[^<]*<\/span><div class="value[^"]*">([\s\S]*?)<\/div><\/div>/g)]
            .map(([, classes, scale, contents]) => ({ rail, classes, scale, contents })));
}

test('exported readouts wrap the slide alone and restore off-scale readings when disabled', () => {
    const data = state();
    const readings = () => Object.fromEntries(parseCards(renderReadout(data, scales)).map(card => [card.rail, card.contents]));
    assert.deepEqual(readings(), { topStator: '1.778', slide: 'off scale', bottomStator: '5.623' });
    data.slideWraparound = true;
    assert.deepEqual(readings(), { topStator: '1.778', slide: '5.623', bottomStator: '5.623' });
    data.slideOffset = -.875;
    assert.deepEqual(readings(), { topStator: '1.778', slide: '1.334', bottomStator: '5.623' });
    data.slideWraparound = false;
    assert.deepEqual(readings(), { topStator: '1.778', slide: 'off scale', bottomStator: '5.623' });
});

// Exercise retained DOM cards, including auxiliary spans and outside classes,
// so the live update path is checked separately from the exported HTML path.
function readingRoot() {
    let cards = [], builds = 0;
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
        get cards() { return cards; },
        set innerHTML(markup) {
            builds++;
            cards = parseCards(markup).map(({ rail, classes, scale, contents }) => {
                const names = new Set(classes.split(' ')), value = valueElement();
                const spans = [...contents.matchAll(/<span>([^<]*)<\/span>/g)];
                if (spans.length) spans.forEach(([, text]) => value.append(valueElement(text)));
                else value.textContent = contents;
                return { dataset: { readoutScale: scale }, value, rail,
                    classList: { contains: name => names.has(name), toggle: (name, on) => on ? names.add(name) : names.delete(name) },
                    querySelector: () => value,
                    closest: selector => ({ dataset: selector === '[data-readout-rail]' ? { readoutRail: rail } : { readoutSide: 'front' } })
                };
            });
        },
        querySelectorAll: () => cards,
        ownerDocument: { createElement: () => valueElement() }
    };
}

test('live motion and wraparound toggles agree with initial exported readouts without rebuilding cards', () => {
    const data = state(), root = readingRoot(), view = createReadoutView(root);
    data.sides.front.cursorMarks = [{ id: 'right', label: 'Right', offset: .25 }];
    const verify = () => {
        view.update(data, scales);
        const exported = parseCards(renderReadout(data, scales));
        root.cards.forEach((card, i) => {
            assert.equal(card.value.textContent, exported[i].contents.replace(/<\/?span>/g, ''));
            assert.equal(card.classList.contains('outside'), exported[i].classes.split(' ').includes('outside'));
        });
    };
    verify();
    data.slideWraparound = true;
    verify();
    assert.deepEqual(root.cards[1].value.children.map(child => child.textContent), ['Main: 5.623', 'Right: 1']);
    data.slideOffset = -.875;
    verify();
    data.fullPrecision = true;
    verify();
    data.cursor = 1;
    verify();
    assert.equal(root.cards[1].value.children.at(-1).textContent, 'Right: off scale');
    data.slideWraparound = false;
    verify();
    assert.equal(root.builds, 1, 'the setting and motion update the existing cards');
});
