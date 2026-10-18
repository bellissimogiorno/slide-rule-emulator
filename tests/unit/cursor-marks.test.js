import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { marksForScale, cursorMarkSegments, cursorCaptionSegments, cursorCapClasses, renderCursor, cursorGlassWidth, positionCursorMarks } from '#ui/cursor-marks.js';
import { cursorScaleReadings } from '#ui/readout-values.js';
import { renderReadout } from '#ui/readout.js';
import { parseProgramText, validateProgram } from '#model/validation.js';
import { deepClone, exportableState, mergeState, normalizeState } from '#model/program.js';
import { DEFAULT_STATE } from '#catalog/defaults.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { createScaleHistory } from '#model/scale-history.js';
import { moveScale } from '#model/scale-order.js';
import { close } from './helpers.js';

const marks = () => [{ id: 'left', label: 'Left', offset: -.1 },
    { id: 'power', label: '2.2; ×10²', offset: .2, scales: ['A', 'C'], labelTone: 'red' }];
const side = () => ({ topStator: ['A'], slide: ['C'], bottomStator: ['D'], cursorMarks: marks() });
const state = () => ({ ...deepClone(DEFAULT_STATE), presetId: 'custom', activeSide: 'front',
    cursor: .5, slideOffset: 0, sides: { front: side() } });

test('cursor marks are scoped to scale identities and duplicate occurrences', () => {
    const face = side(); face.slide.push('A');
    assert.deepEqual(marksForScale(face, 'D').map(mark => mark.id), ['left']);
    assert.deepEqual(marksForScale(face, 'A').map(mark => mark.id), ['left', 'power']);
    const segments = cursorMarkSegments(face);
    assert.equal(segments.length, 2, 'adjacent selected rows make one continuous stroke');
    assert.deepEqual(segments.slice(1).map(({ rail, index, endRail, endIndex }) => [rail, index, endRail, endIndex]),
        [['topStator', 0, 'slide', 1]]);
    face.bottomStator.push('A');
    assert.equal(cursorMarkSegments(face).length, 3, 'an unrelated intervening row separates strokes');
    face.topStator = []; face.slide = [];
    face.bottomStator = ['D'];
    assert.deepEqual(cursorMarkSegments(face).map(({ mark }) => mark.id), ['left']);
});

test('marks export, reimport and normalize independently of preset attribution', () => {
    const original = state();
    const exported = exportableState(original);
    const parsed = parseProgramText(JSON.stringify(exported));
    const restored = mergeState(deepClone(DEFAULT_STATE), parsed);
    normalizeState(restored);
    assert.equal(restored.presetId, 'custom');
    assert.deepEqual(restored.sides.front.cursorMarks, original.sides.front.cursorMarks);
    exported.sides.front.cursorMarks[0].offset = .9;
    parsed.sides.front.cursorMarks[1].scales.push('D');
    assert.equal(original.sides.front.cursorMarks[0].offset, -.1);
    assert.deepEqual(restored.sides.front.cursorMarks[1].scales, ['A', 'C']);
});

test('reordering, removing and undoing rows retain calibrated metadata', () => {
    let data = state(); const history = createScaleHistory();
    history.remember(data, 'Move A', { rail: 'topStator', index: 0 });
    data.sides.front = moveScale(data.sides.front, { rail: 'topStator', index: 0 }, { rail: 'slide', index: 1 });
    assert.deepEqual(data.sides.front.cursorMarks, marks());
    const moved = cursorMarkSegments(data.sides.front).find(segment => segment.mark.id === 'power');
    assert.equal(moved.rail, 'slide'); assert.equal(moved.endIndex, 1);
    data.sides.front.slide = [];
    validateProgram(data); // Missing rows do not invalidate a still-known scale.
    data = history.undo(data).state;
    assert.deepEqual(data.sides.front, side());
});

test('cursor mark validation accepts zero offsets and optional caption tone', () => {
    const data = state(); data.sides.front.cursorMarks[0].offset = 0;
    assert.doesNotThrow(() => validateProgram(data));
    data.sides.front.cursorMarks = [];
    assert.doesNotThrow(() => validateProgram(data));
});

for (const [name, value] of [
    ['non-array', {}], ['null mark', [null]], ['missing label', [{ id: 'x', offset: 0 }]],
    ['empty label', [{ id: 'x', label: ' ', offset: 0 }]],
    ['duplicate ID', [marks()[0], marks()[0]]],
    ['unknown offset units', [{ ...marks()[0], pixels: 10 }]],
    ['text offset', [{ ...marks()[0], offset: '.1' }]],
    ['non-finite offset', [{ ...marks()[0], offset: Infinity }]],
    ['out of range', [{ ...marks()[0], offset: 1.01 }]],
    ['empty scope', [{ ...marks()[0], scales: [] }]],
    ['unknown scale', [{ ...marks()[0], scales: ['missing'] }]],
    ['duplicate scope', [{ ...marks()[0], scales: ['D', 'D'] }]],
    ['unknown caption tone', [{ ...marks()[0], labelTone: 'blue' }]],
    ['too many marks', Array.from({ length: 17 }, (_, i) => ({ ...marks()[0], id: 'm' + i }))]
]) test(`cursor mark validation rejects ${name}`, () => {
    const data = state(); data.sides.front.cursorMarks = value;
    assert.throws(() => validateProgram(data));
});

test('schema describes the same cursor metadata constraints', () => {
    const schema = JSON.parse(readFileSync(new URL('../../schema/program.schema.json', import.meta.url)));
    const marksSchema = schema.properties.sides.additionalProperties.properties.cursorMarks;
    assert.equal(marksSchema.maxItems, 16);
    assert.deepEqual(marksSchema.items.required, ['id', 'label', 'offset']);
    assert.equal(marksSchema.items.additionalProperties, false);
    assert.deepEqual(marksSchema.items.properties.offset, { type: 'number', minimum: -1, maximum: 1 });
    assert.equal(marksSchema.items.properties.scales.uniqueItems, true);
});

test('auxiliary readouts apply the same physical offset to stator and translated slide', () => {
    const mark = [{ id: 'm', label: 'Right', offset: .1 }];
    const stator = cursorScaleReadings(BUILTIN_SCALES.D, .5, BUILTIN_SCALES, mark, .5);
    const slide = cursorScaleReadings(BUILTIN_SCALES.C, .3, BUILTIN_SCALES, mark, .5);
    assert.deepEqual(stator.texts, ['Main: 3.16228', 'Right: 3.98107']);
    assert.deepEqual(slide.texts, ['Main: 1.99526', 'Right: 2.51189']);
    assert.equal(slide.outside, false);
});

test('off-track marks are never clamped or read from invisible slide extensions', () => {
    const mark = [{ id: 'm', label: 'Right', offset: .2 }];
    const reading = cursorScaleReadings(BUILTIN_SCALES.C, .3, BUILTIN_SCALES, mark, .9);
    assert.deepEqual(reading.texts, ['Main: 1.99526', 'Right: off scale']);
    const reverse = cursorScaleReadings(BUILTIN_SCALES.C, -.05, BUILTIN_SCALES, mark, .3);
    assert.equal(reverse.outside, false, 'an auxiliary reading can remain valid when the main one is off scale');
    assert.deepEqual(reverse.texts, ['Main: off scale', 'Right: 1.41254']);
});

test('readout captions remain scoped, escaped and explicit about the main hairline', () => {
    const data = state(); data.sides.front.cursorMarks = [{ id: 'm', label: '<pi>', offset: .1, scales: ['C'] }];
    const html = renderReadout(data, BUILTIN_SCALES);
    assert.equal((html.match(/Main:/g) || []).length, 1);
    assert.match(html, /&lt;pi&gt;: 3.98107/);
    assert.doesNotMatch(html, /<pi>/);
});

test('cursor markup uses real scoped lines, stacked captions and a transparent input window', () => {
    const face = side(); face.cursorMarks[0].label = '<left>';
    const html = renderCursor(face, 'cursor');
    assert.match(html, /class="cursor-window"/);
    assert.equal((html.match(/class="cursor-mark-line"/g) || []).length, 2);
    assert.match(html, /data-cursor-end-rail="slide" data-cursor-end-row="0"/);
    assert.match(html, /<span>×10²<\/span><span>2.2<\/span>/);
    assert.match(html, /red-caption/);
    assert.match(html, /&lt;left&gt;/);
    assert.doesNotMatch(html, /<left>/);
    assert.equal(renderCursor({ ...side(), cursorMarks: [] }, 'cursor'), '<div id="cursor" class="cursor"></div>');
    face.slide = []; face.bottomStator = ['C']; face.cursorMarks[1].scales = ['C'];
    assert.match(renderCursor(face, 'cursor'), /data-cursor-rail="bottomStator"[\s\S]*?<span>2.2<\/span><span>×10²<\/span>/);
});

test('calibrated glass width scales with the track rather than a fixed pixel gap', () => {
    assert.equal(cursorGlassWidth([], 1000), 34);
    assert.equal(cursorGlassWidth([-.2, .1], 500), 228);
    assert.equal(cursorGlassWidth([-.2, .1], 1000), 428);
});

test('scoped mark placement uses row geometry in local units at fractional page zoom', () => {
    const toggles = new Map();
    const mark = { dataset: { cursorOffset: '.2', cursorRail: 'slide', cursorRow: '0' }, style: {},
        classList: { toggle: (name, value) => toggles.set(name, value) } };
    const window = { style: {}, classList: { contains: name => name === 'cursor-window' } };
    const cursor = { style: {}, parentElement: window, querySelectorAll: selector => selector === '.cursor-mark' ? [mark] : [] };
    const row = { getBoundingClientRect: () => ({ top: 150, height: 37.5 }),
        classList: { contains: name => name === 'axis-bottom' } };
    const rail = { dataset: { rail: 'slide' }, querySelectorAll: () => [row] };
    const face = { offsetWidth: 1000, getBoundingClientRect: () => ({ top: 100, width: 1250 }),
        querySelector: () => cursor, querySelectorAll: () => [rail] };
    positionCursorMarks(face, { left: 58, width: 800 });
    assert.equal(window.style.left, '58px'); assert.equal(window.style.width, '800px');
    assert.equal(mark.style.top, '40px'); assert.equal(mark.style.height, '30px');
    close(parseFloat(mark.style.left) - parseFloat(cursor.style.width) / 2, .2 * 800);
    assert.equal(toggles.get('label-at-bottom'), true);
});

const capCaption = () => ({ id: 'bank', offset: -.1, lines: ['10²', '140'], zone: 'topCap', tone: 'red' });
const rowCaption = () => ({ id: 'gauge', offset: .1, lines: ['π', '2'], fraction: true,
    zone: 'row', scale: 'A', edge: 'top', align: 'end', tone: 'red' });

test('printed captions, line colour and hidden inline labels survive export without changing readouts', () => {
    const data = state(), originalReadout = renderReadout(data, BUILTIN_SCALES);
    data.sides.front.cursorMarks.forEach(mark => { mark.showLabel = false; });
    data.sides.front.cursorLineTone = 'red';
    data.sides.front.cursorCaptions = [capCaption(), rowCaption()];
    const restored = parseProgramText(JSON.stringify(exportableState(data)));
    assert.deepEqual(restored.sides.front, data.sides.front);
    assert.equal(renderReadout(data, BUILTIN_SCALES), originalReadout);
    assert.equal(cursorMarkSegments(data.sides.front).length, cursorMarkSegments(side()).length);
    const html = renderCursor(data.sides.front, 'cursor');
    assert.match(html, /cursor-lines-red/);
    assert.doesNotMatch(html, /class="cursor-mark-label"/);
    assert.match(html, /cursor-cap cursor-top-cap/);
    assert.match(html, /data-cursor-caption="bank"[\s\S]*?<span>10²<\/span><span>140<\/span>/);
    assert.match(html, /caption-fraction/);
    assert.equal(cursorCapClasses(data.sides.front), 'cursor-cap-top');
    data.sides.front.cursorCaptions.push({ ...capCaption(), id: 'lower', zone: 'bottomCap' });
    assert.equal(cursorCapClasses(data.sides.front), 'cursor-cap-top cursor-cap-bottom');
});

test('row captions follow each occurrence while cap captions remain independent of scale edits', () => {
    const face = side(); face.cursorCaptions = [capCaption(), rowCaption()];
    face.slide.push('A');
    assert.equal(cursorCaptionSegments(face).length, 3);
    face.topStator = []; face.slide = [];
    assert.deepEqual(cursorCaptionSegments(face).map(({ caption }) => caption.id), ['bank']);
    assert.equal(cursorMarkSegments(face).length, 1, 'captions do not manufacture additional lines');
});

test('cap-only annotations still share the main cursor and escape all printed text', () => {
    const face = { ...side(), cursorMarks: [], cursorCaptions: [{ ...capCaption(), lines: ['<x>', '&y'] }] };
    const html = renderCursor(face, 'cursor');
    assert.match(html, /class="cursor has-auxiliary"/);
    assert.match(html, /&lt;x&gt;/); assert.match(html, /&amp;y/);
    assert.doesNotMatch(html, /<x>|cursor-mark-line/);
});

test('an explicit hairline tone also applies to a plain single-line cursor', () => {
    for (const cursorLineTone of ['neutral', 'red'])
        assert.equal(renderCursor({ ...side(), cursorMarks: [], cursorLineTone }, 'cursor'),
            `<div id="cursor" class="cursor cursor-lines-${cursorLineTone}"></div>`);
});

test('continuous scoped marks and row captions use the complete zoom-corrected row span', () => {
    const mark = { dataset: { cursorOffset: '.1', cursorRail: 'topStator', cursorRow: '0',
        cursorEndRail: 'slide', cursorEndRow: '0' }, style: {}, classList: { toggle() {} } };
    const flags = new Map();
    const caption = { dataset: { cursorOffset: '0', cursorZone: 'row', cursorRail: 'slide',
        cursorRow: '0', cursorEdge: 'top' }, style: {}, classList: { toggle: (name, value) => flags.set(name, value) } };
    const window = { style: {}, classList: { contains: () => true } };
    const cursor = { style: {}, parentElement: window,
        querySelectorAll: selector => selector === '.cursor-mark' ? [mark] : [caption] };
    const row = (top, height) => ({ getBoundingClientRect: () => ({ top, height }), classList: { contains: () => false } });
    const rails = [{ dataset: { rail: 'topStator' }, querySelectorAll: () => [row(140, 30)] },
        { dataset: { rail: 'slide' }, querySelectorAll: () => [row(174, 30)] }];
    const face = { offsetWidth: 1000, getBoundingClientRect: () => ({ top: 100, width: 1250 }),
        querySelector: () => cursor, querySelectorAll: () => rails };
    positionCursorMarks(face, { left: 58, width: 800 });
    assert.equal(mark.style.top, '32px');
    assert.equal(mark.style.height, '51.2px', 'the continuous line bridges the rail boundary');
    assert.equal(caption.style.top, '59.2px');
    close(parseFloat(caption.style.left), parseFloat(cursor.style.width) / 2);
    assert.equal(flags.get('caption-before-row'), true);
});

for (const [name, caption] of [
    ['missing zone', { ...capCaption(), zone: undefined }],
    ['unknown zone', { ...capCaption(), zone: 'middle' }],
    ['empty lines', { ...capCaption(), lines: [] }],
    ['blank line', { ...capCaption(), lines: [' '] }],
    ['three lines', { ...capCaption(), lines: ['a', 'b', 'c'] }],
    ['non-finite offset', { ...capCaption(), offset: Infinity }],
    ['out of range offset', { ...capCaption(), offset: -1.1 }],
    ['unknown field', { ...capCaption(), pixels: 10 }],
    ['row without scale', { ...capCaption(), zone: 'row', edge: 'top' }],
    ['row without edge', { ...rowCaption(), edge: undefined }],
    ['missing referenced scale', { ...rowCaption(), scale: 'missing' }],
    ['cap with row anchor', { ...capCaption(), scale: 'A' }],
    ['unknown alignment', { ...capCaption(), align: 'outside' }],
    ['nonboolean fraction', { ...capCaption(), fraction: 'yes' }],
    ['one-line fraction', { ...capCaption(), lines: ['π'], fraction: true }]
]) test(`cursor caption validation rejects ${name}`, () => {
    const data = state(); data.sides.front.cursorCaptions = [caption];
    assert.throws(() => validateProgram(data));
});

test('cursor presentation rejects invalid arrays, duplicate IDs, tone and showLabel types', () => {
    for (const cursorCaptions of [{}, [capCaption(), capCaption()],
        Array.from({ length: 33 }, (_, index) => ({ ...capCaption(), id: 'c' + index }))]) {
        const data = state(); data.sides.front.cursorCaptions = cursorCaptions;
        assert.throws(() => validateProgram(data));
    }
    const data = state(); data.sides.front.cursorLineTone = 'blue';
    assert.throws(() => validateProgram(data));
    delete data.sides.front.cursorLineTone; data.sides.front.cursorMarks[0].showLabel = 'false';
    assert.throws(() => validateProgram(data));
});

test('cursor caption schema distinguishes row and cap anchors and bounds presentation data', () => {
    const schema = JSON.parse(readFileSync(new URL('../../schema/program.schema.json', import.meta.url)));
    const properties = schema.properties.sides.additionalProperties.properties;
    assert.equal(properties.cursorCaptions.maxItems, 32);
    assert.deepEqual(properties.cursorCaptions.items.required, ['id', 'offset', 'lines', 'zone']);
    assert.deepEqual(properties.cursorCaptions.items.allOf[0].then.required, ['scale', 'edge']);
    assert.equal(properties.cursorCaptions.items.properties.lines.maxItems, 2);
    assert.equal(properties.cursorMarks.items.properties.showLabel.type, 'boolean');
});
