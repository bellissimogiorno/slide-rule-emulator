/** Reproduce the validation refactor audit against an independent source tree.
 * This is an optional release check, not part of the self-contained test suite.
 * Compare accepted results, diagnostics and caller-data mutations using every
 * reference preset/example/scale and deterministic invalid-input mutations.
 * The reference must be a trusted local copy: its modules execute in Node.
 */
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--reference') {
    console.error('Usage: node tools/compare-validation.mjs --reference /path/to/original/slide-rule-emulator');
    process.exit(2);
}
const baseline = resolve(args[1]) + sep;
const current = fileURLToPath(new URL('../', import.meta.url));
const original = await import(pathToFileURL(baseline + 'src/model/validation.js'));
const revised = await import(pathToFileURL(current + 'src/model/validation.js'));
const { BUILTIN_SCALES } = await import(pathToFileURL(baseline + 'src/catalog/scales.js'));
const { PRESETS } = await import(pathToFileURL(baseline + 'src/catalog/presets.js'));
const rail = (ids = ['D']) => ({ topStator: [], slide: [], bottomStator: ids });
const programme = d => ({ customScales: d ? [d] : [], sides: { front: rail(d ? [d.id] : ['D']) } });
function outcome(fn, input) {
    let copied;
    try { copied = structuredClone(input); } catch { copied = input; }
    try { return { ok: true, returned: fn(copied), after: copied }; }
    catch (error) { return { ok: false, name: error.name, message: error.message, after: copied }; }
}
let checks = 0, accepted = 0, rejected = 0;
function compare(input) {
    const expected = outcome(original.validateProgram, input);
    const actual = outcome(revised.validateProgram, input);
    assert.deepEqual(actual, expected, 'Validation mismatch at case ' + checks);
    if (expected.ok) accepted++; else rejected++;
    checks++;
    const json = JSON.stringify(input);
    if (json !== undefined) {
        assert.deepEqual(outcome(revised.parseProgramText, json), outcome(original.parseProgramText, json), 'Parse mismatch at case ' + checks);
        checks++;
    }
}
compare(programme());
for (const p of Object.values(PRESETS)) compare({ ...p, customScales: [] });
for (const filename of await readdir(baseline + 'examples/')) {
    if (filename.endsWith('.json')) compare(JSON.parse(await readFile(baseline + 'examples/' + filename, 'utf8')));
}
const values = [undefined, null, false, true, '', 'bad', -1, 0, 1, 2, 10, 100, -Infinity, NaN, [], {}, ['D']];
const fields = ['type', 'label', 'unit', 'precisionOrigin', 'min', 'max', 'pMin', 'pMax', 'order', 'branch', 'decade', 'sign', 'power', 'coeff', 'fold', 'majorStep', 'minorDivisions', 'anchorPos', 'u0', 'minTemperature', 'maxTemperature', 'origin', 'angleNotation', 'tone', 'axis', 'graduationProfile', 'adaptiveTicks', 'compactLabels', 'labelPacking', 'tickMode', 'logBase', 'correction', 'curve', 'relation', 'pos', 'value', 'gas', 'referenceOnly', 'refineTicks', 'layers', 'anchorTitle', 'pairedSum', 'pairedProduct', 'ticks', 'gauges'];
let seed = 0x81a27b9;
function random(n) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; }
for (const definition of Object.values(BUILTIN_SCALES)) {
    compare(programme(definition));
    for (let mutation = 0; mutation < 15; mutation++) {
        const d = structuredClone(definition);
        for (let changes = 0, n = random(3) + 1; changes < n; changes++) d[fields[random(fields.length)]] = values[random(values.length)];
        compare(programme(d));
    }
}
for (const field of ['cursorShape', 'cursorColour', 'viewMode', 'theme', 'density', 'showFormulas', 'compactScales', 'fullPrecision', 'slideWraparound', 'cursor', 'slideOffset', 'graduationMode', 'adaptiveSpacing', 'logGraduations', 'magnification', 'modelLabel', 'instrumentNote', 'presetId', 'activeSide', 'sides', 'customScales']) {
    for (const value of values) compare({ ...programme(), [field]: value });
}
for (const field of ['name', 'note', 'cursorMarks', 'cursorCaptions', 'cursorFrame', 'cursorLineTone', 'cursorWidth', 'topStator', 'slide', 'bottomStator']) {
    for (const value of values) compare({ sides: { front: { ...rail(), [field]: value } } });
}
for (const [array, item] of [
    ['cursorMarks', { id: 'mark', label: 'mark', offset: 0, scales: ['D'] }],
    ['cursorCaptions', { id: 'caption', offset: 0, lines: ['caption'], zone: 'row', scale: 'D', edge: 'top' }],
]) {
    for (const field of [...Object.keys(item), 'extra', 'tone', 'align', 'fraction', 'labelTone', 'showLabel']) {
        for (const value of values) compare({ sides: { front: { ...rail(), [array]: [{ ...item, [field]: value }] } } });
    }
}
for (const input of [null, [], 0, 1, 'text', undefined, Symbol('nonjson'), 1n, { ...programme(), extra: () => {} }]) {
    const expected = outcome(original.validateProgram, input);
    const actual = outcome(revised.validateProgram, input);
    assert.deepEqual(actual, expected);
    checks++;
}
console.log(JSON.stringify({ checks, acceptedValidationCases: accepted, rejectedValidationCases: rejected, result: 'All baseline and refactored outcomes, error names/messages and input mutations agree.' }, null, 2));
