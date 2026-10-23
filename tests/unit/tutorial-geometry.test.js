/** Worked geometry answers are independent of the authored log coordinates.
 * Read every narrated/practice target through the real teaching programme,
 * runtime mapping and formatted readout, then interpret its physical units.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { GEOMETRY_LESSONS } from '#tutorial/lessons/geometry.js';
import { checkTutorialAlignment } from '#tutorial/lessons.js';
import { createTutorialProgramme } from '#tutorial/programme.js';
import { buildLibrary } from '#model/program.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { scaleReadings } from '#ui/readout-values.js';

const pi = Math.PI;
const examples = [
    { id: 'circumference', unit: 'cm', symbol: 'C',
        demo: [{ D: 2 }, { C: 1, D: 2 }, { C: pi, D: 2 * pi }],
        practice: [{ D: 3 }, { C: 1, D: 3 }, { C: pi, D: 3 * pi }],
        answer: [pi * 2, pi * 3], decade: [1, 1] },
    { id: 'disc-area-radius', unit: 'cm²', symbol: 'A',
        demo: [{ A: 2.25, D: 1.5 }, { D: 2.25 }, { C: 1, D: 2.25 }, { C: pi, D: 2.25 * pi }],
        practice: [{ A: 1.44, D: 1.2 }, { D: 1.44 }, { C: 1, D: 1.44 }, { C: pi, D: 1.44 * pi }],
        answer: [pi * 1.5 ** 2, pi * 1.2 ** 2], decade: [1, 1] },
    { id: 'disc-area-diameter', unit: 'cm²', symbol: 'A',
        demo: [{ A: 16, D: 4 }, { D: 1.6 }, { C: 4, D: 1.6 }, { C: 10, D: 4 }, { C: pi, D: .4 * pi }],
        practice: [{ A: 9, D: 3 }, { D: 9 }, { C: 4, D: 9 }, { C: 1, D: 2.25 }, { C: pi, D: 2.25 * pi }],
        answer: [pi * 4 ** 2 / 4, pi * 3 ** 2 / 4], decade: [10, 1] },
    { id: 'disc-diameter-from-area', unit: 'cm', symbol: 'd',
        demo: [{ D: 1.8 }, { C: pi, D: 1.8 }, { C: 10, D: 18 / pi },
            { A: 18 / pi, D: Math.sqrt(18 / pi) }, { C: 1, D: Math.sqrt(18 / pi) }, { C: 2, D: 2 * Math.sqrt(18 / pi) }],
        practice: [{ D: 2.5 }, { C: pi, D: 2.5 }, { C: 10, D: 25 / pi },
            { A: 25 / pi, D: Math.sqrt(25 / pi) }, { C: 1, D: Math.sqrt(25 / pi) }, { C: 2, D: 2 * Math.sqrt(25 / pi) }],
        answer: [2 * Math.sqrt(18 / pi), 2 * Math.sqrt(25 / pi)], decade: [1, 1] },
    { id: 'rectangle-area', unit: 'cm²', symbol: 'A',
        demo: [{ D: 2.4 }, { C: 1, D: 2.4 }, { C: 3, D: 7.2 }],
        practice: [{ D: 1.6 }, { C: 1, D: 1.6 }, { C: 4, D: 6.4 }],
        answer: [2.4 * 3, 1.6 * 4], decade: [1, 1] },
    { id: 'triangle-area', unit: 'cm²', symbol: 'A',
        demo: [{ D: 4 }, { C: 10, D: 4 }, { C: 3, D: 1.2 }, { C: 2, D: 1.2 }, { C: 10, D: 6 }],
        practice: [{ D: 5 }, { C: 10, D: 5 }, { C: 3, D: 1.5 }, { C: 2, D: 1.5 }, { C: 10, D: 7.5 }],
        answer: [4 * 3 / 2, 5 * 3 / 2], decade: [1, 1] },
    { id: 'ellipse-area', unit: 'cm²', symbol: 'A',
        demo: [{ D: 2 }, { C: 1, D: 2 }, { C: 1.2, D: 2.4 }, { C: 1, D: 2.4 }, { C: pi, D: 2.4 * pi }],
        practice: [{ D: 1.5 }, { C: 1, D: 1.5 }, { C: 1.2, D: 1.8 }, { C: 1, D: 1.8 }, { C: pi, D: 1.8 * pi }],
        answer: [pi * 2 * 1.2, pi * 1.5 * 1.2], decade: [1, 1] },
    { id: 'sector-area', unit: 'cm²', symbol: 'A',
        demo: [{ A: 9, D: 3 }, { D: 9 }, { C: 4, D: 9 }, { C: 1, D: 2.25 }, { C: pi, D: 2.25 * pi }],
        practice: [{ A: 4, D: 2 }, { D: 4 }, { C: 6, D: 4 }, { C: 10, D: 20 / 3 }, { C: pi, D: 2 * pi / 3 }],
        answer: [90 / 360 * pi * 3 ** 2, 60 / 360 * pi * 2 ** 2], decade: [1, 1] },
    { id: 'cylinder-volume', unit: 'cm³', symbol: 'V',
        demo: [{ A: 2.25, D: 1.5 }, { D: 2.25 }, { C: 1, D: 2.25 }, { C: pi, D: 2.25 * pi },
            { C: 10, D: 2.25 * pi }, { C: 2, D: .45 * pi }],
        practice: [{ A: 1.44, D: 1.2 }, { D: 1.44 }, { C: 1, D: 1.44 }, { C: pi, D: 1.44 * pi },
            { C: 1, D: 1.44 * pi }, { C: 2, D: 2.88 * pi }],
        answer: [pi * 1.5 ** 2 * 2, pi * 1.2 ** 2 * 2], decade: [10, 1] },
    { id: 'sphere-volume', unit: 'cm³', symbol: 'V',
        demo: [{ D: 4 }, { C: 3, D: 4 }, { C: 1, D: 4 / 3 }, { C: pi, D: 4 * pi / 3 },
            { K: 1.728, D: 1.2 }, { D: 1.728 }, { C: 1, D: 1.728 }, { C: 4 * pi / 3, D: 4 * pi * 1.728 / 3 }],
        practice: [{ D: 4 }, { C: 3, D: 4 }, { C: 1, D: 4 / 3 }, { C: pi, D: 4 * pi / 3 },
            { K: 2.197, D: 1.3 }, { D: 2.197 }, { C: 1, D: 2.197 }, { C: 4 * pi / 3, D: 4 * pi * 2.197 / 3 }],
        answer: [4 / 3 * pi * 1.2 ** 3, 4 / 3 * pi * 1.3 ** 3], decade: [1, 1] }
];

const near = (actual, expected, context, tolerance = 1e-11) =>
    assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
        `${context}: expected ${expected}, received ${actual}`);
const lesson = id => {
    const item = GEOMETRY_LESSONS.find(entry => entry.id === id);
    assert.ok(item, `Missing geometry lesson ${id}`);
    return item;
};

function instrument(item) {
    const programme = createTutorialProgramme(item.start, item.layout);
    const library = buildLibrary(programme), side = programme.sides.front;
    return (target, id) => {
        const rail = ['topStator', 'slide', 'bottomStator'].find(name => side[name].includes(id));
        assert.ok(rail, `${item.id}: ${id} exists in its teaching layout`);
        const p = target.cursor - (rail === 'slide' ? target.slideOffset : 0);
        const runtime = makeRuntimeScale(library[id]);
        assert.ok(p >= runtime.pMin - 1e-10 && p <= runtime.pMax + 1e-10, `${item.id}: ${id} is in its physical domain`);
        return { value: runtime.value(p), display: scaleReadings(library[id], p, library) };
    };
}

test('ten geometry lessons each retain an unanswered symbolic problem for demo and practice', () => {
    assert.deepEqual(GEOMETRY_LESSONS.map(item => item.id), examples.map(example => example.id));
    assert.ok(Object.isFrozen(GEOMETRY_LESSONS));
    for (const example of examples) {
        const item = lesson(example.id);
        assert.equal(item.sectionId, 'geometry');
        assert.ok(Object.isFrozen(item));
        for (const problem of [item.problem, item.practice.problem]) {
            assert.equal(typeof problem, 'string');
            assert.match(problem, new RegExp(`^${example.symbol} = `));
            assert.ok(problem.endsWith(`Find ${example.symbol}.`));
            assert.ok(problem.includes(example.unit), `${item.id}: the requested quantity has units`);
            assert.match(problem, /= [0-9.]+ cm/, `${item.id}: a given length or area includes its units`);
            assert.doesNotMatch(problem, /approximately|≈|answer is/);
        }
        assert.notEqual(item.problem, item.practice.problem, `${item.id}: practice supplies a different problem`);
    }
    assert.match(lesson('disc-area-radius').problem, /radius, half the diameter/);
    assert.match(lesson('disc-area-diameter').problem, /diameter, twice the radius/);
    assert.match(lesson('ellipse-area').problem, /semi-axes, each half a full axis/);
    assert.match(lesson('triangle-area').problem, /perpendicular height/);
    assert.match(lesson('sector-area').problem, /central angle in degrees/);
});

for (const example of examples) {
    test(`${example.id}: all demo and practice readings match the independent geometry oracle`, () => {
        const item = lesson(example.id), read = instrument(item);
        for (const [kind, steps, answers] of [
            ['demo', item.steps, example.demo], ['practice', item.practice.steps, example.practice]
        ]) {
            assert.equal(steps.length, answers.length, `${item.id}: every ${kind} target has an oracle`);
            for (let index = 0; index < steps.length; index++) {
                const step = steps[index], answer = answers[index];
                if (kind === 'demo') assert.deepEqual([...step.readings].sort(), Object.keys(answer).sort());
                for (const [id, expected] of Object.entries(answer)) {
                    const context = `${item.id} ${kind} ${index + 1} ${id}`;
                    const result = read(step.target, id);
                    near(result.value, expected, context);
                    assert.equal(result.display.outside, false, `${context}: visible reading`);
                    assert.equal(result.display.texts.length, 1);
                    near(Number.parseFloat(result.display.texts[0]), expected, `${context}: formatted reading`, 5e-4);
                }
            }
        }
        for (const [index, steps] of [item.steps, item.practice.steps].entries())
            near(read(steps.at(-1).target, 'D').value * example.decade[index], example.answer[index],
                `${item.id}: full geometric quantity after choosing the decade`);
        assert.notDeepEqual(item.steps.at(-1).target, item.practice.steps.at(-1).target,
            `${item.id}: practice has a different final alignment`);
    });
}

test('every geometry motion moves exactly one named component, and every practice stage needs that movement', () => {
    for (const item of GEOMETRY_LESSONS) {
        for (const [kind, start, steps] of [
            ['demo', item.start, item.steps], ['practice', item.practice.start, item.practice.steps]
        ]) {
            assert.ok(steps.length >= 3 && steps.length <= 8, `${item.id}: a manageable sequence of actual operations`);
            let previous = start;
            for (const step of steps) {
                assert.ok(step.title && step.text);
                assert.ok(Object.isFrozen(step.target));
                assert.ok(Number.isFinite(step.target.slideOffset) && step.target.slideOffset >= -.9 && step.target.slideOffset <= .9);
                assert.ok(Number.isFinite(step.target.cursor) && step.target.cursor >= 0 && step.target.cursor <= 1);
                const changed = ['slideOffset', 'cursor'].filter(field => step.target[field] !== previous[field]);
                assert.deepEqual(changed, [step.focus === 'slide' ? 'slideOffset' : 'cursor'], `${item.id} ${kind} ${step.title}`);
                assert.ok(Math.abs(step.target[changed[0]] - previous[changed[0]]) > .004,
                    `${item.id} ${kind} ${step.title}: movement exceeds the practice tolerance`);
                if (kind === 'practice') {
                    assert.equal(checkTutorialAlignment(previous, step).passed, false, `${item.id}: an unperformed practice movement cannot pass`);
                    assert.equal(checkTutorialAlignment(step.target, step).passed, true);
                    for (const field of step.required) {
                        const wrong = { ...step.target, [field]: step.target[field] + (step.target[field] > .8 ? -.02 : .02) };
                        assert.deepEqual(checkTutorialAlignment(wrong, step), { passed: false, misses: [field] });
                    }
                }
                previous = step.target;
            }
        }
    }
});

test('fixed A/K stages accept a different slide position, while every C/D calculation constrains both parts', () => {
    for (const example of examples) {
        const item = lesson(example.id), read = instrument(item);
        item.practice.steps.forEach((step, index) => {
            const answer = example.practice[index];
            if ('C' in answer) {
                assert.deepEqual([...step.required].sort(), ['cursor', 'slideOffset'], `${item.id}: C moves relative to D`);
            } else {
                assert.deepEqual(step.required, ['cursor'], `${item.id}: these readings depend only on the hairline`);
                const shifted = { ...step.target, slideOffset: .25 };
                assert.equal(checkTutorialAlignment(shifted, step).passed, true);
                for (const [id, expected] of Object.entries(answer)) near(read(shifted, id).value, expected, `${item.id}: ${id} stays fixed`);
            }
        });
    }
});

test('the diameter inversion closes the circle formula and the degree fractions give sector areas', () => {
    const inverse = lesson('disc-diameter-from-area'), read = instrument(inverse);
    for (const [steps, givenArea] of [[inverse.steps, 18], [inverse.practice.steps, 25]]) {
        const diameter = read(steps.at(-1).target, 'D').value;
        near(pi * (diameter / 2) ** 2, givenArea, 'Recovered diameter reproduces the given disc area');
    }
    const sector = lesson('sector-area'), sectorRead = instrument(sector);
    near(sectorRead(sector.steps.at(-1).target, 'D').value / (pi * 3 ** 2), 90 / 360, 'Quarter-circle area fraction');
    near(sectorRead(sector.practice.steps.at(-1).target, 'D').value / (pi * 2 ** 2), 60 / 360, 'Sixth-circle area fraction');
    assert.match(sector.steps[0].text, /reduced mentally/);
    assert.match(sector.practice.intro, /Reduce 60\/360 mentally/);
});
