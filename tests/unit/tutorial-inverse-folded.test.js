/** Worked answers are ordinary arithmetic, independent of authored positions.
 * Check the genuine teaching rows, their runtime mappings and visible readouts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { INVERSE_FOLDED_LESSONS } from '#tutorial/lessons/inverse-folded.js';
import { checkTutorialAlignment } from '#tutorial/lessons.js';
import { createTutorialProgramme, TUTORIAL_LAYOUTS } from '#tutorial/programme.js';
import { buildLibrary } from '#model/program.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { scaleReadings } from '#ui/readout-values.js';

const examples = [
    { id: 'fixed-reciprocals',
        demo: [{ DI: 2.5, CI: 2.5, D: 4 }, { DI: 2.5, CI: 5, D: 4 }, { DI: 2.5, CI: 2.5, D: 4 }],
        practice: [{ DI: 1.25, CI: 2.5, D: 8 }, { DI: 1.25, CI: 1.25, D: 8 }] },
    { id: 'inverse-arithmetic',
        demo: [{ D: 6 }, { CI: 1, D: 6 }, { CI: 2, D: 3 }, { CI: 1, D: 6 }],
        practice: [{ D: 8 }, { CI: 1, D: 8 }, { CI: 2, D: 4 }, { CI: 1, D: 8 }] },
    { id: 'inverse-chain',
        demo: [{ D: 2 }, { CI: 3, D: 2 }, { CI: 1, D: 6 }, { C: 4, D: 2.4 }],
        practice: [{ D: 3 }, { CI: 2, D: 3 }, { CI: 1, D: 6 }, { C: 5, D: 3 }] },
    { id: 'multiply-pi',
        demo: [{ D: 2, DF: 2 * Math.PI, C: 2, CF: 2 * Math.PI },
            { D: 3, DF: 3 * Math.PI, C: 3, CF: 3 * Math.PI },
            { D: 4, DF: 4 * Math.PI / 10, C: 4, CF: 4 * Math.PI / 10 }],
        practice: [{ D: 5, DF: 5 * Math.PI / 10, C: 5, CF: 5 * Math.PI / 10 }] },
    { id: 'folded-multiply',
        demo: [{ C: 4, D: 4 }, { C: 1, D: 4 }, { DF: 4 }, { CF: 1, DF: 4 }, { CF: 3, DF: 1.2 }],
        practice: [{ DF: 6 }, { CF: 1, DF: 6 }, { CF: 2.5, DF: 1.5 }] },
    { id: 'folded-divide',
        demo: [{ DF: 8 }, { CF: 2, DF: 8 }, { CF: 1, DF: 4 }],
        practice: [{ DF: 9 }, { CF: 2, DF: 9 }, { CF: 1, DF: 4.5 }] },
    { id: 'folded-reciprocals',
        demo: [{ DF: 4, DIF: 2.5, CIF: 2.5 }, { DF: 8, DIF: 1.25, CIF: 1.25 }, { DF: 2, DIF: 5, CIF: 5 }],
        practice: [{ DF: 5, DIF: 2, CIF: 2 }] }
];

const lesson = id => INVERSE_FOLDED_LESSONS.find(item => item.id === id);
const near = (actual, expected, context, tolerance = 1e-11) =>
    assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
        `${context}: expected ${expected}, received ${actual}`);

function instrument(item) {
    const programme = createTutorialProgramme(item.start, item.layout);
    const library = buildLibrary(programme);
    const side = programme.sides[programme.activeSide];
    const point = (target, id) => {
        const rail = ['topStator', 'slide', 'bottomStator'].find(name => side[name].includes(id));
        assert.ok(rail, `${item.id}: ${id} is present in the actual ${item.layout} profile`);
        const p = target.cursor - (rail === 'slide' ? target.slideOffset : 0);
        const rt = makeRuntimeScale(library[id]);
        assert.ok(p >= rt.pMin - 1e-10 && p <= rt.pMax + 1e-10, `${item.id}: ${id} lies on its physical rail`);
        return { p, rt };
    };
    return {
        point,
        value: (target, id) => { const { p, rt } = point(target, id); return rt.value(p); },
        display: (target, id) => scaleReadings(library[id], point(target, id).p, library)
    };
}

test('seven inverse and folded lessons use the agreed genuine profiles and unanswered problems', () => {
    assert.deepEqual(INVERSE_FOLDED_LESSONS.map(item => item.id), examples.map(example => example.id));
    assert.deepEqual(TUTORIAL_LAYOUTS.inverse.topStator, ['DI']);
    assert.deepEqual(TUTORIAL_LAYOUTS.inverse.slide, ['CI', 'C']);
    assert.deepEqual(TUTORIAL_LAYOUTS.folded.topStator, ['DF']);
    assert.deepEqual(TUTORIAL_LAYOUTS.folded.slide, ['CF', 'C']);
    assert.deepEqual(TUTORIAL_LAYOUTS['folded-inverse'].topStator, ['DF', 'DIF']);
    assert.deepEqual(TUTORIAL_LAYOUTS['folded-inverse'].slide, ['CIF']);
    const frozen = value => {
        if (!value || typeof value !== 'object') return;
        assert.ok(Object.isFrozen(value));
        Object.values(value).forEach(frozen);
    };
    frozen(INVERSE_FOLDED_LESSONS);
    for (const item of INVERSE_FOLDED_LESSONS) {
        assert.equal(item.sectionId, 'inverse-folded');
        for (const problem of [item.problem, item.practice.problem]) {
            assert.match(problem, /\d.*[×÷]/);
            assert.doesNotMatch(problem, /[=≈]/);
        }
        assert.notEqual(item.problem, item.practice.problem);
    }
});

for (const example of examples) {
    test(`${example.id}: all demonstration and practice readings match independent arithmetic`, () => {
        const item = lesson(example.id), read = instrument(item);
        for (const [kind, steps, answers] of [
            ['demonstration', item.steps, example.demo], ['practice', item.practice.steps, example.practice]
        ]) {
            assert.equal(steps.length, answers.length, `${kind}: no stage is omitted by the oracle`);
            for (let index = 0; index < steps.length; index++) {
                const step = steps[index], answer = answers[index];
                if (kind === 'demonstration')
                    assert.deepEqual([...step.readings].sort(), Object.keys(answer).sort());
                for (const [id, expected] of Object.entries(answer)) {
                    const context = `${item.id} ${kind} ${index + 1} ${id}`;
                    near(read.value(step.target, id), expected, context);
                    const display = read.display(step.target, id);
                    assert.equal(display.outside, false, `${context}: visible on the physical rule`);
                    assert.equal(display.texts.length, 1);
                    near(Number.parseFloat(display.texts[0]), expected, `${context}: displayed value`, 5e-4);
                }
            }
        }
    });
}

test('each stage moves exactly one named part and every practice requires an actual movement', () => {
    for (const item of INVERSE_FOLDED_LESSONS) {
        assert.equal(checkTutorialAlignment(item.practice.start, item.practice.steps[0]).passed, false, item.id);
        for (const [start, steps] of [[item.start, item.steps], [item.practice.start, item.practice.steps]]) {
            let previous = start;
            for (const step of steps) {
                const changed = ['cursor', 'slideOffset'].filter(field => step.target[field] !== previous[field]);
                assert.deepEqual(changed, [step.focus === 'slide' ? 'slideOffset' : 'cursor'], `${item.id}: ${step.title}`);
                assert.ok(Number.isFinite(step.target.cursor) && step.target.cursor >= 0 && step.target.cursor <= 1);
                assert.ok(Number.isFinite(step.target.slideOffset) && step.target.slideOffset >= -.9 && step.target.slideOffset <= .9);
                if (step.required) {
                    assert.equal(checkTutorialAlignment(step.target, step).passed, true);
                    for (const field of step.required) {
                        const wrong = { ...step.target, [field]: step.target[field] + .02 };
                        assert.deepEqual(checkTutorialAlignment(wrong, step), { passed: false, misses: [field] });
                    }
                }
                previous = step.target;
            }
        }
    }
});

test('DI keeps its reciprocal when CI moves; moving inverse answers require the slide constraint', () => {
    const item = lesson('fixed-reciprocals'), read = instrument(item);
    near(read.value(item.steps[0].target, 'DI'), read.value(item.steps[1].target, 'DI'), 'DI remains fixed');
    near(read.value(item.steps[1].target, 'CI'), 5, 'CI changes after displacement');
    assert.deepEqual(item.practice.steps[0].required, ['cursor']);
    const shifted = { ...item.practice.steps[0].target, slideOffset: .4 };
    assert.equal(checkTutorialAlignment(shifted, item.practice.steps[0]).passed, true);
    near(read.value(shifted, 'DI') / 10, 1 / 8, 'DI reciprocal is independent of the slide');
    for (const [id, scale] of [['fixed-reciprocals', 'CI'], ['folded-reciprocals', 'CIF']]) {
        const current = lesson(id), last = current.practice.steps.at(-1), currentRead = instrument(current);
        assert.deepEqual([...last.required].sort(), ['cursor', 'slideOffset']);
        const wrong = { ...last.target, slideOffset: .1 };
        assert.deepEqual(checkTutorialAlignment(wrong, last), { passed: false, misses: ['slideOffset'] });
        assert.ok(Math.abs(currentRead.value(wrong, scale) - currentRead.value(last.target, scale)) > .1);
    }
});

test('CI arithmetic uses the physical right-hand 1 and preserves the aligned product', () => {
    for (const [id, expected] of [['inverse-arithmetic', 6], ['inverse-chain', 6]]) {
        const item = lesson(id), read = instrument(item);
        const atIndex = item.steps[2].target;
        if (id === 'inverse-arithmetic') {
            near(read.point(item.steps[1].target, 'CI').p, 1, 'CI 1 is at its physical right end');
            for (const step of item.steps.slice(1))
                near(read.value(step.target, 'CI') * read.value(step.target, 'D'), expected, 'constant CI × D product');
        } else {
            near(read.point(atIndex, 'CI').p, 1, 'intermediate CI 1 is the physical right end');
            near(read.value(item.steps[1].target, 'CI') * read.value(item.steps[1].target, 'D'), 2 * 3, 'first two factors');
            near(read.value(item.steps.at(-1).target, 'D') * 10, 2 * 3 * 4, 'three-factor demonstration');
            near(read.value(item.practice.steps.at(-1).target, 'D') * 10, 3 * 2 * 5, 'different three-factor practice');
        }
    }
    const inverse = makeRuntimeScale(BUILTIN_SCALES.CI);
    near(inverse.value(0), 10, 'CI left index');
    near(inverse.value(1), 1, 'CI right index');
});

test('folded multiplication replaces the off-end ordinary setup with visible factors', () => {
    const item = lesson('folded-multiply'), read = instrument(item);
    const ordinary = item.steps[1].target;
    assert.ok(ordinary.slideOffset + Math.log10(3) > 1, 'C 3 really is beyond the fixed rule after C 1 meets D 4');
    for (const [steps, expected] of [[item.steps, 4 * 3], [item.practice.steps, 6 * 2.5]]) {
        const setup = steps.at(-2).target, result = steps.at(-1).target;
        near(read.point(setup, 'CF').p, 1 - Math.log10(Math.PI), 'the setup uses the interior unit mark');
        assert.equal(setup.slideOffset, result.slideOffset, 'only the cursor moves to the second factor');
        near(read.value(result, 'DF') * 10, expected, 'estimated decade restores the product');
        read.point(result, 'CF');
        read.point(result, 'DF');
    }
});

test('folded division reads the interior unit index, and pi cross-readings retain their decimal factor', () => {
    const divided = lesson('folded-divide'), division = instrument(divided);
    for (const [steps, expected] of [[divided.steps, 8 / 2], [divided.practice.steps, 9 / 2]]) {
        const last = steps.at(-1).target;
        near(division.point(last, 'CF').p, 1 - Math.log10(Math.PI), 'quotient is read at the interior unit index');
        near(division.value(last, 'CF'), 1, 'the interior mark reads 1');
        near(division.value(last, 'DF'), expected, 'ordinary division answer');
    }
    const pi = lesson('multiply-pi'), cross = instrument(pi);
    for (const [step, input, decade] of [
        [pi.steps[0], 2, 1], [pi.steps[1], 3, 1], [pi.steps[2], 4, 10], [pi.practice.steps[0], 5, 10]
    ]) {
        near(cross.value(step.target, 'DF') * decade, input * Math.PI, 'fixed pi multiplication');
        near(cross.value(step.target, 'CF') * decade, input * Math.PI, 'aligned moving pi multiplication');
    }
});

test('folded physical ends, interior indexes and both sides of the decimal break agree with the engraving', () => {
    const cut = 1 - Math.log10(Math.PI);
    for (const id of ['CF', 'DF', 'CIF', 'DIF']) {
        const def = BUILTIN_SCALES[id], rt = makeRuntimeScale(def), inverse = id.includes('I');
        const ticks = generateTicks(def, rt, 1600, 1.65, { graduationMode: 'conventional' });
        const endpoint = inverse ? 10 / Math.PI : Math.PI;
        const label = inverse ? '10/π' : 'π';
        for (const p of [0, 1]) {
            near(rt.value(p), endpoint, `${id}: the physical end is not unity`);
            assert.ok(ticks.some(tick => tick.pos === p && tick.label === label), `${id}: ${label} is engraved at end ${p}`);
        }
        const unit = ticks.find(tick => tick.label === (inverse ? '1 | 10' : '10 | 1'));
        assert.ok(unit, `${id}: interior unit index is engraved`);
        near(unit.pos, cut, `${id}: unit index is inside the rail`);
        near(rt.value(cut), 1, `${id}: exact chosen unit position`);
        const before = rt.value(cut - 1e-8), after = rt.value(cut + 1e-8);
        assert.ok(inverse ? before < 1.000001 && after > 9.99999 : before > 9.99999 && after < 1.000001,
            `${id}: folded decimal direction agrees with its index label`);
        for (const p of [cut - 1e-8, cut, cut + 1e-8])
            assert.equal(scaleReadings(def, p, BUILTIN_SCALES).outside, false);
    }
    for (const p of [.1, .4, .8]) {
        near(makeRuntimeScale(BUILTIN_SCALES.DF).value(p) * makeRuntimeScale(BUILTIN_SCALES.DIF).value(p), 10,
            'fixed folded reciprocal product');
        near(makeRuntimeScale(BUILTIN_SCALES.CF).value(p) * makeRuntimeScale(BUILTIN_SCALES.CIF).value(p), 10,
            'moving folded reciprocal product');
    }
});
