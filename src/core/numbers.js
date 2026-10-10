function positiveModulo(x, m) { return ((x % m) + m) % m; }
function normalizeMantissa(x) {
    // Bounded even for zero, negative, infinite or subnormal inputs.
    if (!(x > 0) || !Number.isFinite(x))
        return NaN;
    const log = Math.log10(x);
    const power = Math.pow(10, Math.floor(log));
    let value = power > 0 ? x / power : Math.pow(10, log - Math.floor(log));
    if (value >= 10)
        value /= 10;
    if (value < 1)
        value *= 10;
    return value;
}
function nearlyInteger(v) { return Math.abs(v - Math.round(v)) < 1e-9; }
function toRad(deg) { return deg * Math.PI / 180; }
function toDeg(rad) { return rad * 180 / Math.PI; }
function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
function niceStep(raw) {
    if (!(raw > 0))
        return 1;
    const power = Math.pow(10, Math.floor(Math.log10(raw)));
    const fraction = raw / power;
    const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
    return nice * power;
}
function fineNiceStep(raw) {
    if (!(raw > 0))
        return 1;
    const power = Math.pow(10, Math.floor(Math.log10(raw)));
    const fraction = raw / power;
    const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
    return nice * power;
}
function nearMultiple(value, step, tolerance = 1e-7) {
    if (!(step > 0))
        return false;
    return Math.abs(value / step - Math.round(value / step)) < tolerance;
}
function isIndexValue(v) {
    if (!(v > 0))
        return false;
    const log = Math.log10(v);
    return Math.abs(log - Math.round(log)) < 1e-10;
}
function invertMonotonic(fn, target, lo, hi, increasing = true) {
    let a = lo, b = hi;
    for (let i = 0; i < 60; i++) {
        const m = (a + b) / 2;
        const value = fn(m);
        if ((value < target) === increasing)
            a = m;
        else
            b = m;
    }
    return (a + b) / 2;
}
export { positiveModulo, normalizeMantissa, nearlyInteger, toRad, toDeg, clamp, niceStep, fineNiceStep, nearMultiple, isIndexValue, invertMonotonic };
