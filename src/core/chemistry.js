/** Chemical-engineering calibrations, independent of the UI and catalogue.
 * Units at this boundary are kelvin, pascals and J/(mol K).
 * Sources and limitations: docs/CHEMICAL_SCALES.md. No network is used at runtime.
 */
import { invertMonotonic } from '#core/numbers.js';
export const GAS_CONSTANT = 8.31446261815324;
export const KG_FORCE_CM2 = 98066.5;
export const ATMOSPHERE = 101325;
export const MMHG = 133.322387415;
export const PSI = 6894.757293168;
export const INHG = 25.4 * MMHG;
export const WATER_CRITICAL_K = 647.096;
export const WATER_TRIPLE_K = 273.16;

/** IAPWS SR1-86(1992), Eq. 1. Valid from triple to critical point. */
export function waterSaturationPressure(kelvin) {
    if (!Number.isFinite(kelvin) || kelvin < WATER_TRIPLE_K || kelvin > WATER_CRITICAL_K)
        return NaN;
    const tau = 1 - kelvin / WATER_CRITICAL_K;
    const terms = [[-7.85951783, 1], [1.84408259, 1.5], [-11.7866497, 3],
        [22.6807411, 3.5], [-15.9618719, 4], [1.80122502, 7.5]];
    return 22.064e6 * Math.exp(WATER_CRITICAL_K / kelvin *
        terms.reduce((sum, [a, b]) => sum + a * tau ** b, 0));
}
/** IAPWS R14-08(2011), Eq. 6. Ice Ih, not supercooled liquid water. */
export function iceSublimationPressure(kelvin) {
    if (!Number.isFinite(kelvin) || kelvin < 50 || kelvin > WATER_TRIPLE_K)
        return NaN;
    const theta = kelvin / WATER_TRIPLE_K;
    const sum = -21.2144006 * theta ** 0.00333333333
        + 27.3203819 * theta ** 1.20666667 - 6.10598130 * theta ** 1.70333333;
    return 611.657 * Math.exp(sum / theta);
}
export function equilibriumVaporPressure(kelvin) {
    return kelvin < WATER_TRIPLE_K ? iceSublimationPressure(kelvin) : waterSaturationPressure(kelvin);
}
/** Coordinate of all chemical pressure rows: six decades, 0.001-1000 kgf/cm2. */
export function pressurePosition(pascals) {
    return (Math.log10(pascals / KG_FORCE_CM2) + 3) / 6;
}
export function pressureAtPosition(position) {
    return KG_FORCE_CM2 * 10 ** (6 * position - 3);
}

// NIST WebBook Shomate A-E coefficients (SI); only the published ranges used.
// Integration of Cp/T is joined continuously at fit boundaries. This avoids
// small discontinuities from the independently rounded entropy constants G.
const NITROGEN = [
    [100, 500, [28.98641, 1.853978, -9.647459, 16.63537, 0.000117]],
    [500, 2000, [19.50583, 19.88705, -8.598535, 1.369784, 0.527601]]
];
const OXYGEN = [
    [100, 700, [31.32234, -20.23531, 57.86644, -36.50624, -0.007374]],
    [700, 2000, [30.03235, 8.772972, -3.988133, 0.788313, -0.741599]]
];
const CARBON_DIOXIDE = [[298.15, 1200, [24.99735, 55.18696, -33.69137, 7.948387, -0.136638]]];
export function gasTemperatureRange(gas) {
    if (gas === 'air') return [100, 2000];
    if (gas === 'co2') return [298.15, 1200];
    throw new RangeError('Gas must be air or co2.');
}
function primitive(kelvin, [a, b, c, d, e]) {
    const t = kelvin / 1000;
    return a * Math.log(t) + b * t + c * t * t / 2 + d * t ** 3 / 3 - e / (2 * t * t);
}
function integrateEntropy(table, lo, hi) {
    return table.reduce((sum, [start, end, coefficients]) => {
        const a = Math.max(start, lo), b = Math.min(end, hi);
        return b > a ? sum + primitive(b, coefficients) - primitive(a, coefficients) : sum;
    }, 0);
}
/** Fixed-composition ideal gas: air here means 79 mol% N2 and 21 mol% O2.
 * This is a documented modern model, not Hemmi's unpublished historical fit.
 */
export function gasEntropyChange(gas, fromK, toK) {
    const [lo, hi] = gasTemperatureRange(gas);
    if (![fromK, toK].every(t => Number.isFinite(t) && t >= lo && t <= hi)) return NaN;
    const a = Math.min(fromK, toK), b = Math.max(fromK, toK);
    const change = gas === 'co2' ? integrateEntropy(CARBON_DIOXIDE, a, b)
        : 0.79 * integrateEntropy(NITROGEN, a, b) + 0.21 * integrateEntropy(OXYGEN, a, b);
    return Math.sign(toK - fromK) * change;
}
/** Runtime for the two non-elementary chemistry mappings. Child domains can
 * occupy only a part of a physical row; renderers must respect pMin/pMax. */
export function chemicalRuntime(definition) {
    const d = definition;
    if (d.type === 'waterVapor') {
        const pos = celsius => pressurePosition(equilibriumVaporPressure(celsius + 273.15));
        return { pos, value: p => invertMonotonic(pos, p, d.min, d.max, true),
            pMin: pos(d.min), pMax: pos(d.max) };
    }
    if (d.type === 'gasEntropy') {
        const origin = d.origin ?? 0;
        const reference = d.min + 273.15;
        const pos = celsius => origin + gasEntropyChange(d.gas, reference, celsius + 273.15) / (6 * GAS_CONSTANT * Math.LN10);
        return { pos, value: p => invertMonotonic(pos, p, d.min, d.max, true),
            pMin: origin, pMax: pos(d.max) };
    }
    return null;
}
