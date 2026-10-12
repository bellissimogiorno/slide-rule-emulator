import { clamp, fineNiceStep, isIndexValue, nearMultiple } from "#core/numbers.js";
function tickKindRank(kind) {
    return ({ micro: 0, minor: 1, mid: 2, submajor: 3, major: 4, gauge: 5, index: 6 })[kind] ?? 1;
}
function thinTicksForPixels(ticks, width, baseGap) {
    const valid = dedupeTicks(ticks).filter(validTick);
    const ordered = [...valid].sort((a, b) => {
        const rank = tickKindRank(b.kind) - tickKindRank(a.kind);
        if (rank)
            return rank;
        const labelled = Number(Boolean(b.label || b.positiveLabel || b.negativeLabel)) - Number(Boolean(a.label || a.positiveLabel || a.negativeLabel));
        if (labelled)
            return labelled;
        return a.pos - b.pos;
    });
    const kept = [];
    for (const tick of ordered) {
        const rank = tickKindRank(tick.kind);
        const labelled = Boolean(tick.label || tick.positiveLabel || tick.negativeLabel);
        const required = baseGap * (rank >= 4 || labelled ? 1.05 : rank <= 0 ? 1.08 : rank === 1 ? 0.95 : 0.85);
        const x = tick.pos * width;
        let lo = 0, hi = kept.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (kept[mid].pos < tick.pos)
                lo = mid + 1;
            else
                hi = mid;
        }
        const leftGap = lo > 0 ? x - kept[lo - 1].pos * width : Infinity;
        const rightGap = lo < kept.length ? kept[lo].pos * width - x : Infinity;
        if (Math.min(leftGap, rightGap) >= required)
            kept.splice(lo, 0, tick);
    }
    return kept.sort(byPos);
}
function logCompression(decades) {
    if (decades <= 1.15)
        return 1;
    if (decades <= 2.2)
        return 2;
    if (decades <= 3.3)
        return 5;
    if (decades <= 5.3)
        return 10;
    return 20;
}
function engineeringLogCandidates(min, max, compression = 1) {
    const out = [];
    if (!(min > 0) || !(max > min))
        return out;
    const d0 = Math.floor(Math.log10(min)) - 1;
    const d1 = Math.ceil(Math.log10(max)) + 1;
    const regions = [{ lo: 1, hi: 2, base: 0.01 }, { lo: 2, hi: 4, base: 0.02 }, { lo: 4, hi: 10, base: 0.05 }];
    for (let d = d0; d <= d1; d++) {
        const pow = Math.pow(10, d);
        for (const region of regions) {
            const step = fineNiceStep(region.base * compression);
            const midStep = fineNiceStep(step * 5);
            const submajorStep = fineNiceStep(step * 10);
            const start = Math.ceil((region.lo - 1e-10) / step) * step;
            for (let mantissa = start; mantissa < region.hi - step * 0.2; mantissa += step) {
                const m = Number(mantissa.toPrecision(12));
                const value = m * pow;
                if (value < min * (1 - 1e-10) || value > max * (1 + 1e-10))
                    continue;
                const integerMantissa = nearMultiple(m, 1);
                let kind = "micro";
                if (integerMantissa)
                    kind = isIndexValue(value) ? "index" : "major";
                else if (nearMultiple(m, submajorStep))
                    kind = "submajor";
                else if (nearMultiple(m, midStep))
                    kind = "mid";
                out.push({ coord: value, kind, labelCandidate: integerMantissa });
            }
        }
    }
    out.push({ coord: min, kind: "index", labelCandidate: true, endpoint: true });
    out.push({ coord: max, kind: "index", labelCandidate: true, endpoint: true });
    return dedupeCandidateCoords(out);
}
function linearMappedCandidates(min, max, width = 1000) {
    const out = [];
    if (!(max > min))
        return out;
    const targetMinor = clamp(width / 3.0, 120, 340);
    const minorStep = fineNiceStep((max - min) / targetMinor);
    const majorStep = fineNiceStep(minorStep * 20);
    const midStep = majorStep / 2;
    const subStep = majorStep / 5;
    const start = Math.ceil((min - 1e-10) / minorStep) * minorStep;
    for (let i = 0; i <= 2000; i++) {
        const value = start + i * minorStep;
        if (value > max + minorStep * 0.2)
            break;
        const coord = Number(value.toPrecision(12));
        let kind = "micro";
        if (nearMultiple(coord, majorStep))
            kind = "major";
        else if (nearMultiple(coord, midStep))
            kind = "submajor";
        else if (nearMultiple(coord, subStep))
            kind = "mid";
        out.push({ coord, kind, labelCandidate: kind === "major" });
    }
    out.push({ coord: min, kind: "index", labelCandidate: true, endpoint: true });
    out.push({ coord: max, kind: "index", labelCandidate: true, endpoint: true });
    return dedupeCandidateCoords(out);
}
function dedupeCandidateCoords(candidates) {
    const map = new Map();
    for (const item of candidates) {
        if (!Number.isFinite(item.coord))
            continue;
        const key = Number(item.coord).toPrecision(11);
        const existing = map.get(key);
        if (!existing || tickKindRank(item.kind) > tickKindRank(existing.kind) || (item.labelCandidate && !existing.labelCandidate))
            map.set(key, item);
    }
    return [...map.values()].sort((a, b) => a.coord - b.coord);
}
function addTick(ticks, rt, value, min, max, label, kind) {
    const tolerance = 1e-10 * Math.max(1, Math.abs(min), Math.abs(max));
    if (!Number.isFinite(value) || value < min - tolerance || value > max + tolerance)
        return;
    const pos = rt.pos(value);
    const tick = { pos, value, label, kind };
    if (validTick(tick))
        ticks.push(tick);
}
function validTick(t) {
    return Number.isFinite(t.pos) && t.pos >= -1e-10 && t.pos <= 1 + 1e-10;
}
function dedupeTicks(ticks) {
    const map = new Map();
    for (const raw of ticks || []) {
        if (!raw || !validTick(raw))
            continue;
        const tick = Object.assign({}, raw, { pos: clamp(raw.pos, 0, 1) });
        const key = Math.round(tick.pos * 1e12);
        const existing = map.get(key);
        if (!existing) {
            map.set(key, tick);
            continue;
        }
        const existingRank = tickKindRank(existing.kind), newRank = tickKindRank(tick.kind);
        let keeper = existing, donor = tick;
        if (newRank > existingRank) {
            keeper = tick;
            donor = existing;
            map.set(key, keeper);
        }
        if (!keeper.title && donor.title)
            keeper.title = donor.title;
        if (!keeper.label && donor.label)
            keeper.label = donor.label;
        if (!keeper.positiveLabel && donor.positiveLabel)
            keeper.positiveLabel = donor.positiveLabel;
        if (!keeper.negativeLabel && donor.negativeLabel)
            keeper.negativeLabel = donor.negativeLabel;
        if (keeper.value == null && donor.value != null)
            keeper.value = donor.value;
        if (keeper.reciprocalValue == null && donor.reciprocalValue != null)
            keeper.reciprocalValue = donor.reciprocalValue;
    }
    return [...map.values()];
}
/** Add round decimal values only where a nonlinear interval is too wide.
 * Unlike pixel sampling, every new tick is a meaningful value passed through
 * the actual mapping. Four passes and bounded candidates prevent runaway work.
 * Explicit manual ticks and user-specified linear subdivisions do not use this.
 */
function refineMappedGaps(ticks, runtime, width, maxGap = 10) {
    let result = dedupeTicks(ticks).sort(byPos);
    for (let pass = 0; pass < 4; pass++) {
        const additions = [];
        for (let i = 1; i < result.length; i++) {
            const left = result[i - 1], right = result[i];
            const gap = (right.pos - left.pos) * width;
            if (gap <= maxGap)
                continue;
            const lo = Math.min(left.value, right.value);
            const hi = Math.max(left.value, right.value);
            const step = fineNiceStep((hi - lo) / Math.max(2, gap / 4));
            if (!(step > 0) || !Number.isFinite(step))
                continue;
            const start = Math.ceil(lo / step) * step;
            for (let j = 0; j < 1000; j++) {
                const value = Number((start + j * step).toPrecision(13));
                if (!Number.isFinite(value) || value >= hi)
                    break;
                if (value <= lo)
                    continue;
                const pos = runtime.pos(value);
                if (Number.isFinite(pos) && pos > left.pos + 1e-12 && pos < right.pos - 1e-12) {
                    additions.push({ pos, value, label: '', kind: 'micro' });
                }
            }
        }
        if (!additions.length)
            break;
        result = dedupeTicks([...result, ...additions]).sort(byPos);
    }
    return result;
}
function byPos(a, b) { return a.pos - b.pos; }
export { tickKindRank, thinTicksForPixels, logCompression, engineeringLogCandidates, linearMappedCandidates, dedupeCandidateCoords, addTick, validTick, dedupeTicks, refineMappedGaps, byPos };
