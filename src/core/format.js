import { formatSexagesimal } from '#core/sexagesimal.js';
function formatValue(value, def) {
    if (!Number.isFinite(value))
        return value > 0 ? "∞" : "--";
    if (def.angleNotation === "sexagesimal") return formatSexagesimal(value);
    if (def.unit === "°" || def.type === "sin" || def.type === "cos" || def.type === "tan" || def.type === "tan2" || def.type === "smallAngle") {
        return `${formatSig(value, 5)}°`;
    }
    const base = formatSig(value, 6);
    if (def.unit)
        return `${base} ${def.unit}`;
    return base;
}
function formatSig(x, sig) {
    if (x === 0)
        return "0";
    const ax = Math.abs(x);
    if (ax >= 100000 || ax < 0.001) {
        const [mantissa, exponent] = x.toExponential(sig - 1).split("e");
        return trimZeros(mantissa) + "e" + Number(exponent);
    }
    return trimZeros(Number(x).toPrecision(sig));
}
function formatCompact(x) {
    if (!Number.isFinite(x))
        return "";
    return formatSig(x, Math.abs(x) >= 10000 ? 3 : 5);
}
function formatLinearLabel(v, min, max, step) {
    if (Number.isFinite(step) && step > 0)
        return formatForStep(v, step);
    const span = Math.abs(max - min);
    if (span <= 1.5)
        return trimZeros(v.toFixed(1));
    if (span <= 20)
        return trimZeros(v.toFixed(0));
    return formatCompact(v);
}
function formatForStep(value, step) {
    const decimals = decimalPlacesForStep(step);
    if (Math.abs(value) >= 100000 || (Math.abs(value) > 0 && Math.abs(value) < 0.0001))
        return formatSig(value, 5);
    return trimZeros(value.toFixed(decimals));
}
function decimalPlacesForStep(step) {
    let scaled = Math.abs(step);
    let decimals = 0;
    while (decimals < 7 && Math.abs(scaled - Math.round(scaled)) > 1e-8) {
        scaled *= 10;
        decimals++;
    }
    return decimals;
}
function smartRound(x) {
    if (!Number.isFinite(x) || x === 0)
        return x;
    // Fixed decimal places erase small, perfectly representable log labels.
    if (Math.abs(x) < 1e-7)
        return Number(x.toPrecision(9));
    const digits = Math.max(0, 8 - Math.floor(Math.log10(Math.abs(x))));
    return Number(x.toFixed(Math.min(10, digits)));
}
function trimZeros(s) {
    return String(s).replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, " ").trim();
}
function formatRootLabel(value, step) {
    const decimals = Math.max(0, -Math.floor(Math.log10(step)) + (step < 0.2 ? 1 : 0));
    return trimZeros(value.toFixed(Math.min(4, decimals)));
}
function formatLogLogLabel(value, decade) {
    if (!Number.isFinite(value))
        return "--";
    if (value >= 100000 || value < 0.0001)
        return formatSig(value, 3);
    const sig = decade <= -2 ? 6 : 5;
    return formatSig(value, sig);
}
function logLogEngraving(value, decade) {
    if (!Number.isFinite(value))
        return "--";
    const magnitude = Math.abs(value);
    /* Classic rules favour a short engraving over calculator-style output.
       Retain the extra digit near unity on the fine LL ranges, but cap the
       wide LL ranges at four significant figures. */
    if (decade <= -3)
        return formatSig(value, 5);
    if (decade <= -1)
        return formatSig(value, 4);
    if (magnitude >= 10000 || (magnitude > 0 && magnitude < 0.0001)) {
        return formatSig(value, 3);
    }
    return formatSig(value, 4);
}
export { formatValue, formatSig, formatCompact, formatLinearLabel, formatForStep, decimalPlacesForStep, smartRound, trimZeros, formatRootLabel, formatLogLogLabel, logLogEngraving };
