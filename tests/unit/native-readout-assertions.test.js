/** Negative controls for the browser harness's numerical acceptance policy. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { assertReadoutValue } from '../browser/readout-assertions.mjs';

test('native readout acceptance uses decimal rounding bounds without an absolute unit floor', () => {
    for (const [actual, expected] of [[3.142, Math.PI], [-12.35, -12.34567],
        [.1235, .123456789], [4.54e-5, Math.exp(-10)], [3.72e-44, Math.exp(-100)]])
        assert.doesNotThrow(() => assertReadoutValue(actual, expected));
    for (const [actual, expected] of [[3.14, Math.PI], [.1234, .123456789],
        [0, Math.exp(-100)], [3.72e-43, Math.exp(-100)], [3.72e-45, Math.exp(-100)]])
        assert.throws(() => assertReadoutValue(actual, expected));
});

test('native near-one checks preserve the useful excess for eligible LL and hypotenuse rows', () => {
    for (const [actual, expected] of [[1.001001, Math.exp(.001)],
        [1.004988, Math.sqrt(1.01)], [1.00000001234, 1.000000012345]])
        assert.doesNotThrow(() => assertReadoutValue(actual, expected, { nearUnity: true }));
    for (const [actual, expected] of [[1, Math.exp(.001)], [1.001, Math.exp(.001)],
        [1, 1.000000012345], [1.00000001236, 1.000000012345], [1, 1 + Number.EPSILON]])
        assert.throws(() => assertReadoutValue(actual, expected, { nearUnity: true }));
    // Below unity the documented policy keeps ordinary significant digits.
    assert.doesNotThrow(() => assertReadoutValue(1, .999987654, { nearUnity: true }));
});

test('native readout checks reject nonfinite values, false zeros and nonzero renderings of zero', () => {
    assert.doesNotThrow(() => assertReadoutValue(0, 0));
    assert.doesNotThrow(() => assertReadoutValue(Number.MIN_VALUE, Number.MIN_VALUE));
    for (const [actual, expected] of [[0, Number.MIN_VALUE], [Number.MIN_VALUE * 2, Number.MIN_VALUE], [Number.MIN_VALUE, 0],
        [NaN, 2], [2, NaN], [Infinity, Infinity], [-Infinity, 2]])
        assert.throws(() => assertReadoutValue(actual, expected));
});
