/** Independent arithmetic oracle for the Faber-Castell W course. Every input,
 * result and intermediate reading is an ordinary numerical worked answer,
 * rather than a value derived from the lesson's authored coordinates.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { FABER_W_LESSONS } from '#tutorial/lessons/faber-w.js';
import { checkTutorialAlignment } from '#tutorial/lessons.js';
import { createTutorialProgramme, TUTORIAL_LAYOUTS } from '#tutorial/programme.js';
import { buildLibrary } from '#model/program.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { scaleReadings } from '#ui/readout-values.js';
import { renderReadout } from '#ui/readout.js';

const examples = [
    { id: 'faber-w-read',
        demo: [{ W1: 2, W2: Math.sqrt(40), W1P: 2, W2P: Math.sqrt(40), D: 4 },
            { W1: Math.sqrt(2.5), W2: 5, W2P: 5, D: 2.5 }, { W1: 3, D: 9 }],
        practice: [{ W1: 2.5, W2: Math.sqrt(62.5), W1P: 2.5, W2P: Math.sqrt(62.5), D: 6.25 },
            { W2: 7, D: 4.9 }] },
    { id: 'faber-w-multiply',
        demo: [{ W1: 1.5 }, { W1P: 1, W1: 1.5 }, { W2P: 4, W2: 1.5 * 4 }],
        practice: [{ W1: 1.6 }, { W1P: 1, W1: 1.6 }, { W2P: 4.5, W2: 1.6 * 4.5 }] },
    { id: 'faber-w-cross-multiply',
        demo: [{ W1: 1.8 }, { W1P: 1, W1: 1.8 }, { W1P: Math.sqrt(10), W1: 1.8 },
            { W2P: 7.5, W1: (1.8 * 7.5) / 10 }],
        practice: [{ W1: 1.9 }, { W1P: Math.sqrt(10), W1: 1.9 }, { W2P: 8, W1: (1.9 * 8) / 10 }] },
    { id: 'faber-w-divide',
        demo: [{ W2: 6 }, { W2P: 4, W2: 6 }, { W1P: 1, W1: 6 / 4 }],
        practice: [{ W2: 7.5 }, { W2P: 3.5, W2: 7.5 }, { W1P: 1, W1: 7.5 / 3.5 }] },
    { id: 'faber-w-cross-divide',
        demo: [{ W1: 13.5 / 10 }, { W2P: 7.5, W1: 13.5 / 10 }, { W1P: Math.sqrt(10), W1: 13.5 / 7.5 }],
        practice: [{ W1: 17.6 / 10 }, { W2P: 8, W1: 17.6 / 10 }, { W1P: Math.sqrt(10), W1: 17.6 / 8 }] },
    { id: 'faber-w-geometric-mean',
        demo: [{ W1: 2 }, { W1P: 1, W1: 2 }, { W2P: 4.5, W2: 2 * 4.5 },
            { W1: Math.sqrt(2 * 4.5), D: 2 * 4.5 }],
        practice: [{ W1: 1.6 }, { W1P: 1, W1: 1.6 }, { W2P: 4, W2: 1.6 * 4 },
            { W1: Math.sqrt(1.6 * 4), D: 1.6 * 4 }] }
];

const lesson = id => FABER_W_LESSONS.find(item => item.id === id);
const near = (actual, expected, context, tolerance = 1e-11) =>
    assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
        `${context}: expected ${expected}, received ${actual}`);

function instrument(item) {
    const programme = createTutorialProgramme(item.start, item.layout);
    const side = programme.sides.front, library = buildLibrary(programme);
    const point = (target, id) => {
        const rails = ['topStator', 'slide', 'bottomStator'].filter(name => side[name].includes(id));
        assert.equal(rails.length, 1, `${item.id}: ${id} appears exactly once on the real programme`);
        assert.ok(Object.hasOwn(BUILTIN_SCALES, id), `${id}: genuine built-in scale`);
        const p = target.cursor - (rails[0] === 'slide' ? target.slideOffset : 0);
        const rt = makeRuntimeScale(library[id]);
        assert.ok(p >= rt.pMin - 1e-10 && p <= rt.pMax + 1e-10, `${item.id}: ${id} lies on its physical row`);
        return { p, rt };
    };
    return {
        point,
        value: (target, id) => { const { p, rt } = point(target, id); return rt.value(p); },
        display: (target, id) => {
            const reading = scaleReadings(library[id], point(target, id).p, library);
            Object.assign(programme, target);
            const html = renderReadout(programme, library);
            const card = html.match(new RegExp(`data-readout-scale="${id}"><span[^>]*>[^<]*</span><div class="value">([^<]*)</div>`));
            assert.ok(card, `${item.id}: ${id} has a rendered scalar readout card`);
            assert.equal(card[1], reading.texts[0], `${id}: the rendered card uses the actual scale reading`);
            return reading;
        }
    };
}

test('six immutable W lessons use the manufacturer’s adjacent fixed and moving pairs', () => {
    assert.deepEqual(FABER_W_LESSONS.map(item => item.id), examples.map(example => example.id));
    const profile = TUTORIAL_LAYOUTS['faber-w'];
    assert.deepEqual(profile.topStator, ['W2']);
    assert.deepEqual(profile.slide, ['W2P', 'W1P']);
    assert.deepEqual(profile.bottomStator, ['W1', 'D']);
    const frozen = value => {
        if (!value || typeof value !== 'object') return;
        assert.ok(Object.isFrozen(value));
        Object.values(value).forEach(frozen);
    };
    frozen(FABER_W_LESSONS);
    for (const item of FABER_W_LESSONS) {
        assert.equal(item.sectionId, 'faber-w');
        assert.equal(item.layout, 'faber-w');
        assert.ok(item.problem.includes('?') && item.practice.problem.includes('?'));
        assert.notEqual(item.problem, item.practice.problem);
        assert.notDeepEqual(item.steps.at(-1).target, item.practice.steps.at(-1).target);
    }
});

for (const example of examples) {
    test(`${example.id}: every demonstration and practice reading matches independent arithmetic`, () => {
        const item = lesson(example.id), read = instrument(item);
        for (const [kind, steps, answers] of [
            ['demo', item.steps, example.demo], ['practice', item.practice.steps, example.practice]
        ]) {
            assert.equal(steps.length, answers.length, `${item.id}: the oracle covers every ${kind} stage`);
            for (let index = 0; index < steps.length; index++) {
                const step = steps[index], answer = answers[index];
                assert.deepEqual([...step.readings].sort(), Object.keys(answer).sort(),
                    `${item.id}: the oracle covers every declared ${kind} reading`);
                for (const [id, expected] of Object.entries(answer)) {
                    const context = `${item.id} ${kind} ${index + 1} ${id}`;
                    near(read.value(step.target, id), expected, context);
                    const display = read.display(step.target, id);
                    assert.equal(display.outside, false, `${context}: physically visible`);
                    assert.equal(display.texts.length, 1);
                    near(Number(display.texts[0]), expected, `${context}: useful-precision visible answer`, 5e-4);
                }
            }
        }
    });
}

test('every motion changes one part, requires movement and checks each constrained coordinate', () => {
    for (const item of FABER_W_LESSONS) {
        for (const [kind, start, steps] of [['demo', item.start, item.steps], ['practice', item.practice.start, item.practice.steps]]) {
            let previous = start;
            for (const step of steps) {
                const context = `${item.id} ${kind}: ${step.title}`;
                const changed = ['cursor', 'slideOffset'].filter(field => step.target[field] !== previous[field]);
                assert.deepEqual(changed, [step.focus === 'slide' ? 'slideOffset' : 'cursor'], context);
                assert.ok(Math.abs(step.target[changed[0]] - previous[changed[0]]) > 1e-10, context);
                assert.ok(Number.isFinite(step.target.cursor) && step.target.cursor >= 0 && step.target.cursor <= 1);
                assert.ok(Number.isFinite(step.target.slideOffset) && step.target.slideOffset >= -.9 && step.target.slideOffset <= .9);
                if (kind === 'practice') {
                    assert.ok(step.required.includes(changed[0]), `${context}: check the part named in the instruction`);
                    assert.equal(checkTutorialAlignment(previous, step).passed, false, `${context}: requires a new movement`);
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

test('W rows double logarithmic distances and meet at sqrt(10) on opposite physical ends', () => {
    const d = makeRuntimeScale(BUILTIN_SCALES.D);
    for (const [id, a, b] of [['W1', 1.25, 2.5], ['W2', 4, 8]]) {
        const rt = makeRuntimeScale(BUILTIN_SCALES[id]);
        near(rt.pos(b) - rt.pos(a), 2 * (d.pos(b) - d.pos(a)), `${id}: twice the ordinary logarithmic distance`);
    }
    for (const [id, start, end] of [['W1', 1, Math.sqrt(10)], ['W1P', 1, Math.sqrt(10)],
        ['W2', Math.sqrt(10), 10], ['W2P', Math.sqrt(10), 10]]) {
        const def = BUILTIN_SCALES[id], rt = makeRuntimeScale(def);
        near(rt.value(0), start, `${id}: left endpoint`);
        near(rt.value(1), end, `${id}: right endpoint`);
        const ticks = generateTicks(def, rt, 1600, 1.65,
            { graduationMode: 'conventional', logGraduations: 'standard', fullPrecision: false });
        for (const [p, value] of [[0, start], [1, end]]) {
            assert.ok(ticks.some(tick => tick.pos === p && Math.abs(tick.value - value) < 1e-11));
            if (Math.abs(value - Math.sqrt(10)) < 1e-11)
                assert.ok(ticks.some(tick => tick.pos === p && tick.label === '3.162'), `${id}: visible dividing-index caption`);
        }
    }
});

test('ordinary W arithmetic uses twice the C/D slide displacement and the adjacent branch', () => {
    for (const [id, first, second, answer] of [['faber-w-multiply', 1.5, 4, 6], ['faber-w-divide', 1.5, 4, 6]]) {
        const item = lesson(id), read = instrument(item), setting = item.steps[1].target;
        near(setting.slideOffset, 2 * Math.log10(first), `${id}: doubled slide displacement`);
        assert.ok(Math.abs(setting.slideOffset - Math.log10(first)) > .1, 'a C/D displacement would be wrong');
        const aligned = id === 'faber-w-multiply' ? item.steps.at(-1).target : setting;
        near(read.value(aligned, 'W2P'), second, `${id}: second factor or divisor`);
        near(read.value(aligned, 'W2'), answer, `${id}: adjacent fixed value`);
        near(read.value(item.steps.at(-1).target, id === 'faber-w-multiply' ? 'W2' : 'W1'),
            id === 'faber-w-multiply' ? 1.5 * 4 : 6 / 4, `${id}: ordinary arithmetic`);
    }
});

test('the dividing index keeps the crossed multiplication visible and requires the opposite fixed branch', () => {
    const item = lesson('faber-w-cross-multiply'), read = instrument(item);
    assert.ok(item.steps[1].target.slideOffset + makeRuntimeScale(BUILTIN_SCALES.W2P).pos(7.5) > 1,
        'the demonstrated ordinary-index setting really puts the second factor beyond the fixed rule');
    for (const [steps, expected] of [[item.steps, 1.8 * 7.5], [item.practice.steps, 1.9 * 8]]) {
        const setup = steps.at(-2).target, result = steps.at(-1).target;
        near(read.point(setup, 'W1P').p, 1, 'use the physical right-hand endpoint of W₁′');
        near(read.value(setup, 'W1P'), Math.sqrt(10), 'the dividing index is sqrt(10), not 1 or 10');
        near(read.value(result, 'W1') * 10, expected, 'opposite-branch reading with the estimated decade');
        near(read.value(result, 'W2') / read.value(result, 'W1'), Math.sqrt(10), 'the adjacent branch would add sqrt(10)');
        assert.ok([.1, 1, 10, 100].every(decade => Math.abs(read.value(result, 'W2') * decade - expected) > .1),
            'decimal placement cannot repair the wrong fixed branch');
        assert.equal(setup.slideOffset, result.slideOffset);
    }
});

test('opposite-branch W division reads the quotient at the dividing index with its correct decimal', () => {
    const item = lesson('faber-w-cross-divide'), read = instrument(item);
    for (const [steps, numerator, denominator] of [[item.steps, 13.5, 7.5], [item.practice.steps, 17.6, 8]]) {
        const setup = steps[1].target, last = steps.at(-1).target;
        near(read.value(setup, 'W1') * 10, numerator, 'restored dividend decade');
        near(read.value(setup, 'W2P'), denominator, 'opposite moving divisor');
        near(read.point(last, 'W1P').p, 1, 'the quotient uses W₁′’s right dividing index');
        near(read.value(last, 'W1'), numerator / denominator, 'the independently calculated quotient');
        assert.ok(setup.slideOffset < 0, 'W₁′’s ordinary left-hand 1 is off the fixed rule at this setting');
        assert.equal(setup.slideOffset, last.slideOffset);
    }
});

test('geometric means transfer the W product to D before taking its root on fixed W₁', () => {
    const item = lesson('faber-w-geometric-mean'), read = instrument(item);
    for (const [steps, a, b] of [[item.steps, 2, 4.5], [item.practice.steps, 1.6, 4]]) {
        const product = steps.at(-2).target, root = steps.at(-1).target;
        near(read.value(product, 'W2'), a * b, 'completed W product');
        near(read.value(root, 'D'), a * b, 'the product is explicitly transferred to D');
        near(read.value(root, 'W1'), Math.sqrt(a * b), 'the ordinary geometric mean');
        assert.ok(Math.abs(read.value(product, 'W1') - Math.sqrt(a * b)) > .1,
            'reading W₁ without transferring the cursor would be wrong');
        assert.equal(product.slideOffset, root.slideOffset);
    }
    const fixedStep = item.practice.steps.at(-1), shifted = { ...fixedStep.target, slideOffset: -.2 };
    assert.deepEqual(fixedStep.required, ['cursor']);
    assert.equal(checkTutorialAlignment(shifted, fixedStep).passed, true);
    near(read.value(shifted, 'W1'), Math.sqrt(1.6 * 4), 'the final fixed root is independent of slide position');
});

test('representative W readout captions retain the endpoint, branch and answer digits', () => {
    for (const [id, kind, index, scale, text] of [
        ['faber-w-read', 'demo', 0, 'W2', '6.325'],
        ['faber-w-read', 'demo', 1, 'W2', '5'],
        ['faber-w-read', 'practice', 1, 'D', '4.9'],
        ['faber-w-cross-multiply', 'demo', 2, 'W1P', '3.162'],
        ['faber-w-cross-multiply', 'demo', 3, 'W1', '1.35'],
        ['faber-w-divide', 'practice', 2, 'W1', '2.143'],
        ['faber-w-geometric-mean', 'practice', 3, 'W1', '2.53']
    ]) {
        const item = lesson(id), steps = kind === 'demo' ? item.steps : item.practice.steps;
        assert.deepEqual(instrument(item).display(steps[index].target, scale).texts, [text], `${id} ${kind} ${scale}`);
    }
});
