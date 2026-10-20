#!/usr/bin/env node
/** Exact same-engine comparison with a separately extracted reference checkout.
 *
 * Usage: node tools/compare_behaviour.mjs --reference /absolute/reference/repository
 * This is an optional refactoring audit, not part of the standalone test gate:
 * it needs the reference source, and equality does not prove either is correct.
 * No reference paths, application versions or machine paths enter the report.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reference = process.argv[3];
if (!reference || process.argv.length !== 4 || process.argv[2] !== '--reference') {
    console.error('Usage: node tools/compare_behaviour.mjs --reference /absolute/reference/repository');
    process.exitCode = 2;
} else {
    const modules = ['catalog/scales.js', 'catalog/presets.js', 'catalog/defaults.js',
        'core/mappings.js', 'core/ticks/index.js', 'ui/scale-markup.js',
        'ui/cursor-marks.js', 'ui/readout.js', 'model/program.js'];
    const load = async directory => Object.assign({}, ...await Promise.all(modules.map(name =>
        import(pathToFileURL(join(directory, 'src', name)).href))));
    const [before, after] = await Promise.all([load(resolve(reference)), load(root)]);
    assert.deepEqual(after.BUILTIN_SCALES, before.BUILTIN_SCALES, 'Scale definitions changed');
    assert.deepEqual(after.PRESETS, before.PRESETS, 'Presets changed');
    assert.deepEqual(after.DEFAULT_STATE, before.DEFAULT_STATE, 'Defaults changed');
    const counts = { catalogues: 3, tickSets: 0, tickMarks: 0, scaleRows: 0,
        cursorDrawings: 0, readoutPanels: 0, programmeSnapshots: 0 };
    const fingerprint = createHash('sha256');
    // Hash the input source, rather than relying on a version label for identity.
    for (const name of modules) {
        fingerprint.update(name + '\0');
        fingerprint.update(await readFile(join(resolve(reference), 'src', name)));
    }
    const options = [
        { graduationMode: 'conventional', logGraduations: 'adaptive', fullPrecision: false },
        { graduationMode: 'conventional', logGraduations: 'fine', fullPrecision: true },
        { graduationMode: 'adaptive', adaptiveSpacing: 'clear', displayScale: .75, fullPrecision: false },
        { graduationMode: 'adaptive', adaptiveSpacing: 'fine', displayScale: 2, fullPrecision: true }
    ];
    for (const [id, definition] of Object.entries(after.BUILTIN_SCALES)) {
        for (const width of [720, 1600]) {
            for (const option of options) {
                const context = { library: after.BUILTIN_SCALES, width, minGap: 1.65, ...option };
                if (!definition.layers) {
                    const ticks = after.generateTicks(definition, after.makeRuntimeScale(definition), width, 1.65, option);
                    assert.deepEqual(ticks, before.generateTicks(before.BUILTIN_SCALES[id],
                        before.makeRuntimeScale(before.BUILTIN_SCALES[id]), width, 1.65, option), `Ticks: ${id}, ${width}, ${JSON.stringify(option)}`);
                    counts.tickSets++;
                    counts.tickMarks += ticks.length;
                }
                // Composite, segmented and root rows exercise child mappings too.
                for (const rail of ['topStator', 'slide', 'bottomStator']) {
                    assert.equal(after.renderRailRows([id], rail, rail === 'slide', context),
                        before.renderRailRows([id], rail, rail === 'slide', { ...context, library: before.BUILTIN_SCALES }),
                        `Scale markup: ${id}, ${rail}, ${width}, ${JSON.stringify(option)}`);
                    counts.scaleRows++;
                }
            }
        }
    }
    for (const preset of Object.values(after.PRESETS)) {
        for (const side of Object.values(preset.sides)) {
            assert.equal(after.renderCursor(side, 'audit-cursor'), before.renderCursor(side, 'audit-cursor'), 'Cursor markup');
            counts.cursorDrawings++;
        }
        for (const fullPrecision of [false, true]) {
            for (const slideWraparound of [false, true]) {
                for (const [cursor, slideOffset] of [[0, -.9], [.123456789012345, .23456789012345], [.5, 0], [1, .9]]) {
                    const input = { ...after.DEFAULT_STATE, ...preset, viewMode: 'both', cursor,
                        slideOffset, fullPrecision, slideWraparound };
                    const current = after.mergeState(after.DEFAULT_STATE, input);
                    const old = before.mergeState(before.DEFAULT_STATE, input);
                    after.normalizeState(current);
                    before.normalizeState(old);
                    assert.deepEqual(after.exportableState(current), before.exportableState(old), 'Programme snapshot');
                    counts.programmeSnapshots++;
                    assert.equal(after.renderReadout(current, after.buildLibrary(current)),
                        before.renderReadout(old, before.buildLibrary(old)), 'Readout markup');
                    counts.readoutPanels++;
                }
            }
        }
    }
    console.log(JSON.stringify({ passed: true, comparison: 'Exact output equality on the same Node engine',
        referenceSourceSha256: fingerprint.digest('hex'), counts,
        limitations: ['A finite regression matrix; equality is not an independent mathematical proof.',
            'HTML string comparisons do not test browser layout, event handling or native persistence.'] }, null, 2));
}
