/** Main index intervals from the supplied 690A/691A specimens and manufacturer
 * manual. Degree/minute engraving is distinct from the 691A's decimal degrees.
 * The photographic source, omissions and independent examples are documented in
 * docs/GRAPHOPLEX.md. No scanned artwork is used by the renderer.
 */
import { arithmeticScales } from '#catalog/scales/arithmetic.js';
import { rootsScales } from '#catalog/scales/roots.js';
import { trigonometricScales } from '#catalog/scales/trigonometric.js';
import { hyperbolicScales } from '#catalog/scales/hyperbolic.js';
import { makeLogLogScale } from '#catalog/factories.js';
import { formatSexagesimal } from '#core/sexagesimal.js';
import { nearMultiple } from '#core/numbers.js';
import { constantGauge } from '#core/mark-descriptions.js';

const family = 'Graphoplex Neperlog';
const alias = (id, base, extra = {}) => ({ ...base, id, family, tone: 'neutral', ...extra });
const smallAngle = {
    type: 'expression', min: 1.8 / Math.PI, max: 18 / Math.PI,
    pos: 'log10(x*PI/180)+2', value: '180*10^(p-2)/PI', tickMode: 'mapped', unit: '\u00b0',
    formula: 'sin / tan (small)', pairedSum: 90, label: 'ST',
    description: 'Small-angle sine/tangent approximation in radians, corresponding to C/100. Red angles are the complements for cosine/cotangent. The approximation, not exact sine or tangent, is graduated.'
};
// A regular sexagesimal lattice in each region; candidates are generated with
// integer minute counters, not repeated floating-point degree additions.
// These are convention-based graduations, not a stroke-for-stroke tracing.
function angularTicks(base, bands, sexagesimal) {
    const ticks = new Map(), units = sexagesimal ? 60 : 1;
    for (const [low, high, step, labelStep] of bands) {
        const first = Math.ceil(Math.max(base.min, low) * units / step - 1e-9);
        const last = Math.floor(Math.min(base.max, high) * units / step + 1e-9);
        for (let i = first; i <= last; i++) {
            const count = Number((i * step).toPrecision(13)), value = count / units;
            const labelled = nearMultiple(count, labelStep);
            const kind = nearMultiple(value, 1) ? 'major' : nearMultiple(value, 0.5) ? 'submajor' :
                nearMultiple(value, sexagesimal ? 1/6 : 0.1) ? 'mid' : 'minor';
            const caption = sexagesimal ? formatSexagesimal(value) : String(value);
            const tick = { value, kind, label: labelled ? caption : '' };
            if (!ticks.has(count) || labelled) ticks.set(count, tick);
        }
    }
    for (const value of [base.min, base.max]) {
        ticks.set(value * units, { value, kind: 'index', label: Number.isInteger(value) ?
            (sexagesimal ? formatSexagesimal(value) : String(value)) : '' });
    }
    return [...ticks.values()].sort((a, b) => a.value - b.value);
}
const s = { ...trigonometricScales.S, min: Math.asin(0.1) * 180 / Math.PI, max: 90 };
const t1 = { ...trigonometricScales.T1, min: Math.atan(0.1) * 180 / Math.PI, max: 45 };
const t2 = { ...trigonometricScales.T2, min: 45, max: Math.atan(10) * 180 / Math.PI };
const minuteBands = {
    S: [[0, 10, 5, 60], [10, 20, 10, 120], [20, 45, 20, 300], [45, 70, 30, 300], [70, 90, 60, 600]],
    T1: [[0, 10, 5, 60], [10, 20, 10, 120], [20, 45, 20, 300]],
    T2: [[45, 70, 30, 300], [70, 80, 20, 120], [80, 90, 10, 60]],
    ST: [[0, 1, 1, 10], [1, 2, 2, 10], [2, 4, 5, 30], [4, 6, 10, 30]]
};
const decimalBands = {
    S: [[0, 10, .05, 1], [10, 20, .1, 2], [20, 40, .2, 5], [40, 65, .5, 5], [65, 90, 1, 10]],
    T1: [[0, 10, .05, 1], [10, 20, .1, 2], [20, 45, .2, 5]],
    ST: [[0, 1, .005, .1], [1, 2, .01, .2], [2, 4, .02, .5], [4, 6, .05, .5]]
};
const angles = {};
for (const [suffix, base, label] of [['S', s, 'S'], ['T1', t1, 'T<45\u00b0'], ['T2', t2, 'T>45\u00b0'], ['ST', smallAngle, 'S & T']]) {
    for (const model of [690, 691]) {
        if (model === 691 && suffix === 'T2') continue;
        const id = `GP${model}_${suffix}`;
        angles[id] = alias(id, base, { label, pairedSum: 90,
            description: `Graphoplex ${model}A ${label}. Black angles and red complements sum to 90 degrees on shared ticks. ` +
                (suffix === 'ST' ? smallAngle.description : 'Sine/cosine or tangent/cotangent aligned with the number scale. ') +
                (model === 690 ? 'Degree/minute conventional engraving; adaptive mode uses round decimal positions with sexagesimal captions.' : 'Decimal-degree engraving.'),
            ticks: angularTicks(base, (model === 690 ? minuteBands : decimalBands)[suffix], model === 690),
            adaptiveTicks: true,
            ...(model === 690 ? { angleNotation: 'sexagesimal', compactLabels: false } : {}) });
    }
}
const logs = {};
for (let decade = -3; decade <= 0; decade++) {
    const n = decade + 3;
    for (const sign of [-1, 1]) {
        const label = sign < 0 ? `LL0${n || '0'}` : `LL${n}`;
        const id = `GP_${label}`;
        logs[id] = { ...makeLogLogScale(id, label, decade, sign, `Graphoplex ${label}: exp(${sign} * D * 10^${decade}). Main interval without end extensions.`), family };
    }
}
const gauges = [
    constantGauge(3437.746770784939 / 1000, '\u03c1\u2032', '3437.746770785 arcminutes per radian, shown divided by 1000 on C; arc length equals radius times the angle in arcminutes divided by that constant.'),
    constantGauge(206264.80624709636 / 100000, '\u03c1\u2033', '206264.8062471 arcseconds per radian, shown divided by 100000 on C.'),
    constantGauge(2000000 / Math.PI / 100000, '\u03c1cc', '636619.7723676 centesimal seconds per radian (10000 per gon), shown divided by 100000; not sexagesimal arcseconds.')
];
export const graphoplexScales = {
    ...logs, ...angles,
    GP_C: alias('GP_C', arithmeticScales.C, { gauges: [...(arithmeticScales.C.gauges || []), ...gauges] }),
    GP_D: alias('GP_D', arithmeticScales.D),
    GP_CF: alias('GP_CF', arithmeticScales.CF), GP_DF: alias('GP_DF', arithmeticScales.DF),
    GP_CIF: alias('GP_CIF', arithmeticScales.CIF, { tone: 'red' }),
    GP_CI: alias('GP_CI', arithmeticScales.CI, { tone: 'red' }),
    GP_DI: alias('GP_DI', arithmeticScales.DI, { tone: 'red' }),
    GP_A: alias('GP_A', rootsScales.A), GP_B: alias('GP_B', rootsScales.B), GP_K: alias('GP_K', rootsScales.K),
    GP_L: alias('GP_L', arithmeticScales.L),
    GP_P: alias('GP_P', trigonometricScales.P, { tone: 'red', description: 'Graphoplex reverse-running Pythagorean scale. With D read as 0.1-1, P = sqrt(1-D^2).' }),
    GP_CH: alias('GP_CH', hyperbolicScales.CH, { label: 'Ch' }),
    GP_TH: alias('GP_TH', hyperbolicScales.TH, { label: 'Th' }),
    GP_SH1: alias('GP_SH1', hyperbolicScales.SH1, { label: 'Sh1' }),
    GP_SH2: alias('GP_SH2', hyperbolicScales.SH2, { label: 'Sh2' })
};
