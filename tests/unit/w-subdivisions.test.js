/** W uses the shared density choice but retains its doubled pitch and bands. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_SCALES as S } from '#catalog/scales.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { wRegionProfiles, W_PROFILES, W_REGIONS } from '#core/ticks/expanded-roots.js';
import { LOG_GRADUATIONS, LOG_MIN_GAP } from '#core/ticks/conventional.js';

const ids = ['W1', 'W2', 'W1P', 'W2P'];
const patterns = {
    pocket: [0.01, 0.02, 0.05],
    standard: [0.005, 0.01, 0.02],
    fine: [0.0025, 0.005, 0.01]
};
const bands = [[1, 2], [2, 5], [5, 10]];
const near = (a, b) => Math.abs(a - b) < 1e-11;
const make = (id, logGraduations, width = 1000, extra = {}) =>
    generateTicks(S[id], makeRuntimeScale(S[id]), width, 1.65, { logGraduations, ...extra });

// Independently construct the explicit decimal lattice, without production code.
function lattice(steps) {
    const values = [];
    for (const [index, [lo, hi]] of bands.entries()) {
        const unit = 10000, step = Math.round(steps[index] * unit);
        for (let n = lo * unit; n < hi * unit; n += step) values.push(n / unit);
    }
    return [...values, 10];
}
function expectedBranch(id, values) {
    const { min, max } = S[id];
    return [...values.filter(v => v > min && v < max), min, max].sort((a, b) => a - b);
}

test('W reference pattern and display variants are deeply immutable', () => {
    assert.deepEqual(W_PROFILES, patterns);
    assert.deepEqual(W_REGIONS, bands);
    assert.ok(Object.isFrozen(W_PROFILES) && Object.values(W_PROFILES).every(Object.isFrozen));
    assert.ok(Object.isFrozen(W_REGIONS) && W_REGIONS.every(Object.isFrozen));
});

for (const [mode, steps] of Object.entries(patterns)) {
    test(`W ${mode}: every regular value survives on all four branches at every zoom`, () => {
        const long = lattice(steps);
        for (const id of ids) for (const width of [300, 1000, 2400])
            for (const displayScale of [.75, 1, 1.25, 1.5, 2]) {
                const actual = make(id, mode, width, { displayScale });
                assert.deepEqual(actual.map(t => t.value), expectedBranch(id, long), `${id} ${width} ${displayScale}`);
                for (const tick of actual) {
                    assert.ok(near(tick.pos, 2 * Math.log10(tick.value) - S[id].branch));
                    assert.ok(Number.isFinite(tick.pos) && tick.pos >= -1e-10 && tick.pos <= 1 + 1e-10);
                }
            }
    });
}

test('the shared selector visibly changes W density; the breakpoint is 5, not 4', () => {
    for (const id of ids) {
        const counts = Object.keys(patterns).map(mode => make(id, mode).length);
        assert.ok(counts[0] < counts[1] && counts[1] < counts[2], `${id}: ${counts}`);
    }
    assert.ok(make('W2', 'standard').some(t => t.value === 4.01));
    assert.ok(!make('W2', 'standard').some(t => t.value === 5.01));
    assert.ok(make('W2', 'fine').some(t => t.value === 5.01));
    assert.ok(make('W1', 'fine').some(t => t.value === 1.0025));
    assert.ok(!make('W1', 'standard').some(t => t.value === 1.0025));
});

test('fine W engraving distinguishes quarter-, half- and full-hundredths', () => {
    const ts = make('W1', 'fine');
    for (const [value, kind] of [[1, 'index'], [1.1, 'submajor'], [1.01, 'mid'], [1.005, 'minor'], [1.0025, 'micro']])
        assert.equal(ts.find(t => t.value === value)?.kind, kind);
});

test('adaptive W selects whole regions using the tightest gap over the full 2L decade', () => {
    for (const width of [300, 600, 800, 1000, 1600, 2400]) for (const zoom of [.75, 1, 2]) {
        const length = 2 * width * zoom;
        const selected = bands.map(([, hi], i) => ['fine', 'standard', 'pocket'].find(mode => {
            const step = patterns[mode][i];
            return length * (Math.log10(hi / (hi - step))) >= LOG_MIN_GAP;
        }) || 'pocket');
        assert.deepEqual(wRegionProfiles(length), selected);
        const values = lattice(selected.map((p, i) => patterns[p][i]));
        for (const id of ids)
            assert.deepEqual(make(id, 'adaptive', width, { displayScale: zoom }).map(t => t.value), expectedBranch(id, values));
    }
    assert.notDeepEqual(wRegionProfiles(1600), wRegionProfiles(3200), 'fixture must distinguish L from 2L');
    for (const id of ids)
        assert.deepEqual(make(id, 'adaptive', 800, { displayScale: 2 }), make(id, 'adaptive', 1600));
});

test('W and W-prime share a complete plan; the seam has one identical numerical endpoint', () => {
    for (const mode of LOG_GRADUATIONS) for (const width of [300, 1000, 2400]) {
        const a = make('W1', mode, width), b = make('W2', mode, width);
        assert.deepEqual(a, make('W1P', mode, width));
        assert.deepEqual(b, make('W2P', mode, width));
        assert.equal(a.at(-1).value, b[0].value);
        assert.ok(near(a.at(-1).pos, 1) && near(b[0].pos, 0));
        assert.equal(a.filter(t => near(t.value, Math.sqrt(10))).length, 1);
        assert.equal(b.filter(t => near(t.value, Math.sqrt(10))).length, 1);
    }
});

test('cache keys include the selected W plan, and returned values do not poison it', () => {
    const fine = make('W1', 'fine');
    make('W1', 'pocket'); make('W2', 'standard'); make('W1', 'adaptive', 400);
    const mutated = make('W1', 'fine');
    mutated[0].value = -1; mutated[1].label = 'wrong'; mutated.pop();
    assert.deepEqual(make('W1', 'fine'), fine);
    for (const id of ids) for (const mode of LOG_GRADUATIONS) {
        const first = make(id, mode);
        make(id, mode, 10000);
        assert.deepEqual(make(id, mode), first);
    }
});

test('Fully adaptive ignores the hidden C/D-and-W setting for automatic W scales', () => {
    for (const id of ids) for (const adaptiveSpacing of ['clear', 'balanced', 'fine']) {
        const options = { graduationMode: 'adaptive', adaptiveSpacing };
        const expected = make(id, 'pocket', 1000, options);
        for (const mode of LOG_GRADUATIONS) assert.deepEqual(make(id, mode, 1000, options), expected);
    }
});

test('manual W ticks remain authoritative and custom W-profile aliases follow the setting', () => {
    const explicit = { ...S.W1, ticks: [{ value: 1, label: 'start' }, { value: 2, label: 'two' }] };
    const rt = makeRuntimeScale(explicit);
    for (const mode of LOG_GRADUATIONS) {
        assert.deepEqual(generateTicks(explicit, rt, 1000, 1.65, { logGraduations: mode }),
            generateTicks(explicit, rt, 1000, 1.65, { logGraduations: 'pocket' }));
        const alias = { ...S.W1, id: 'MY_W' };
        assert.deepEqual(generateTicks(alias, makeRuntimeScale(alias), 1000, 1.65, { logGraduations: mode }), make('W1', mode));
    }
});

test('other root families retain their effective-length policy independently of this menu', () => {
    for (const id of ['R1', 'R2', 'Q1', 'Q2', 'Q3', '5R1', '5R5', 'PICKETT_5R2'])
        for (const mode of LOG_GRADUATIONS) assert.deepEqual(make(id, mode), make(id, 'pocket'));
});

test('W pattern selection rejects invalid widths/modes and has bounded floor and ceiling', () => {
    for (const width of [0, -1, NaN, Infinity]) assert.throws(() => wRegionProfiles(width));
    for (const mode of ['unknown', 'constructor', '__proto__', null]) assert.throws(() => wRegionProfiles(1000, mode));
    assert.deepEqual(wRegionProfiles(1), ['pocket', 'pocket', 'pocket']);
    assert.deepEqual(wRegionProfiles(1e6), ['fine', 'fine', 'fine']);
});
