/** Independent worked-answer oracle for the original twenty lessons. New
 * subject families have additional independently authored oracle files.
 * Expected numbers
 * come from ordinary arithmetic and geometry, never from authored coordinates
 * or from the inverse of the scale mapping under test. Both the numerical
 * runtime and the user-visible readout must agree at every teaching target.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TUTORIAL_SECTIONS } from '#tutorial/course.js';
import { TUTORIAL_LESSONS, checkTutorialAlignment } from '#tutorial/lessons.js';
import { createTutorialProgramme } from '#tutorial/programme.js';
import { buildLibrary } from '#model/program.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { scaleReadings } from '#ui/readout-values.js';

const examples = [
    { id: 'read', demo: [{ D: 2 }, { D: 3 }], practice: [{ D: 4 }] },
    { id: 'multiply', demo: [{ C: 2, D: 2 }, { C: 1, D: 2 }, { C: 3, D: 6 }],
        practice: [{ C: 1, D: 2 }, { C: 3, D: 6 }] },
    { id: 'divide', demo: [{ C: 6, D: 6 }, { C: 2, D: 6 }, { C: 1, D: 3 }],
        practice: [{ C: 6, D: 6 }, { C: 2, D: 6 }, { C: 1, D: 3 }] },
    { id: 'right-index', demo: [{ C: 4, D: 4 }, { C: 1, D: 4 }, { C: 10, D: 4 }, { C: 3, D: 1.2 }],
        practice: [{ C: 10, D: 4 }, { C: 3, D: 1.2 }] },
    { id: 'decimal-multiply', demo: [{ C: 2.4, D: 2.4 }, { C: 1, D: 2.4 }, { C: 3, D: 7.2 }],
        practice: [{ C: 1, D: 1.6 }, { C: 4, D: 6.4 }] },
    { id: 'small-product', demo: [{ C: 6, D: 6 }, { C: 10, D: 6 }, { C: 4, D: 2.4 }],
        practice: [{ C: 10, D: 7 }, { C: 4, D: 2.8 }] },
    { id: 'small-quotient', demo: [{ C: 2, D: 2 }, { C: 5, D: 2 }, { C: 10, D: 4 }],
        practice: [{ C: 3, D: 3 }, { C: 4, D: 3 }, { C: 10, D: 7.5 }] },
    { id: 'repeated-products', demo: [{ C: 2.5, D: 2.5 }, { C: 1, D: 2.5 }, { C: 2, D: 5 }, { C: 3, D: 7.5 }],
        practice: [{ C: 1, D: 1.5 }, { C: 4, D: 6 }, { C: 6, D: 9 }] },
    { id: 'proportion', demo: [{ C: 5, D: 5 }, { C: 3, D: 5 }, { C: 4, D: 20 / 3 }, { C: 5, D: 25 / 3 }],
        practice: [{ C: 4, D: 6 }, { C: 6, D: 9 }] },
    { id: 'inches-to-centimetres', demo: [{ C: 2.54, D: 2.54 }, { C: 1, D: 2.54 }, { C: 2, D: 5.08 }, { C: 3, D: 7.62 }],
        practice: [{ C: 1, D: 2.54 }, { C: 3.5, D: 8.89 }] },
    { id: 'chained-calculation', demo: [{ C: 2, D: 2 }, { C: 1, D: 2 }, { C: 3, D: 6 }, { C: 4, D: 6 }, { C: 1, D: 1.5 }],
        practice: [{ C: 1, D: 3 }, { C: 2, D: 6 }, { C: 5, D: 6 }, { C: 1, D: 1.2 }] },
    { id: 'reciprocals', demo: [{ CI: 5, D: 2 }, { CI: 2.5, D: 4 }], practice: [{ CI: 2, D: 5 }] },
    { id: 'squares', demo: [{ A: 4, D: 2 }, { A: 9, D: 3 }, { A: 16, D: 4 }],
        practice: [{ A: 25, D: 5 }, { A: 2.25, D: 1.5 }] },
    { id: 'square-roots', demo: [{ A: 25, D: 5 }, { A: 2.5, D: Math.sqrt(2.5) }],
        practice: [{ A: 36, D: 6 }, { A: 3.6, D: Math.sqrt(3.6) }] },
    { id: 'cubes', demo: [{ K: 8, D: 2 }, { K: 27, D: 3 }],
        practice: [{ K: 64, D: 4 }, { K: 3.375, D: 1.5 }] },
    { id: 'cube-roots', demo: [{ K: 125, D: 5 }, { K: 12.5, D: Math.cbrt(12.5) }, { K: 1.25, D: Math.cbrt(1.25) }],
        practice: [{ K: 64, D: 4 }, { K: 6.4, D: Math.cbrt(6.4) }] },
    { id: 'sine', demo: [{ S: 30, D: 5 }, { S: 60, D: 5 * Math.sqrt(3) }],
        practice: [{ S: 45, D: 5 * Math.SQRT2 }] },
    { id: 'cosine', demo: [{ S: 60, D: 5 * Math.sqrt(3) }, { S: 30, D: 5 }],
        practice: [{ S: 45, D: 5 * Math.SQRT2 }] },
    { id: 'tangent', demo: [{ T1: 30, D: 10 / Math.sqrt(3) }, { T1: 45, D: 10 }],
        practice: [{ T1: 20, D: 10 * Math.tan(20 * Math.PI / 180) }] },
    { id: 'right-triangle', demo: [{ S: 30, D: 5 }, { C: 1, D: 5 }, { C: 1.5, D: 7.5 }],
        practice: [{ S: 30, D: 5 }, { C: 1, D: 5 }, { C: 1.2, D: 6 }] }
];

// These IDs correspond to independently reviewed expected-answer fixtures in
// the named test files. Keep this coverage contract separate from the course
// assembly: adding a lesson must also add its independent mathematical oracle.
const additionalOracleLessons = {
    'tutorial-inverse-folded.test.js': [
        'fixed-reciprocals', 'inverse-arithmetic', 'inverse-chain', 'multiply-pi',
        'folded-multiply', 'folded-divide', 'folded-reciprocals'
    ],
    'tutorial-advanced-scales.test.js': [
        'root-square-even', 'root-square-odd', 'root-square-decades', 'root-cube-branches',
        'root-cube-decades', 'root-powers-ratios', 'ab-geometry', 'ab-multiply',
        'tangent-high', 'small-angle', 'pythagorean', 'hypotenuse'
    ],
    'tutorial-logarithms.test.js': [
        'common-log', 'll-banks', 'exponential', 'natural-log', 'positive-power',
        'll-roots', 'negative-exponents', 'compound-growth', 'solve-exponent'
    ],
    'tutorial-geometry.test.js': [
        'circumference', 'disc-area-radius', 'disc-area-diameter', 'disc-diameter-from-area',
        'rectangle-area', 'triangle-area', 'ellipse-area', 'sector-area',
        'cylinder-volume', 'sphere-volume'
    ],
    'tutorial-hyperbolic.test.js': [
        'hyperbolic-sine', 'hyperbolic-cosine', 'hyperbolic-tangent',
        'inverse-hyperbolic', 'catenary', 'hyperbolic-identity'
    ],
    'tutorial-faber-w.test.js': [
        'faber-w-read', 'faber-w-multiply', 'faber-w-cross-multiply',
        'faber-w-divide', 'faber-w-cross-divide', 'faber-w-geometric-mean'
    ],
    'tutorial-log-conversions.test.js': [
        'log-characteristic', 'extended-common-antilog', 'linear-natural-log',
        'linear-natural-antilog', 'change-log-base', 'folded-log-convert', 'folded-log-chain'
    ],
    'tutorial-thornton.test.js': [
        'thornton-ps-complement', 'thornton-ps-triangle', 'thornton-pt-low',
        'thornton-pt-high', 'thornton-direct-study', 'thornton-inverse-study'
    ],
    'tutorial-neat-tricks.test.js': [
        'split-total', 'parallel-resistance', 'golden-ratio',
        'pythagorean-triples', 'double-tangent', 'symmetric-percentages'
    ]
};

test('every course lesson has exactly one independently reviewed worked-answer oracle', async () => {
    // Inspect only the fixture ownership declarations, without importing test
    // modules and registering all their tests a second time. The mathematical
    // answers themselves are still exercised by their respective test files.
    for (const [filename, ids] of Object.entries(additionalOracleLessons)) {
        const source = await readFile(new URL(filename, import.meta.url), 'utf8');
        const fixture = source.match(/const examples\s*=\s*\[([\s\S]*?)\n\];/);
        assert.ok(fixture, `${filename}: independent expected-answer fixture exists`);
        const declared = [...fixture[1].matchAll(/\bid:\s*(['"])(.*?)\1/g)].map(match => match[2]);
        assert.deepEqual(declared, ids, `${filename}: every assigned lesson has an actual answer fixture`);
    }
    const covered = [...examples.map(example => example.id), ...Object.values(additionalOracleLessons).flat()];
    assert.equal(new Set(covered).size, covered.length, 'No duplicate mathematical oracle ownership');
    assert.deepEqual(TUTORIAL_LESSONS.map(item => item.id).sort(), covered.sort(),
        'No lesson may be omitted from the independent mathematical review');
});

const lesson = id => {
    const item = TUTORIAL_LESSONS.find(entry => entry.id === id);
    assert.ok(item, `Missing lesson ${id}`);
    return item;
};
const near = (actual, expected, context, tolerance = 1e-11) =>
    assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance * Math.max(1e-300, Math.abs(expected)),
        `${context}: expected ${expected}, received ${actual}`);

test('the answer oracle rejects a vanished or wrong-decade nonzero reading', () => {
    for (const expected of [Math.exp(-10), Math.exp(-100), 10 ** -250]) {
        assert.throws(() => near(0, expected, 'a nonzero value must not disappear'));
        assert.throws(() => near(expected * 10, expected, 'a decade error must not pass'));
        near(expected, expected, 'the exact tiny value remains representable');
    }
});

function instrument(item) {
    const programme = createTutorialProgramme(item.start, item.layout);
    const library = buildLibrary(programme);
    const side = programme.sides[programme.activeSide];
    const read = (point, id) => {
        const rail = ['topStator', 'slide', 'bottomStator'].find(name => side[name].includes(id));
        assert.ok(rail, `${item.id}: ${id} is physically present in ${item.layout}`);
        const p = point.cursor - (rail === 'slide' ? point.slideOffset : 0);
        const def = library[id];
        return { value: makeRuntimeScale(def).value(p), display: scaleReadings(def, p, library) };
    };
    return { read };
}

test('the original twenty answer oracles remain present and ordered within the expanded course', () => {
    const originalSections = ['basics', 'arithmetic', 'ratios', 'powers', 'trigonometry'];
    assert.deepEqual(TUTORIAL_SECTIONS.filter(section => originalSections.includes(section.id))
        .map(section => section.id), originalSections);
    const originalIds = examples.map(example => example.id);
    assert.deepEqual(TUTORIAL_LESSONS.filter(item => originalIds.includes(item.id)).map(item => item.id), originalIds);
});

for (const example of examples) {
    test(`${example.id}: every demonstrated and practised reading matches an independent worked answer`, () => {
        const item = lesson(example.id), { read } = instrument(item);
        for (const [kind, steps, answers] of [
            ['demonstration', item.steps, example.demo], ['practice', item.practice.steps, example.practice]
        ]) {
            assert.equal(steps.length, answers.length, `${item.id}: the oracle covers every ${kind} step`);
            for (let index = 0; index < steps.length; index++) {
                const step = steps[index], answer = answers[index];
                if (kind === 'demonstration')
                    assert.deepEqual([...step.readings].sort(), Object.keys(answer).sort(),
                        `${item.id}: the oracle covers every narrated scale`);
                for (const [id, expected] of Object.entries(answer)) {
                    const context = `${item.id} ${kind} ${index + 1} ${id}`;
                    const result = read(step.target, id);
                    near(result.value, expected, context);
                    assert.equal(result.display.outside, false, `${context}: visible on the rule`);
                    assert.equal(result.display.texts.length, 1);
                    near(Number.parseFloat(result.display.texts[0]), expected, `${context}: displayed number`, 5e-4);
                    if (['S', 'T1'].includes(id)) assert.match(result.display.texts[0], /°$/);
                }
            }
        }
    });
}

test('every practice requires a real first movement and rejects each wrong constrained coordinate', () => {
    for (const item of TUTORIAL_LESSONS) {
        assert.equal(checkTutorialAlignment(item.practice.start, item.practice.steps[0]).passed, false,
            `${item.id}: practice does not start with an accepted answer`);
        for (const step of item.practice.steps) {
            assert.equal(checkTutorialAlignment(step.target, step).passed, true);
            for (const field of step.required) {
                const changed = { ...step.target, [field]: step.target[field] + (step.target[field] > .8 ? -.02 : .02) };
                assert.deepEqual(checkTutorialAlignment(changed, step), { passed: false, misses: [field] },
                    `${item.id} ${step.title}: an independently wrong ${field} cannot pass`);
            }
        }
    }
});

test('fixed A, K, S and T₁ readings ignore slide movement; moving CI must remain aligned', () => {
    for (const id of ['squares', 'square-roots', 'cubes', 'cube-roots', 'sine', 'cosine', 'tangent']) {
        const item = lesson(id), { read } = instrument(item);
        for (const step of item.practice.steps) {
            assert.deepEqual(step.required, ['cursor'], `${id}: both comparison scales are fixed`);
            const shifted = { ...step.target, slideOffset: .2 };
            assert.equal(checkTutorialAlignment(shifted, step).passed, true);
            for (const scale of item.steps[0].readings)
                near(read(shifted, scale).value, read(step.target, scale).value, `${id}: ${scale} stays fixed`);
        }
    }
    const item = lesson('reciprocals'), step = item.practice.steps[0], { read } = instrument(item);
    assert.deepEqual([...step.required].sort(), ['cursor', 'slideOffset']);
    const shifted = { ...step.target, slideOffset: .1 };
    assert.deepEqual(checkTutorialAlignment(shifted, step), { passed: false, misses: ['slideOffset'] });
    near(read(shifted, 'D').value, 5, 'D remains at 5');
    assert.ok(Math.abs(read(shifted, 'CI').value / 10 - .2) > .04,
        'Moving CI really changes the reciprocal, even when the D cursor is correct');
});

test('one slide setting preserves each common factor, proportion and unit conversion', () => {
    for (const [id, indices, factor] of [
        ['repeated-products', [1, 2, 3], 2.5], ['proportion', [1, 2, 3], 5 / 3],
        ['inches-to-centimetres', [1, 2, 3], 2.54]
    ]) {
        const item = lesson(id), { read } = instrument(item);
        const first = item.steps[indices[0]].target;
        for (const index of indices) {
            const point = item.steps[index].target;
            assert.equal(point.slideOffset, first.slideOffset, `${id}: slide stays at the same setting`);
            near(read(point, 'D').value / read(point, 'C').value, factor, `${id}: constant ratio`);
        }
    }
    const item = lesson('chained-calculation'), { read } = instrument(item);
    assert.equal(item.steps[2].target.cursor, item.steps[3].target.cursor,
        'The cursor carries the intermediate product while the next divisor is aligned');
    near(read(item.steps.at(-1).target, 'D').value, (2 * 3) / 4, 'Chained demonstration');
    assert.equal(item.practice.steps[1].target.cursor, item.practice.steps[2].target.cursor);
    near(read(item.practice.steps.at(-1).target, 'D').value, (3 * 2) / 5, 'Chained practice');
});

test('decade changes and reversed CI readings produce the intended decimal quantities', () => {
    for (const [id, source, expected, multiplier] of [
        ['right-index', 'demo', 12, 10], ['small-product', 'demo', .24, .1],
        ['small-product', 'practice', .28, .1], ['small-quotient', 'demo', .4, .1],
        ['small-quotient', 'practice', .75, .1]
    ]) {
        const item = lesson(id), { read } = instrument(item);
        const steps = source === 'demo' ? item.steps : item.practice.steps;
        near(read(steps.at(-1).target, 'D').value * multiplier, expected, `${id} ${source}: decimal place`);
    }
    const reciprocal = lesson('reciprocals'), { read } = instrument(reciprocal);
    for (const [step, expected] of [[reciprocal.steps[0], .5], [reciprocal.steps[1], .25], [reciprocal.practice.steps[0], .2]])
        near(read(step.target, 'CI').value / 10, expected, 'CI reading divided by ten');
    const roots = lesson('square-roots'), squareInstrument = instrument(roots);
    near(squareInstrument.read(roots.steps[0].target, 'D').value / squareInstrument.read(roots.steps[1].target, 'D').value,
        Math.sqrt(10), 'Moving one A decade changes D by sqrt(10)');
    const cubes = lesson('cube-roots'), cubeInstrument = instrument(cubes);
    for (let index = 1; index < 3; index++)
        near(cubeInstrument.read(cubes.steps[index - 1].target, 'D').value / cubeInstrument.read(cubes.steps[index].target, 'D').value,
            Math.cbrt(10), 'Moving one K decade changes D by cbrt(10)');
});

test('degree-scale lookups feed the complete hypotenuse-to-height calculation', () => {
    for (const [id, angle, expected] of [['sine', 45, Math.SQRT1_2], ['cosine', 45, Math.SQRT1_2],
        ['tangent', 20, Math.tan(20 * Math.PI / 180)]]) {
        const item = lesson(id), { read } = instrument(item), point = item.practice.steps[0].target;
        near(read(point, id === 'tangent' ? 'T1' : 'S').value, angle, `${id}: angle in degrees`);
        near(read(point, 'D').value / 10, expected, `${id}: the decimal function value`);
    }
    const item = lesson('right-triangle'), { read } = instrument(item);
    assert.deepEqual(item.practice.start, { slideOffset: 0, cursor: 0 });
    assert.deepEqual(item.practice.steps.map(step => step.focus), ['cursor', 'slide', 'cursor']);
    assert.deepEqual(item.practice.steps[0].required, ['cursor']);
    near(read(item.practice.steps[0].target, 'S').value, 30, 'Practice starts by finding sin 30°');
    const sine = read(item.practice.steps[0].target, 'D').value / 10;
    near(read(item.steps.at(-1).target, 'D').value, 15 * Math.sin(Math.PI / 6), '15-unit ramp height');
    near(read(item.practice.steps.at(-1).target, 'D').value, 12 * sine, '12-unit ramp height');
});
