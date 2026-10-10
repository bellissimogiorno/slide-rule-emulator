import { toRad } from "#core/numbers.js";
function correctionMetric(key, x) {
    if (['sd', 'td', 'isd', 'itd'].includes(key) && x === 0)
        return 1;
    if (key === "sd") {
        const r = toRad(x);
        return r / Math.sin(r);
    }
    if (key === "td") {
        const r = toRad(x);
        return r / Math.tan(r);
    }
    if (key === "isd")
        return Math.asin(x) / x;
    if (key === "itd")
        return Math.atan(x) / x;
    throw new Error('Unknown correction function: ' + key);
}
export { correctionMetric };
