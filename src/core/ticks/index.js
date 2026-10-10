import { assertTickStrategy, tickModeFor } from "#core/scale-types.js";
import { byPos, dedupeTicks, refineMappedGaps, thinTicksForPixels } from "#core/ticks/common.js";
import { angleTicks, hyperbolicTicks, linearTicks, manualTicks, mappedTicks, pythagoreanTicks, smallAngleTicks } from "#core/ticks/elementary.js";
import { foldedTicks, logTicks, rootTicks } from "#core/ticks/logarithmic.js";
import { logLog10Ticks, logLogTicks, syncroLogLogTicks } from "#core/ticks/loglog.js";
import { blackbodyCurveTicks, temperatureTicks } from "#core/ticks/radiation.js";
function generateTicks(def, rt, width = 1000, minGap = 1.65) {
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(minGap) || minGap <= 0) {
        throw new RangeError("Tick width and minimum spacing must be positive finite numbers.");
    }
    assertTickStrategy(def);
    {
        let ticks;
        if (Array.isArray(def.ticks))
            ticks = manualTicks(def, rt);
        else {
            const mode = tickModeFor(def);
            if (mode === "linear" || mode === "reverseLinear")
                ticks = linearTicks(def, rt, width);
            else if (mode === "sin" || mode === "cos" || mode === "tan" || mode === "tan2")
                ticks = angleTicks(def, rt);
            else if (mode === "smallAngle")
                ticks = smallAngleTicks(def, rt);
            else if (mode === "mapped" && ["sinhLow", "sinhHigh", "tanh", "hypotenuseLow", "hypotenuseHigh", "acosh"].includes(def.type) && def.minorDivisions == null)
                ticks = hyperbolicTicks(def, rt);
            else if (mode === "mapped")
                ticks = mappedTicks(def, rt, 10);
            else if (mode === "loglog")
                ticks = logLogTicks(def, rt, width);
            else if (mode === "loglog10")
                ticks = logLog10Ticks(def, rt, width);
            else if (mode === "syncroLogLog")
                ticks = syncroLogLogTicks(def, rt, width);
            else if (mode === "root")
                ticks = rootTicks(def, rt, width);
            else if (mode === "folded")
                ticks = foldedTicks(def, rt);
            else if (mode === "pythagorean")
                ticks = pythagoreanTicks(def, rt);
            else if (mode === "temperature" || mode === "tempDerived")
                ticks = temperatureTicks(def, rt);
            else if (mode === "bbCurve")
                ticks = blackbodyCurveTicks(def, rt);
            else
                ticks = logTicks(def, rt);
        }
        if (def.refineTicks || (!Array.isArray(def.ticks) && ['correction', 'temperatureC', 'temperatureF', 'tempDerived', 'waterVapor', 'gasEntropy'].includes(def.type))) {
            ticks = refineMappedGaps(ticks, rt, width);
        }
        const withGauges = addGaugeTicks(def, rt, ticks || []);
        return thinTicksForPixels(withGauges.filter(tick => tick.pos >= rt.pMin - 1e-10 && tick.pos <= rt.pMax + 1e-10), width, minGap);
    }
}
function addGaugeTicks(def, rt, ticks) {
    if (def.anchor) {
        const pos = Number.isFinite(def.anchorPos) ? def.anchorPos : 0.5;
        if (pos >= rt.pMin && pos <= rt.pMax)
            ticks.push({ pos, value: rt.value(pos), label: def.anchor, kind: "gauge" });
    }
    for (const gauge of def.gauges || []) {
        const value = Number(gauge.value);
        const pos = rt.pos(value);
        if (Number.isFinite(pos) && pos >= 0 && pos <= 1)
            ticks.push({ pos, value, label: gauge.label || "", kind: "gauge" });
    }
    return dedupeTicks(ticks).sort(byPos);
}
export { generateTicks, addGaugeTicks };
