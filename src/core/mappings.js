import { chemicalRuntime } from "#core/chemistry.js";
import { correctionMetric } from "#core/corrections.js";
import { MathExpressions } from "#core/expressions.js";
import { clamp, invertMonotonic, positiveModulo, toDeg, toRad } from "#core/numbers.js";
import { blackbodyCurveValue } from "#core/physics.js";
const runtimeCache = new WeakMap();
/** Runtime mappings may be cached only when their definition cannot change. */
function makeRuntimeScale(def) {
    if (!def || typeof def !== "object")
        throw new TypeError("A scale definition is required.");
    if (!Object.isFrozen(def))
        return createRuntimeScale(def);
    if (runtimeCache.has(def))
        return runtimeCache.get(def);
    const runtime = createRuntimeScale(def);
    runtimeCache.set(def, runtime);
    return runtime;
}
function createRuntimeScale(def) {
    const chemical = chemicalRuntime(def);
    if (chemical) return chemical;
    const min = Number(def.min);
    const max = Number(def.max);
    const safeMin = Number.isFinite(min) ? min : 0;
    const safeMax = Number.isFinite(max) ? max : 1;
    const explicitPMin = Number(def.pMin);
    const explicitPMax = Number(def.pMax);
    const bounded = (rt, pMin = 0, pMax = 1) => Object.assign(rt, {
        pMin: Number.isFinite(explicitPMin) ? explicitPMin : pMin,
        pMax: Number.isFinite(explicitPMax) ? explicitPMax : pMax
    });
    if (def.type === "expression") {
        const posExpr = String(def.pos || "x");
        const valueExpr = String(def.value || "p");
        const posFn = MathExpressions.compile(posExpr, "x");
        const valueFn = MathExpressions.compile(valueExpr, "p");
        return bounded({
            pos: x => Number(posFn(Number(x))),
            value: p => Number(valueFn(Number(p)))
        });
    }
    if (def.type === "root") {
        const order = Math.max(2, Math.round(Number(def.order) || 2));
        const branch = clamp(Math.round(Number(def.branch) || 0), 0, order - 1);
        return bounded({
            pos: x => order * Math.log10(x) - branch,
            value: p => Math.pow(10, (p + branch) / order)
        });
    }
    if (def.type === "foldedLog") {
        const fold = Number(def.fold) > 0 ? Number(def.fold) : Math.PI;
        return bounded({
            pos: x => positiveModulo(Math.log10(x) - Math.log10(fold), 1),
            value: p => Math.pow(10, positiveModulo(Math.log10(fold) + p, 1))
        });
    }
    if (def.type === "foldedInverse") {
        const fold = Number(def.fold) > 0 ? Number(def.fold) : Math.PI;
        return bounded({
            pos: x => positiveModulo(-Math.log10(fold) - Math.log10(x), 1),
            value: p => Math.pow(10, positiveModulo(-Math.log10(fold) - p, 1))
        });
    }
    if (def.type === "inverseLog") {
        const l0 = Math.log10(safeMin);
        const span = Math.log10(safeMax) - l0;
        return bounded({
            pos: x => 1 - ((Math.log10(x) - l0) / span),
            value: p => Math.pow(10, l0 + (1 - p) * span)
        });
    }
    if (def.type === "linear") {
        const span = safeMax - safeMin || 1;
        return bounded({
            pos: x => (x - safeMin) / span,
            value: p => safeMin + p * span
        });
    }
    if (def.type === "sin") {
        return bounded({
            pos: deg => Math.log10(10 * Math.sin(toRad(deg))),
            value: p => toDeg(Math.asin(Math.pow(10, p - 1)))
        });
    }
    if (def.type === "cos") {
        return bounded({
            pos: deg => Math.log10(10 * Math.cos(toRad(deg))),
            value: p => toDeg(Math.acos(Math.pow(10, p - 1)))
        });
    }
    if (def.type === "tan") {
        return bounded({
            pos: deg => Math.log10(10 * Math.tan(toRad(deg))),
            value: p => toDeg(Math.atan(Math.pow(10, p - 1)))
        });
    }
    if (def.type === "tan2") {
        return bounded({
            pos: deg => Math.log10(Math.tan(toRad(deg))),
            value: p => toDeg(Math.atan(Math.pow(10, p)))
        });
    }
    if (def.type === "smallAngle") {
        return bounded({
            pos: deg => Math.log10(100 * Math.sin(toRad(deg))),
            value: p => toDeg(Math.asin(Math.pow(10, p - 2)))
        });
    }
    if (def.type === "pythagorean") {
        return bounded({
            pos: y => 1 + Math.log10(Math.sqrt(Math.max(0, 1 - y * y))),
            value: p => Math.sqrt(Math.max(0, 1 - Math.pow(10, 2 * (p - 1))))
        });
    }
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
    if (def.type === "reverseLinear") {
        const span = safeMax - safeMin || 1;
        return bounded({
            pos: x => 1 - (x - safeMin) / span,
            value: p => safeMin + (1 - p) * span
        });
    }
    if (def.type === "correction") {
        const key = String(def.correction || "sd");
        const metric = x => correctionMetric(key, x);
        const m0 = metric(safeMin);
        const m1 = metric(safeMax);
        const increasing = m1 >= m0;
        const span = m1 - m0 || 1;
        return bounded({
            pos: x => (metric(x) - m0) / span,
            value: p => invertMonotonic(v => metric(v), m0 + p * span, safeMin, safeMax, increasing)
        });
    }
    if (def.type === "temperature") {
        return bounded({
            pos: x => (Math.log10(x) - 2) / 2,
            value: p => 100 * Math.pow(10, 2 * p)
        });
    }
    if (def.type === "temperatureC") {
        return bounded({
            pos: x => (Math.log10(x + 273.15) - 2) / 2,
            value: p => 100 * Math.pow(10, 2 * p) - 273.15
        });
    }
    if (def.type === "temperatureF") {
        return bounded({
            pos: x => (Math.log10((x + 459.67) * 5 / 9) - 2) / 2,
            value: p => 1.8 * (100 * Math.pow(10, 2 * p)) - 459.67
        });
    }
    if (def.type === "tempDerived") {
        const coeff = Number(def.coeff) || 1;
        const power = Number(def.power) || 1;
        const relation = def.relation || "power";
        const valueAtTemperature = T => relation === "sqrt" ? coeff * Math.sqrt(T) : relation === "linear" ? coeff * T : relation === "inverse" ? coeff / T : coeff * Math.pow(T, power);
        const temperatureAtValue = x => relation === "sqrt" ? Math.pow(x / coeff, 2) : relation === "linear" ? x / coeff : relation === "inverse" ? coeff / x : Math.pow(x / coeff, 1 / power);
        return bounded({
            pos: x => (Math.log10(temperatureAtValue(x)) - 2) / 2,
            value: p => valueAtTemperature(100 * Math.pow(10, 2 * p))
        });
    }
    if (def.type === "bbWavenumber") {
        const l0 = Math.log10(safeMin);
        const span = Math.log10(safeMax) - l0 || 1;
        return bounded({
            pos: x => (Math.log10(x) - l0) / span,
            value: p => Math.pow(10, l0 + p * span)
        });
    }
    if (def.type === "bbWavelength") {
        const lMin = Math.log10(safeMin);
        const lMax = Math.log10(safeMax);
        const span = lMax - lMin || 1;
        return bounded({
            pos: x => (lMax - Math.log10(x)) / span,
            value: p => Math.pow(10, lMax - p * span)
        });
    }
    if (def.type === "bbCurve") {
        return bounded({
            pos: () => NaN,
            value: p => blackbodyCurveValue(def.curve, (Number(def.u0) || 0.01) * Math.pow(10, 2 * p))
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
    if (def.type !== "log")
        throw new Error("Unknown scale mapping: " + def.type);
    const l0 = Math.log10(safeMin);
    const span = Math.log10(safeMax) - l0;
    return bounded({
        pos: x => (Math.log10(x) - l0) / span,
        value: p => Math.pow(10, l0 + p * span)
    });
}
export { makeRuntimeScale, createRuntimeScale };
