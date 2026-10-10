import { formatCompact, formatRootLabel, formatSig, smartRound } from "#core/format.js";
import { clamp, fineNiceStep, nearMultiple } from "#core/numbers.js";
import { addTick, byPos, dedupeTicks, engineeringLogCandidates, logCompression, validTick } from "#core/ticks/common.js";
function rootTicks(def, rt, width = 1000) {
    const order = Math.max(2, Math.round(Number(def.order) || 2));
    const branch = clamp(Math.round(Number(def.branch) || 0), 0, order - 1);
    const rawMin = Number(def.min), rawMax = Number(def.max);
    const min = Number.isFinite(rawMin) ? rawMin : Math.pow(10, branch / order);
    const max = Number.isFinite(rawMax) ? rawMax : Math.pow(10, (branch + 1) / order);
    const ticks = [];
    const targetMinor = clamp(width / 3.1, 120, 330);
    const minorStep = fineNiceStep((max - min) / targetMinor);
    const majorStep = fineNiceStep(minorStep * 10);
    const halfStep = majorStep / 2, fifthStep = majorStep / 5;
    const start = Math.ceil((min - 1e-10) / minorStep) * minorStep;
    for (let i = 0; i <= 2000; i++) {
        const v = start + i * minorStep;
        if (v > max + minorStep * 0.2)
            break;
        const value = Number(v.toPrecision(12));
        let kind = "micro", label = "";
        if (nearMultiple(value, majorStep)) {
            kind = "major";
            label = formatRootLabel(value, majorStep);
        }
        else if (nearMultiple(value, halfStep))
            kind = "submajor";
        else if (nearMultiple(value, fifthStep))
            kind = "mid";
        addTick(ticks, rt, value, min, max, label, kind);
    }
    ticks.push({ pos: rt.pos(min), value: min, label: formatSig(min, 5), kind: "index" });
    ticks.push({ pos: rt.pos(max), value: max, label: formatSig(max, 5), kind: "index" });
    return dedupeTicks(ticks).sort(byPos);
}
function foldedTicks(def, rt) {
    const inverse = def.type === "foldedInverse";
    const fold = Number(def.fold) > 0 ? Number(def.fold) : Math.PI;
    const ticks = engineeringLogCandidates(1, 10, 1).map(candidate => {
        const value = candidate.coord;
        const label = candidate.labelCandidate && !candidate.endpoint ? labelForLogMajor(value, 1, 10, 1) : "";
        return { pos: rt.pos(value), value, label, kind: candidate.kind };
    }).filter(validTick);
    const breakPos = rt.pos(1);
    ticks.push({ pos: breakPos, value: 1, label: inverse ? "1 | 10" : "10 | 1", kind: "index" });
    const endpointValue = rt.value(0);
    const foldLabel = def.foldLabel || formatSig(fold, 5);
    const endpointLabel = inverse ? `10/${foldLabel}` : foldLabel;
    ticks.push({ pos: 0, value: endpointValue, label: endpointLabel, kind: "index" });
    ticks.push({ pos: 1, value: endpointValue, label: endpointLabel, kind: "index" });
    return dedupeTicks(ticks).sort(byPos);
}
function logTicks(def, rt) {
    const min = Number(def.min), max = Number(def.max);
    if (!(min > 0) || !(max > min))
        return [];
    const decades = Math.log10(max) - Math.log10(min);
    const candidates = engineeringLogCandidates(min, max, logCompression(decades));
    const ticks = candidates.map(candidate => ({
        pos: rt.pos(candidate.coord), value: candidate.coord,
        label: candidate.labelCandidate ? labelForLogMajor(candidate.coord, min, max, decades) : "",
        kind: candidate.kind
    })).filter(validTick);
    return dedupeTicks(ticks).sort(byPos);
}
function labelForLogMajor(v, min, max, decades) {
    if (v < min * 0.99999 || v > max * 1.00001)
        return "";
    const rounded = smartRound(v);
    if (decades <= 1.05)
        return formatSig(rounded, 5);
    const mant = rounded / Math.pow(10, Math.floor(Math.log10(rounded)));
    const isPower = Math.abs(mant - 1) < 1e-9;
    if (decades <= 2.2 || isPower)
        return formatCompact(rounded);
    return isPower || mant === 2 || mant === 5 ? formatCompact(rounded) : "";
}
export { rootTicks, foldedTicks, logTicks, labelForLogMajor };
