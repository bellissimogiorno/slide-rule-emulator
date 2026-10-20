/** Hyperbolic and log-log mappings, independent of catalogue and UI.
 * Return null for another family. The coordinator owns explicit position bounds. */
function transcendentalMapping(def, safeMin, safeMax, bounded) {
    if (def.type === "sinhLow") {
        return bounded({
            pos: u => Math.log10(10 * Math.sinh(u)),
            value: p => Math.asinh(Math.pow(10, p - 1))
        });
    }
    if (def.type === "sinhHigh") {
        return bounded({
            pos: u => Math.log10(Math.sinh(u)),
            value: p => Math.asinh(Math.pow(10, p))
        });
    }
    if (def.type === "tanh") {
        const pMax = Math.log10(10 * Math.tanh(safeMax));
        return bounded({
            pos: u => Math.log10(10 * Math.tanh(u)),
            value: p => Math.atanh(Math.min(1 - 1e-15, Math.pow(10, p - 1)))
        }, 0, pMax);
    }
    if (def.type === "hypotenuseLow") {
        return bounded({
            pos: y => Math.log10(10 * Math.sqrt(Math.max(0, (y - 1) * (y + 1)))),
            value: p => Math.sqrt(1 + Math.pow(10, 2 * (p - 1)))
        });
    }
    if (def.type === "hypotenuseHigh") {
        return bounded({
            pos: y => Math.log10(Math.sqrt(Math.max(0, (y - 1) * (y + 1)))),
            value: p => Math.sqrt(1 + Math.pow(10, 2 * p))
        });
    }
    if (def.type === "acosh") {
        return bounded({
            pos: u => Math.log10(Math.cosh(u)),
            value: p => Math.acosh(Math.pow(10, p))
        });
    }
    if (def.type === "syncroLogLog" && Number.isFinite(Number(def.decade))) {
        const decade = Number(def.decade);
        const base = String(def.logBase).toLowerCase() === "e" ? Math.E : 10;
        const logarithm = x => Math.log(x) / Math.log(base);
        return bounded({
            pos: x => Math.log10(Math.abs(logarithm(x))) - decade,
            value: p => Math.pow(base, Math.pow(10, decade + p))
        });
    }
    if (def.type === "loglog" && Number.isFinite(Number(def.decade))) {
        const decade = Number(def.decade);
        const sign = Number(def.sign) < 0 ? -1 : 1;
        return bounded({
            pos: x => Math.log10(Math.abs(Math.log(x))) - decade,
            value: p => Math.exp(sign * Math.pow(10, decade + p))
        });
    }
    if (def.type === "loglog10" && Number.isFinite(Number(def.decade))) {
        const decade = Number(def.decade);
        const sign = Number(def.sign) < 0 ? -1 : 1;
        return bounded({
            pos: x => Math.log10(Math.abs(Math.log10(x))) - decade,
            value: p => Math.pow(10, sign * Math.pow(10, decade + p))
        });
    }
    if (def.type === "loglog") {
        const l0 = Math.log10(Math.abs(Math.log(safeMin)));
        const span = Math.log10(Math.abs(Math.log(safeMax))) - l0;
        const sign = safeMin < 1 ? -1 : 1;
        return bounded({
            pos: x => (Math.log10(Math.abs(Math.log(x))) - l0) / span,
            value: p => Math.exp(sign * Math.pow(10, l0 + p * span))
        });
    }
    return null;
}
export { transcendentalMapping };
