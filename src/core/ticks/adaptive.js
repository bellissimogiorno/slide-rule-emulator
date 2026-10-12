/** Screen-aware decimal graduation, independent of labels and instrument state.
 *
 * Refine whole round-number cells, not a greedy subset of nearby strokes.
 * All positions come from the scale's mapping. Reversed/partial domains use the
 * same policy; non-monotone radiation curves are explicitly split at the peak.
 * Named gauges, discrete references and authored tick lists remain authoritative.
 */
import { formatSig } from '#core/format.js';
import { nearMultiple, invertMonotonic, niceStep } from '#core/numbers.js';
import { ENERGY_PEAK_U, PHOTON_PEAK_U } from '#core/physics.js';
import { byPos, dedupeTicks } from '#core/ticks/common.js';

export const GRADUATION_MODES = Object.freeze(['conventional', 'adaptive']);
export const ADAPTIVE_SPACING = Object.freeze({ clear: 4.5, balanced: 3, fine: 2 });
const cache = new WeakMap();
const MAX_NODES = 16000, MAX_DEPTH = 18;
const NEAR_UNITY = new Set(['pythagorean', 'hypotenuseLow', 'hypotenuseHigh',
    'loglog', 'loglog10', 'syncroLogLog', 'bbCurve']);

export function usesAdaptiveGraduations(def, options = {}) {
    return options.graduationMode === 'adaptive' && !def.referenceOnly
        && def.adaptiveTicks !== false && (!Array.isArray(def.ticks) || def.adaptiveTicks === true);
}

/** Significant figures without turning nonzero ticks into 0, or near-one ticks
 * into 1. These are engraved numbers, never samples taken at arbitrary pixels. */
function caption(value) {
    const short = formatSig(value, 12);
    return (Number(short) === 1 && value !== 1) ? formatSig(value, 16) : short;
}
function decimalKind(q) {
    if (q === 0) return 'major';
    const m = Math.abs(q) / 10 ** Math.floor(Math.log10(Math.abs(q)) + 1e-12);
    return nearMultiple(m, 1) ? 'major' : nearMultiple(m, 0.1) ? 'submajor'
        : nearMultiple(m, 0.05) ? 'mid' : nearMultiple(m, 0.01) ? 'minor' : 'micro';
}

/** Work in actual values except where a near-unity scale needs round differences
 * from one. This is decimal labelling, not a substitute mathematical mapping. */
function coordinateWindows(lo, hi, nearUnity) {
    if (!nearUnity) return [{ lo, hi, value: x => x }];
    const result = [];
    const add = (a, b, origin, direction) => {
        if (!(b > a)) return;
        const qa = direction * (a - origin), qb = direction * (b - origin);
        result.push({ lo: Math.min(qa, qb), hi: Math.max(qa, qb), value: q => origin + direction * q });
    };
    add(lo, Math.min(hi, 0.9), 0, 1);
    add(Math.max(lo, 0.9), Math.min(hi, 1), 1, -1);
    add(Math.max(lo, 1), Math.min(hi, 1.1), 1, 1);
    add(Math.max(lo, 1.1), hi, 0, 1);
    return result;
}

/** Numeric cells are chosen in value space; screen space only decides whether a
 * complete finer lattice is legible. A local change in density occurs at an
 * existing round-number boundary, never at the moving cursor or slide. */
function graduateWindow(window, pos, width, gap, ticks, budget) {
    const { lo, hi, value } = window;
    const positions = new Map();
    const position = q => {
        if (!positions.has(q)) positions.set(q, pos(value(q)));
        return positions.get(q);
    };
    const emit = q => {
        if (q < lo || q > hi) return;
        const p = position(q), actual = value(q);
        if (!Number.isFinite(p) || !Number.isFinite(actual)) return;
        const kind = decimalKind(q);
        ticks.push({ pos: p, value: actual, kind,
            label: kind === 'major' || kind === 'submajor' ? caption(actual) : '' });
    };
    const refine = (left, right, depth = 0) => {
        if (++budget.nodes > MAX_NODES || depth > MAX_DEPTH || !(right > left)) return;
        const a = Math.max(lo, left), b = Math.min(hi, right);
        if (!(b > a)) return;
        const pa = position(a), pb = position(b);
        if (!Number.isFinite(pa) || !Number.isFinite(pb) || Math.abs(pb - pa) * width < gap) return;
        // Try 1-2-2.5-5 decimal steps, coarse to fine. Values of an entire child
        // interval are accepted or rejected together. Cap work before looping.
        let chosen = null;
        const exponent = Math.ceil(Math.log10(right - left) - 1e-10);
        for (let level = 0; level < 40; level++) {
            const step = [1, 0.5, 0.25, 0.2][level % 4] * 10 ** (exponent - Math.floor(level / 4));
            if (!(step > 0) || a + step === a) break;
            if (!nearMultiple(left, step) || !nearMultiple(right, step)) continue;
            const first = Math.ceil(a / step - 1e-9), last = Math.floor(b / step + 1e-9);
            if (last - first > 10) break;
            if (last - first < 1) continue;
            const values = [];
            for (let i = first; i <= last; i++) values.push(Number((i * step).toPrecision(14)));
            const points = values.map(position);
            const readable = points.every(Number.isFinite) && points.slice(1).every((p, i) => Math.abs(p - points[i]) * width >= gap - 1e-7);
            if (!readable) break;
            chosen = { values, step };
        }
        if (!chosen) return;
        for (const q of chosen.values) emit(q);
        // Neighbouring cells may refine further where a nonlinear mapping
        // expands. Keep the parent grid as the intermediate-stroke hierarchy.
        const boundaries = [left, ...chosen.values.filter(q => q > left && q < right), right];
        if (boundaries.length <= 2) return;
        for (let i = 1; i < boundaries.length; i++) refine(boundaries[i - 1], boundaries[i], depth + 1);
    };
    if (lo <= 0 && hi >= 0) emit(0);
    for (const sign of [-1, 1]) {
        const lower = sign < 0 ? Math.max(0, -hi) : Math.max(0, lo);
        const upper = sign < 0 ? Math.max(0, -lo) : Math.max(0, hi);
        if (!(upper > 0) || !(upper > lower)) continue;
        const end = Math.min(307, Math.floor(Math.log10(upper)));
        // Zero is a labelled endpoint, not an infinite list of tiny decades.
        const start = Math.max(-300, lower > 0 ? Math.floor(Math.log10(lower)) : end - 14);
        for (let k = start; k <= end && budget.nodes < MAX_NODES; k++) {
            const unit = 10 ** k;
            // Even where the three mantissa bands are individually too short,
            // a complete decade may still be readable (e.g. the far LL4 tail).
            const decadeLo = sign > 0 ? unit : -10 * unit;
            const decadeHi = sign > 0 ? 10 * unit : -unit;
            const da = Math.max(lo, decadeLo), db = Math.min(hi, decadeHi);
            if (db > da && Math.abs(position(db) - position(da)) * width >= gap) {
                emit(decadeLo); emit(decadeHi);
            }
            for (const [m, n] of [[1, 2], [2, 5], [5, 10]]) {
                const a = sign > 0 ? m * unit : -n * unit;
                const b = sign > 0 ? n * unit : -m * unit;
                if (b < lo || a > hi) continue;
                // Do not populate vanishing tails with superposed decade marks.
                const pa = position(Math.max(a, lo)), pb = position(Math.min(b, hi));
                if (!Number.isFinite(pa) || !Number.isFinite(pb) || Math.abs(pb - pa) * width < gap) continue;
                emit(a); emit(b);
                refine(a, b);
            }
        }
    }
}

function monotoneBranches(def, rt) {
    if (def.type !== 'bbCurve') return [{ pMin: rt.pMin, pMax: rt.pMax, pos: rt.pos }];
    const peakU = def.curve === 'energySpectral' ? ENERGY_PEAK_U : PHOTON_PEAK_U;
    const peak = Math.log10(peakU / def.u0) / 2;
    const breaks = /Spectral$/.test(def.curve) && peak > rt.pMin && peak < rt.pMax
        ? [rt.pMin, peak, rt.pMax] : [rt.pMin, rt.pMax];
    return breaks.slice(1).map((pMax, i) => {
        const pMin = breaks[i], increasing = rt.value(pMax) >= rt.value(pMin);
        return { pMin, pMax, pos: x => invertMonotonic(rt.value, x, pMin, pMax, increasing) };
    });
}

/** Pure generator; numeric bounds and all reciprocal/paired readouts are intact. */
export function adaptiveTicks(def, rt, screenWidth, spacing = 'balanced') {
    if (!Number.isFinite(screenWidth) || screenWidth <= 0 || !Object.hasOwn(ADAPTIVE_SPACING, spacing))
        throw new RangeError('Invalid adaptive graduation width or spacing.');
    let memo;
    const key = `${screenWidth}:${spacing}`;
    if (Object.isFrozen(def)) {
        if (!cache.has(def)) cache.set(def, new WeakMap());
        const byRuntime = cache.get(def);
        if (!byRuntime.has(rt)) byRuntime.set(rt, new Map());
        memo = byRuntime.get(rt);
        if (memo.has(key)) return memo.get(key).map(t => ({ ...t }));
    }
    const gap = Math.max(ADAPTIVE_SPACING[spacing], screenWidth / 4000), ticks = [], budget = { nodes: 0 };
    for (const branch of monotoneBranches(def, rt)) {
        const a = rt.value(branch.pMin), b = rt.value(branch.pMax);
        if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) continue;
        for (const window of coordinateWindows(Math.min(a, b), Math.max(a, b), NEAR_UNITY.has(def.type)))
            graduateWindow(window, branch.pos, screenWidth, gap, ticks, budget);
        for (const [p, value] of [[branch.pMin, a], [branch.pMax, b]]) {
            const override = p === rt.pMin ? def.startLabel : p === rt.pMax ? def.endLabel : undefined;
            ticks.push({ pos: p, value, label: override ?? formatSig(value, 6), kind: 'index' });
        }
    }
    // A spectral peak may evaluate one ULP above one. Collapse only numerical
    // equivalents of an exact endpoint within a subpixel tolerance; never snap
    // a distinct neighbouring value or collapse the two spectral branches.
    const ends = ticks.filter(t => t.kind === 'index');
    const clean = ticks.filter(t => t.kind === 'index' || !ends.some(e =>
        Math.abs(e.pos - t.pos) * screenWidth < 0.01 &&
        Math.abs(e.value - t.value) <= 8 * Number.EPSILON * Math.max(Math.abs(e.value), Math.abs(t.value))));
    const result = dedupeTicks(clean).sort(byPos);
    if (['linear', 'reverseLinear'].includes(def.type)) {
        const major = def.majorStep || niceStep(Math.abs(rt.value(rt.pMax) - rt.value(rt.pMin)) / 10);
        for (const tick of result) {
            if (tick.kind === 'index') continue;
            tick.kind = nearMultiple(tick.value, major) ? 'major'
                : nearMultiple(tick.value, major / 2) ? 'submajor'
                : nearMultiple(tick.value, major / 10) ? 'mid' : 'micro';
            tick.label = ['major', 'submajor'].includes(tick.kind) ? caption(tick.value) : '';
        }
    }
    if (memo) {
        if (memo.size >= 6) memo.delete(memo.keys().next().value);
        memo.set(key, result.map(t => ({ ...t })));
    }
    return result;
}

/** Labels have a separate, deliberately quieter density than the tick lattice.
 * Reserve room for full-size numerals; only remove captions, never strokes.
 * The DOM's exact glyph collision check remains the final authority. */
export function spaceAdaptiveLabels(ticks, screenWidth) {
    const reserved = [];
    const ordered = ticks.filter(t => t.label).sort((a, b) => {
        const rank = t => t.kind === 'index' ? 4 : t.kind === 'major' ? 3 : 1;
        return rank(b) - rank(a) || a.pos - b.pos;
    });
    const visible = new Set();
    for (const tick of ordered) {
        const x = tick.pos * screenWidth;
        const width = Math.max(30, tick.label.length * 6 + 10);
        if (reserved.some(r => Math.abs(x - r.x) < (width + r.width) / 2)) continue;
        visible.add(tick); reserved.push({ x, width });
    }
    return ticks.map(t => visible.has(t) || !t.label ? t : { ...t, label: '' });
}
