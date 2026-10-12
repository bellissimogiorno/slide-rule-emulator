/** Generate the long logarithmic scale first; cut it into branches afterwards.
 * W follows the shared C/D-and-W choice, using its own 1-2/2-5/5-10 bands.
 * Other root banks use effective length n*L. No pattern restarts at a seam.
 */
import { adaptiveTicks } from '#core/ticks/adaptive.js';
import { selectRegionProfiles } from '#core/ticks/conventional.js';
import { byPos, dedupeTicks } from '#core/ticks/common.js';
import { formatSig } from '#core/format.js';
import { nearMultiple } from '#core/numbers.js';
// The standard choice is the documented W engraving on a nominal 10-inch
// instrument (20 inches per decade). Pocket/fine are explicit display variants,
// not claims about historical 10/40-inch W instruments.
export const W_REGIONS = Object.freeze([[1, 2], [2, 5], [5, 10]].map(Object.freeze));
export const W_PROFILES = Object.freeze({
    pocket: Object.freeze([0.01, 0.02, 0.05]),
    standard: Object.freeze([0.005, 0.01, 0.02]),
    fine: Object.freeze([0.0025, 0.005, 0.01])
});
export function wRegionProfiles(screenWidth, mode = 'adaptive') {
    return selectRegionProfiles(screenWidth, mode, W_REGIONS, W_PROFILES);
}
function faberW(profiles) {
    const ticks = [];
    for (const [region, [lo, hi]] of W_REGIONS.entries()) {
        const step = W_PROFILES[profiles[region]][region];
        const count = Math.round((hi - lo) / step);
        for (let i = 0; i < count; i++) {
            const value = Number((lo + i * step).toPrecision(13));
            const integer = nearMultiple(value, 1), tenth = nearMultiple(value, 0.1);
            const hundredth = nearMultiple(value, 0.01);
            const label = value < 2 ? tenth : value < 5 ? nearMultiple(value, 0.5) : integer;
            const kind = integer ? 'major' : tenth ? 'submajor'
                : step < 0.005 && hundredth ? 'mid'
                : step < 0.005 && nearMultiple(value, 0.005) ? 'minor'
                : step < 0.01 && hundredth ? 'minor' : 'micro';
            ticks.push({ value, pos: Math.log10(value), kind,
                label: label ? formatSig(value, 5) : '' });
        }
    }
    ticks.push({ value: 10, pos: 1, kind: 'index', label: '10' });
    return ticks;
}
const plans = new Map();
export function expandedRootTicks(def, rt, width = 1000, options = {}) {
    const screenWidth = width * (options.displayScale ?? 1), order = def.order;
    const conventionalW = def.graduationProfile === 'faber-w' && options.graduationMode !== 'adaptive';
    const profiles = conventionalW ? wRegionProfiles(order * screenWidth, options.logGraduations) : null;
    const spacing = options.graduationMode === 'adaptive' ? options.adaptiveSpacing || 'balanced' : 'balanced';
    const key = conventionalW ? `faber-w:${profiles.join(':')}` : `${order * screenWidth}:${spacing}`;
    if (!plans.has(key)) {
        if (plans.size >= 32) plans.delete(plans.keys().next().value);
        plans.set(key, conventionalW ? faberW(profiles) : adaptiveTicks({ type: 'log' }, {
            pMin: 0, pMax: 1, pos: x => Math.log10(x), value: p => 10 ** p
        }, order * screenWidth, spacing));
    }
    const ticks = plans.get(key).map(t => ({ ...t, pos: rt.pos(t.value) }))
        .filter(t => t.pos >= rt.pMin - 1e-10 && t.pos <= rt.pMax + 1e-10);
    for (const [p, text] of [[rt.pMin, def.startLabel], [rt.pMax, def.endLabel]]) {
        const value = rt.value(p);
        ticks.push({ pos: p, value, label: text ?? formatSig(value, 5), kind: 'index' });
    }
    return dedupeTicks(ticks).sort(byPos);
}
