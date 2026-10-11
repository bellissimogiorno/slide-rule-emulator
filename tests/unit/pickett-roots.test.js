/** Sources and fidelity boundaries: docs/PICKETT_ROOTS.md.
 * Reference answers use elementary identities, not the renderer's inverses.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { PRESETS } from '#catalog/presets.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { renderScaleRow } from '#ui/scale-markup.js';
import { renderReadout } from '#ui/readout.js';
import { validateProgram, parseProgramText } from '#model/validation.js';
import { buildLibrary, deepClone, exportableState } from '#model/program.js';
import { close, programme } from './helpers.js';

const stacks = ['PICKETT_SQRT', 'PICKETT_CBRT'];
const childId = layer => typeof layer === 'string' ? layer : layer.scale;
const markup = (id, library = BUILTIN_SCALES, sliding = false) =>
    renderScaleRow(id, sliding, sliding ? 'slide' : 'topStator', 0, 1,
        { library, width: 1600, minGap: 1.65 });

for (const id of stacks) {
    test(`${id}: one shared spine, no duplicate baselines, and every branch retained`, () => {
        const def = BUILTIN_SCALES[id], html = markup(id);
        assert.equal((html.match(/class="root-spine"/g) || []).length, 1);
        assert.equal((html.match(/class="baseline"/g) || []).length, 0);
        assert.equal((html.match(/class="root-branch /g) || []).length, def.layers.length);
        assert.equal((html.match(/class="tick-mover root-stack-track"/g) || []).length, 1);
        assert.ok(!html.includes('ink-red'), 'later root branches are not inverse scales');
        for (const layer of def.layers)
            assert.ok(html.includes(`data-root-scale="${childId(layer)}"`));
        const tracks = html.slice(html.indexOf('<div class="tick-pane">'), html.indexOf('<div class="scale-legend'));
        assert.equal((tracks.match(/class="root-single"/g) || []).length, def.layers.length - 2);
        assert.ok(tracks.indexOf('root-spine') < tracks.lastIndexOf('root-lower'));
    });
    test(`${id}: all graduation positions survive without snapping different branches together`, () => {
        const def = BUILTIN_SCALES[id];
        const html = markup(id);
        // Tick markup has seven decimal places in data-pos. Check each branch,
        // not a union of marks that would hide an omitted or copied component.
        for (const layer of def.layers) {
            const name = childId(layer), d = BUILTIN_SCALES[name];
            const start = html.indexOf(`data-root-scale="${name}">`);
            const next = html.indexOf('data-root-scale=', start + 20);
            const section = html.slice(start, next < 0 ? undefined : next);
            const actual = [...section.matchAll(/data-pos="([^"]+)" data-kind=/g)].map(m => Number(m[1]));
            const expected = generateTicks(d, makeRuntimeScale(d), 1600, 1.65);
            assert.equal(actual.length, expected.length, name);
            actual.forEach((p, i) => close(p, expected[i].pos, 0, 5.01e-8));
        }
    });
    test(`${id}: independent roots and powers at 501 positions`, () => {
        const def = BUILTIN_SCALES[id], n = def.layers.length;
        for (let b = 0; b < n; b++) {
            const rt = makeRuntimeScale(BUILTIN_SCALES[childId(def.layers[b])]);
            for (let i = 0; i <= 500; i++) {
                const p = i / 500, radicand = 10 ** p * 10 ** b;
                const expected = n === 2 ? Math.sqrt(radicand) : Math.cbrt(radicand);
                close(rt.value(p), expected);
                close(rt.pos(expected), p);
                close(rt.value(p) ** n, radicand);
            }
        }
    });
    test(`${id}: the complete bank moves as one on the slide`, () => {
        const html = markup(id, BUILTIN_SCALES, true);
        assert.equal((html.match(/slide-mover/g) || []).length, 1);
        assert.match(html, /class="tick-mover slide-mover root-stack-track"/);
    });
}

test('N3 and N4 reproduce the photographed root-bank order, not five independent rows', () => {
    assert.deepEqual(PRESETS.pickettN3.sides.front.topStator, ['PICKETT_SQRT', 'K', 'A']);
    assert.deepEqual(PRESETS.pickettN3.sides.front.bottomStator, ['D', 'DI', 'PICKETT_CBRT']);
    assert.deepEqual(PRESETS.pickettN4.sides.front.topStator, ['PICKETT_CBRT', 'DF']);
    assert.deepEqual(PRESETS.pickettN4.sides.front.bottomStator, ['D', 'DI', 'PICKETT_SQRT']);
    assert.ok(PRESETS.pickettN3.sides.back.topStator.includes('PN3LL0'));
    assert.ok(PRESETS.pickettN4.sides.back.topStator.includes('PLL1'));
    assert.ok(PRESETS.faber283n.sides.back.topStator.includes('W2'));
    assert.ok(!JSON.stringify(PRESETS.faber283n).includes('PICKETT_'));
});

test('unlike log-log reciprocals, round-number root marks must not be equated', () => {
    const first = makeRuntimeScale(BUILTIN_SCALES.PICKETT_R1);
    const second = makeRuntimeScale(BUILTIN_SCALES.PICKETT_R2);
    close(first.pos(2), second.pos(Math.sqrt(40)));
    assert.ok(Math.abs(first.pos(2) - second.pos(6.32)) > 1e-4);
    close(second.value(first.pos(2)), Math.sqrt(40));
});

test('manual square- and cube-root examples, including decimal powers', () => {
    for (const [id, examples] of [
        ['PICKETT_SQRT', [7.3, 73, 841, .062, .00000094, 248, 563000]],
        ['PICKETT_CBRT', [6.4, 64, 640, 6400, 64000, .0064, .064, 6.9e3, 4.85e7, 1.33e-4]]
    ]) {
        const def = BUILTIN_SCALES[id], order = def.layers.length;
        for (const number of examples) {
            const exponent = Math.floor(Math.log10(number));
            const branch = ((exponent % order) + order) % order;
            const p = Math.log10(number / 10 ** exponent);
            const rt = makeRuntimeScale(BUILTIN_SCALES[childId(def.layers[branch])]);
            close(rt.value(p) * 10 ** Math.floor(exponent / order),
                order === 2 ? Math.sqrt(number) : Math.cbrt(number));
        }
    }
});

test('cube bank readout includes the third branch and respects the slide displacement', () => {
    const state = programme();
    state.cursor = Math.log10(6.4);
    state.slideOffset = 0;
    state.activeSide = 'front';
    state.sides = { front: { topStator: ['PICKETT_SQRT'], slide: ['PICKETT_CBRT'], bottomStator: ['D'] } };
    const html = renderReadout(state, BUILTIN_SCALES);
    assert.match(html, /\u221b\u2082: 4<\/span>/);
    assert.match(html, /\u221b\u2083: 8\.6177/);
    state.slideOffset = .85;
    assert.equal((renderReadout(state, BUILTIN_SCALES).match(/off scale/g) || []).length, 3);
});

test('custom root stacks round-trip with escaped captions and deliberate ink', () => {
    const def = { id: 'CUSTOM_ROOTS', type: 'rootStack',
        layers: [{ scale: 'PICKETT_R1', caption: '<img src=x>', tone: 'blue' },
                 { scale: 'PICKETT_R2', caption: '&lower', tone: 'green' }] };
    const state = programme(def);
    validateProgram(state);
    const library = buildLibrary(state), html = markup(def.id, library);
    assert.ok(!html.includes('<img'));
    assert.match(html, /&lt;img src=x&gt;/);
    assert.match(html, /ink-blue/);
    assert.match(html, /ink-green/);
    const snapshot = exportableState(state);
    const serialised = JSON.stringify(snapshot);
    assert.deepEqual(parseProgramText(serialised), JSON.parse(serialised));
});

test('legacy standalone root scales and custom overrides remain independent', () => {
    const legacy = programme({ id: 'R1', type: 'log', min: 1, max: 10 });
    validateProgram(legacy);
    const library = buildLibrary(legacy);
    assert.equal(library.R1.type, 'log');
    assert.equal(library.PICKETT_R1.type, 'root');
    for (const id of ['R1', 'R2', 'Q1', 'Q2', 'Q3', '5R1', '5R5', 'W1', 'W2'])
        assert.ok(!markup(id).includes('root-stack'));
});

test('stack and child compact-number opt-outs are respected', () => {
    const def = { ...deepClone(BUILTIN_SCALES.PICKETT_SQRT), compactLabels: false };
    assert.match(markup(def.id, { ...BUILTIN_SCALES, [def.id]: def }), /no-compact-labels/);
    const lib = { ...BUILTIN_SCALES, PICKETT_R1: { ...BUILTIN_SCALES.PICKETT_R1, compactLabels: false } };
    assert.match(markup(def.id, lib), /no-compact-labels/);
});

for (const [name, data] of [
    ['one branch', { layers: ['PICKETT_R1'] }],
    ['four branches', { layers: ['PICKETT_R1', 'PICKETT_R2', 'PICKETT_Q1', 'PICKETT_Q2'] }],
    ['mixed orders', { layers: ['PICKETT_R1', 'PICKETT_Q2'] }],
    ['reversed order', { layers: ['PICKETT_R2', 'PICKETT_R1'] }],
    ['duplicate branch', { layers: ['PICKETT_R1', 'PICKETT_R1'] }],
    ['missing branch', { layers: ['NO_SUCH_ROOT', 'PICKETT_R2'] }],
    ['nested stack', { layers: ['PICKETT_SQRT', 'PICKETT_R2'] }],
    ['ignored parent mapping', { min: 1 }],
    ['ignored parent ticks', { ticks: [{ value: 2 }] }],
    ['incorrect layer tone', { layers: [{ scale: 'PICKETT_R1', tone: 'pink' }, 'PICKETT_R2'] }]
]) test(`rootStack rejects ${name}`, () => {
    assert.throws(() => validateProgram(programme({ id: 'X', type: 'rootStack', layers: ['PICKETT_R1', 'PICKETT_R2'], ...data })));
});

test('a stack cannot hide a partial child range or nest in an ordinary composite', () => {
    const state = programme({ id: 'X', type: 'rootStack', layers: ['PICKETT_R1', 'PICKETT_R2'] });
    state.customScales.push({ ...BUILTIN_SCALES.PICKETT_R1, pMin: .1 });
    assert.throws(() => validateProgram(state));
    assert.throws(() => validateProgram(programme({ id: 'X', type: 'composite', layers: ['PICKETT_SQRT', 'D'] })));
});
