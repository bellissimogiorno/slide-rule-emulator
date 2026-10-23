/** Independent answer checks for the logarithm course. Expected values come
 * from the stated operands, not the authored coordinates or inverse mappings.
 * Check both numerical scale values and the HTML readout the learner sees.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LOGARITHM_LESSONS } from '#tutorial/lessons/logarithms.js';
import { checkTutorialAlignment } from '#tutorial/lessons.js';
import { createTutorialProgramme } from '#tutorial/programme.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { buildLibrary } from '#model/program.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { scaleReadings } from '#ui/readout-values.js';
import { renderReadout } from '#ui/readout.js';

const ln2 = Math.log(2), ln3 = Math.log(3), ln4 = Math.log(4);
const ln16 = Math.log(16), ln20 = Math.log(20), ln27 = Math.log(27);
const growth = Math.log(1.002), practiceGrowth = Math.log(1.003);
const examples = [
    {
        id: 'common-log',
        demo: [{ L: Math.log10(2), D: 2 }, { L: Math.log10(5), D: 5 }, { L: .6, D: 10 ** .6 }],
        practice: [{ L: Math.log10(4), D: 4 }, { L: .8, D: 10 ** .8 }]
    },
    {
        id: 'll-banks',
        demo: [{ LL1: Math.exp(.02), D: 2 }, { LL2: Math.exp(.3), D: 3 },
            { LL3: Math.exp(4), D: 4 }, { LL4: Math.exp(20), D: 2 }, { LL0: Math.exp(.005), D: 5 }],
        practice: [{ LL1: Math.exp(.06), D: 6 }, { LL4: Math.exp(30), D: 3 }]
    },
    {
        id: 'exponential',
        demo: [{ LL2: Math.exp(.4), D: 4 }, { LL3: Math.exp(2), D: 2 }],
        practice: [{ LL2: Math.exp(.7), D: 7 }]
    },
    {
        id: 'natural-log',
        demo: [{ LL2: 2, D: 10 * ln2 }, { LL3: 10, D: Math.log(10) }],
        practice: [{ LL3: 3, D: ln3 }]
    },
    {
        id: 'positive-power',
        demo: [{ LL3: 3, D: ln3 }, { C: 1, LL3: 3, D: ln3 },
            { C: 2.5, LL3: 3 ** 2.5, D: 2.5 * ln3 }],
        practice: [{ LL3: 4, D: ln4 }, { C: 1, LL3: 4, D: ln4 },
            { C: 1.5, LL3: 4 ** 1.5, D: 1.5 * ln4 }]
    },
    {
        id: 'll-roots',
        demo: [{ LL3: 16, D: ln16 }, { C: 2, LL3: 16, D: ln16 },
            { C: 1, LL3: Math.sqrt(16), D: ln16 / 2 }],
        practice: [{ LL3: 27, D: ln27 }, { C: 3, LL3: 27, D: ln27 },
            { C: 1, LL3: Math.cbrt(27), D: ln27 / 3 }]
    },
    {
        id: 'negative-exponents',
        demo: [{ LL01: Math.exp(-.02), D: 2 }, { LL02: Math.exp(-.3), D: 3 },
            { LL03: Math.exp(-4), D: 4 }, { LL04: Math.exp(-20), D: 2 },
            { LL00: Math.exp(-.005), D: 5 }, { LL02: 1 / 2, D: 10 * ln2 },
            { C: 10, LL02: 1 / 2, D: 10 * ln2 }, { C: 3, LL03: 2 ** -3, D: 3 * ln2 }],
        practice: [{ LL03: 1 / 3, D: ln3 }, { C: 1, LL03: 1 / 3, D: ln3 },
            { C: 2, LL03: 3 ** -2, D: 2 * ln3 }]
    },
    {
        id: 'compound-growth',
        demo: [{ LL0: 1.002, D: 1000 * growth }, { C: 1, LL0: 1.002, D: 1000 * growth },
            { C: 4, LL0: 1.002 ** 4, D: 4000 * growth },
            { C: 1, LL0: 1.002, D: 1000 * growth }, { C: 10, LL0: 1.002, D: 1000 * growth },
            { C: 8, LL1: 1.002 ** 8, D: 800 * growth }],
        practice: [{ LL0: 1.003, D: 1000 * practiceGrowth },
            { C: 10, LL0: 1.003, D: 1000 * practiceGrowth },
            { C: 5, LL1: 1.003 ** 5, D: 500 * practiceGrowth }]
    },
    {
        id: 'solve-exponent',
        demo: [{ LL3: 4, D: ln4 }, { C: 1, LL3: 4, D: ln4 },
            { C: ln20 / ln4, LL3: 20, D: ln20 }],
        practice: [{ LL3: 3, D: ln3 }, { C: 1, LL3: 3, D: ln3 },
            { C: Math.log(15) / ln3, LL3: 15, D: Math.log(15) }]
    }
];

const lesson = id => {
    const result = LOGARITHM_LESSONS.find(item => item.id === id);
    assert.ok(result, `Missing logarithm lesson ${id}`);
    return result;
};
const relativeNear = (actual, expected, context, tolerance = 1e-11) => {
    assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <=
        tolerance * Math.max(1e-300, Math.abs(expected)),
    `${context}: expected ${expected}, received ${actual}`);
};

function instrument(item) {
    const programme = createTutorialProgramme(item.start, item.layout);
    const library = buildLibrary(programme);
    const side = programme.sides[programme.activeSide];
    const read = (point, id) => {
        const rails = ['topStator', 'slide', 'bottomStator'].filter(name => side[name].includes(id));
        assert.equal(rails.length, 1, `${item.id}: ${id} is physically present exactly once`);
        assert.ok(Object.hasOwn(BUILTIN_SCALES, id), `${item.id}: ${id} is a genuine built-in scale`);
        const p = point.cursor - (rails[0] === 'slide' ? point.slideOffset : 0);
        const runtime = makeRuntimeScale(library[id]);
        assert.ok(p >= runtime.pMin - 1e-10 && p <= runtime.pMax + 1e-10,
            `${item.id}: ${id} is inside its physical domain`);
        const display = scaleReadings(library[id], p, library);
        Object.assign(programme, point);
        const html = renderReadout(programme, library);
        const card = html.match(new RegExp(`data-readout-scale="${id}"><span[^>]*>[^<]*</span><div class="value">([^<]*)</div>`));
        assert.ok(card, `${item.id}: ${id} has a scalar readout card`);
        assert.equal(card[1], display.texts[0], `${item.id}: the rendered card uses the actual formatted value`);
        return { value: runtime.value(p), display };
    };
    return { read, side };
}

test('nine immutable logarithm lessons pose different explicit demonstration and practice problems', () => {
    assert.equal(LOGARITHM_LESSONS.length, 9);
    assert.deepEqual(LOGARITHM_LESSONS.map(item => item.id), examples.map(example => example.id));
    assert.ok(Object.isFrozen(LOGARITHM_LESSONS));
    for (const item of LOGARITHM_LESSONS) {
        assert.equal(item.sectionId, 'logarithms');
        assert.ok(Object.isFrozen(item) && Object.isFrozen(item.practice));
        for (const problem of [item.problem, item.practice.problem]) {
            assert.equal(typeof problem, 'string');
            assert.match(problem, /\d/);
            assert.match(problem, /[a-z]/i, 'The problem contains a symbol for an unanswered quantity');
        }
        assert.notEqual(item.problem, item.practice.problem);
        assert.notDeepEqual(item.steps.at(-1).target, item.practice.steps.at(-1).target);
        const { side } = instrument(item);
        assert.ok(side.topStator.length <= 5, `${item.id}: at most five fixed teaching rows`);
        assert.deepEqual(side.slide, ['C']);
        assert.deepEqual(side.bottomStator, ['D']);
    }
});

for (const example of examples) {
    test(`${example.id}: every target and formatted reading agrees with independent arithmetic`, () => {
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
                    relativeNear(result.value, expected, context);
                    assert.equal(result.display.outside, false, `${context}: the value is visible`);
                    assert.equal(result.display.texts.length, 1);
                    const displayed = Number(result.display.texts[0]);
                    relativeNear(displayed, expected, `${context}: useful-precision readout`, 5e-4);
                    if (id.startsWith('LL') && expected > 1 && expected < 2)
                        relativeNear(displayed - 1, expected - 1, `${context}: excess above one`, 5e-4);
                }
            }
        }
    });
}

test('every demonstration and practice instruction moves exactly one named component', () => {
    for (const item of LOGARITHM_LESSONS) {
        for (const [kind, initial, steps] of [
            ['demonstration', item.start, item.steps], ['practice', item.practice.start, item.practice.steps]
        ]) {
            let previous = initial;
            for (const step of steps) {
                const context = `${item.id} ${kind}: ${step.title}`;
                assert.ok(Object.isFrozen(step.target));
                assert.ok(step.target.cursor >= 0 && step.target.cursor <= 1, context);
                assert.ok(step.target.slideOffset >= -.9 && step.target.slideOffset <= .9, context);
                const changed = ['cursor', 'slideOffset'].filter(field => step.target[field] !== previous[field]);
                assert.equal(changed.length, 1, `${context}: exactly one component changes`);
                assert.equal(changed[0], step.focus === 'slide' ? 'slideOffset' : 'cursor', context);
                assert.ok(Math.abs(step.target[changed[0]] - previous[changed[0]]) > 1e-10, context);
                if (kind === 'practice') {
                    assert.ok(step.required.includes(changed[0]), `${context}: the changed coordinate is checked`);
                    assert.equal(checkTutorialAlignment(previous, step).passed, false,
                        `${context}: a movement is required before the stage can pass`);
                    assert.deepEqual(checkTutorialAlignment(step.target, step), { passed: true, misses: [] });
                    for (const field of step.required) {
                        const wrong = { ...step.target, [field]: step.target[field] + .02 };
                        assert.deepEqual(checkTutorialAlignment(wrong, step), { passed: false, misses: [field] },
                            `${context}: a wrong ${field} fails independently`);
                    }
                }
                previous = step.target;
            }
        }
    }
});

test('the narrated generic LL banks cover all ten natural-base ranges with their real numbering', () => {
    const banks = [
        ['LL0', .001, 1], ['LL1', .01, 1], ['LL2', .1, 1], ['LL3', 1, 1], ['LL4', 10, 1],
        ['LL00', .001, -1], ['LL01', .01, -1], ['LL02', .1, -1], ['LL03', 1, -1], ['LL04', 10, -1]
    ];
    const narrated = new Set(LOGARITHM_LESSONS.flatMap(item => item.steps.flatMap(step => step.readings)));
    for (const [id, coefficient, sign] of banks) {
        assert.ok(narrated.has(id), `${id} is explicitly taught, not merely displayed`);
        const def = BUILTIN_SCALES[id], runtime = makeRuntimeScale(def);
        assert.equal(def.type, 'loglog', `${id} is a natural-base LL scale`);
        for (const d of [1, 2, 5, 10])
            relativeNear(runtime.value(Math.log10(d)), Math.exp(sign * coefficient * d), `${id} at D ${d}`);
    }
    assert.deepEqual([...narrated].filter(id => /^(?:P10|KE|AR)/.test(id)), [],
        'Maker-specific numbering is not substituted for the generic banks');
});

test('tiny inverse-bank answers stay nonzero and retain the correct absolute decade', () => {
    for (const expected of [Math.exp(-20), Math.exp(-30), Math.exp(-100)]) {
        assert.throws(() => relativeNear(0, expected, 'zero must not pass for an inverse value'));
        assert.throws(() => relativeNear(expected * 10, expected, 'a wrong decade must not pass'));
        relativeNear(expected, expected, 'the true small result remains representable');
    }
    const item = lesson('negative-exponents'), { read } = instrument(item);
    const small = read(item.steps[3].target, 'LL04');
    relativeNear(small.value, Math.exp(-20), 'the narrated small inverse value');
    assert.equal(small.display.texts[0], '2.061e-9');
});

test('representative readouts preserve scientific magnitude and useful near-one digits', () => {
    for (const [id, kind, index, scale, expected] of [
        ['ll-banks', 'demo', 3, 'LL4', '4.852e8'],
        ['ll-banks', 'practice', 1, 'LL4', '1.069e13'],
        ['ll-banks', 'demo', 4, 'LL0', '1.005013'],
        ['negative-exponents', 'demo', 4, 'LL00', '0.995'],
        ['compound-growth', 'demo', 2, 'LL0', '1.008024'],
        ['compound-growth', 'demo', 5, 'LL1', '1.01611'],
        ['compound-growth', 'practice', 2, 'LL1', '1.01509']
    ]) {
        const item = lesson(id), steps = kind === 'demo' ? item.steps : item.practice.steps;
        assert.equal(instrument(item).read(steps[index].target, scale).display.texts[0], expected,
            `${id} ${kind} ${scale}`);
    }
});

test('right-index calculations select the new LL bank rather than rescaling an LL answer', () => {
    const inverse = lesson('negative-exponents'), inverseRule = instrument(inverse);
    const inverseStart = inverse.steps[6].target, inverseResult = inverse.steps[7].target;
    relativeNear(inverseRule.read(inverseStart, 'C').value, 10, 'inverse-power right index');
    relativeNear(inverseRule.read(inverseResult, 'LL03').value, 1 / 8, 'inverse power on the correct bank');
    assert.ok(Math.abs(inverseRule.read(inverseResult, 'LL02').value - 1 / 8) > .5,
        'Reading the previous inverse bank would give the wrong mathematical answer');
    const growthItem = lesson('compound-growth'), growthRule = instrument(growthItem);
    const growthResult = growthItem.steps.at(-1).target;
    relativeNear(growthRule.read(growthItem.steps[4].target, 'C').value, 10, 'growth right index');
    relativeNear(growthRule.read(growthResult, 'LL1').value, 1.002 ** 8, 'growth on the correct bank');
    assert.ok(Math.abs(growthRule.read(growthResult, 'LL0').value - 1.002 ** 8) > .01,
        'The previous positive bank also represents a different absolute value');
});
