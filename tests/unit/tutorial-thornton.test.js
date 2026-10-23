/** The answer fixtures do not invert authored coordinates. Ordinary geometry
 * and trigonometry supply the oracle; real catalogue mappings and formatted
 * readouts must agree at each narrated and checked position.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { THORNTON_LESSONS } from '#tutorial/lessons/thornton.js';
import { checkTutorialAlignment } from '#tutorial/lessons.js';
import { createTutorialProgramme } from '#tutorial/programme.js';
import { buildLibrary } from '#model/program.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { scaleReadings } from '#ui/readout-values.js';

const degrees = value => value * 180 / Math.PI;
const examples = [
    { id: 'thornton-ps-complement',
        demo: [{ PS: .3, D: 10 * Math.sqrt(.91) }, { PS: .6, D: 8 }, { PS: .8, D: 6 }],
        practice: [{ PS: .5, D: 5 * Math.sqrt(3) }, { PS: Math.sqrt(3) / 2, D: 5 }] },
    { id: 'thornton-ps-triangle',
        demo: [{ D: 3 }, { C: 5, D: 3 }, { C: 10, D: 6 }, { PS: .6, D: 8 }, { C: 10, D: 8 }, { C: 5, D: 4 }],
        practice: [{ D: 4 }, { C: 5, D: 4 }, { C: 10, D: 8 }, { PS: .8, D: 6 }, { C: 10, D: 6 }, { C: 5, D: 3 }] },
    { id: 'thornton-pt-low',
        demo: [{ D: 3 }, { C: 4, D: 3 }, { C: 10, D: 7.5, H1: 1.25 }, { D: 1.25 }, { C: 1, D: 1.25 }, { C: 4, D: 5 }],
        practice: [{ D: 2 }, { C: 3, D: 2 }, { C: 10, D: 20 / 3, H1: Math.sqrt(13) / 3 },
            { D: Math.sqrt(13) / 3 }, { C: 1, D: Math.sqrt(13) / 3 }, { C: 3, D: Math.sqrt(13) }] },
    { id: 'thornton-pt-high',
        demo: [{ D: 4 }, { C: 3, D: 4 }, { C: 1, D: 4 / 3, H2: 5 / 3 }, { D: 5 / 3 }, { C: 1, D: 5 / 3 }, { C: 3, D: 5 }],
        practice: [{ D: 5 }, { C: 2, D: 5 }, { C: 1, D: 2.5, H2: Math.sqrt(29) / 2 },
            { D: Math.sqrt(29) / 2 }, { C: 1, D: Math.sqrt(29) / 2 }, { C: 2, D: Math.sqrt(29) }] },
    { id: 'thornton-direct-study',
        demo: [{ SD: 30 }, { S: 30, D: 5 }, { TD: 30 }, { T1: 30, D: 10 / Math.sqrt(3) }],
        practice: [{ SD: 45 }, { S: 45, D: 5 * Math.sqrt(2) }, { TD: 20 }, { T1: 20, D: 10 * Math.tan(Math.PI / 9) }] },
    { id: 'thornton-inverse-study',
        demo: [{ ISD: .6 }, { S: degrees(Math.asin(.6)), D: 6 }, { ITD: .75 }, { T1: degrees(Math.atan(.75)), D: 7.5 }],
        practice: [{ ISD: .8 }, { S: degrees(Math.asin(.8)), D: 8 }, { ITD: .5 }, { T1: degrees(Math.atan(.5)), D: 5 }] }
];

const lesson = id => {
    const item = THORNTON_LESSONS.find(entry => entry.id === id);
    assert.ok(item, `Missing lesson ${id}`);
    return item;
};
const near = (actual, expected, context, tolerance = 1e-10) =>
    assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
        `${context}: expected ${expected}, received ${actual}`);

function instrument(item) {
    const programme = createTutorialProgramme(item.start, item.layout);
    const library = buildLibrary(programme), side = programme.sides.front;
    return (target, id) => {
        const rail = ['topStator', 'slide', 'bottomStator'].find(name => side[name].includes(id));
        assert.ok(rail, `${item.id}: ${id} belongs to the teaching profile`);
        const p = target.cursor - (rail === 'slide' ? target.slideOffset : 0), runtime = makeRuntimeScale(library[id]);
        assert.ok(p >= runtime.pMin - 1e-10 && p <= runtime.pMax + 1e-10, `${item.id}: ${id} stays in its actual domain`);
        return { value: runtime.value(p), display: scaleReadings(library[id], p, library) };
    };
}

test('six immutable Thornton lessons cover vector functions and clearly limited model studies', () => {
    assert.deepEqual(THORNTON_LESSONS.map(item => item.id), examples.map(example => example.id));
    assert.ok(Object.isFrozen(THORNTON_LESSONS));
    for (const item of THORNTON_LESSONS) {
        assert.ok(Object.isFrozen(item));
        assert.equal(item.sectionId, 'thornton');
        assert.ok(item.problem && item.practice.problem && item.summary && item.practice.intro);
        assert.notEqual(item.problem, item.practice.problem);
    }
    for (const id of ['thornton-direct-study', 'thornton-inverse-study']) {
        const item = lesson(id);
        assert.match(item.problem, /^Normalised model study:/);
        assert.match(item.practice.problem, /^Normalised model study:/);
        assert.match(item.practice.note, /cannot reproduce the historical calibrated correction procedure/);
        for (const step of [...item.steps, ...item.practice.steps])
            assert.match(step.text, /model|normalised|calibrated/);
    }
    for (const id of ['thornton-pt-low', 'thornton-pt-high']) {
        const item = lesson(id);
        assert.match(item.problem, /Model layout:/);
        assert.match(item.practice.note, /layout differs from the historical Pt input scale/);
    }
});

for (const example of examples) {
    test(`${example.id}: every demonstration and practice reading agrees with independent mathematics`, () => {
        const item = lesson(example.id), read = instrument(item);
        for (const [kind, steps, answers] of [
            ['demo', item.steps, example.demo], ['practice', item.practice.steps, example.practice]
        ]) {
            assert.equal(steps.length, answers.length, `${item.id}: every ${kind} stage has an answer`);
            steps.forEach((step, index) => {
                const answer = answers[index];
                if (kind === 'demo') assert.deepEqual([...step.readings].sort(), Object.keys(answer).sort());
                for (const [id, expected] of Object.entries(answer)) {
                    const result = read(step.target, id), context = `${item.id} ${kind} ${index + 1} ${id}`;
                    near(result.value, expected, context);
                    assert.equal(result.display.outside, false, context);
                    assert.equal(result.display.texts.length, 1);
                    near(Number.parseFloat(result.display.texts[0]), expected, `${context}: formatted number`, 5e-4);
                    assert.equal(result.display.texts[0].endsWith('°'), ['S', 'T1', 'SD', 'TD'].includes(id), `${context}: correct units`);
                }
            });
        }
    });
}

test('every movement changes one named component; practice cannot advance from its preceding pose', () => {
    for (const item of THORNTON_LESSONS) {
        for (const [kind, start, steps] of [
            ['demo', item.start, item.steps], ['practice', item.practice.start, item.practice.steps]
        ]) {
            assert.ok(steps.length >= 2 && steps.length <= 8);
            let previous = start;
            for (const step of steps) {
                assert.ok(step.title && step.text);
                assert.ok(Number.isFinite(step.target.slideOffset) && step.target.slideOffset >= -.9 && step.target.slideOffset <= .9);
                assert.ok(Number.isFinite(step.target.cursor) && step.target.cursor >= 0 && step.target.cursor <= 1);
                const changed = ['slideOffset', 'cursor'].filter(field => previous[field] !== step.target[field]);
                assert.deepEqual(changed, [step.focus === 'slide' ? 'slideOffset' : 'cursor'], `${item.id}: ${step.title}`);
                assert.ok(Math.abs(step.target[changed[0]] - previous[changed[0]]) > .004,
                    `${item.id}: a visibly meaningful movement exceeds the practice tolerance`);
                if (kind === 'practice') {
                    assert.equal(checkTutorialAlignment(previous, step).passed, false, `${item.id}: the movement is required`);
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

test('fixed Ps and Pt constituents ignore slide changes; model rows and arithmetic constrain the slide', () => {
    for (const example of examples) {
        const item = lesson(example.id), read = instrument(item);
        item.practice.steps.forEach((step, index) => {
            const answer = example.practice[index];
            const movingRow = ['C', 'SD', 'TD', 'ISD', 'ITD'].some(id => id in answer);
            assert.deepEqual([...step.required].sort(), movingRow ? ['cursor', 'slideOffset'] : ['cursor']);
            if (!movingRow) {
                const shifted = { ...step.target, slideOffset: .2 };
                assert.equal(checkTutorialAlignment(shifted, step).passed, true);
                for (const [id, expected] of Object.entries(answer)) near(read(shifted, id).value, expected, `${item.id}: fixed ${id}`);
            }
        });
    }
});

test('Ps restores physical side lengths and the two Pt model ranges agree with Pythagoras', () => {
    const ps = lesson('thornton-ps-triangle'), psRead = instrument(ps);
    near(psRead(ps.steps.at(-1).target, 'D').value, Math.sqrt(5 ** 2 - 3 ** 2), 'Ps demonstration length');
    near(psRead(ps.practice.steps.at(-1).target, 'D').value, Math.sqrt(5 ** 2 - 4 ** 2), 'Ps practice length');
    for (const [id, demoLegs, practiceLegs] of [
        ['thornton-pt-low', [3, 4], [2, 3]], ['thornton-pt-high', [4, 3], [5, 2]]
    ]) {
        const item = lesson(id), read = instrument(item);
        for (const [steps, [a, b]] of [[item.steps, demoLegs], [item.practice.steps, practiceLegs]]) {
            const result = read(steps.at(-1).target, 'D').value;
            near(result, Math.hypot(a, b), `${id}: physical hypotenuse`);
            assert.ok(result > Math.max(a, b), 'A hypotenuse exceeds either perpendicular leg');
        }
    }
    const low = lesson('thornton-pt-low'), lowRead = instrument(low), point = low.steps[2].target;
    near(lowRead(point, 'H1').value, 1.25, 'Low range uses t = D/10');
    near(lowRead(point, 'H2').value, Math.hypot(1, 7.5), 'The other row really represents a different input ratio');
});

test('correction studies use the actual endpoint-normalised metrics, never a D correction-factor reading', () => {
    const toRadians = value => value * Math.PI / 180;
    const metrics = {
        SD: value => toRadians(value) / Math.sin(toRadians(value)),
        TD: value => toRadians(value) / Math.tan(toRadians(value)),
        ISD: value => Math.asin(value) / value,
        ITD: value => Math.atan(value) / value
    };
    const domains = { SD: [1, 90], TD: [1, 84], ISD: [.1, .999], ITD: [.1, 10] };
    for (const id of ['thornton-direct-study', 'thornton-inverse-study']) {
        const item = lesson(id), example = examples.find(entry => entry.id === id);
        for (const [steps, answers] of [[item.steps, example.demo], [item.practice.steps, example.practice]]) {
            steps.forEach((step, index) => {
                const answer = answers[index], scale = Object.keys(answer).find(key => key in metrics);
                if (!scale) return;
                assert.deepEqual(Object.keys(answer), [scale], 'The study does not describe D as a correction readout');
                const [minimum, maximum] = domains[scale], metric = metrics[scale], input = answer[scale];
                const expected = (metric(input) - metric(minimum)) / (metric(maximum) - metric(minimum));
                near(step.target.cursor - step.target.slideOffset, expected, `${scale}: endpoint-normalised coordinate`);
                if (step.readings) assert.deepEqual(step.readings, [scale]);
            });
        }
    }
});

test('standard trig comparisons give the claimed functions and inverse angles separately from model labels', () => {
    const direct = lesson('thornton-direct-study'), directRead = instrument(direct);
    near(directRead(direct.steps[1].target, 'D').value / 10, Math.sin(Math.PI / 6), 'Sine comparison');
    near(directRead(direct.steps[3].target, 'D').value / 10, Math.tan(Math.PI / 6), 'Tangent comparison');
    near(directRead(direct.practice.steps[1].target, 'D').value / 10, Math.sin(Math.PI / 4), 'Practice sine');
    near(directRead(direct.practice.steps[3].target, 'D').value / 10, Math.tan(Math.PI / 9), 'Practice tangent');
    const inverse = lesson('thornton-inverse-study'), inverseRead = instrument(inverse);
    for (const [steps, sineInput, tangentInput] of [[inverse.steps, .6, .75], [inverse.practice.steps, .8, .5]]) {
        const sineAngle = inverseRead(steps[1].target, 'S').value, tangentAngle = inverseRead(steps[3].target, 'T1').value;
        near(Math.sin(sineAngle * Math.PI / 180), sineInput, 'Recovered sine angle');
        near(Math.tan(tangentAngle * Math.PI / 180), tangentInput, 'Recovered tangent angle');
    }
});
