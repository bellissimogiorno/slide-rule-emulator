/** Compare JSON catalogue snapshots without requiring bit-identical maths. */
import assert from 'node:assert/strict';

// Math functions may round differently between engines. Allow only a few
// rounding steps, relative to each value: an absolute floor would conceal
// errors in radiation coefficients of order 1e-15 and smaller.
const RELATIVE_TOLERANCE = 16 * Number.EPSILON;

/**
 * Text, types, keys and array order remain exact. Only finite, nonzero numeric
 * leaves allow round-off; safe integers and signed zero still compare exactly.
 * This is a snapshot check, not a replacement for independent physics tests.
 * Inputs must be JSON data (plain objects, dense arrays and JSON primitives).
 */
export function assertCatalogueEqual(actual, expected, path = 'catalogue') {
    assert.equal(typeof actual, typeof expected, `${path}: value type`);
    if (typeof expected === 'number') {
        assert.ok(Number.isFinite(actual) && Number.isFinite(expected), `${path}: non-finite number`);
        if (Object.is(actual, expected))
            return;
        if (actual === 0 || expected === 0 ||
            (Number.isSafeInteger(actual) && Number.isSafeInteger(expected))) {
            assert.equal(actual, expected, path);
            return;
        }
        assert.equal(Math.sign(actual), Math.sign(expected), `${path}: number sign`);
        // Dividing the difference avoids underflow in tolerance * tinyValue.
        const relativeError = Math.abs(actual - expected) / Math.max(Math.abs(actual), Math.abs(expected));
        assert.ok(relativeError <= RELATIVE_TOLERANCE,
            `${path}: ${actual} != ${expected} (relative error ${relativeError}; limit ${RELATIVE_TOLERANCE})`);
        return;
    }
    if (expected === null || typeof expected !== 'object') {
        assert.ok(expected === null || ['string', 'boolean'].includes(typeof expected), `${path}: not JSON data`);
        assert.equal(actual, expected, path);
        return;
    }
    assert.notEqual(actual, null, `${path}: unexpected null`);
    const isArray = Array.isArray(expected);
    assert.equal(Array.isArray(actual), isArray, `${path}: array/object mismatch`);
    const prototype = isArray ? Array.prototype : Object.prototype;
    assert.equal(Object.getPrototypeOf(actual), prototype, `${path}: not a plain JSON container`);
    assert.equal(Object.getPrototypeOf(expected), prototype, `${path}: not a plain JSON container`);
    if (isArray) {
        assert.equal(actual.length, expected.length, `${path}: array length`);
        assert.equal(Object.keys(actual).length, actual.length, `${path}: not a dense JSON array`);
        assert.equal(Object.keys(expected).length, expected.length, `${path}: not a dense JSON array`);
    }
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), `${path}: object keys`);
    for (const key of Object.keys(expected))
        assertCatalogueEqual(actual[key], expected[key], isArray ? `${path}[${key}]` : `${path}.${key}`);
}
