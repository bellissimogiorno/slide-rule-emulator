import { anchorDescription, gaugeDescription } from "#core/mark-descriptions.js";
import { pairedAngleTicks } from "#core/paired-angles.js";
import { assertTickStrategy, tickModeFor } from "#core/scale-types.js";
import { byPos, dedupeTicks, refineMappedGaps, thinTicksForPixels } from "#core/ticks/common.js";
import { angleTicks, hyperbolicTicks, linearTicks, manualTicks, mappedTicks, pythagoreanTicks, smallAngleTicks } from "#core/ticks/elementary.js";
import { foldedTicks, logTicks, rootTicks } from "#core/ticks/logarithmic.js";
import { logLog10Ticks, logLogTicks, syncroLogLogTicks } from "#core/ticks/loglog.js";
import { blackbodyCurveTicks, temperatureTicks } from "#core/ticks/radiation.js";
const GENERATORS = Object.freeze({
    linear: linearTicks, reverseLinear: linearTicks,
    sin: angleTicks, cos: angleTicks, tan: angleTicks, tan2: angleTicks,
    smallAngle: smallAngleTicks, mapped: mappedTicks,
    loglog: logLogTicks, loglog10: logLog10Ticks, syncroLogLog: syncroLogLogTicks,
    root: rootTicks, folded: foldedTicks, pythagorean: pythagoreanTicks,
    temperature: temperatureTicks, tempDerived: temperatureTicks,
    bbCurve: blackbodyCurveTicks, log: logTicks
});
const HYPERBOLIC = new Set(['sinhLow', 'sinhHigh', 'tanh', 'hypotenuseLow', 'hypotenuseHigh', 'acosh']);
const REFINED = new Set(['correction', 'temperatureC', 'temperatureF', 'tempDerived', 'waterVapor', 'gasEntropy']);

function generateTicks(def, rt, width = 1000, minGap = 1.65) {
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(minGap) || minGap <= 0)
        throw new RangeError("Tick width and minimum spacing must be positive finite numbers.");
    assertTickStrategy(def);
    const mode = tickModeFor(def);
    const manual = Array.isArray(def.ticks);
    let ticks;
    if (manual) ticks = manualTicks(def, rt);
    else if (mode === 'mapped' && HYPERBOLIC.has(def.type) && def.minorDivisions == null)
        ticks = hyperbolicTicks(def, rt);
    else if (mode === 'mapped') ticks = mappedTicks(def, rt, 10);
    else ticks = GENERATORS[mode](def, rt, width);
    if (def.refineTicks || (!manual && REFINED.has(def.type)))
        ticks = refineMappedGaps(ticks, rt, width);
    const withGauges = addGaugeTicks(def, rt, ticks);
    const visible = thinTicksForPixels(withGauges.filter(tick => tick.pos >= rt.pMin - 1e-10 && tick.pos <= rt.pMax + 1e-10), width, minGap);
    return def.pairedSum === undefined ? visible : pairedAngleTicks(visible, def);
}
function addGaugeTicks(def, rt, ticks) {
    if (def.anchor) {
        const pos = Number.isFinite(def.anchorPos) ? def.anchorPos : 0.5;
        if (pos >= rt.pMin && pos <= rt.pMax)
            ticks.push({ pos, value: rt.value(pos), label: def.anchor, kind: "gauge", title: anchorDescription(def, rt.value(pos)) });
    }
    for (const gauge of def.gauges || []) {
        const value = Number(gauge.value);
        const pos = rt.pos(value);
        if (Number.isFinite(pos) && pos >= 0 && pos <= 1)
            ticks.push({ pos, value, label: gauge.label || "", kind: "gauge", title: gaugeDescription(gauge) });
    }
    return dedupeTicks(ticks).sort(byPos);
}
export { generateTicks, addGaugeTicks };
