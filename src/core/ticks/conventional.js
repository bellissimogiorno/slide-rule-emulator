/** Readable C/D-type graduations. Select complete decimal lattices, not an
 * arbitrary subset of their strokes. See docs/GRADUATIONS.md for sources,
 * the deliberately limited scope, and the screen-density policy.
 */
import { nearMultiple } from '#core/numbers.js';

export const LOG_GRADUATIONS = Object.freeze(['adaptive', 'pocket', 'standard', 'fine']);
export const LOG_PROFILES = Object.freeze({
    pocket: Object.freeze([0.02, 0.05, 0.1]),
    standard: Object.freeze([0.01, 0.02, 0.05]),
    fine: Object.freeze([0.005, 0.01, 0.02])
});
export const LOG_REGIONS = Object.freeze([
    Object.freeze([1, 2]), Object.freeze([2, 4]), Object.freeze([4, 10])
]);
export const LOG_MIN_GAP = 3; // CSS pixels, not a historical manufacturing rule.

/** Only a complete, ordinary log decade or its folded counterpart qualifies.
 * Explicit ticks and nonlinear, multi-decade and root scales keep their own
 * generators. Never infer a custom expression's mathematics from its name.
 */
export function usesConventionalLog(def) {
    if (Array.isArray(def.ticks) || def.refineTicks) return false;
    if (['foldedLog', 'foldedInverse'].includes(def.type)) return true;
    if (!['log', 'inverseLog'].includes(def.type)) return false;
    const lo = Math.log10(Number(def.min)), hi = Math.log10(Number(def.max));
    return Number.isFinite(lo) && Number.isFinite(hi)
        && Math.abs(lo - Math.round(lo)) < 1e-10 && Math.abs(hi - lo - 1) < 1e-10;
}

/** Pick one pattern per whole region using its tightest adjacent interval.
 * At very small sizes the pocket pattern is the floor: do not silently erase
 * secondary divisions just to promise a hard minimum gap. Enlarging helps.
 */
export function logRegionProfiles(screenWidth, mode = 'adaptive') {
    return selectRegionProfiles(screenWidth, mode, LOG_REGIONS, LOG_PROFILES);
}

/** Share the density policy, not the family-specific breakpoints or intervals.
 * screenWidth is the length of one complete logarithmic decade (2L for W).
 */
export function selectRegionProfiles(screenWidth, mode, regions, profiles) {
    if (!Number.isFinite(screenWidth) || screenWidth <= 0)
        throw new RangeError('Graduation width must be a positive finite number.');
    if (!LOG_GRADUATIONS.includes(mode)) throw new RangeError('Unknown logarithmic graduation pattern.');
    return regions.map(([, hi], index) => {
        if (mode !== 'adaptive') return mode;
        return ['fine', 'standard', 'pocket'].find(name => {
            const step = profiles[name][index];
            return screenWidth * Math.log10(hi / (hi - step)) >= LOG_MIN_GAP;
        }) || 'pocket';
    });
}

export function conventionalLogCandidates(def, screenWidth, mode = 'adaptive') {
    const profiles = logRegionProfiles(screenWidth, mode);
    const factor = ['foldedLog', 'foldedInverse'].includes(def.type) ? 1 : Number(def.min);
    const result = [];
    for (const [region, [lo, hi]] of LOG_REGIONS.entries()) {
        const step = LOG_PROFILES[profiles[region]][region];
        const count = Math.round((hi - lo) / step);
        // Integer iteration avoids accumulating floating-point step error.
        for (let i = 0; i < count; i++) {
            const m = Number((lo + i * step).toPrecision(12));
            const primary = nearMultiple(m, 1), secondary = nearMultiple(m, 0.1);
            const midpoint = step <= 0.01 && nearMultiple(m, 0.05);
            const kind = primary ? (m === 1 ? 'index' : 'major')
                : secondary ? 'submajor' : midpoint ? 'mid'
                : step < 0.01 && nearMultiple(m, 0.01) ? 'minor' : 'micro';
            result.push({ coord: Number((m * factor).toPrecision(14)), kind,
                labelCandidate: primary || (m < 2 && secondary),
                endpoint: m === 1, profile: profiles[region] });
        }
    }
    result.push({ coord: Number((10 * factor).toPrecision(14)), kind: 'index',
        labelCandidate: true, endpoint: true, profile: profiles[2] });
    return result;
}
