/** Temperature, wavelength and blackbody-curve coordinates.
 * Physics stays in physics.js; this module only maps quantities to positions.
 * Return null for another family. The coordinator owns explicit position bounds. */
import { blackbodyCurveValue } from "#core/physics.js";
function radiationMapping(def, safeMin, safeMax, bounded) {
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
    return null;
}
export { radiationMapping };
