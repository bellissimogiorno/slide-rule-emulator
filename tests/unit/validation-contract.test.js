/** Public-boundary contracts that must survive splitting the validator.
 * Several cases deliberately contain more than one error: callers should keep
 * receiving the first diagnostic, without the rejected input being modified.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProgramText, validateProgram, PROGRAM_LIMITS } from '#model/validation.js';
import { programme, rail } from './helpers.js';

const log = { id: 'X', type: 'log', min: 1, max: 10 };
const mark = { id: 'm', label: 'mark', offset: 0 };
const caption = { id: 'c', offset: 0, lines: ['caption'], zone: 'topCap' };
const withFace = fields => ({ sides: { front: { ...rail(['D']), ...fields } } });
const withScale = fields => programme({ ...log, ...fields });

for (const [description, input, message] of [
    ['root shape', [], 'JSON must be an object.'],
    ['sides precede metadata', { sides: {}, viewMode: 'invalid' }, 'Include at least one side in a sides object.'],
    ['custom array precedes metadata', { ...programme(), customScales: null, viewMode: 'invalid' }, 'customScales must be an array.'],
    ['metadata precedes definitions', { ...withScale({ type: 'invalid' }), viewMode: 'invalid' }, 'viewMode must be single or both.'],
    ['definition identity precedes fields', withScale({ id: 'bad id', type: 'invalid' }), 'Each custom scale needs a non-reserved ID of at most 64 characters.'],
    ['scale fields retain their prefix', withScale({ label: 2, min: 'bad' }), 'X: label must be text.'],
    ['scale type precedes text fields', withScale({ type: 'invalid', label: 2 }), 'X: Unknown scale type: invalid'],
    ['numeric fields precede tick strategy', withScale({ min: 'bad', tickMode: 'invalid' }), 'X: min must be a finite number.'],
    ['scale ticks precede runtime', withScale({ min: -1, ticks: [{ value: 'bad' }] }), 'X: Each tick or gauge needs a finite value.'],
    ['runtime precedes face references', { ...withScale({ min: 0 }), sides: { front: rail(['missing']) } }, 'X: Logarithmic ticks require a positive minimum.'],
    ['duplicate definitions', { ...programme(), customScales: [log, { ...log }] }, 'Duplicate custom scale ID: X'],
    ['layout references precede faces', { customScales: [{ id: 'X', type: 'composite', layers: ['missing'] }], sides: { front: rail(['alsoMissing']) } }, 'X: missing layer missing'],
    ['side text precedes cursor data', withFace({ name: false, cursorMarks: 'bad' }), 'front: name must be text.'],
    ['cursor marks precede captions', withFace({ cursorMarks: 'bad', cursorCaptions: 'bad' }), 'cursorMarks must be an array of at most 16 marks.'],
    ['cursor captions precede rail references', withFace({ cursorCaptions: 'bad', bottomStator: ['missing'] }), 'cursorCaptions must be an array of at most 32 captions.'],
    ['mark identity precedes unknown fields', withFace({ cursorMarks: [{ ...mark, id: 'bad id', extra: true }] }), 'Each cursor mark needs a unique, non-reserved ID of at most 64 characters.'],
    ['mark fields precede its label', withFace({ cursorMarks: [{ ...mark, label: '', extra: true }] }), 'Unknown cursor mark field.'],
    ['caption identity precedes fields', withFace({ cursorCaptions: [{ ...caption, id: 'bad id', extra: true }] }), 'Each cursor caption needs a unique, non-reserved ID of at most 64 characters.'],
    ['caption fields precede its offset', withFace({ cursorCaptions: [{ ...caption, offset: 2, extra: true }] }), 'Unknown cursor caption field.'],
    ['rail references precede active side', { ...withFace({ bottomStator: ['missing'] }), activeSide: 'missing' }, 'front: missing scale missing'],
    ['active side follows valid faces', { ...programme(), activeSide: 'missing' }, 'activeSide must name an existing side.'],
]) {
    test(`validation first diagnostic: ${description}`, () => {
        const before = structuredClone(input);
        assert.throws(() => validateProgram(input), { name: 'Error', message });
        assert.deepEqual(input, before);
    });
}

test('JSON data inspection precedes semantic checks', () => {
    const nonfinite = { ...programme(), cursor: -1, extra: Infinity };
    assert.throws(() => validateProgram(nonfinite), { message: 'All numbers must be finite.' });
    assert.throws(() => parseProgramText('{"sides":{},"constructor":null}'), { message: 'Reserved property name: constructor' });
    assert.throws(() => validateProgram({ ...programme(), extra: undefined }), { message: 'Only JSON data is supported.' });
});

test('validation accepts its exact text, depth and node boundaries', () => {
    const text = JSON.stringify(programme());
    assert.deepEqual(parseProgramText(text.padEnd(PROGRAM_LIMITS.characters)), programme());
    assert.throws(() => parseProgramText(text.padEnd(PROGRAM_LIMITS.characters + 1)), { message: 'Programme exceeds the 1,000,000-character limit.' });
    validateProgram({ ...programme(), extra: 'x'.repeat(4000) });
    assert.throws(() => validateProgram({ ...programme(), extra: 'x'.repeat(4001) }), { message: 'A programme string exceeds 4000 characters.' });
    const nested = depth => Array.from({ length: depth }).reduce(value => [value], 0);
    validateProgram({ ...programme(), extra: nested(11) });
    assert.throws(() => validateProgram({ ...programme(), extra: nested(12) }), { message: 'Programme is too large or deeply nested.' });
    // This programme contains nine nodes apart from the extra array's elements.
    validateProgram({ ...programme(), extra: Array(29991).fill(null) });
    assert.throws(() => validateProgram({ ...programme(), extra: Array(29992).fill(null) }), { message: 'Programme is too large or deeply nested.' });
});

test('validation accepts exact face, row and cursor annotation limits', () => {
    const sides = Object.fromEntries(Array.from({ length: 8 }, (_, index) => ['side' + index, rail(Array(40).fill('D'))]));
    validateProgram({ sides });
    assert.throws(() => validateProgram({ sides: { ...sides, ninth: rail() } }), { message: 'At most 8 sides are supported.' });
    assert.throws(() => validateProgram(withFace({ slide: Array(41).fill('D') })), { message: 'front: slide must be an array of at most 40 scale IDs.' });
    sides.side0.slide = ['D'];
    assert.throws(() => validateProgram({ sides }), { message: 'At most 320 scale rows are supported.' });
    const marks = Array.from({ length: 16 }, (_, i) => ({ ...mark, id: 'm' + i }));
    const captions = Array.from({ length: 32 }, (_, i) => ({ ...caption, id: 'c' + i }));
    validateProgram(withFace({ cursorMarks: marks, cursorCaptions: captions }));
    assert.throws(() => validateProgram(withFace({ cursorMarks: [...marks, { ...mark, id: 'extra' }] })), { message: 'cursorMarks must be an array of at most 16 marks.' });
    assert.throws(() => validateProgram(withFace({ cursorCaptions: [...captions, { ...caption, id: 'extra' }] })), { message: 'cursorCaptions must be an array of at most 32 captions.' });
});

test('validation accepts exact custom-scale and manual-tick limits', () => {
    const customScales = Array.from({ length: 128 }, (_, i) => ({ ...log, id: 'X' + i }));
    validateProgram({ ...programme(), customScales });
    assert.throws(() => validateProgram({ ...programme(), customScales: [...customScales, { ...log, id: 'extra' }] }), { message: 'At most 128 custom scales are supported.' });
    const ticks = Array.from({ length: 2000 }, () => ({ value: 1 }));
    validateProgram(withScale({ ticks }));
    assert.throws(() => validateProgram(withScale({ ticks: [...ticks, { value: 1 }] })), { message: 'X: ticks must contain at most 2000 entries.' });
    const id = 'X'.repeat(64);
    validateProgram(withScale({ id }));
    assert.throws(() => validateProgram(withScale({ id: id + 'X' })), { message: 'Each custom scale needs a non-reserved ID of at most 64 characters.' });
});

test('the JSON entry point alone migrates retired cursor shape values', () => {
    for (const cursorShape of ['clear', 'ivory', 'metal']) {
        const input = { ...programme(), cursorShape };
        const before = structuredClone(input);
        assert.throws(() => validateProgram(input));
        assert.deepEqual(input, before);
        assert.deepEqual(parseProgramText(JSON.stringify(input)), { ...input, cursorShape: 'instrument' });
    }
    const input = withScale({});
    const before = structuredClone(input);
    assert.equal(validateProgram(input), undefined);
    assert.deepEqual(input, before);
    assert.deepEqual(parseProgramText(JSON.stringify(input)), input);
});
