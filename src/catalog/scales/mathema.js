/** Mathema 2/84N: one physical coordinate for the extended function scales.
 * Angles AND hyperbolic arguments use gon (400 gon = 2 pi radians).
 * The frame is display padding, not an assertion about the instrument's length;
 * each row has its own engraved interval within that shared frame.
 * Sources, cursor calibration and operating examples: docs/MATHEMA.md.
 */
import { makeRuntimeScale } from '#core/mappings.js';
import { logLogEngraving } from '#core/format.js';
import { nearMultiple } from '#core/numbers.js';
import { bandedTicks } from '#core/ticks/elementary.js';
import { engineeringLogCandidates } from '#core/ticks/common.js';
import { logLogCandidatePlan } from '#core/ticks/loglog.js';

export const MATHEMA_GON = 200 / Math.PI;
export const MATHEMA_ORIGIN = Math.log10(.625);
export const MATHEMA_SPAN = Math.log10(16.5) - MATHEMA_ORIGIN;
export const mathemaPosition = y => (Math.log10(10 * y) - MATHEMA_ORIGIN) / MATHEMA_SPAN;
export const mathemaValue = p => 10 ** (MATHEMA_ORIGIN + MATHEMA_SPAN * p - 1);

const family = 'Faber-Castell Mathema 2/84N';
const common = { family, tone: 'neutral', type: 'expression', adaptiveTicks: true };
const Y = `(10^((${MATHEMA_ORIGIN})+${MATHEMA_SPAN}*p-1))`;
function mapped(id, label, min, max, principalPosition, value, formula, description, extra = {}) {
    const def = { ...common, id, label, min, max,
        pos: `((${principalPosition})-(${MATHEMA_ORIGIN}))/${MATHEMA_SPAN}`,
        value, formula, description, tickMode: 'mapped', ...extra };
    const rt = makeRuntimeScale(def);
    const ends = [rt.pos(min), rt.pos(max)];
    def.pMin = Math.min(...ends);
    def.pMax = Math.max(...ends);
    return def;
}
function logarithmic(id, label, min, max, power, formula, description) {
    return mapped(id, label, min, max, `1+log10(x)/(${power})`, `${Y}^(${power})`, formula,
        description, { tickMode: 'log', ...(power < 0 ? { tone: 'red' } : {}) });
}
// Conventional decimal lattices in gon; no degree suffix or degree tick engine.
function gonTicks(min, max, bands) {
    const ticks = new Map();
    for (const [lower, upper, step, labelStep] of bands) {
        const first = Math.ceil(Math.max(lower, min) / step - 1e-9);
        const last = Math.floor(Math.min(upper, max) / step + 1e-9);
        for (let i = first; i <= last; i++) {
            const value = Number((i * step).toPrecision(13));
            const labelled = nearMultiple(value, labelStep);
            const kind = labelled ? 'major' : nearMultiple(value, labelStep / 2) ? 'submajor'
                : nearMultiple(value, 1) ? 'mid' : 'minor';
            ticks.set(value, { value, kind, label: labelled ? String(value) : '' });
        }
    }
    for (const value of [min, max])
        ticks.set(value, { value, kind: 'index', label: String(value) });
    return [...ticks.values()].sort((a, b) => a.value - b.value);
}
function angle(id, label, min, max, pos, value, formula, description, bands) {
    return mapped(id, label, min, max, pos, value, formula, description,
        { unit: 'gon', ticks: gonTicks(min, max, bands) });
}
const lowerBands = [[0, 10, .05, 1], [10, 20, .1, 2], [20, 50, .2, 5], [50, 70, .2, 5], [70, 100, 1, 10]];
const hyperbolicBands = [[0, 20, .1, 5], [20, 50, .2, 10], [50, 100, .5, 10], [100, 220, 1, 20]];
function banded(def, bands) {
    def.ticks = bandedTicks({ ...def, startLabel: String(def.min), endLabel: String(def.max) }, makeRuntimeScale(def), bands)
        .map(({ value, kind, label }) => ({ value, kind, label }));
    return def;
}

const loglogs = {};
// Row limits are engraved numbers, not extrapolations of the principal decade.
// LL2, LL01 and LL03 use clearly legible limits; the photograph does not
// resolve every fine fringe division. See the fidelity limits in MATHEMA.md.
const logLogIntervals = {
    '1': [1.0065, 1.162], '2': [1.07, 4.5], '3': [1.9, 4e6],
    '01': [.86, .993], '02': [.22, .935], '03': [1e-6, .5]
};
for (const [suffix, decade, factor, coefficient] of [['1', -2, .1, '10'], ['2', -1, 1, ''], ['3', 0, 10, '0.1']]) {
    for (const sign of [1, -1]) {
        const key = `${sign < 0 ? '0' : ''}${suffix}`;
        const id = `FC284_LL${key}`;
        const label = `${sign < 0 ? '−' : ''}${coefficient}ln X`;
        const relation = `${sign < 0 ? '−' : ''}${factor === 1 ? '' : factor}Y`;
        const [min, max] = logLogIntervals[key];
        const def = mapped(id, label, min, max, `1+log10(abs(log(x))/${factor})`,
            `exp(${sign * factor}*${Y})`, `e^(${relation})`,
            `Mathema logarithmic function row: Y = ${label}; the engraved number X is exp(${relation}).`,
            { decade, sign, ...(sign < 0 ? { tone: 'red' } : {}) });
        const plan = sign > 0 ? logLogCandidatePlan(min, max, decade)
            : { candidates: engineeringLogCandidates(decade < 0 ? 1 - max : min,
                decade < 0 ? 1 - min : max, 1),
                toPositive: coord => decade < 0 ? 1 - coord : coord };
        // Negative near-unity rows graduate the decimal deficit 1-X. Inverting
        // round positive numbers would create unrounded negative engravings.
        // The far-right million range uses the coarser complete decimal lattice
        // already present in the plan; it otherwise exceeds the manual limit.
        def.ticks = plan.candidates.filter(candidate => candidate.kind !== 'micro'
            || plan.toPositive(candidate.coord) < 1e6).map(candidate => {
            const value = plan.toPositive(candidate.coord);
            return { value, kind: candidate.kind,
                label: candidate.labelCandidate ? logLogEngraving(value, decade, candidate.endpoint) : '' };
        });
        // Preserve the selected, verified terminal values exactly. LL2, LL01
        // and LL03 stop at legible graduations rather than uncertain fringe ticks.
        def.startLabel = String(sign < 0 ? max : min);
        def.endLabel = String(sign < 0 ? min : max);
        loglogs[id] = def;
    }
}

export const mathemaScales = {
    FC284_Y: logarithmic('FC284_Y', 'Y', .065, 1.5, 1, 'Y',
        'Fixed principal number scale, extended from 0.065 to 1.5 on both faces.'),
    FC284_y: logarithmic('FC284_y', 'y', .065, 1.5, 1, 'y',
        'Movable principal number scale, extended from 0.065 to 1.5 on both faces.'),
    FC284_I: logarithmic('FC284_I', '1/y', .65, 15, -1, '1/y',
        'Reciprocal principal scale, reading from 15 down to 0.65.'),
    FC284_A: logarithmic('FC284_A', '√X', .0044, 2.3, 2, 'Y²',
        'Fixed parabolic row: engraved X = Y squared. The left caption means Y = sqrt(X).'),
    FC284_B: logarithmic('FC284_B', '√x', .0044, 2.3, 2, 'y²',
        'Movable parabolic row: engraved x = y squared. The left caption means y = sqrt(x).'),
    FC284_BI: logarithmic('FC284_BI', '1/√x', .44, 230, -2, '1/y²',
        'Reciprocal parabolic row: engraved x = 1/y squared, from 230 down to 0.44.'),
    FC284_H: banded(mapped('FC284_H', '√(X²−1)', 1.0022, 1.8,
        'log10(10*sqrt((x-1)*(x+1)))', `hypot(1,${Y})`, '√(1+Y²)',
        'Hypotenuse row: engraved X = sqrt(1+Y^2), extended from 1.0022 to 1.8.'),
        [[1, 1.01, .00002, .001], [1.01, 1.02, .00005, .002], [1.02, 1.05, .0001, .005],
            [1.05, 1.1, .0002, .01], [1.1, 1.2, .0005, .02], [1.2, 1.8, .002, .1]]),
    FC284_P: banded(mapped('FC284_P', '√(1−X²)', 0, .9978,
        'log10(10*sqrt((1-x)*(1+x)))', `sqrt(max(0,1-${Y}^2))`, '√(1−Y²)',
        'Pythagorean row: engraved X = sqrt(1-Y^2), from 0.9978 down to zero. With sine on Y it gives cosine.',
        { tone: 'red', startLabel: '.9978', endLabel: '0' }),
        [[0, .5, .005, .1], [.5, .8, .002, .05], [.8, .9, .001, .02], [.9, .95, .0005, .01],
            [.95, .98, .0002, .005], [.98, .99, .0001, .002], [.99, 1, .00002, .001]]),
    FC284_S: angle('FC284_S', 'sin Xᵍ', 4.2, 100,
        'log10(10*sin(x*PI/200))', `200*asin(min(1,${Y}))/PI`, 'asin(Y) in gon',
        'Sine in gon: Y = sin(pi X/200), from 4.2 to 100 gon. Use the Pythagorean row for cosine.', lowerBands),
    FC284_T: angle('FC284_T', 'tan Xᵍ', 4.2, 62,
        'log10(10*tan(x*PI/200))', `200*atan(${Y})/PI`, 'atan(Y) in gon',
        'Tangent in gon: Y = tan(pi X/200), extended from 4.2 to 62 gon.', lowerBands),
    FC284_CH: angle('FC284_CH', '0.1 cosh xᵍ', 0, 220,
        'log10(cosh(x*PI/200))', `200*acosh(max(1,10*${Y}))/PI`, 'acosh(10y) in gon',
        'Hyperbolic cosine in gon: y = 0.1 cosh(pi x/200), from 0 to 220 gon. Multiply y by 10 for cosh.', hyperbolicBands),
    FC284_SH2: angle('FC284_SH2', '0.1 sinh xᵍ', 40, 220,
        'log10(sinh(x*PI/200))', `200*asinh(10*${Y})/PI`, 'asinh(10y) in gon',
        'Upper hyperbolic sine in gon: y = 0.1 sinh(pi x/200), from 40 to 220 gon. Multiply y by 10 for sinh.', hyperbolicBands),
    FC284_SH1: angle('FC284_SH1', 'sinh xᵍ', 4, 80,
        'log10(10*sinh(x*PI/200))', `200*asinh(${Y})/PI`, 'asinh(y) in gon',
        'Lower hyperbolic sine in gon: y = sinh(pi x/200), extended from 4 to 80 gon.', lowerBands),
    FC284_TH: angle('FC284_TH', 'tanh Xᵍ', 4, 200,
        'log10(10*tanh(x*PI/200))', `200*atanh(${Y})/PI`, 'atanh(Y) in gon',
        'Fixed hyperbolic tangent in gon: Y = tanh(pi X/200). Finite graduations extend from 4 to 200 gon; infinity is at Y = 1.',
        [[0, 10, .05, 1], [10, 40, .2, 5], [40, 80, .5, 10], [80, 120, 1, 10], [120, 200, 2, 20]]),
    FC284_E: mapped('FC284_E', '(eˣ)', 0, 2.9,
        '(x+4.4)/LN10-2', `max(0,log(1000*${Y})-4.4)`, 'ln Y',
        'Original displaced exponential row. At the main hairline the reading is ln(1000Y)-4.4; select one of the five lower cursor marks to apply its additive constant and power-of-ten multiplier.',
        { tickMode: 'linear', majorStep: .1, minorDivisions: 10 }),
    FC284_EG: mapped('FC284_EG', '(eˣᵍ)', 0, 185,
        '(x+280)*PI/(200*LN10)-2', `max(0,200*log(1000*${Y})/PI-280)`, 'ᵍln Y',
        'Original displaced exponential row in gon. At the main hairline the reading is (200/pi)ln(1000Y)-280; use the five upper cursor marks and their printed constants and powers of ten.',
        { tickMode: 'linear', majorStep: 10, minorDivisions: 10, unit: 'gon' }),
    ...loglogs
};
