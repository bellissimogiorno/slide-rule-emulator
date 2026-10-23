/** Independent arithmetic checks for dedicated roots and supplementary scales.
 * Answers use ordinary square/cube roots, trigonometry and triangle lengths;
 * they are not obtained by inverting the authored cursor coordinates. Every
 * narrated reading is checked against the real physical profile and readout.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { ADVANCED_POWER_LESSONS, ADVANCED_TRIG_LESSONS } from '#tutorial/lessons/advanced-scales.js';
import { createTutorialProgramme } from '#tutorial/programme.js';
import { buildLibrary } from '#model/program.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { formatValue } from '#core/format.js';
import { scaleReadings } from '#ui/readout-values.js';

const lessons = [...ADVANCED_POWER_LESSONS, ...ADVANCED_TRIG_LESSONS];
const radians = degrees => degrees * Math.PI / 180;
const examples = [
    { id: 'root-square-even',
        demo: [{ R1: Math.SQRT2, R2: Math.sqrt(20), D: 2 }, { R1: Math.sqrt(2.5), D: 2.5 }],
        practice: [{ R1: Math.sqrt(3.6), D: 3.6 }] },
    { id: 'root-square-odd', demo: [{ R2: Math.sqrt(20), D: 2 }, { R2: 5, D: 2.5 }],
        practice: [{ R2: 6, D: 3.6 }] },
    { id: 'root-square-decades', demo: [{ R1: Math.SQRT2, D: 2 }, { R1: Math.sqrt(2.5), D: 2.5 }],
        practice: [{ R2: 5, D: 2.5 }] },
    { id: 'root-cube-branches',
        demo: [{ Q1: Math.cbrt(2), Q2: Math.cbrt(20), Q3: Math.cbrt(200), D: 2 },
            { Q1: Math.cbrt(4), Q2: Math.cbrt(40), Q3: Math.cbrt(400), D: 4 }],
        practice: [{ Q1: Math.cbrt(3.2), Q2: Math.cbrt(32), Q3: Math.cbrt(320), D: 3.2 }] },
    { id: 'root-cube-decades', demo: [{ Q1: Math.cbrt(2), D: 2 }, { Q1: Math.cbrt(4), D: 4 }],
        practice: [{ Q3: Math.cbrt(400), D: 4 }] },
    { id: 'root-powers-ratios',
        demo: [{ R2: 6, D: 3.6 }, { R1: 3, D: 9 }, { C: 4, D: 9, R1: 3 },
            { C: 1, D: 9 / 4, R1: Math.sqrt(9 / 4) }],
        practice: [{ R2: 8, D: 6.4 }, { R1: Math.sqrt(8), D: 8 },
            { C: 2, D: 8, R1: Math.sqrt(8) }, { C: 1, D: 4, R1: 2 }] },
    { id: 'ab-geometry',
        demo: [{ A: 4, B: 4, C: 2, D: 2 }, { A: 4, B: (4 / 3) ** 2, C: 4 / 3, D: 2 },
            { A: 9, B: 4, C: 2, D: 3 }],
        practice: [{ A: 4, B: 1.6 ** 2, C: 1.6, D: 2 },
            { A: (15 / 4) ** 2, B: 9, C: 3, D: 15 / 4 }] },
    { id: 'ab-multiply', demo: [{ A: 4, B: 4 }, { A: 4, B: 1 }, { A: 36, B: 9 }],
        practice: [{ A: 16, B: 16 }, { A: 16, B: 1 }, { A: 64, B: 4 }] },
    { id: 'tangent-high', demo: [{ T2: 50, D: Math.tan(radians(50)) }, { T2: 60, D: Math.sqrt(3) }],
        practice: [{ T2: 70, D: Math.tan(radians(70)) }] },
    { id: 'small-angle', demo: [{ ST: 2, D: 100 * Math.sin(radians(2)) },
        { ST: 1, D: 100 * Math.sin(radians(1)) }],
        practice: [{ ST: 2.5, D: 100 * Math.sin(radians(2.5)) }] },
    { id: 'pythagorean', demo: [{ P: Math.sqrt(1 - .3 ** 2), D: 3 }, { P: 4 / 5, D: 6 }],
        practice: [{ P: 3 / 5, D: 8 }] },
    { id: 'hypotenuse', demo: [{ H1: 5 / 4, D: 15 / 2 }, { H2: 5 / 3, D: 4 / 3 }],
        practice: [{ H1: 13 / 12, D: 25 / 6 }, { H2: 13 / 5, D: 12 / 5 }] }
];

function near(actual, expected, context, tolerance = 1e-11) {
    assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
        `${context}: expected ${expected}, received ${actual}`);
}

function instrument(item) {
    const programme = createTutorialProgramme(item.start, item.layout);
    const library = buildLibrary(programme), side = programme.sides.front;
    const read = (point, id) => {
        const rail = ['topStator', 'slide', 'bottomStator'].find(name => side[name].includes(id));
        assert.ok(rail, `${item.id}: ${id} is physically present in ${item.layout}`);
        const p = point.cursor - (rail === 'slide' ? point.slideOffset : 0), def = library[id];
        assert.equal(def.layers, undefined, `${id}: the teaching row is a dedicated scalar scale`);
        const runtime = makeRuntimeScale(def);
        assert.ok(p >= runtime.pMin - 1e-10 && p <= runtime.pMax + 1e-10,
            `${item.id}: ${id} is inside the visible scale at ${p}`);
        return { value: runtime.value(p), display: scaleReadings(def, p, library), definition: def };
    };
    return { read };
}

test('the twelve advanced lessons form eight powers/root and four supplementary angle lessons', () => {
    assert.equal(ADVANCED_POWER_LESSONS.length, 8);
    assert.equal(ADVANCED_TRIG_LESSONS.length, 4);
    assert.deepEqual(lessons.map(item => item.id), examples.map(item => item.id));
    assert.equal(new Set(lessons.map(item => item.id)).size, 12);
    assert.ok(Object.isFrozen(ADVANCED_POWER_LESSONS));
    assert.ok(Object.isFrozen(ADVANCED_TRIG_LESSONS));
    for (const [items, section] of [[ADVANCED_POWER_LESSONS, 'powers'], [ADVANCED_TRIG_LESSONS, 'trigonometry']]) {
        for (const item of items) {
            assert.ok(Object.isFrozen(item));
            assert.equal(item.sectionId, section);
            assert.ok(item.problem.includes('?') && item.practice.problem.includes('?'));
            assert.notEqual(item.problem, item.practice.problem, `${item.id}: practice asks a different problem`);
        }
    }
});

for (const example of examples) {
    test(`${example.id}: every demo and practice reading agrees with independent mathematics`, () => {
        const item = lessons.find(entry => entry.id === example.id), { read } = instrument(item);
        for (const [kind, steps, expected] of [
            ['demo', item.steps, example.demo], ['practice', item.practice.steps, example.practice]
        ]) {
            assert.equal(steps.length, expected.length, `${item.id}: every ${kind} step has an oracle`);
            for (let index = 0; index < steps.length; index++) {
                const step = steps[index];
                assert.deepEqual([...step.readings].sort(), Object.keys(expected[index]).sort(),
                    `${item.id}: every declared ${kind} reading is checked`);
                for (const [id, answer] of Object.entries(expected[index])) {
                    const context = `${item.id} ${kind} ${index + 1} ${id}`;
                    const result = read(step.target, id);
                    near(result.value, answer, context);
                    assert.equal(result.display.outside, false, `${context}: visible readout`);
                    assert.deepEqual(result.display.texts, [formatValue(answer, result.definition)],
                        `${context}: the visible reading formats the independent answer`);
                    near(Number.parseFloat(result.display.texts[0]), answer, `${context}: rounded digits`, 5e-4);
                }
            }
        }
    });
}

test('every authored movement moves one component and practice starts unanswered', () => {
    for (const item of lessons) {
        for (const [kind, start, steps] of [
            ['demo', item.start, item.steps], ['practice', item.practice.start, item.practice.steps]
        ]) {
            let previous = start;
            for (const step of steps) {
                const changed = ['slideOffset', 'cursor'].filter(field => step.target[field] !== previous[field]);
                assert.equal(changed.length, 1, `${item.id} ${kind} ${step.title}: exactly one moving part`);
                assert.equal(changed[0], step.focus === 'slide' ? 'slideOffset' : 'cursor');
                assert.ok(step.target.slideOffset >= -.9 && step.target.slideOffset <= .9);
                assert.ok(step.target.cursor >= 0 && step.target.cursor <= 1);
                previous = step.target;
            }
        }
        const first = item.practice.steps[0];
        assert.ok(first.required.some(field => Math.abs(first.target[field] - item.practice.start[field]) > .004),
            `${item.id}: practice must require more than the accepted alignment tolerance`);
    }
});

test('square and cube branch answers use the correct external decade, including negative exponents', () => {
    for (const [id, kind, scale, external, expected] of [
        ['root-square-even', 'demo', 'R1', 1, Math.sqrt(2.5)],
        ['root-square-odd', 'demo', 'R2', 1, Math.sqrt(25)],
        ['root-square-decades', 'demo', 'R1', 10, Math.sqrt(250)],
        ['root-square-decades', 'practice', 'R2', .1, Math.sqrt(.25)],
        ['root-cube-decades', 'demo', 'Q1', 10, Math.cbrt(4000)],
        ['root-cube-decades', 'practice', 'Q3', .1, Math.cbrt(.4)]
    ]) {
        const item = lessons.find(entry => entry.id === id), { read } = instrument(item);
        const step = (kind === 'demo' ? item.steps : item.practice.steps).at(-1);
        near(read(step.target, scale).value * external, expected, `${id} ${kind}: reconstructed full answer`);
    }
    const item = lessons.find(entry => entry.id === 'root-cube-branches'), { read } = instrument(item);
    for (const [scale, radicand] of [['Q1', 4], ['Q2', 40], ['Q3', 400]])
        near(read(item.steps.at(-1).target, scale).value, Math.cbrt(radicand), `${scale}: own radicand decade`);
});

test('reversed R2 recovers ten times D, while the final R1 root reads the C/D quotient', () => {
    const item = lessons.find(entry => entry.id === 'root-powers-ratios'), { read } = instrument(item);
    for (const [steps, input, numerator, denominator] of [[item.steps, 6, 9, 4], [item.practice.steps, 8, 8, 2]]) {
        near(read(steps[0].target, 'D').value * 10, input ** 2, 'R2 reversed square');
        const last = steps.at(-1).target;
        near(read(last, 'C').value, 1, 'division index');
        near(read(last, 'D').value, numerator / denominator, 'ordinary quotient');
        near(read(last, 'R1').value, Math.sqrt(numerator / denominator), 'ordinary root of quotient');
    }
});

test('B follows moving C squared while A follows fixed D squared', () => {
    const item = lessons.find(entry => entry.id === 'ab-geometry'), { read } = instrument(item);
    const before = item.steps[0].target, shifted = item.steps[1].target;
    near(read(before, 'A').value, read(shifted, 'A').value, 'A does not slide');
    near(read(before, 'D').value, read(shifted, 'D').value, 'D does not slide');
    assert.notEqual(read(before, 'B').value, read(shifted, 'B').value);
    for (const point of [...item.steps, ...item.practice.steps].map(step => step.target)) {
        near(read(point, 'B').value, read(point, 'C').value ** 2, 'moving pair');
        near(read(point, 'A').value, read(point, 'D').value ** 2, 'fixed pair');
    }
    const multiply = lessons.find(entry => entry.id === 'ab-multiply'), multiplying = instrument(multiply);
    near(multiplying.read(multiply.steps.at(-1).target, 'A').value, 4 * 9, 'A/B product');
    near(multiplying.read(multiply.practice.steps.at(-1).target, 'A').value, 16 * 4, 'A/B practice product');
});

test('ST is sine-calibrated and its tangent approximation has the stated finite errors', () => {
    const item = lessons.find(entry => entry.id === 'small-angle'), { read } = instrument(item);
    for (const [step, angle, percent] of [[item.steps.at(-1), 1, .0152], [item.practice.steps[0], 2.5, .0952]]) {
        const sine = read(step.target, 'D').value / 100, tangent = Math.tan(radians(angle));
        near(sine, Math.sin(radians(angle)), 'ST exact sine mapping');
        assert.ok(sine < tangent, 'the tangent estimate is explicitly an underestimate');
        const errorPercent = 100 * (tangent - sine) / tangent;
        near(errorPercent, 100 * (1 - Math.cos(radians(angle))), 'independent tangent-error identity');
        assert.ok(Math.abs(errorPercent - percent) < .00005);
        assert.ok(errorPercent < .1);
    }
    assert.match(item.steps.at(-1).text, /not equal/);
    assert.match(item.practice.steps[0].success, /0\.0952%/);
});

test('P and both H ranges restore the independently known 3-4-5 and 5-12-13 triangles', () => {
    const p = lessons.find(entry => entry.id === 'pythagorean'), complement = instrument(p);
    near(complement.read(p.steps.at(-1).target, 'P').value, Math.sqrt(1 - .6 ** 2), 'P uses D/10');
    near(complement.read(p.practice.steps[0].target, 'P').value, Math.sqrt(1 - .8 ** 2), 'P practice uses D/10');
    const h = lessons.find(entry => entry.id === 'hypotenuse'), hypotenuse = instrument(h);
    near(hypotenuse.read(h.steps[0].target, 'H1').value * 4, Math.hypot(3, 4), 'H1 triangle');
    near(hypotenuse.read(h.steps[1].target, 'H2').value * 3, Math.hypot(3, 4), 'H2 triangle');
    near(hypotenuse.read(h.practice.steps[0].target, 'H1').value * 12, Math.hypot(5, 12), 'H1 practice triangle');
    near(hypotenuse.read(h.practice.steps[1].target, 'H2').value * 5, Math.hypot(5, 12), 'H2 practice triangle');
});

test('critical rendered branch, angle and near-unity readings keep their intended literal captions', () => {
    for (const [id, kind, index, scale, text] of [
        ['root-square-odd', 'demo', 1, 'R2', '5'],
        ['root-cube-branches', 'demo', 1, 'Q3', '7.368'],
        ['tangent-high', 'demo', 1, 'T2', '60°'],
        ['small-angle', 'demo', 1, 'ST', '1°'],
        ['pythagorean', 'demo', 1, 'P', '0.8'],
        ['hypotenuse', 'demo', 1, 'H2', '1.6667'],
        ['hypotenuse', 'practice', 0, 'H1', '1.08333']
    ]) {
        const item = lessons.find(entry => entry.id === id), { read } = instrument(item);
        const step = (kind === 'demo' ? item.steps : item.practice.steps)[index];
        assert.deepEqual(read(step.target, scale).display.texts, [text], `${id} ${kind} ${scale}`);
    }
});
