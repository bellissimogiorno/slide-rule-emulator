import { clamp } from "#core/numbers.js";
const PHYSICS = Object.freeze({ h: 6.62607015e-34, c: 299792458, k: 1.380649e-23, e: 1.602176634e-19 });
const ENERGY_PEAK_U = 4.965114231744276;
const PHOTON_PEAK_U = 3.920690394872886;
const RADIATION_C2 = PHYSICS.h * PHYSICS.c / PHYSICS.k * 1e6;
const STEFAN_CM = 2 * Math.pow(Math.PI, 5) * Math.pow(PHYSICS.k, 4) / (15 * Math.pow(PHYSICS.h, 3) * PHYSICS.c ** 2) * 1e-4;
const PHOTON_TOTAL_CM = 4 * Math.PI * 1.2020569031595943 * (PHYSICS.k / PHYSICS.h) ** 3 / PHYSICS.c ** 2 * 1e-4;
const ENERGY_PEAK_CM = 2 * Math.PI * PHYSICS.h * PHYSICS.c ** 2 * (PHYSICS.k / (PHYSICS.h * PHYSICS.c)) ** 5 * planckShape(ENERGY_PEAK_U, 5) * 1e-10;
const PHOTON_PEAK_CM = 2 * Math.PI * PHYSICS.c * (PHYSICS.k / (PHYSICS.h * PHYSICS.c)) ** 4 * planckShape(PHOTON_PEAK_U, 4) * 1e-10;
function blackbodyCurveValue(curve, u) {
    if (!(u >= 0))
        return NaN;
    if (curve === "energySpectral") {
        const up = ENERGY_PEAK_U;
        return planckShape(u, 5) / planckShape(up, 5);
    }
    if (curve === "photonSpectral") {
        const up = PHOTON_PEAK_U;
        return planckShape(u, 4) / planckShape(up, 4);
    }
    if (curve === "energyShort")
        return planckTailFraction(u, 3);
    if (curve === "energyLong")
        return planckLowerFraction(u, 3);
    if (curve === "photonShort")
        return planckTailFraction(u, 2);
    if (curve === "photonLong")
        return planckLowerFraction(u, 2);
    return NaN;
}
/** Log-space evaluation avoids overflow without truncating a representable tail. */
function planckShape(u, power) {
    if (u < 0 || Number.isNaN(u))
        return NaN;
    if (u === 0 || u === Infinity)
        return 0;
    if (u < 1e-8)
        return Math.pow(u, power - 1) / (1 + u / 2);
    if (u > 50)
        return Math.exp(power * Math.log(u) - u) / -Math.expm1(-u);
    return Math.pow(u, power) / Math.expm1(u);
}
function planckTotal(order) {
    if (![2, 3].includes(order))
        throw new RangeError('Planck integral order must be 2 or 3.');
    return order === 3 ? Math.pow(Math.PI, 4) / 15 : 2.4041138063191885;
}
/** Directly integrate the lower tail near zero: 1 - (1 - tiny) loses precision. */
function smallLowerFraction(u, order) {
    const intervals = 96;
    const step = u / intervals;
    let sum = 0;
    for (let i = 0; i <= intervals; i++) {
        const x = i * step;
        const value = x === 0 ? 0 : Math.pow(x, order) / Math.expm1(x);
        sum += (i === 0 || i === intervals ? 1 : i % 2 ? 4 : 2) * value;
    }
    return clamp(sum * step / (3 * planckTotal(order)), 0, 1);
}
function planckLowerFraction(u, order) {
    planckTotal(order);
    if (!(u >= 0))
        return NaN;
    if (u < 1)
        return smallLowerFraction(u, order);
    return 1 - planckTailFraction(u, order);
}
function planckTailFraction(u, order) {
    const total = planckTotal(order);
    if (!(u >= 0))
        return NaN;
    if (u < 1)
        return 1 - smallLowerFraction(u, order);
    let tail = 0;
    for (let k = 1; k <= 240; k++) {
        const e = Math.exp(-k * u);
        if (e === 0)
            break;
        let term;
        if (order === 3)
            term = e * (Math.pow(u, 3) / k + 3 * u * u / (k * k) + 6 * u / Math.pow(k, 3) + 6 / Math.pow(k, 4));
        else
            term = e * (u * u / k + 2 * u / (k * k) + 2 / Math.pow(k, 3));
        tail += term;
        if (Math.abs(term) < 1e-14)
            break;
    }
    return clamp(tail / total, 0, 1);
}
export { PHYSICS, ENERGY_PEAK_U, PHOTON_PEAK_U, RADIATION_C2, STEFAN_CM, PHOTON_TOTAL_CM, ENERGY_PEAK_CM, PHOTON_PEAK_CM, blackbodyCurveValue, planckShape, planckTailFraction, planckLowerFraction };
