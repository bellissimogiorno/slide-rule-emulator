/** Worked-answer oracles for the neat-tricks section. Every stage is checked
 * against actual scalar mappings, its physical rail and the visible readout.
 * Expected answers come from elementary arithmetic/identities; no oracle
 * recovers an answer by inverting an authored target coordinate.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { NEAT_TRICK_LESSONS } from '#tutorial/lessons/neat-tricks.js';
import { createTutorialProgramme } from '#tutorial/programme.js';
import { buildLibrary } from '#model/program.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { formatValue } from '#core/format.js';
import { scaleReadings } from '#ui/readout-values.js';

const examples = [
    { id: 'split-total', demo: [{ D: 8.4 }, { C: 7, D: 8.4 }, { C: 2, D: 2.4 }, { C: 5, D: 6 }],
        practice: [{ D: 9.6 }, { C: 8, D: 9.6 }, { C: 3, D: 3.6 }, { C: 5, D: 6 }] },
    { id: 'parallel-resistance', demo: [{ D: 6 }, { CI: 3, D: 6 }, { CI: 9, D: 2 }],
        practice: [{ D: 4 }, { CI: 2, D: 4 }, { CI: 6, D: 4 / 3 }] },
    { id: 'golden-ratio',
        demo: [{ H2: Math.sqrt(5), D: 2 }, { D: 1 + Math.sqrt(5) },
            { C: 2, D: 1 + Math.sqrt(5) }, { C: 1, D: (1 + Math.sqrt(5)) / 2 }],
        practice: [{ H2: Math.sqrt(17), D: 4 }, { D: 1 + Math.sqrt(17) },
            { C: 2, D: 1 + Math.sqrt(17) }, { C: 1, D: (1 + Math.sqrt(17)) / 2 }] },
    { id: 'pythagorean-triples', demo: [{ A: 25, D: 5 }, { A: 4, D: 2 }, { C: 1, D: 2 }, { C: 5, D: 10 }],
        practice: [{ A: 16, D: 4 }, { A: 9, D: 3 }, { C: 10, D: 3 }, { C: 4, D: 1.2 }] },
    { id: 'double-tangent', demo: [{ A: 25, D: 5 }, { D: 1 }, { C: 7.5, D: 1 }, { C: 10, D: 4 / 3 }],
        practice: [{ A: 36, D: 6 }, { D: 1.2 }, { C: 6.4, D: 1.2 }, { C: 10, D: 15 / 8 }] },
    { id: 'symmetric-percentages', demo: [{ A: 4, D: 2 }, { D: 1.2 }, { C: 1, D: 1.2 }, { C: 8, D: 9.6 }],
        practice: [{ A: 9, D: 3 }, { D: 1.3 }, { C: 1, D: 1.3 }, { C: 7, D: 9.1 }] }
];

const lesson = id => {
    const item = NEAT_TRICK_LESSONS.find(entry => entry.id === id);
    assert.ok(item, `Missing trick ${id}`);
    return item;
};
function near(actual, expected, context, tolerance = 1e-11) {
    assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
        `${context}: expected ${expected}, received ${actual}`);
}
function instrument(item) {
    const programme = createTutorialProgramme(item.start, item.layout);
    const library = buildLibrary(programme), side = programme.sides.front;
    function read(point, id) {
        const rail = ['topStator', 'slide', 'bottomStator'].find(name => side[name].includes(id));
        assert.ok(rail, `${item.id}: ${id} belongs to ${item.layout}`);
        const definition = library[id], p = point.cursor - (rail === 'slide' ? point.slideOffset : 0);
        assert.equal(definition.layers, undefined, `${id}: scalar teaching row`);
        const runtime = makeRuntimeScale(definition);
        assert.ok(p >= runtime.pMin - 1e-10 && p <= runtime.pMax + 1e-10, `${item.id}: ${id} remains visible`);
        return { value: runtime.value(p), display: scaleReadings(definition, p, library), definition };
    }
    return { read };
}

test('six immutable tricks have distinct checked problems and reuse existing teaching profiles', () => {
    assert.equal(NEAT_TRICK_LESSONS.length, 6);
    assert.deepEqual(NEAT_TRICK_LESSONS.map(item => item.id), examples.map(example => example.id));
    assert.equal(new Set(NEAT_TRICK_LESSONS.map(item => item.id)).size, 6);
    assert.ok(Object.isFrozen(NEAT_TRICK_LESSONS));
    for (const item of NEAT_TRICK_LESSONS) {
        assert.ok(Object.isFrozen(item));
        assert.equal(item.sectionId, 'neat-tricks');
        assert.ok(['cd', 'reciprocal', 'hypotenuse', 'squares'].includes(item.layout));
        assert.ok(item.problem && item.practice.problem && item.summary && item.practice.intro);
        assert.notEqual(item.problem, item.practice.problem);
        assert.ok(item.steps.length >= 3 && item.practice.steps.length >= 3);
    }
});

for (const example of examples) {
    test(`${example.id}: every visible demo and practice reading matches its worked answer`, () => {
        const item = lesson(example.id), { read } = instrument(item);
        for (const [kind, steps, expected] of [
            ['demo', item.steps, example.demo], ['practice', item.practice.steps, example.practice]
        ]) {
            assert.equal(steps.length, expected.length, `${item.id}: all ${kind} stages are covered`);
            for (let index = 0; index < steps.length; index++) {
                const step = steps[index];
                assert.deepEqual([...step.readings].sort(), Object.keys(expected[index]).sort(),
                    `${item.id}: every named ${kind} scale is checked`);
                for (const [id, answer] of Object.entries(expected[index])) {
                    const context = `${item.id} ${kind} ${index + 1} ${id}`, result = read(step.target, id);
                    near(result.value, answer, context);
                    assert.equal(result.display.outside, false, `${context}: visible readout`);
                    assert.deepEqual(result.display.texts, [formatValue(answer, result.definition)],
                        `${context}: independent answer formatted for the real row`);
                    near(Number.parseFloat(result.display.texts[0]), answer, `${context}: displayed precision`, 5e-4);
                }
            }
        }
    });
}

test('all 46 movements change one named component inside physical bounds, with unsolved practice starts', () => {
    let movements = 0;
    for (const item of NEAT_TRICK_LESSONS) {
        for (const [kind, start, steps] of [
            ['demo', item.start, item.steps], ['practice', item.practice.start, item.practice.steps]
        ]) {
            let previous = start;
            for (const step of steps) {
                const changed = ['slideOffset', 'cursor'].filter(field => step.target[field] !== previous[field]);
                assert.equal(changed.length, 1, `${item.id} ${kind}: a real movement of one component`);
                assert.equal(changed[0], step.focus === 'slide' ? 'slideOffset' : 'cursor');
                assert.ok(step.target.slideOffset >= -.9 && step.target.slideOffset <= .9);
                assert.ok(step.target.cursor >= 0 && step.target.cursor <= 1);
                assert.ok(Number.isFinite(step.duration ?? 1400));
                const programme = createTutorialProgramme(step.target, item.layout);
                assert.equal(programme.slideOffset, step.target.slideOffset);
                assert.equal(programme.cursor, step.target.cursor);
                previous = step.target;
                movements++;
            }
        }
        const first = item.practice.steps[0];
        assert.ok(first.required.some(field => Math.abs(item.practice.start[field] - first.target[field]) > .004),
            `${item.id}: practice cannot pass without moving`);
        for (const step of item.practice.steps) {
            assert.ok(step.success && step.required.length);
            assert.ok(step.required.includes(step.focus === 'slide' ? 'slideOffset' : 'cursor'));
        }
    }
    assert.equal(movements, 46);
});

test('a single ratio setting reads shares which sum to the original total', () => {
    const item = lesson('split-total'), { read } = instrument(item);
    for (const [steps, total, a, b] of [[item.steps, 84, 2, 5], [item.practice.steps, 96, 3, 5]]) {
        const x = read(steps[2].target, 'D').value * 10, y = read(steps[3].target, 'D').value * 10;
        near(x, total * a / (a + b), 'first share from ordinary fraction');
        near(y, total * b / (a + b), 'second share from ordinary fraction');
        near(x + y, total, 'sum of shares');
        near(x / y, a / b, 'ratio of shares');
        assert.equal(steps[1].target.slideOffset, steps[3].target.slideOffset);
    }
});

test('the CI trick keeps ab constant and yields the reciprocal-sum resistance', () => {
    const item = lesson('parallel-resistance'), { read } = instrument(item);
    for (const [steps, a, b] of [[item.steps, 6, 3], [item.practice.steps, 4, 2]]) {
        for (const step of steps.slice(1))
            near(read(step.target, 'CI').value * read(step.target, 'D').value, a * b, 'constant CI/D product');
        const last = steps.at(-1).target, equivalent = read(last, 'D').value;
        near(read(last, 'CI').value, a + b, 'mentally formed sum');
        near(equivalent, 1 / (1 / a + 1 / b), 'independent conductance sum');
        assert.ok(equivalent > 0 && equivalent < Math.min(a, b));
    }
});

test('the H2 construction solves each quadratic and selects its positive root', () => {
    const item = lesson('golden-ratio'), { read } = instrument(item);
    for (const [steps, constant, radicand] of [[item.steps, 1, 5], [item.practice.steps, 4, 17]]) {
        near(read(steps[0].target, 'H2').value, Math.sqrt(radicand), 'ordinary square root');
        near(read(steps[1].target, 'D').value, 1 + Math.sqrt(radicand), 'mental addition transferred to D');
        const solution = read(steps.at(-1).target, 'D').value;
        assert.ok(solution > 0);
        near(solution * solution - solution, constant, 'original quadratic equation');
        near(solution, (1 + Math.sqrt(1 + 4 * constant)) / 2, 'independent quadratic formula');
    }
});

test('the square/product construction generates the promised integer right triangles', () => {
    const item = lesson('pythagorean-triples'), { read } = instrument(item);
    for (const [steps, m, n, productFactor, expected] of [
        [item.steps, 5, 2, 1, [21, 20, 29]], [item.practice.steps, 4, 3, 10, [7, 24, 25]]
    ]) {
        const mSquared = read(steps[0].target, 'A').value, nSquared = read(steps[1].target, 'A').value;
        const product = read(steps.at(-1).target, 'D').value * productFactor;
        near(mSquared, m * m, 'larger square'); near(nSquared, n * n, 'smaller square');
        near(product, m * n, 'product with its stated decade');
        const sides = [mSquared - nSquared, 2 * product, mSquared + nSquared];
        sides.forEach((value, index) => near(value, expected[index], 'integer triangle side'));
        near(sides[0] ** 2 + sides[1] ** 2, sides[2] ** 2, 'Pythagorean theorem');
    }
});

test('the double-angle result agrees with trigonometry, independently of the algebraic identity', () => {
    const item = lesson('double-tangent'), { read } = instrument(item);
    for (const [steps, tangent] of [[item.steps, .5], [item.practice.steps, .6]]) {
        near(read(steps[0].target, 'A').value / 100, tangent * tangent, 'fractional tangent squared');
        const angle = Math.atan(tangent), result = read(steps.at(-1).target, 'D').value;
        assert.ok(2 * angle < Math.PI / 2);
        near(result, Math.tan(2 * angle), 'ordinary doubled-angle tangent');
        near(result, 2 * tangent / (1 - tangent * tangent), 'independent rational identity');
    }
});

test('equal percentage rises and falls lose the square of the fractional change', () => {
    const item = lesson('symmetric-percentages'), { read } = instrument(item);
    for (const [steps, fraction] of [[item.steps, .2], [item.practice.steps, .3]]) {
        const square = read(steps[0].target, 'A').value / 100;
        const multiplier = read(steps.at(-1).target, 'D').value / 10;
        near(square, fraction ** 2, 'fractional square');
        near(multiplier, (1 + fraction) * (1 - fraction), 'successive changes of base');
        near(1 - multiplier, square, 'net fractional decrease');
        assert.ok(multiplier < 1);
    }
});

test('critical worked readings retain concrete user-visible captions', () => {
    for (const [id, kind, index, scale, expected] of [
        ['split-total', 'demo', 2, 'D', '2.4'],
        ['parallel-resistance', 'practice', 2, 'D', '1.333'],
        ['golden-ratio', 'demo', 0, 'H2', '2.236'],
        ['golden-ratio', 'demo', 3, 'D', '1.618'],
        ['golden-ratio', 'practice', 3, 'D', '2.562'],
        ['pythagorean-triples', 'demo', 3, 'D', '10'],
        ['double-tangent', 'practice', 3, 'D', '1.875'],
        ['symmetric-percentages', 'practice', 3, 'D', '9.1']
    ]) {
        const item = lesson(id), steps = kind === 'demo' ? item.steps : item.practice.steps;
        assert.deepEqual(instrument(item).read(steps[index].target, scale).display.texts, [expected]);
    }
});
