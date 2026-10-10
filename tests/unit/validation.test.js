import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { MathExpressions } from '#core/expressions.js';
import { validateProgram, parseProgramText } from '#model/validation.js';
import { programme, rail, close } from './helpers.js';
const square = { id: 'X', type: 'expression', min: 1, max: 100, pos: 'log10(x)/2', value: '10^(2*p)' };
for (const [description, definition] of [
    ['missing hyperbolic numeric bounds', { id: 'X', type: 'sinhLow', tickMode: 'mapped' }],
    ['incompatible unbounded temperature loop', { id: 'X', type: 'linear', min: -1e20, max: 1e20, tickMode: 'temperature' }],
    ['expression declares only half its readable values', { ...square, max: 5 }],
    ['off-grid noninverse expression', { id: 'X', type: 'expression', min: 0, max: 1, pos: 'x', value: 'p+0.01*sin(128*PI*p)', tickMode: 'linear' }],
    ['unbounded linear work', { id: 'X', type: 'linear', min: 0, max: 1, majorStep: 1e-20 }],
    ['singular expression', { ...square, value: '1/(p-0.5)' }],
    ['unknown mapping', { id: 'X', type: 'bananas', min: 1, max: 10 }],
    ['reversed generic bounds', { id: 'X', type: 'linear', min: 10, max: 1 }],
    ['nonpositive log domain', { id: 'X', type: 'log', min: 0, max: 10 }],
    ['out-of-range manual tick', { id: 'X', type: 'log', min: 1, max: 10, ticks: [{ value: 20 }] }],
    ['invalid branch', { id: 'X', type: 'root', order: 5, branch: 5 }],
    ['too many decades', { id: 'X', type: 'log', min: 1e-30, max: 1e30 }],
    ['ignored custom temperature calibration', { id: 'X', type: 'temperature', minTemperature: 200, maxTemperature: 2000 }],
    ['noninteger subdivisions', { id: 'X', type: 'linear', min: 0, max: 1, minorDivisions: 2.5 }],
    ['unknown ink', { id: 'X', type: 'log', min: 1, max: 10, tone: 'script' }],
    ['string numeric bounds', { id: 'X', type: 'log', min: '1', max: 10 }],
    ['nested composite', { id: 'X', type: 'composite', layers: ['T'] }],
    ['three physical subrows', { id: 'X', type: 'composite', layers: ['C', 'D', 'CI'] }],
    ['missing paired component', { id: 'X', type: 'composite', layers: ['DOES_NOT_EXIST'] }],
    ['paired LL inside paired row', { id: 'X', type: 'composite', layers: ['PN3_LL0'] }],
])
    test(`validation rejects ${description}`, () => assert.throws(() => validateProgram(programme(definition))));
for (const expression of [
    'globalThis', 'window.alert(1)', 'this', 'x.constructor', 'Math.constructor(1)', 'Function(1)', 'eval(1)',
    'Math.random()', 'fetch(1)', 'x=2', 'x;1', '[1][0]', '({a:1})', 'x ? 1 : 0', 'import(1)',
    'sin()', 'pow(2)', 'pow(2,3,4)', 'min()', '1e999', 'unknown(x)', 'sin(x).constructor',
])
    test(`expression parser rejects ${expression}`, () => assert.throws(() => MathExpressions.compile(expression, 'x')));
for (const [expression, value] of [['-2^2', -4], ['(-2)^2', 4], ['2^3^2', 512], ['2**3', 8], ['Math.log10(100)', 2], ['sqrt(9)+cbrt(8)', 5], ['min(2,3)+max(4,5)', 7], ['atan2(1,1)', Math.PI / 4], ['hypot(3,4)', 5]]) {
    test(`expression arithmetic: ${expression}`, () => close(MathExpressions.compile(expression, 'x')(0), value));
}
test('parser bounds expression size, depth and token count', () => {
    for (const s of ['1'.repeat(1025), '('.repeat(60) + 'x' + ')'.repeat(60), Array(140).fill('1').join('+')])
        assert.throws(() => MathExpressions.compile(s, 'x'));
});
test('valid custom expressions and Math-qualified syntax are accepted', () => validateProgram(programme({ ...square, pos: 'Math.log10(x)/2', value: 'Math.pow(10,2*p)' })));
test('prototype keys, duplicate IDs, unknown references and non-JSON are rejected', () => {
    assert.throws(() => parseProgramText('{"__proto__":{},"sides":{}}'));
    assert.throws(() => validateProgram({ ...programme(square), customScales: [square, { ...square }] }));
    assert.throws(() => validateProgram({ sides: { front: rail(['missing']) } }));
    assert.throws(() => validateProgram({ ...programme(), cursor: NaN }));
    assert.throws(() => validateProgram({ ...programme(), fn: () => 0 }));
    assert.throws(() => parseProgramText(' '.repeat(1000001)));
});
test('metadata is validated before programme mutation', () => {
    for (const extra of [{ cursor: -1 }, { slideOffset: 2 }, { magnification: 3 }, { theme: 'unknown' }, { density: 'unknown' }, { compactScales: 0 }, { activeSide: 'absent' }])
        assert.throws(() => validateProgram({ ...programme(), ...extra }));
});
test('overriding a component may not create a composite cycle', () => {
    const d = { id: 'T1', type: 'composite', layers: ['T'] };
    assert.throws(() => validateProgram(programme(d)));
});
test('all distributed examples validate', async () => {
    const dir = new URL('../../examples/', import.meta.url);
    for (const file of await readdir(dir))
        if (file.endsWith('.json'))
            parseProgramText(await readFile(new URL(file, dir), 'utf8'));
});
test('fixed mappings may not silently ignore narrower numeric bounds', () => {
    assert.throws(() => validateProgram(programme({ id: 'X', type: 'temperature', min: 1000, max: 10000 })), /range/);
    assert.throws(() => validateProgram(programme({ id: 'X', type: 'sinhLow', min: .2, max: .8 })), /range/);
});
test('manual LL marks cannot silently use the opposite exponential branch', () => {
    assert.throws(() => validateProgram(programme({ id: 'X', type: 'syncroLogLog', logBase: 'e', decade: -1, ticks: [{ value: .5 }] })), /branch/);
    assert.throws(() => validateProgram(programme({ id: 'X', type: 'log', min: 1, max: 10, anchor: 'bad', anchorPos: 2 })), /Anchor/);
});
