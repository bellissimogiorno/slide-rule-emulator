/** Course structure, physical targets and practice policy use real mappings.
 * Independent numeric examples also live in tutorial-course-math.test.js.
 * These checks establish data contracts, not native animation or pedagogy.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { TUTORIAL_LESSONS, checkTutorialAlignment } from '#tutorial/lessons.js';
import { TUTORIAL_SECTIONS, TUTORIAL_PRIMARY_SCALE_IDS } from '#tutorial/course.js';
import { createTutorialProgramme, TUTORIAL_LAYOUTS } from '#tutorial/programme.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { makeRuntimeScale } from '#core/mappings.js';

const C = makeRuntimeScale(BUILTIN_SCALES.C), D = makeRuntimeScale(BUILTIN_SCALES.D);
const lesson = id => TUTORIAL_LESSONS.find(item => item.id === id);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10,
    `${actual} differs from ${expected}`);
const readings = target => ({
    C: C.value(target.cursor - target.slideOffset), D: D.value(target.cursor)
});

// This is an independently agreed teaching scope, not a set derived from the
// lesson data being checked. Only the explicitly listed maker-specific scales
// are included; this is not every catalogue alias or historical instrument.
const PRIMARY_SCALE_IDS = [
    'C', 'D', 'A', 'B', 'K', 'CI', 'DI', 'CF', 'DF', 'CIF', 'DIF',
    'R1', 'R2', 'Q1', 'Q2', 'Q3', 'L',
    'LL0', 'LL1', 'LL2', 'LL3', 'LL4', 'LL00', 'LL01', 'LL02', 'LL03', 'LL04',
    'S', 'T1', 'T2', 'ST', 'P', 'H1', 'H2', 'SH1', 'SH2', 'CH', 'TH',
    'LN', 'CFM', 'DFM', 'W1', 'W2', 'W1P', 'W2P', 'PS', 'SD', 'TD', 'ISD', 'ITD'
];

function physicalTarget(target, context) {
    assert.deepEqual(Object.keys(target).sort(), ['cursor', 'slideOffset'], context);
    assert.ok(Number.isFinite(target.slideOffset) && target.slideOffset >= -.9 && target.slideOffset <= .9,
        `${context}: slide offset stays in its physical limits`);
    assert.ok(Number.isFinite(target.cursor) && target.cursor >= 0 && target.cursor <= 1,
        `${context}: cursor stays on the instrument`);
}

function singleMovement(previous, step, context) {
    const changed = ['slideOffset', 'cursor'].filter(field => step.target[field] !== previous[field]);
    assert.equal(changed.length, 1, `${context}: one instruction moves one part`);
    assert.equal(changed[0], step.focus === 'slide' ? 'slideOffset' : 'cursor',
        `${context}: focus names the moving part`);
    assert.ok(Math.abs(step.target[changed[0]] - previous[changed[0]]) > 1e-10,
        `${context}: movement is more than floating-point noise`);
}

function explicitQuestion(problem, context) {
    assert.equal(typeof problem, 'string', `${context}: a visible problem is explicit`);
    assert.ok(problem.trim().length >= 4, `${context}: problem is not empty`);
    assert.match(problem, /\d/, `${context}: problem names its numerical input`);
}

test('all immutable lessons keep every demonstration within physical motion limits', () => {
    assert.ok(TUTORIAL_LESSONS.length >= 20);
    assert.equal(new Set(TUTORIAL_LESSONS.map(item => item.id)).size, TUTORIAL_LESSONS.length);
    assert.ok(Object.isFrozen(TUTORIAL_LESSONS));
    for (const item of TUTORIAL_LESSONS) {
        assert.ok(Object.isFrozen(item));
        assert.ok(item.title && item.summary && item.practice.intro);
        explicitQuestion(item.problem, `${item.id}: demonstration`);
        explicitQuestion(item.practice.problem, `${item.id}: practice`);
        assert.ok(Object.hasOwn(TUTORIAL_LAYOUTS, item.layout));
        assert.ok(item.steps.length && item.practice.steps.length);
        physicalTarget(item.start, `${item.id}: start`);
        physicalTarget(item.practice.start, `${item.id}: practice start`);
        let previous = item.start;
        for (const step of item.steps) {
            assert.ok(Object.isFrozen(step.target));
            assert.ok(step.title && step.text);
            assert.ok(Number.isFinite(step.duration) && step.duration > 0);
            assert.ok(['slide', 'cursor'].includes(step.focus));
            assert.ok(step.readings.length > 0);
            assert.equal(new Set(step.readings).size, step.readings.length);
            physicalTarget(step.target, `${item.id}: ${step.title}`);
            singleMovement(previous, step, `${item.id}: ${step.title}`);
            previous = step.target;
        }
        for (const step of item.practice.steps) {
            assert.ok(Object.isFrozen(step.required));
            assert.ok(step.title && step.text && step.success);
            assert.equal(new Set(step.required).size, step.required.length);
            physicalTarget(step.target, `${item.id}: practice ${step.title}`);
            assert.deepEqual(checkTutorialAlignment(step.target, step), { passed: true, misses: [] });
        }
    }
});

test('named sections of variable length flatten without copies or duplicates', () => {
    assert.ok(Object.isFrozen(TUTORIAL_SECTIONS));
    assert.equal(new Set(TUTORIAL_SECTIONS.map(section => section.id)).size, TUTORIAL_SECTIONS.length);
    assert.deepEqual(TUTORIAL_SECTIONS[0].lessons.map(item => item.id),
        ['read', 'multiply', 'divide', 'right-index']);
    let index = 0;
    for (const section of TUTORIAL_SECTIONS) {
        assert.ok(Object.isFrozen(section));
        assert.ok(Object.isFrozen(section.lessons));
        assert.ok(section.id && section.title && section.summary);
        assert.ok(section.lessons.length > 0);
        for (const item of section.lessons) {
            assert.equal(item.sectionId, section.id);
            assert.strictEqual(item, TUTORIAL_LESSONS[index++]);
        }
    }
    assert.equal(index, TUTORIAL_LESSONS.length);
});

test('every explicitly narrated scale is physically present and inside its real runtime domain', () => {
    for (const item of TUTORIAL_LESSONS) {
        const programme = createTutorialProgramme(item.start, item.layout);
        const side = programme.sides[programme.activeSide];
        for (const step of [...item.steps, ...item.practice.steps.filter(step => step.readings)]) {
            for (const id of step.readings) {
                const rails = ['topStator', 'slide', 'bottomStator'].filter(rail => side[rail].includes(id));
                assert.equal(rails.length, 1, `${item.id}: ${id} exists once in ${item.layout}`);
                assert.ok(Object.hasOwn(BUILTIN_SCALES, id), `${item.id}: ${id} is a genuine catalogue scale`);
                const runtime = makeRuntimeScale(BUILTIN_SCALES[id]);
                const p = step.target.cursor - (rails[0] === 'slide' ? step.target.slideOffset : 0);
                assert.ok(p >= runtime.pMin - 1e-10 && p <= runtime.pMax + 1e-10,
                    `${item.id}: ${id} is readable at the narrated target`);
                assert.ok(Number.isFinite(runtime.value(p)));
            }
        }
    }
});

test('the worked course explicitly teaches every agreed primary scale, including each LL and root branch', () => {
    assert.ok(Object.isFrozen(TUTORIAL_PRIMARY_SCALE_IDS));
    assert.deepEqual([...TUTORIAL_PRIMARY_SCALE_IDS].sort(), [...PRIMARY_SCALE_IDS].sort(),
        'The declared course scope agrees with the independently specified scale list');
    const narrated = new Set(TUTORIAL_LESSONS.flatMap(item => item.steps.flatMap(step => step.readings)));
    assert.deepEqual(PRIMARY_SCALE_IDS.filter(id => !narrated.has(id)), [],
        'A row merely present in a profile does not count as teaching that scale');
});

test('new subjects ask distinct practice problems and every practice stage moves one checked part', () => {
    for (const item of TUTORIAL_LESSONS) {
        let previous = item.practice.start;
        for (const step of item.practice.steps) {
            assert.ok(['slide', 'cursor'].includes(step.focus));
            singleMovement(previous, step, `${item.id}: practice ${step.title}`);
            assert.ok(step.required.includes(step.focus === 'slide' ? 'slideOffset' : 'cursor'),
                `${item.id}: practice checks the coordinate it asks the learner to move`);
            assert.equal(checkTutorialAlignment(previous, step).passed, false,
                `${item.id}: the previous stage cannot already solve the next practice target`);
            previous = step.target;
        }
        if (item.sectionId !== 'basics')
            // Different root branches or LL ranges can answer different
            // questions at the same coordinate. Compare the actual problem,
            // not merely the cursor's last position.
            assert.notEqual(item.practice.problem, item.problem,
                `${item.id}: practice asks a different mathematical question`);
    }
});

test('reading lesson shows D 2 then D 3 and asks for D 4', () => {
    const item = lesson('read');
    close(readings(item.steps[0].target).D, 2);
    close(readings(item.steps[1].target).D, 3);
    close(readings(item.practice.steps[0].target).D, 4);
});

test('practice focus identifies the part to move rather than every alignment constraint', () => {
    assert.deepEqual(TUTORIAL_SECTIONS[0].lessons.map(item => item.practice.steps.map(step => step.focus)), [
        ['cursor'], ['slide', 'cursor'], ['cursor', 'slide', 'cursor'], ['slide', 'cursor']
    ]);
    assert.match(lesson('right-index').practice.note, /check verifies alignment/);
    assert.match(lesson('right-index').practice.note, /decimal place yourself/);
});

test('slide-first practice starts mark the alignment number without completing the exercise', () => {
    for (const [id, value] of [['multiply', 2], ['right-index', 4]]) {
        const item = lesson(id);
        close(readings(item.practice.start).D, value);
        assert.equal(item.practice.start.slideOffset, 0);
        assert.equal(item.practice.start.cursor, item.practice.steps[0].target.cursor);
        assert.match(item.practice.steps[0].text, new RegExp(`hairline marks ${value} on D`));
    }
    for (const item of TUTORIAL_LESSONS)
        assert.equal(checkTutorialAlignment(item.practice.start, item.practice.steps[0]).passed, false,
            `${item.id}: practice must require an actual movement`);
    assert.deepEqual(lesson('read').practice.start, { slideOffset: 0, cursor: 0 });
    assert.deepEqual(lesson('divide').practice.start, { slideOffset: 0, cursor: 0 });
});

test('multiplication first aligns C 1 with D 2, then C 3 with D 6', () => {
    const item = lesson('multiply');
    close(readings(item.steps[0].target).D, 2);
    const setup = readings(item.steps[1].target), result = readings(item.steps[2].target);
    close(setup.C, 1); close(setup.D, 2);
    close(result.C, 3); close(result.D, 6);
    const practice = readings(item.practice.steps.at(-1).target);
    close(practice.C, 3); close(practice.D, 6);
});

test('division holds D 6 while aligning C 2, then reads D 3 at C 1', () => {
    const item = lesson('divide');
    close(readings(item.steps[0].target).D, 6);
    const setup = readings(item.steps[1].target), result = readings(item.steps[2].target);
    close(setup.C, 2); close(setup.D, 6);
    close(result.C, 1); close(result.D, 3);
    close(item.steps[0].target.cursor, item.steps[1].target.cursor);
    const practice = readings(item.practice.steps.at(-1).target);
    close(practice.C, 1); close(practice.D, 3);
});

test('end-index lesson demonstrates the off-rule alignment and the factor-of-ten result', () => {
    const item = lesson('right-index');
    const leftSetup = item.steps[1].target;
    close(readings(leftSetup).C, 1);
    close(readings(leftSetup).D, 4);
    assert.ok(leftSetup.slideOffset + C.pos(3) > 1, 'C 3 is genuinely beyond D\'s right end');
    const rightSetup = readings(item.steps[2].target), result = readings(item.steps[3].target);
    close(rightSetup.C, 10); close(rightSetup.D, 4);
    close(result.C, 3); close(result.D, 1.2); close(result.D * 10, 12);
    const practice = readings(item.practice.steps.at(-1).target);
    close(practice.C, 3); close(practice.D * 10, 12);
});

test('reading practice ignores an irrelevant slide coordinate but rejects a missing cursor', () => {
    const step = lesson('read').practice.steps[0];
    assert.deepEqual(checkTutorialAlignment({ cursor: step.target.cursor, slideOffset: NaN }, step),
        { passed: true, misses: [] });
    assert.deepEqual(checkTutorialAlignment({}, step), { passed: false, misses: ['cursor'] });
});

test('practice accepts the tolerance boundary and rejects independently wrong slide or cursor', () => {
    const step = lesson('multiply').practice.steps.at(-1), target = step.target;
    for (const field of step.required) {
        for (const direction of [-1, 1]) {
            assert.equal(checkTutorialAlignment({ ...target, [field]: target[field] + direction * .004 }, step).passed, true);
            assert.deepEqual(checkTutorialAlignment({ ...target, [field]: target[field] + direction * .0041 }, step),
                { passed: false, misses: [field] });
        }
        for (const invalid of [NaN, Infinity, -Infinity, undefined, '0.3'])
            assert.deepEqual(checkTutorialAlignment({ ...target, [field]: invalid }, step),
                { passed: false, misses: [field] });
    }
    assert.deepEqual(checkTutorialAlignment({ slideOffset: 0, cursor: 0 }, step),
        { passed: false, misses: ['slideOffset', 'cursor'] });
});

test('practice policy rejects invalid tolerance, unsupported fields and nonfinite targets', () => {
    const step = lesson('divide').practice.steps.at(-1);
    for (const tolerance of [-1, NaN, Infinity, '0.004'])
        assert.throws(() => checkTutorialAlignment(step.target, step, tolerance), RangeError);
    assert.equal(checkTutorialAlignment(step.target, step, 0).passed, true);
    for (const required of [undefined, [], ['answer'], ['cursor', 'answer']])
        assert.throws(() => checkTutorialAlignment(step.target, { ...step, required }), TypeError);
    assert.deepEqual(checkTutorialAlignment(step.target,
        { ...step, target: { ...step.target, cursor: Infinity } }),
        { passed: false, misses: ['cursor'] });
});
