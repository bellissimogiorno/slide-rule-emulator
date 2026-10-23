import test from 'node:test';
import assert from 'node:assert/strict';
import { createTutorialProgramme, TUTORIAL_LAYOUTS } from '#tutorial/programme.js';
import { TUTORIAL_LESSONS } from '#tutorial/lessons.js';
import { DEFAULT_STATE } from '#catalog/defaults.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { buildLibrary, exportableState } from '#model/program.js';
import { parseProgramText, validateProgram } from '#model/validation.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { renderRailRows } from '#ui/scale-markup.js';

const RAILS = {
    'cd': { topStator: [], slide: ['C'], bottomStator: ['D'] },
    'reciprocal': { topStator: [], slide: ['CI', 'C'], bottomStator: ['D'] },
    'squares': { topStator: ['A'], slide: ['C'], bottomStator: ['D'] },
    'cubes': { topStator: ['K'], slide: ['C'], bottomStator: ['D'] },
    'sine': { topStator: ['S'], slide: ['C'], bottomStator: ['D'] },
    'tangent': { topStator: ['T1'], slide: ['C'], bottomStator: ['D'] },
    'inverse': { topStator: ['DI'], slide: ['CI', 'C'], bottomStator: ['D'] },
    'folded': { topStator: ['DF'], slide: ['CF', 'C'], bottomStator: ['D'] },
    'folded-inverse': { topStator: ['DF', 'DIF'], slide: ['CIF'], bottomStator: ['D'] },
    'root-square': { topStator: ['R1', 'R2'], slide: ['C'], bottomStator: ['D'] },
    'root-cube': { topStator: ['Q1', 'Q2', 'Q3'], slide: ['C'], bottomStator: ['D'] },
    'ab': { topStator: ['A'], slide: ['B', 'C'], bottomStator: ['D'] },
    'faber-w': { topStator: ['W2'], slide: ['W2P', 'W1P'], bottomStator: ['W1', 'D'] },
    'tangent-high': { topStator: ['T2'], slide: ['C'], bottomStator: ['D'] },
    'small-angle': { topStator: ['ST'], slide: ['C'], bottomStator: ['D'] },
    'pythagorean': { topStator: ['P'], slide: ['C'], bottomStator: ['D'] },
    'hypotenuse': { topStator: ['H1', 'H2'], slide: ['C'], bottomStator: ['D'] },
    'thornton-ps': { topStator: ['PS'], slide: ['C'], bottomStator: ['D'] },
    'thornton-pt': { topStator: ['H1', 'H2'], slide: ['C'], bottomStator: ['D'] },
    'thornton-direct': { topStator: ['S', 'T1'], slide: ['SD', 'TD', 'C'], bottomStator: ['D'] },
    'thornton-inverse': { topStator: ['S', 'T1'], slide: ['ISD', 'ITD', 'C'], bottomStator: ['D'] },
    'logarithm': { topStator: ['L'], slide: ['C'], bottomStator: ['D'] },
    'natural-linear': { topStator: ['L', 'LN'], slide: ['C'], bottomStator: ['D'] },
    'folded-log-conversion': { topStator: ['DFM'], slide: ['CFM', 'C'], bottomStator: ['D'] },
    'loglog-banks': { topStator: ['LL0', 'LL1', 'LL2', 'LL3', 'LL4'], slide: ['C'], bottomStator: ['D'] },
    'loglog-main': { topStator: ['LL1', 'LL2', 'LL3'], slide: ['C'], bottomStator: ['D'] },
    'loglog-negative': { topStator: ['LL00', 'LL01', 'LL02', 'LL03', 'LL04'], slide: ['C'], bottomStator: ['D'] },
    'loglog-near': { topStator: ['LL0', 'LL1', 'LL2'], slide: ['C'], bottomStator: ['D'] },
    'geometry': { topStator: ['A'], slide: ['C'], bottomStator: ['D'] },
    'sinh': { topStator: ['SH1', 'SH2'], slide: ['C'], bottomStator: ['D'] },
    'cosh': { topStator: ['CH'], slide: ['C'], bottomStator: ['D'] },
    'tanh': { topStator: ['TH'], slide: ['C'], bottomStator: ['D'] },
    'hyperbolic': { topStator: ['SH1', 'SH2', 'CH', 'TH'], slide: ['C'], bottomStator: ['D'] },
    'catenary': { topStator: ['CH', 'SH2'], slide: ['C'], bottomStator: ['D'] },
    'hyperbolic-identity': { topStator: ['CH', 'SH2', 'A'], slide: ['C'], bottomStator: ['D'] },
};
const rows = programme => Object.fromEntries(['topStator', 'slide', 'bottomStator']
    .map(rail => [rail, programme.sides.front[rail]]));

test('every lesson starts with its valid, exportable single-face teaching programme', () => {
    for (const lesson of TUTORIAL_LESSONS) {
        const layout = lesson.layout || 'cd';
        const programme = createTutorialProgramme(lesson.start, layout);
        assert.equal(programme.activeSide, 'front');
        assert.equal(programme.viewMode, 'single');
        assert.equal(programme.presetId, 'custom');
        assert.deepEqual(Object.keys(programme.sides), ['front']);
        assert.deepEqual(rows(programme), RAILS[layout]);
        assert.equal(programme.theme, 'neutral');
        assert.equal(programme.density, 'comfortable');
        assert.equal(programme.cursorShape, 'minimal');
        assert.equal(programme.cursorColour, 'red');
        assert.equal(programme.slideWraparound, false);
        assert.equal(programme.compactScales, false);
        assert.equal(programme.showFormulas, true);
        assert.equal(programme.fullPrecision, false);
        assert.equal(programme.magnification, 1);
        assert.equal(programme.graduationMode, 'conventional');
        assert.equal(programme.logGraduations, 'standard');
        assert.equal(programme.adaptiveSpacing, 'balanced');
        assert.equal(programme.slideOffset, lesson.start.slideOffset);
        assert.equal(programme.cursor, lesson.start.cursor);
        assert.doesNotThrow(() => validateProgram(programme));
        assert.deepEqual(parseProgramText(JSON.stringify(exportableState(programme))),
            exportableState(programme));
    }
});

test('tutorial programme preserves exact targets, including the right-hand-index offset', () => {
    for (const lesson of TUTORIAL_LESSONS) {
        for (const { target } of [...lesson.steps, ...lesson.practice.steps]) {
            const programme = createTutorialProgramme(target, lesson.layout);
            assert.equal(programme.slideOffset, target.slideOffset);
            assert.equal(programme.cursor, target.cursor);
        }
    }
    for (const slideOffset of [-.9, .9]) {
        for (const cursor of [0, 1]) {
            const programme = createTutorialProgramme({ slideOffset, cursor });
            assert.equal(programme.slideOffset, slideOffset);
            assert.equal(programme.cursor, cursor);
        }
    }
});

test('tutorial programmes retain no custom scale override or shared mutable defaults', () => {
    const original = JSON.stringify(DEFAULT_STATE);
    const profiles = JSON.stringify(TUTORIAL_LAYOUTS);
    const start = { slideOffset: .25, cursor: .75 };
    for (const layout of Object.keys(RAILS)) {
        const first = createTutorialProgramme(start, layout), second = createTutorialProgramme(start, layout);
        assert.notStrictEqual(first, second);
        assert.notStrictEqual(first.sides, DEFAULT_STATE.sides);
        assert.notStrictEqual(first.customScales, DEFAULT_STATE.customScales);
        for (const rail of Object.keys(RAILS[layout])) {
            assert.notStrictEqual(first.sides.front[rail], second.sides.front[rail]);
            assert.notStrictEqual(first.sides.front[rail], TUTORIAL_LAYOUTS[layout][rail]);
        }
        assert.deepEqual(first.customScales, []);
        const library = buildLibrary(first);
        for (const id of Object.values(RAILS[layout]).flat()) assert.strictEqual(library[id], BUILTIN_SCALES[id]);
        first.sides.front.slide.push('A');
        first.customScales.push({ id: 'C', label: 'Override' });
        assert.deepEqual(rows(second), RAILS[layout]);
        assert.deepEqual(second.customScales, []);
        assert.equal(second.slideOffset, .25);
    }
    assert.equal(JSON.stringify(DEFAULT_STATE), original);
    assert.equal(JSON.stringify(TUTORIAL_LAYOUTS), profiles);
});

for (const [layout, expected] of Object.entries(RAILS)) {
    test(`${layout} teaching profile renders genuine catalogue scales in their specified rails`, () => {
        const programme = createTutorialProgramme({ slideOffset: 0, cursor: .5 }, layout);
        assert.deepEqual(rows(programme), expected);
        assert.ok(programme.sides.front.name && programme.sides.front.note);
        const library = buildLibrary(programme);
        const context = { library, width: 1000, fullPrecision: false, graduationMode: 'conventional',
            adaptiveSpacing: 'balanced', logGraduations: 'standard', displayScale: 1, minGap: 1.8 };
        for (const [rail, ids] of Object.entries(expected)) {
            for (const id of ids) assert.strictEqual(library[id], BUILTIN_SCALES[id]);
            const markup = renderRailRows(ids, rail, rail === 'slide', context);
            assert.deepEqual([...markup.matchAll(/data-scale="([^"]+)"/g)].map(match => match[1]), ids);
            assert.doesNotMatch(markup, /Missing scale definition/);
        }
    });
}

test('teaching profiles are immutable and unknown or inherited layout names fail', () => {
    assert.ok(Object.isFrozen(TUTORIAL_LAYOUTS));
    assert.deepEqual(Object.keys(TUTORIAL_LAYOUTS), Object.keys(RAILS));
    for (const profile of Object.values(TUTORIAL_LAYOUTS)) {
        assert.ok(Object.isFrozen(profile));
        for (const rail of ['topStator', 'slide', 'bottomStator']) assert.ok(Object.isFrozen(profile[rail]));
    }
    const start = { slideOffset: 0, cursor: .5 };
    assert.deepEqual(rows(createTutorialProgramme(start)), RAILS.cd);
    for (const layout of ['', 'unknown', 'T', 'TAN', 'T1', '__proto__', 'constructor', 'toString',
        null, [], {}, 0, false, new String('cd')])
        assert.throws(() => createTutorialProgramme(start, layout), /Unknown tutorial layout/);
});

test('trigonometric teaching rows use scalar degree mappings and preserve the factor of ten', () => {
    const sine = buildLibrary(createTutorialProgramme({ slideOffset: 0, cursor: 0 }, 'sine')).S;
    const tangent = buildLibrary(createTutorialProgramme({ slideOffset: 0, cursor: 0 }, 'tangent')).T1;
    assert.equal(sine.type, 'sin');
    assert.equal(tangent.type, 'tan');
    assert.equal(tangent.layers, undefined);
    assert.equal(tangent.max, 45);
    assert.ok(tangent.min > 5.7 && tangent.min < 5.72);
    const S = makeRuntimeScale(sine), T = makeRuntimeScale(tangent), D = makeRuntimeScale(BUILTIN_SCALES.D);
    const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10);
    close(D.value(S.pos(30)), 5);
    close(D.value(T.pos(45)), 10);
    close(T.value(0), Math.atan(.1) * 180 / Math.PI);
    close(T.value(1), 45);
    close(D.value(T.pos(30)) / 10, Math.tan(Math.PI / 6));
});

test('invalid coordinates fail before normalisation can coerce or clamp them', () => {
    const valid = { slideOffset: 0, cursor: .5 };
    for (const slideOffset of [-.9001, .9001, Infinity, -Infinity, NaN, '0', null, undefined])
        assert.throws(() => createTutorialProgramme({ ...valid, slideOffset }), RangeError);
    for (const cursor of [-.0001, 1.0001, Infinity, -Infinity, NaN, '0.5', null, undefined])
        assert.throws(() => createTutorialProgramme({ ...valid, cursor }), RangeError);
    assert.throws(() => createTutorialProgramme(), RangeError);
    assert.throws(() => createTutorialProgramme(null), RangeError);
});
