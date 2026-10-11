import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { assertCatalogueEqual } from './catalogue-comparison.js';

// These binary64 values differ by two representable steps. Different engines
// can produce either when deriving the peak blackbody-radiation coefficient.
const coefficient = 1.2866941473091515e-15;
const adjacentCoefficient = 1.286694147309152e-15;

test('catalogue comparison accepts the two-step radiation round-off in either direction', () => {
    const a = { BB_H_PEAK: { coeff: coefficient }, F5100_B: { coeff: coefficient } };
    const b = { BB_H_PEAK: { coeff: adjacentCoefficient }, F5100_B: { coeff: adjacentCoefficient } };
    assert.throws(() => assert.deepEqual(a, b), { code: 'ERR_ASSERTION' });
    assertCatalogueEqual(a, b);
    assertCatalogueEqual(b, a);
});

test('full catalogue accepts either peak-coefficient rounding but rejects physical drift', async () => {
    const file = new URL('../../docs/data/scales.json', import.meta.url);
    // The file is relative to tests/unit, hence two parents reach the repository.
    const catalogue = JSON.parse(await readFile(file, 'utf8'));
    for (const value of [coefficient, adjacentCoefficient]) {
        catalogue.BB_H_PEAK.coeff = value;
        catalogue.F5100_B.coeff = value;
        assertCatalogueEqual(catalogue, BUILTIN_SCALES);
    }
    catalogue.BB_H_PEAK.coeff = coefficient * (1 + 1e-12);
    assert.throws(() => assertCatalogueEqual(catalogue, BUILTIN_SCALES), /BB_H_PEAK\.coeff/);
});

test('catalogue comparison keeps nested structure, array order and prose exact', () => {
    const data = { description: 'Normalised', rows: [{ value: coefficient }, null, true, 2] };
    assertCatalogueEqual(structuredClone(data), data);
    assertCatalogueEqual({ b: 2, a: 1 }, { a: 1, b: 2 });
    for (const mutate of [
        value => { value.description = 'Normalized'; },
        value => { delete value.description; },
        value => { value.extra = true; },
        value => { value.rows.reverse(); },
        value => { value.rows.pop(); },
        value => { value.rows[0].value = String(coefficient); },
        value => { value.rows[2] = false; },
        value => { value.rows[3] = 3; }
    ]) {
        const changed = structuredClone(data);
        mutate(changed);
        assert.throws(() => assertCatalogueEqual(changed, data), { code: 'ERR_ASSERTION' });
    }
});

test('catalogue comparison uses a relative bound at tiny and large magnitudes', () => {
    for (const scale of [1e-300, 1e-100, coefficient, 0.1, 1e100, 1e300]) {
        assertCatalogueEqual(scale * (1 + 4 * Number.EPSILON), scale);
        assertCatalogueEqual(-scale * (1 + 4 * Number.EPSILON), -scale);
        assert.throws(() => assertCatalogueEqual(scale * (1 + 1e-12), scale));
        assert.throws(() => assertCatalogueEqual(2 * scale, scale));
        assert.throws(() => assertCatalogueEqual(0, scale));
        assert.throws(() => assertCatalogueEqual(-scale, scale));
    }
});

test('catalogue comparison rejects invalid numbers and preserves zero and safe integers', () => {
    for (const value of [NaN, Infinity, -Infinity]) {
        assert.throws(() => assertCatalogueEqual(value, value), /non-finite/);
        assert.throws(() => assertCatalogueEqual(value, coefficient), /non-finite/);
        assert.throws(() => assertCatalogueEqual(coefficient, value), /non-finite/);
    }
    assertCatalogueEqual(0, 0);
    assertCatalogueEqual(-0, -0);
    assertCatalogueEqual(Number.MIN_VALUE, Number.MIN_VALUE);
    assert.throws(() => assertCatalogueEqual(-0, 0));
    assert.throws(() => assertCatalogueEqual(Number.MIN_VALUE, 0));
    assert.throws(() => assertCatalogueEqual(Number.MIN_VALUE, 2 * Number.MIN_VALUE));
    assert.throws(() => assertCatalogueEqual(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER - 1));
});

test('catalogue comparison rejects non-JSON containers and sparse arrays', () => {
    for (const [actual, expected] of [
        [[], {}], [null, {}], [{}, null], [undefined, undefined],
        [new Date(0), new Date(0)], [new Map(), new Map()],
        [Array(1), [null]], [Array(1), Array(1)]
    ])
        assert.throws(() => assertCatalogueEqual(actual, expected), { code: 'ERR_ASSERTION' });
});

test('catalogue comparison reports the failing leaf rather than dumping the whole catalogue', () => {
    assert.throws(
        () => assertCatalogueEqual({ rows: [{ coeff: coefficient * 2 }] }, { rows: [{ coeff: coefficient }] }),
        /catalogue\.rows\[0\]\.coeff:.*relative error/
    );
});
