/** Worked answers use exponential definitions and elementary inverse formulas,
 * not the lesson coordinates or the inverse of a runtime mapping. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { HYPERBOLIC_LESSONS } from '#tutorial/lessons/hyperbolic.js';
import { createTutorialProgramme } from '#tutorial/programme.js';
import { buildLibrary } from '#model/program.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { scaleReadings } from '#ui/readout-values.js';

const sinh = u => (Math.exp(u) - Math.exp(-u)) / 2;
const cosh = u => (Math.exp(u) + Math.exp(-u)) / 2;
const tanh = u => sinh(u) / cosh(u);
const asinh = x => Math.log(x + Math.sqrt(x * x + 1));
const acosh = x => Math.log(x + Math.sqrt(x * x - 1));
const atanh = x => Math.log((1 + x) / (1 - x)) / 2;

const examples = [
    { id: 'hyperbolic-sine',
        demo: [{ SH1: .5, D: 10 * sinh(.5) }, { SH2: 1.5, D: sinh(1.5) }],
        practice: [{ SH1: .4, D: 10 * sinh(.4) }, { SH2: 1.2, D: sinh(1.2) }] },
    { id: 'hyperbolic-cosine',
        demo: [{ CH: .5, D: cosh(.5) }, { CH: 1.5, D: cosh(1.5) }, { CH: 0, D: 1 }],
        practice: [{ CH: 1, D: cosh(1) }, { CH: 2, D: cosh(2) }] },
    { id: 'hyperbolic-tangent',
        demo: [{ TH: .5, D: 10 * tanh(.5) }, { TH: 2, D: 10 * tanh(2) }, { TH: 3, D: 10 * tanh(3) }],
        practice: [{ TH: 1, D: 10 * tanh(1) }, { TH: 1.5, D: 10 * tanh(1.5) }] },
    { id: 'inverse-hyperbolic',
        demo: [{ SH2: asinh(2), D: 2 }, { CH: acosh(3), D: 3 }, { TH: atanh(.5), D: 5 }],
        practice: [{ SH2: asinh(3), D: 3 }, { CH: acosh(2), D: 2 }, { TH: atanh(.6), D: 6 }] },
    { id: 'catenary',
        demo: [{ C: 3, D: 3 }, { C: 2, D: 3 }, { C: 1, D: 1.5 },
            { CH: 1.5, D: cosh(1.5) }, { C: 1, D: cosh(1.5) },
            { C: 2, D: 2 * cosh(1.5) }, { SH2: 1.5, D: sinh(1.5) }],
        practice: [{ C: 2.4, D: 2.4 }, { C: 2, D: 2.4 }, { C: 1, D: 1.2 },
            { CH: 1.2, D: cosh(1.2) }, { C: 1, D: cosh(1.2) },
            { C: 2, D: 2 * cosh(1.2) }, { SH2: 1.2, D: sinh(1.2) }] },
    { id: 'hyperbolic-identity',
        demo: [{ CH: 1, A: cosh(1) ** 2, D: cosh(1) },
            { SH2: 1, A: sinh(1) ** 2, D: sinh(1) }],
        practice: [{ CH: 1.2, A: cosh(1.2) ** 2, D: cosh(1.2) },
            { SH2: 1.2, A: sinh(1.2) ** 2, D: sinh(1.2) }] }
];

function near(actual, expected, context, relative = 3e-11) {
    const limit = expected === 0 ? 1e-12 : relative * Math.abs(expected);
    assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= limit,
        `${context}: expected ${expected}, received ${actual}`);
}

for (const example of examples) {
    test(`${example.id}: every narrated and practised reading agrees with exponential definitions`, () => {
        const lesson = HYPERBOLIC_LESSONS.find(item => item.id === example.id);
        assert.ok(lesson.problem && lesson.practice.problem);
        const programme = createTutorialProgramme(lesson.start, lesson.layout);
        const side = programme.sides.front, library = buildLibrary(programme);
        for (const [kind, steps, answers] of [
            ['demonstration', lesson.steps, example.demo], ['practice', lesson.practice.steps, example.practice]
        ]) {
            assert.equal(steps.length, answers.length, `${example.id}: all ${kind} steps covered`);
            for (const [index, step] of steps.entries()) {
                const answer = answers[index];
                if (kind === 'demonstration')
                    assert.deepEqual([...step.readings].sort(), Object.keys(answer).sort());
                for (const [id, expected] of Object.entries(answer)) {
                    const rail = ['topStator', 'slide', 'bottomStator'].find(key => side[key].includes(id));
                    assert.ok(rail, `${id} is present in ${lesson.layout}`);
                    const p = step.target.cursor - (rail === 'slide' ? step.target.slideOffset : 0);
                    const context = `${example.id} ${kind} ${index + 1} ${id}`;
                    near(makeRuntimeScale(library[id]).value(p), expected, context);
                    const display = scaleReadings(library[id], p, library);
                    assert.equal(display.outside, false, context);
                    assert.equal(display.texts.length, 1);
                    near(Number.parseFloat(display.texts[0]), expected, `${context} formatted`, 5e-4);
                    assert.doesNotMatch(display.texts[0], /°/, 'Hyperbolic arguments have no degree unit');
                }
            }
        }
    });
}

test('tanh finite endpoint remains strictly below one and below the physical D endpoint', () => {
    const lesson = HYPERBOLIC_LESSONS.find(item => item.id === 'hyperbolic-tangent');
    const point = lesson.steps.at(-1).target;
    assert.ok(point.cursor < 1);
    near(10 ** point.cursor / 10, tanh(3), 'tanh at the final engraved argument');
    const TH = makeRuntimeScale(buildLibrary(createTutorialProgramme(lesson.start, lesson.layout)).TH);
    near(point.cursor, TH.pMax, 'The demonstration reaches the real finite endpoint');
    const library = buildLibrary(createTutorialProgramme(lesson.start, lesson.layout));
    assert.equal(scaleReadings(library.TH, 1, library).outside, true);
    for (const step of lesson.practice.steps)
        assert.ok(TH.pMax - step.target.cursor > .004, 'Practice tolerance cannot cross the blank end');
});

test('the catenary carries the ratio and height on the actual rule before reading its slope', () => {
    const lesson = HYPERBOLIC_LESSONS.find(item => item.id === 'catenary');
    for (const [steps, a, x] of [[lesson.steps, 2, 3], [lesson.practice.steps, 2, 2.4]]) {
        near(10 ** steps[2].target.cursor, x / a, 'Dimensionless argument');
        near(10 ** steps[5].target.cursor, a * cosh(x / a), 'Vertical coordinate in metres');
        near(10 ** steps[6].target.cursor, sinh(x / a), 'Dimensionless slope');
        assert.equal(steps[0].target.cursor, steps[1].target.cursor, 'Cursor retains dividend while dividing');
        assert.equal(steps[3].target.cursor, steps[4].target.cursor, 'Cursor retains cosh while multiplying');
    }
    assert.match(lesson.problem, /dy\/dx/);
    assert.match(lesson.steps[0].text, /lowest point at y = a/);
});

test('A squares the unscaled high-range functions before the explicitly mental subtraction', () => {
    const lesson = HYPERBOLIC_LESSONS.find(item => item.id === 'hyperbolic-identity');
    for (const [steps, u] of [[lesson.steps, 1], [lesson.practice.steps, 1.2]]) {
        const first = 10 ** (2 * steps[0].target.cursor), second = 10 ** (2 * steps[1].target.cursor);
        near(first, cosh(u) ** 2, 'cosh squared');
        near(second, sinh(u) ** 2, 'sinh squared');
        near(first - second, 1, 'cosh²u − sinh²u');
    }
    assert.match(lesson.problem, /subtract mentally/);
    assert.match(lesson.practice.problem, /mental subtraction/);
});
