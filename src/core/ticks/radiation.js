import { formatSig } from "#core/format.js";
import { invertMonotonic, nearMultiple } from "#core/numbers.js";
import { ENERGY_PEAK_U, PHOTON_PEAK_U } from "#core/physics.js";
import { byPos, dedupeTicks, engineeringLogCandidates, logCompression, validTick } from "#core/ticks/common.js";
function temperatureTicks(def, rt) {
    const a = rt.value(rt.pMin), b = rt.value(rt.pMax), min = Math.min(a, b), max = Math.max(a, b);
    let candidates;
    if (min > 0) {
        candidates = engineeringLogCandidates(min, max, logCompression(Math.log10(max / min)));
    }
    else {
        candidates = [];
        for (const [lo, hi, step] of [[min, 0, 10], [0, 100, 10], [100, 1000, 100], [1000, max, 1000]]) {
            for (let i = 0, x = Math.ceil(lo / (step / 5)) * step / 5; i < 2000 && x <= Math.min(hi, max); i++, x += step / 5)
                candidates.push({ coord: x, kind: nearMultiple(x, step) ? "major" : "minor", labelCandidate: nearMultiple(x, step) });
        }
        candidates.push({ coord: min, kind: "index", labelCandidate: true }, { coord: max, kind: "index", labelCandidate: true });
    }
    return candidates.map(t => ({ pos: rt.pos(t.coord), value: t.coord, kind: t.kind,
        label: t.labelCandidate ? formatSig(t.coord, 4) : "" })).filter(validTick);
}
function blackbodyCurveTicks(def, rt) {
    // Spectral ratios have two inverse branches. Graduate each monotonically
    // rather than sampling evenly in position and labelling arbitrary values.
    const spectral = /Spectral$/.test(def.curve);
    const peakU = def.curve === "energySpectral" ? ENERGY_PEAK_U : PHOTON_PEAK_U;
    const peak = Math.log10(peakU / def.u0) / 2;
    const breaks = spectral && peak > rt.pMin && peak < rt.pMax ? [rt.pMin, peak, rt.pMax] : [rt.pMin, rt.pMax];
    const ticks = [];
    // Use the actual representable range, not a fixed 1e-12 cutoff that
    // left the short-wavelength energy tail ungraduated.
    const positiveEnds = breaks.map(p => rt.value(p)).filter(value => value > 0);
    const lower = Math.max(1e-300, Math.min(...positiveEnds, 1e-6));
    const candidates = engineeringLogCandidates(lower, 1, 10);
    // Near a ratio of one, use round differences from one. These extra marks
    // are unnumbered: rounded captions must not falsely read "1" before the peak.
    candidates.push(...engineeringLogCandidates(1e-6, 1, 5).map(t => ({
        coord: 1 - t.coord, kind: 'minor', labelCandidate: false
    })).filter(t => t.coord > 0));
    candidates.push(...[0.25, 0.5, 0.75, 0.9, 0.95, 0.98, 0.99, 0.995, 0.999, 0.9999].map(coord => ({ coord, kind: "major", labelCandidate: true })));
    for (let i = 0; i < breaks.length - 1; i++) {
        const lo = breaks[i], hi = breaks[i + 1], a = rt.value(lo), b = rt.value(hi);
        for (const t of candidates) {
            if (t.coord < Math.min(a, b) || t.coord > Math.max(a, b))
                continue;
            const pos = invertMonotonic(rt.value, t.coord, lo, hi, b >= a);
            ticks.push({ pos, value: t.coord, kind: t.kind, label: t.labelCandidate ? formatSig(t.coord, 4) : "" });
        }
    }
    for (const pos of breaks) {
        const value = rt.value(pos);
        ticks.push({ pos, value, kind: "index", label: formatSig(value, 4) });
    }
    return dedupeTicks(ticks).sort(byPos);
}
export { temperatureTicks, blackbodyCurveTicks };
