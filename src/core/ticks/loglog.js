import { logLogEngraving } from "#core/format.js";
import { clamp } from "#core/numbers.js";
import { byPos, dedupeTicks, engineeringLogCandidates, linearMappedCandidates } from "#core/ticks/common.js";
function logLogCandidatePlan(positiveMin, positiveMax, decade, width = 1000) {
    // Near one, graduate the excess over one. A linear value grid leaves the
    // beginning of the middle LL range much too sparse.
    if (decade <= -1) {
        const min = Math.max(Number.MIN_VALUE, positiveMin - 1);
        const max = Math.max(min * 1.00001, positiveMax - 1);
        return { candidates: engineeringLogCandidates(min, max, 1), toPositive: coord => 1 + coord };
    }
    if (positiveMax / positiveMin < 3.5)
        return { candidates: linearMappedCandidates(positiveMin, positiveMax, width), toPositive: coord => coord };
    return { candidates: engineeringLogCandidates(positiveMin, positiveMax, 1), toPositive: coord => coord };
}
function buildLogLogTicks(def, rt, base, sign, paired, width = 1000) {
    const decade = Number(def.decade);
    if (!Number.isFinite(decade))
        return [];
    const positiveMin = Math.pow(base, Math.pow(10, decade));
    const positiveMax = Math.pow(base, Math.pow(10, decade + 1));
    const plan = logLogCandidatePlan(positiveMin, positiveMax, decade, width);
    const ticks = [];
    for (const candidate of plan.candidates) {
        const positiveValue = plan.toPositive(candidate.coord);
        const actualValue = sign < 0 ? 1 / positiveValue : positiveValue;
        const pos = rt.pos(actualValue);
        if (!Number.isFinite(pos) || pos < -0.0001 || pos > 1.0001)
            continue;
        const labelWanted = Boolean(candidate.labelCandidate);
        if (paired) {
            ticks.push({ pos: clamp(pos, 0, 1), value: positiveValue, reciprocalValue: 1 / positiveValue,
                positiveLabel: labelWanted ? logLogEngraving(positiveValue, decade) : "",
                negativeLabel: labelWanted ? logLogEngraving(1 / positiveValue, decade) : "", kind: candidate.kind });
        }
        else {
            ticks.push({ pos: clamp(pos, 0, 1), value: actualValue,
                label: labelWanted ? logLogEngraving(actualValue, decade) : "", kind: candidate.kind });
        }
    }
    return dedupeTicks(ticks).sort(byPos);
}
function logLogTicks(def, rt, width = 1000) { return buildLogLogTicks(def, rt, Math.E, Number(def.sign) < 0 ? -1 : 1, false, width); }
function syncroLogLogTicks(def, rt, width = 1000) { return buildLogLogTicks(def, rt, String(def.logBase).toLowerCase() === "e" ? Math.E : 10, 1, true, width); }
function logLog10Ticks(def, rt, width = 1000) { return buildLogLogTicks(def, rt, 10, Number(def.sign) < 0 ? -1 : 1, false, width); }
export { logLogCandidatePlan, buildLogLogTicks, logLogTicks, syncroLogLogTicks, logLog10Ticks };
