import { formatForStep, formatLinearLabel, formatSig, logLogEngraving } from "#core/format.js";
import { clamp, fineNiceStep, nearMultiple, nearlyInteger, niceStep } from "#core/numbers.js";
import { addTick, byPos, dedupeTicks, linearMappedCandidates, validTick } from "#core/ticks/common.js";
function manualTicks(def, rt) {
    return def.ticks.map(t => {
        const value = Number(t.value);
        return {
            pos: rt.pos(value),
            value,
            label: t.label ?? "",
            title: t.title,
            decade: t.decade,
            ...(def.type === "syncroLogLog" ? {
                reciprocalValue: 1 / value,
                positiveLabel: t.positiveLabel ?? t.label ?? logLogEngraving(value, def.decade),
                negativeLabel: t.negativeLabel ?? logLogEngraving(1 / value, def.decade)
            } : {}),
            kind: t.kind || "major"
        };
    }).filter(validTick).sort(byPos);
}
function bandedTicks(def, rt, bands) {
    const min = Number(def.min), max = Number(def.max);
    const ticks = [];
    for (const [lower, upper, step, majorStep] of bands) {
        const lo = Math.max(min, lower), hi = Math.min(max, upper);
        if (!(hi >= lo))
            continue;
        const first = Math.ceil(lo / step - 1e-9);
        const last = Math.floor(hi / step + 1e-9);
        for (let i = first; i <= last; i++) {
            const value = Number((i * step).toPrecision(13));
            let kind = "micro", label = "";
            if (nearMultiple(value, majorStep)) {
                kind = "major";
                label = formatForStep(value, majorStep);
            }
            else if (nearMultiple(value, majorStep / 2))
                kind = "submajor";
            else if (nearMultiple(value, majorStep / 10))
                kind = "mid";
            else if (nearMultiple(value, step * 5))
                kind = "minor";
            addTick(ticks, rt, value, min, max, label, kind);
        }
    }
    addTick(ticks, rt, min, min, max, def.startLabel ?? formatSig(min, 6), "index");
    addTick(ticks, rt, max, min, max, def.endLabel || formatSig(max, 5), "index");
    return dedupeTicks(ticks).sort(byPos);
}
function pythagoreanTicks(def, rt) {
    // y approaches 1 at the left: the useful decimal places increase there.
    return bandedTicks(def, rt, [
        [0, 0.5, 0.005, 0.1],
        [0.5, 0.8, 0.002, 0.05],
        [0.8, 0.9, 0.001, 0.02],
        [0.9, 0.95, 0.0005, 0.01],
        [0.95, 0.98, 0.0002, 0.005],
        [0.98, 0.99, 0.0001, 0.002],
        [0.99, 1, 0.00002, 0.001]
    ]);
}
function hyperbolicTicks(def, rt) {
    if (def.type === "hypotenuseLow")
        return bandedTicks(def, rt, [
            [1, 1.01, 0.00002, 0.001], [1.01, 1.02, 0.00005, 0.002],
            [1.02, 1.05, 0.0001, 0.005], [1.05, 1.1, 0.0002, 0.01],
            [1.1, 1.2, 0.0005, 0.02], [1.2, 1.5, 0.001, 0.05]
        ]);
    if (def.type === "hypotenuseHigh")
        return bandedTicks(def, rt, [
            [1, 2, 0.002, 0.05], [2, 5, 0.005, 0.1], [5, 11, 0.01, 0.5]
        ]);
    if (def.type === "acosh")
        return bandedTicks(def, rt, [[0, 3, 0.005, 0.1]]);
    const low = [[0, 0.2, 0.0005, 0.01], [0.2, 0.5, 0.001, 0.05], [0.5, 1, 0.002, 0.1]];
    const high = def.type === "tanh"
        ? [[1, 1.5, 0.005, 0.1], [1.5, 2, 0.01, 0.1], [2, 3, 0.02, 0.2]]
        : [[1, 3, 0.002, 0.1]];
    return bandedTicks(def, rt, [...low, ...high]);
}
function linearTicks(def, rt, width = 1000) {
    const min = Number(def.min), max = Number(def.max), specifiedStep = Number(def.majorStep);
    const ticks = [];
    if (Number.isFinite(specifiedStep) && specifiedStep > 0) {
        const minorDivisions = clamp(Math.round(Number(def.minorDivisions) || 10), 2, 100);
        // Include subdivisions in the partial interval before the first major mark.
        const first = Math.floor(min / specifiedStep) * specifiedStep;
        for (let i = 0; i <= 1000; i++) {
            const v = first + i * specifiedStep;
            if (v > max + specifiedStep * 1e-9)
                break;
            const value = Number(v.toPrecision(13));
            addTick(ticks, rt, value, min, max, formatLinearLabel(value, min, max, specifiedStep), "major");
            for (let k = 1; k < minorDivisions; k++) {
                const sub = value + specifiedStep * k / minorDivisions;
                if (sub >= max - 1e-12)
                    break;
                const kind = k * 2 === minorDivisions ? "submajor" : (k % 2 === 0 ? "mid" : "micro");
                addTick(ticks, rt, sub, min, max, "", kind);
            }
        }
        addTick(ticks, rt, min, min, max, formatSig(min, 6), "index");
        addTick(ticks, rt, max, min, max, formatSig(max, 5), "index");
        return dedupeTicks(ticks).sort(byPos);
    }
    const candidates = linearMappedCandidates(min, max, width);
    for (const candidate of candidates) {
        const label = candidate.endpoint ? formatSig(candidate.coord, 6) : candidate.labelCandidate ? formatForStep(candidate.coord, fineNiceStep((max - min) / 10)) : "";
        addTick(ticks, rt, candidate.coord, min, max, label, candidate.kind);
    }
    return dedupeTicks(ticks).sort(byPos);
}
function angleTicks(def, rt) {
    const min = Number(def.min), max = Number(def.max), ticks = [];
    const fine = def.type === "tan2" ? 0.25 : 0.2;
    const start = Math.ceil((min - 1e-10) / fine) * fine;
    for (let i = 0; i <= 2000; i++) {
        const v = start + i * fine;
        if (v > max + fine * 0.2)
            break;
        const deg = Number(v.toFixed(4));
        const whole = nearlyInteger(deg);
        let label = "";
        if (whole) {
            if (def.type === "tan2")
                label = deg === 45 || deg % 5 === 0 || Math.abs(deg - max) < 0.3 ? String(Math.round(deg)) : "";
            else if (def.type === "cos")
                label = deg === 0 || deg % 10 === 0 || (deg >= 60 && deg % 5 === 0) ? String(Math.round(deg)) : "";
            else
                label = deg <= 10 || deg % 10 === 0 || (deg % 5 === 0 && deg <= 45) ? String(Math.round(deg)) : "";
        }
        const endpoint = Math.abs(deg - min) < fine * 0.6 || Math.abs(deg - max) < fine * 0.6 || deg === 45 || deg === 90;
        let kind = "micro";
        if (endpoint)
            kind = "index";
        else if (whole && label)
            kind = "major";
        else if (whole)
            kind = "submajor";
        else if (nearMultiple(deg, 0.5))
            kind = "mid";
        addTick(ticks, rt, deg, min, max, label, kind);
    }
    addTick(ticks, rt, min, min, max, formatSig(min, 4), "index");
    addTick(ticks, rt, max, min, max, formatSig(max, 4), "index");
    return dedupeTicks(ticks).sort(byPos);
}
function smallAngleTicks(def, rt) {
    const min = Number(def.min), max = Number(def.max), ticks = [];
    const step = 0.02, start = Math.ceil((min - 1e-10) / step) * step;
    for (let i = 0; i <= 2000; i++) {
        const v = start + i * step;
        if (v > max + step * 0.2)
            break;
        const value = Number(v.toFixed(3));
        const label = nearlyInteger(value) || Math.abs(value - 5.7) < 0.015 || (value < 1 && nearMultiple(value, 0.1)) ? formatSig(value, 3) : "";
        const kind = label ? "major" : nearMultiple(value, 0.1) ? "submajor" : nearMultiple(value, 0.05) ? "mid" : "micro";
        addTick(ticks, rt, value, min, max, label, kind);
    }
    addTick(ticks, rt, min, min, max, formatSig(min, 4), "index");
    addTick(ticks, rt, max, min, max, formatSig(max, 4), "index");
    return dedupeTicks(ticks).sort(byPos);
}
function mappedTicks(def, rt, targetMajorCount = 10) {
    const min = Number(def.min);
    const max = Number(def.max);
    if (!Number.isFinite(min) || !Number.isFinite(max) || !(max > min))
        return [];
    const ticks = [];
    const step = niceStep((max - min) / Math.max(2, targetMajorCount));
    const minorDivisions = clamp(Math.round(Number(def.minorDivisions) || 5), 2, 100);
    // Start with the cell containing min, not the first major mark above it.
    // Otherwise all minor marks in that initial partial cell disappear.
    const first = Math.floor((min + 1e-12) / step) * step;
    for (let i = 0; i <= 2000; i++) {
        const v = first + i * step;
        if (v > max + step * 1e-9)
            break;
        const value = Number(v.toPrecision(13));
        addTick(ticks, rt, value, min, max, formatForStep(value, step), "major");
        for (let k = 1; k < minorDivisions; k++) {
            const sub = value + step * k / minorDivisions;
            if (sub >= max - 1e-12)
                break;
            addTick(ticks, rt, sub, min, max, "", k * 2 === minorDivisions ? "mid" : "minor");
        }
    }
    addTick(ticks, rt, min, min, max, def.startLabel ?? formatSig(min, 6), "index");
    addTick(ticks, rt, max, min, max, def.endLabel || formatSig(max, 5), "index");
    return dedupeTicks(ticks).sort(byPos);
}
export { manualTicks, bandedTicks, pythagoreanTicks, hyperbolicTicks, linearTicks, angleTicks, smallAngleTicks, mappedTicks };
