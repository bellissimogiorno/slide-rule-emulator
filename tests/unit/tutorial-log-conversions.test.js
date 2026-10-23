/** Independent operands establish each answer; no expected value is obtained
 * by inverting an authored target. Both the real mapping and rendered readout
 * must agree, including folded decades and logarithmic characteristics.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LOG_CONVERSION_LESSONS } from '#tutorial/lessons/log-conversions.js';
import { checkTutorialAlignment } from '#tutorial/lessons.js';
import { createTutorialProgramme, TUTORIAL_LAYOUTS } from '#tutorial/programme.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { buildLibrary } from '#model/program.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { scaleReadings } from '#ui/readout-values.js';
import { renderReadout } from '#ui/readout.js';

const logarithmsOf = value => ({ L: Math.log10(value), LN: Math.log(value), D: value });
const examples = [
    { id: 'log-characteristic',
        demo: [{ L: Math.log10(2.5), D: 2.5 }, { L: Math.log10(4), D: 4 }],
        practice: [{ L: Math.log10(6), D: 6 }, { L: Math.log10(8), D: 8 }] },
    { id: 'extended-common-antilog',
        demo: [{ L: .4, D: 10 ** .4 }, { L: .7, D: 10 ** .7 }],
        practice: [{ L: .2, D: 10 ** .2 }, { L: .6, D: 10 ** .6 }] },
    { id: 'linear-natural-log',
        demo: [logarithmsOf(2), logarithmsOf(7), logarithmsOf(5)],
        practice: [logarithmsOf(3), logarithmsOf(4)] },
    { id: 'linear-natural-antilog',
        demo: [{ LN: 1.5, L: 1.5 / Math.log(10), D: Math.exp(1.5) },
            { LN: 4 - Math.log(10), L: 4 / Math.log(10) - 1, D: Math.exp(4) / 10 },
            { LN: Math.log(10) - .4, L: 1 - .4 / Math.log(10), D: 10 * Math.exp(-.4) }],
        practice: [{ LN: .8, L: .8 / Math.log(10), D: Math.exp(.8) },
            { LN: Math.log(10) - 1.2, L: 1 - 1.2 / Math.log(10), D: 10 * Math.exp(-1.2) }] },
    { id: 'change-log-base',
        demo: [logarithmsOf(2), logarithmsOf(6), { D: 10 * Math.log10(6) },
            { C: 10 * Math.log10(2), D: 10 * Math.log10(6) }, { C: 1, D: Math.log(6) / Math.log(2) }],
        practice: [logarithmsOf(3), logarithmsOf(7), { D: 10 * Math.log10(7) },
            { C: 10 * Math.log10(3), D: 10 * Math.log10(7) }, { C: 1, D: Math.log(7) / Math.log(3) }] },
    { id: 'folded-log-convert',
        demo: [{ D: 2, DFM: 2 * Math.log(10), C: 2, CFM: 2 * Math.log(10) },
            { D: 6, DFM: .6 * Math.log(10), C: 6, CFM: .6 * Math.log(10) },
            { DFM: 1.2, D: 12 / Math.log(10), CFM: 1.2, C: 12 / Math.log(10) }],
        practice: [{ D: 4, DFM: 4 * Math.log(10), C: 4, CFM: 4 * Math.log(10) },
            { DFM: 8, D: 8 / Math.log(10), CFM: 8, C: 8 / Math.log(10) }] },
    { id: 'folded-log-chain',
        demo: [{ D: 2, DFM: Math.log(100) }, { CFM: 3, DFM: Math.log(100) },
            { CFM: 1, DFM: Math.log(100) / 3 }],
        practice: [{ D: 3, DFM: Math.log(1000) }, { CFM: 4, DFM: Math.log(1000) },
            { CFM: 1, DFM: Math.log(1000) / 4 }] }
];

const lesson = id => {
    const item = LOG_CONVERSION_LESSONS.find(value => value.id === id);
    assert.ok(item, `Missing lesson ${id}`);
    return item;
};
const near = (actual, expected, context, tolerance = 1e-11) =>
    assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <=
        tolerance * Math.max(1e-300, Math.abs(expected)), `${context}: expected ${expected}, received ${actual}`);

function instrument(item) {
    const programme = createTutorialProgramme(item.start, item.layout);
    const library = buildLibrary(programme), side = programme.sides[programme.activeSide];
    const point = (target, id) => {
        const rails = ['topStator', 'slide', 'bottomStator'].filter(name => side[name].includes(id));
        assert.equal(rails.length, 1, `${item.id}: ${id} is physically present exactly once`);
        assert.ok(Object.hasOwn(BUILTIN_SCALES, id), `${item.id}: ${id} is a genuine built-in scale`);
        const p = target.cursor - (rails[0] === 'slide' ? target.slideOffset : 0);
        const runtime = makeRuntimeScale(library[id]);
        assert.ok(p >= runtime.pMin - 1e-10 && p <= runtime.pMax + 1e-10,
            `${item.id}: ${id} remains on its physical rail`);
        return { p, runtime };
    };
    const read = (target, id) => {
        const { p, runtime } = point(target, id);
        const display = scaleReadings(library[id], p, library);
        Object.assign(programme, target);
        const html = renderReadout(programme, library);
        const card = html.match(new RegExp(`data-readout-scale="${id}"><span[^>]*>[^<]*</span><div class="value">([^<]*)</div>`));
        assert.ok(card, `${item.id}: ${id} has a scalar HTML readout card`);
        assert.equal(card[1], display.texts[0], `${item.id}: rendered and numerical readouts agree`);
        return { value: runtime.value(p), display };
    };
    return { point, read };
}

test('seven immutable log-conversion lessons have explicit different problems and genuine profiles', () => {
    assert.equal(LOG_CONVERSION_LESSONS.length, 7);
    assert.deepEqual(LOG_CONVERSION_LESSONS.map(item => item.id), examples.map(example => example.id));
    assert.deepEqual(TUTORIAL_LAYOUTS['natural-linear'].topStator, ['L', 'LN']);
    assert.deepEqual(TUTORIAL_LAYOUTS['natural-linear'].slide, ['C']);
    assert.deepEqual(TUTORIAL_LAYOUTS['folded-log-conversion'].topStator, ['DFM']);
    assert.deepEqual(TUTORIAL_LAYOUTS['folded-log-conversion'].slide, ['CFM', 'C']);
    const frozen = value => {
        if (value && typeof value === 'object') {
            assert.ok(Object.isFrozen(value));
            Object.values(value).forEach(frozen);
        }
    };
    frozen(LOG_CONVERSION_LESSONS);
    for (const item of LOG_CONVERSION_LESSONS) {
        assert.equal(item.sectionId, 'log-conversions');
        for (const problem of [item.problem, item.practice.problem]) {
            assert.match(problem, /\d/);
            assert.match(problem, /find/i);
            assert.doesNotMatch(problem, /≈/);
        }
        assert.notEqual(item.problem, item.practice.problem);
        assert.notDeepEqual(item.steps.at(-1).target, item.practice.steps.at(-1).target);
    }
});

for (const example of examples) {
    test(`${example.id}: each demonstrated and practised target matches an independent numerical oracle`, () => {
        const item = lesson(example.id), { read } = instrument(item);
        for (const [kind, steps, answers] of [
            ['demonstration', item.steps, example.demo], ['practice', item.practice.steps, example.practice]
        ]) {
            assert.equal(steps.length, answers.length, `${kind}: every stage has an answer oracle`);
            for (let index = 0; index < steps.length; index++) {
                const step = steps[index], answer = answers[index];
                if (kind === 'demonstration')
                    assert.deepEqual([...step.readings].sort(), Object.keys(answer).sort(),
                        `${item.id}: every narrated scale has an independent answer`);
                for (const [id, expected] of Object.entries(answer)) {
                    const context = `${item.id} ${kind} ${index + 1} ${id}`;
                    const result = read(step.target, id);
                    near(result.value, expected, context);
                    assert.equal(result.display.outside, false, `${context}: visible scale reading`);
                    assert.equal(result.display.texts.length, 1);
                    near(Number(result.display.texts[0]), expected, `${context}: formatted number`, 5e-4);
                }
            }
        }
    });
}

test('each stage moves exactly one part and each imitation checks the relevant alignment', () => {
    for (const item of LOG_CONVERSION_LESSONS) {
        for (const [start, steps] of [[item.start, item.steps], [item.practice.start, item.practice.steps]]) {
            let previous = start;
            for (const step of steps) {
                const context = `${item.id}: ${step.title}`;
                assert.ok(step.target.cursor >= 0 && step.target.cursor <= 1, context);
                assert.ok(step.target.slideOffset >= -.9 && step.target.slideOffset <= .9, context);
                const changed = ['cursor', 'slideOffset'].filter(field => step.target[field] !== previous[field]);
                assert.deepEqual(changed, [step.focus === 'slide' ? 'slideOffset' : 'cursor'], context);
                assert.ok(Math.abs(step.target[changed[0]] - previous[changed[0]]) > 1e-10, context);
                if (step.required) {
                    assert.ok(step.required.includes(changed[0]), `${context}: requested movement is checked`);
                    assert.equal(checkTutorialAlignment(previous, step).passed, false, `${context}: an actual movement is needed`);
                    assert.deepEqual(checkTutorialAlignment(step.target, step), { passed: true, misses: [] });
                    for (const field of step.required) {
                        const wrong = { ...step.target, [field]: step.target[field] + .02 };
                        assert.deepEqual(checkTutorialAlignment(wrong, step), { passed: false, misses: [field] }, context);
                    }
                }
                previous = step.target;
            }
        }
    }
});

test('the common-log characteristic and antilog decade reproduce the full problem quantities', () => {
    const common = lesson('log-characteristic'), { read } = instrument(common);
    for (const [steps, cases] of [
        [common.steps, [[250, 2], [.04, -2]]], [common.practice.steps, [[600, 2], [.008, -3]]]
    ]) {
        cases.forEach(([input, characteristic], index) =>
            near(characteristic + read(steps[index].target, 'L').value, Math.log10(input), `log₁₀(${input})`));
    }
    const anti = lesson('extended-common-antilog'), antiRule = instrument(anti);
    for (const [steps, cases] of [
        [anti.steps, [[2.4, 2], [-1.3, -2]]], [anti.practice.steps, [[3.2, 3], [-2.4, -3]]]
    ]) {
        cases.forEach(([exponent, characteristic], index) =>
            near(antiRule.read(steps[index].target, 'D').value * 10 ** characteristic,
                10 ** exponent, `10^${exponent}`));
    }
});

test('linear natural-log range extensions reproduce complete logarithms and powers of e', () => {
    const natural = lesson('linear-natural-log'), { read } = instrument(natural);
    near(read(natural.steps[2].target, 'LN').value + Math.log(10), Math.log(50), 'ln(50)');
    near(read(natural.practice.steps[1].target, 'LN').value - Math.log(10), Math.log(.4), 'ln(0.4)');
    const anti = lesson('linear-natural-antilog'), antiRule = instrument(anti);
    for (const [steps, cases] of [
        [anti.steps, [[1.5, 0], [4, 1], [-.4, -1]]], [anti.practice.steps, [[.8, 0], [-1.2, -1]]]
    ]) {
        cases.forEach(([exponent, characteristic], index) =>
            near(antiRule.read(steps[index].target, 'D').value * 10 ** characteristic,
                Math.exp(exponent), `e^${exponent}`));
    }
});

test('linear LN and UltraLog Ln are logarithms, unlike Flying Fish exponential Ln banks', () => {
    const linear = makeRuntimeScale(BUILTIN_SCALES.LN), ultra = makeRuntimeScale(BUILTIN_SCALES.UL_LN);
    const fish = makeRuntimeScale(BUILTIN_SCALES.FF_LN_M2);
    assert.equal(BUILTIN_SCALES.LN.type, 'linear');
    assert.equal(BUILTIN_SCALES.UL_LN.type, 'linear');
    assert.equal(BUILTIN_SCALES.FF_LN_M2.type, 'loglog');
    for (const d of [1, 2, 5, 10]) {
        near(linear.value(Math.log10(d)), Math.log(d), `linear ln at D ${d}`);
        near(ultra.value(Math.log10(d)), Math.log(d), `UltraLog Ln at D ${d}`);
        near(fish.value(Math.log10(d)), Math.exp(d / 1000), `Flying Fish Ln₋₂ at D ${d}`);
    }
    assert.notEqual(linear.value(Math.log10(2)), fish.value(Math.log10(2)));
    assert.match(lesson('linear-natural-log').steps[1].text, /Flying Fish.*exponential/);
});

test('changing logarithm bases cancels the common factor without changing the mathematical answer', () => {
    const item = lesson('change-log-base'), { read } = instrument(item);
    for (const [steps, base, argument] of [[item.steps, 2, 6], [item.practice.steps, 3, 7]]) {
        const naturalRatio = read(steps[1].target, 'LN').value / read(steps[0].target, 'LN').value;
        const commonRatio = read(steps[1].target, 'L').value / read(steps[0].target, 'L').value;
        const answer = Math.log(argument) / Math.log(base);
        near(naturalRatio, answer, 'ratio of natural logarithms');
        near(commonRatio, answer, 'ratio of common logarithms');
        near(read(steps.at(-1).target, 'D').value, answer, 'C/D division yields the same base change');
        assert.ok(answer > 1 && answer < 3, 'an independent power estimate bounds the answer');
    }
});

test('the ln(10) folds convert in both directions with independently determined decimal places', () => {
    const item = lesson('folded-log-convert'), { read } = instrument(item);
    near(read(item.steps[0].target, 'DFM').value / 10, .2 * Math.log(10), 'common .2 to natural');
    near(read(item.steps[1].target, 'DFM').value, .6 * Math.log(10), 'common .6 to natural across break');
    near(read(item.steps[2].target, 'D').value / 10, 1.2 / Math.log(10), 'natural 1.2 to common');
    near(read(item.practice.steps[0].target, 'DFM').value / 10, .4 * Math.log(10), 'practice common to natural');
    near(read(item.practice.steps[1].target, 'D').value / 10, .8 / Math.log(10), 'practice natural to common');
    for (const [foldedId, piId] of [['CFM', 'CF'], ['DFM', 'DF']]) {
        assert.equal(BUILTIN_SCALES[foldedId].type, 'foldedLog');
        near(BUILTIN_SCALES[foldedId].fold, Math.log(10), `${foldedId} fold`);
        near(BUILTIN_SCALES[piId].fold, Math.PI, `${piId} fold`);
        assert.ok(Math.abs(makeRuntimeScale(BUILTIN_SCALES[foldedId]).value(Math.log10(2)) -
            makeRuntimeScale(BUILTIN_SCALES[piId]).value(Math.log10(2))) > 1,
        'The two folds provide different constants at the same ordinary scale position');
    }
});

test('paired folded division uses the interior unit mark rather than the physical end', () => {
    const item = lesson('folded-log-chain'), { point, read } = instrument(item);
    for (const [steps, input, divisor] of [[item.steps, 100, 3], [item.practice.steps, 1000, 4]]) {
        const result = steps.at(-1).target;
        near(point(result, 'CFM').p, 1 - Math.log10(Math.log(10)), 'interior unit-index coordinate');
        assert.ok(point(result, 'CFM').p > .6 && point(result, 'CFM').p < .7);
        near(read(result, 'DFM').value, Math.log(input) / divisor, 'complete logarithm quotient');
        near(read(result, 'CFM').value, 1, 'interior unit-index value');
    }
    const runtime = makeRuntimeScale(BUILTIN_SCALES.CFM);
    near(runtime.value(0), Math.log(10), 'left physical end represents 1/M');
    near(runtime.value(1), Math.log(10), 'right physical end represents 1/M');
});
