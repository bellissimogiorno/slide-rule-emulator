/** Numerical display acceptance, independent of the production formatter.
 * Four useful digits allow at most half a unit in the last retained decimal.
 * LL/hypotenuse rows above one budget their excess above one separately.
 * Expected values must come from the test's mathematical or mapping oracle.
 */
import assert from 'node:assert/strict';

export function assertReadoutValue(actual, expected, { nearUnity = false, label = 'Readout' } = {}) {
    assert(Number.isFinite(actual) && Number.isFinite(expected), `${label}: readings must be finite`);
    if (expected === 0) {
        assert.equal(actual, 0, `${label}: an exact zero must display zero`);
        return;
    }
    assert.notEqual(actual, 0, `${label}: a nonzero value must not collapse to zero`);
    const usesExcess = nearUnity && expected > 1 && expected < 2;
    if (usesExcess) assert(actual > 1, `${label}: a useful excess above one must not collapse to one`);
    const magnitude = usesExcess ? expected - 1 : Math.abs(expected);
    const quantum = 10 ** (Math.floor(Math.log10(magnitude)) - 3);
    if (quantum <= Number.MIN_VALUE) {
        assert.equal(actual, expected, `${label}: subnormal rounding at this resolution must preserve the value`);
        return;
    }
    // The ulp allowance accounts only for representing the displayed decimal
    // as a Number; the decimal budget itself never has an absolute unit floor.
    const tolerance = quantum / 2 + Math.abs(expected) * Number.EPSILON * 8;
    assert(Math.abs(actual - expected) <= tolerance,
        `${label}: ${actual} differs from ${expected} beyond four-useful-digit rounding`);
}
