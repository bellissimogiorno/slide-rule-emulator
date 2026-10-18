import { adaptiveTicks, usesAdaptiveGraduations, spaceAdaptiveLabels } from "#core/ticks/adaptive.js";
import { expandedRootTicks } from "#core/ticks/expanded-roots.js";
import { logLogEngraving, formatTickPrecision } from "#core/format.js";
import { usesConventionalLog } from "#core/ticks/conventional.js";
import { anchorDescription, gaugeDescription } from "#core/mark-descriptions.js";
import { pairedAngleTicks } from "#core/paired-angles.js";
import { pairedProductTicks } from "#core/paired-products.js";
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

function generateTicks(def, rt, width = 1000, minGap = 1.65, options = {}) {
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(minGap) || minGap <= 0)
        throw new RangeError("Tick width and minimum spacing must be positive finite numbers.");
    assertTickStrategy(def);
    const mode = tickModeFor(def);
    const manual = Array.isArray(def.ticks);
    const adaptive = usesAdaptiveGraduations(def, options);
    const expanded = def.type === 'root' && !def.referenceOnly && (!manual || adaptive);
    let ticks;
    if (expanded) ticks = expandedRootTicks(def, rt, width,
        adaptive ? options : { ...options, graduationMode: 'conventional' });
    else if (adaptive && mode !== 'folded') {
        ticks = adaptiveTicks(def, rt, width * (options.displayScale ?? 1), options.adaptiveSpacing || 'balanced');
        if (def.type === 'syncroLogLog') ticks = spaceAdaptiveLabels(ticks, width * (options.displayScale ?? 1)).map(t => ({ ...t,
            reciprocalValue: 1 / t.value, positiveLabel: t.label,
            negativeLabel: t.label ? logLogEngraving(1 / t.value, def.decade, t.pos === rt.pMin || t.pos === rt.pMax) : '' }));
    }
    else if (manual) ticks = manualTicks(def, rt);
    else if (mode === 'mapped' && HYPERBOLIC.has(def.type) && def.minorDivisions == null)
        ticks = hyperbolicTicks(def, rt);
    else if (mode === 'mapped') ticks = mappedTicks(def, rt, 10);
    else ticks = GENERATORS[mode](def, rt, width, options);
    if (!adaptive && !expanded && (def.refineTicks || (!manual && REFINED.has(def.type))))
        ticks = refineMappedGaps(ticks, rt, width);
    const fixedW = def.graduationProfile === 'faber-w' && !adaptive;
    if ((adaptive || expanded) && !fixedW && def.type !== 'syncroLogLog')
        ticks = spaceAdaptiveLabels(ticks, width * (options.displayScale ?? 1));
    const withGauges = addGaugeTicks(def, rt, ticks);
    const inDomain = withGauges.filter(tick => tick.pos >= rt.pMin - 1e-10 && tick.pos <= rt.pMax + 1e-10);
    // A coherent C/D lattice must survive as a whole, including near a named
    // gauge. Label collision handling is separate and cannot delete strokes.
    const visible = adaptive || expanded || (usesConventionalLog(def) && ['log', 'folded'].includes(mode))
        ? inDomain : thinTicksForPixels(inDomain, width, minGap);
    const paired = def.pairedProduct !== undefined ? pairedProductTicks(visible, def)
        : def.pairedSum === undefined ? visible : pairedAngleTicks(visible, def);
    // Raw generator consumers retain detailed captions; the UI always supplies
    // its explicit precision preference. This never changes stroke geometry.
    return typeof options.fullPrecision === 'boolean'
        ? formatTickPrecision(paired, def, options.fullPrecision) : paired;
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
