/** Deterministic CSSOM operation comparison of the real loupe painters.
 *
 * Usage: node tools/benchmark-loupe.mjs --reference /trusted/repository
 *        [--strokes 5000] [--output /path/report.json]
 *
 * Uses explicit measured-DOM inputs, not a browser engine. Counts and canonical
 * paint equality are reproducible; wall-clock values include fixture parsing
 * and instrumentation and must not be presented as native rendering speedups.
 */
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { createLoupeDrawing } from '#ui/loupe-renderer.js';
import { createLoupeFixture, drawingSnapshot } from '../tests/helpers/loupe-dom.js';

const option = name => {
    const index = process.argv.indexOf(name);
    return index < 0 ? undefined : process.argv[index + 1];
};
const referencePath = option('--reference');
if (!referencePath) throw new Error('--reference /trusted/repository is required');
const strokes = Number(option('--strokes') || 5000);
if (!Number.isSafeInteger(strokes) || strokes < 1 || strokes > 20000) throw new Error('Invalid stroke count');
const { createLoupeDrawing: referenceDrawing } = await import(pathToFileURL(resolve(referencePath, 'src/ui/loupe-renderer.js')));

function run(factory) {
    const fixture = createLoupeFixture({ strokes });
    const phases = {};
    const started = performance.now();
    const drawing = factory(fixture.face);
    phases.construction = { ...fixture.environment.counts(), elapsedMilliseconds: performance.now() - started };
    const place = (x, y) => drawing.place(x, y, drawing.measureMotion?.());
    place(10.25, -20.75);
    const initial = drawingSnapshot(drawing);
    fixture.environment.reset();
    drawing.place(11.5, -19.125);
    phases.pointerOnly = fixture.environment.counts();
    fixture.environment.reset();
    drawing.place(11.5, -19.125);
    phases.stationaryPointer = fixture.environment.counts();
    fixture.shift(fixture.mover, 7.125);
    fixture.shift(fixture.seam, 7.125);
    fixture.shift(fixture.cursor, -3.5);
    fixture.environment.reset();
    place(11.5, -19.125);
    phases.instrumentMotion = fixture.environment.counts();
    const final = drawingSnapshot(drawing);
    const events = fixture.environment.operations.map(event => event.kind);
    const firstWrite = events.findIndex(kind => kind.startsWith('style'));
    const readsAfterWrite = firstWrite < 0 ? 0 : events.slice(firstWrite).filter(kind => kind.endsWith('Read')).length;
    phases.instrumentMotion.sourceReadsAfterFirstStyleWrite = readsAfterWrite;
    return { phases, initial, final };
}

const reference = run(referenceDrawing), candidate = run(createLoupeDrawing);
assert.deepEqual(candidate.initial, reference.initial, 'Initial measured paint must agree after pure-translation canonicalisation');
assert.deepEqual(candidate.final, reference.final, 'Moved measured paint must agree after pure-translation canonicalisation');
const mutations = phase => phase.styleSetProperty + phase.styleCssText;
const oldMutations = mutations(reference.phases.construction), newMutations = mutations(candidate.phases.construction);
const report = {
    passed: true,
    scope: 'Real renderer modules on explicit measured-DOM fixture inputs; no native browser execution',
    fixture: { strokeElements: strokes, sourceZoom: 1.25, movingContainers: 4, sharedMovingParents: 2 },
    paintEquality: { initial: true, afterFractionalSlideAndCursorMotion: true, canonicalisation: 'Root left/top versus pure translation only; every other style, priority, node, attribute and text run compared' },
    reference: reference.phases,
    candidate: candidate.phases,
    constructionMutations: { reference: oldMutations, candidate: newMutations, reductionFraction: 1 - newMutations / oldMutations },
    limitations: [
        'Explicit boxes and computed styles are fixture inputs, not independently rendered CSS.',
        'CSSOM calls are counted; this does not establish browser milliseconds, frame rate, paint cost or compositor memory.',
        'Construction elapsed milliseconds include fixture CSS parsing and instrumentation, so they are not a native speed comparison.'
    ]
};
if (option('--output')) await writeFile(resolve(option('--output')), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
