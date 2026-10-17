/** Mathema 2/84N: the .1–1 principal decade and its associated functions.
 * Angles AND hyperbolic arguments use gon (400 gon = 2 pi radians).
 * The two linear exponential rows are normalised for the single hairline;
 * they do not reproduce the instrument's displaced auxiliary cursor marks.
 * Sources, mathematical derivation and operating examples: docs/MATHEMA.md.
 */
import { makeLogLogScale } from '#catalog/factories.js';
import { hyperbolicScales } from '#catalog/scales/hyperbolic.js';
import { trigonometricScales } from '#catalog/scales/trigonometric.js';
import { nearMultiple } from '#core/numbers.js';

const family = 'Faber-Castell Mathema 2/84N';
const GON = 200 / Math.PI;
const common = { family, tone: 'neutral' };
const logarithmic = (id, label, min, max, formula, description, inverse = false) => ({
    ...common, id, label, min, max, formula, description,
    type: inverse ? 'inverseLog' : 'log', tickMode: 'log',
    ...(inverse ? { tone: 'red' } : {})
});
// Conventional decimal lattices in gon. No degree-based tick generator or
// degree suffix can be used here. These are not tracings of the physical rule.
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
        ticks.set(value, { value, kind: 'index', label: Number.isInteger(value) ? String(value) : '' });
    return [...ticks.values()].sort((a, b) => a.value - b.value);
}
function angle(id, label, min, max, pos, value, formula, description, bands, extra = {}) {
    return { ...common, id, label, type: 'expression', tickMode: 'mapped', unit: 'gon',
        min, max, pos, value, formula, description,
        ticks: gonTicks(min, max, bands), adaptiveTicks: true, ...extra };
}
const lowerBands = [[0, 10, .05, 1], [10, 20, .1, 2], [20, 50, .2, 5], [50, 70, .5, 5], [70, 100, 1, 10]];
const hyperbolicBands = [[0, 20, .1, 5], [20, 50, .2, 10], [50, 100, .5, 10], [100, 200, 1, 20]];

const loglogs = {};
for (const [suffix, decade, coefficient] of [['1', -2, '10'], ['2', -1, ''], ['3', 0, '0.1']]) {
    for (const sign of [1, -1]) {
        const id = `FC284_LL${sign < 0 ? '0' : ''}${suffix}`;
        const label = `${sign < 0 ? '−' : ''}${coefficient}ln X`;
        const relation = `${sign < 0 ? '−' : ''}${suffix === '1' ? '0.1' : suffix === '2' ? '' : '10'}Y`;
        loglogs[id] = { ...makeLogLogScale(id, label, decade, sign,
            `Mathema logarithmic function row: Y = ${label}; the engraved number X is exp(${relation}).`),
            family, formula: `e^(${relation})` };
    }
}

export const mathemaScales = {
    FC284_Y: logarithmic('FC284_Y', 'Y', .1, 1, 'Y',
        'Fixed principal number scale; actual decimal values from 0.1 to 1 on both faces.'),
    FC284_y: logarithmic('FC284_y', 'y', .1, 1, 'y',
        'Movable principal number scale; actual decimal values from 0.1 to 1 on both faces.'),
    FC284_I: logarithmic('FC284_I', '1/y', 1, 10, '1/y',
        'Reciprocal principal scale: reads 10 to 1 while y reads 0.1 to 1.', true),
    FC284_A: logarithmic('FC284_A', '√X', .01, 1, 'Y²',
        'Fixed parabolic row: the engraved X equals Y squared. The left caption means Y = sqrt(X).'),
    FC284_B: logarithmic('FC284_B', '√x', .01, 1, 'y²',
        'Movable parabolic row: the engraved x equals y squared. The left caption means y = sqrt(x).'),
    FC284_BI: logarithmic('FC284_BI', '1/√x', 1, 100, '1/y²',
        'Reciprocal parabolic row: engraved x equals 1/y squared; y = 1/sqrt(x).', true),
    FC284_H: { ...hyperbolicScales.H1, ...common, id: 'FC284_H', label: '√(X²−1)',
        formula: '√(1+Y²)', description: 'Hypotenuse row: the engraved X is sqrt(1+Y^2). The caption specifies Y = sqrt(X^2-1).' },
    FC284_P: { ...trigonometricScales.P, ...common, id: 'FC284_P', label: '√(1−X²)',
        tone: 'red', min: 0, max: Math.sqrt(.99), formula: '√(1−Y²)',
        description: 'Pythagorean row: engraved X = sqrt(1-Y^2). With sine read on Y, this gives the cosine.' },
    FC284_S: angle('FC284_S', 'sin Xᵍ', GON * Math.asin(.1), 100,
        'log10(10*sin(x*PI/200))', '200*asin(min(1,10^(p-1)))/PI', 'asin(Y) in gon',
        'Sine in gon: Y = sin(pi X/200). There is no complementary-angle overprint; use the Pythagorean row for cosine.', lowerBands),
    FC284_T: angle('FC284_T', 'tan Xᵍ', GON * Math.atan(.1), 50,
        'log10(10*tan(x*PI/200))', '200*atan(10^(p-1))/PI', 'atan(Y) in gon',
        'Tangent in gon: Y = tan(pi X/200). The principal interval stops at 50 gon (45 degrees).', lowerBands),
    FC284_CH: angle('FC284_CH', '0.1 cosh xᵍ', 0, GON * Math.acosh(10),
        'log10(cosh(x*PI/200))', '200*acosh(10^p)/PI', 'acosh(10y) in gon',
        'Hyperbolic cosine in gon: y = 0.1 cosh(pi x/200). Multiply the y reading by 10 to obtain cosh.', hyperbolicBands),
    FC284_SH2: angle('FC284_SH2', '0.1 sinh xᵍ', GON * Math.asinh(1), GON * Math.asinh(10),
        'log10(sinh(x*PI/200))', '200*asinh(10^p)/PI', 'asinh(10y) in gon',
        'Upper hyperbolic sine in gon: y = 0.1 sinh(pi x/200). Multiply the y reading by 10 to obtain sinh.', hyperbolicBands),
    FC284_SH1: angle('FC284_SH1', 'sinh xᵍ', GON * Math.asinh(.1), GON * Math.asinh(1),
        'log10(10*sinh(x*PI/200))', '200*asinh(10^(p-1))/PI', 'asinh(y) in gon',
        'Lower hyperbolic sine in gon: y = sinh(pi x/200).', lowerBands),
    FC284_TH: angle('FC284_TH', 'tanh Xᵍ', GON * Math.atanh(.1), 200,
        'log10(10*tanh(x*PI/200))', '200*atanh(10^(p-1))/PI', 'atanh(Y) in gon',
        'Fixed hyperbolic tangent in gon: Y = tanh(pi X/200). Stops at 200 gon before the infinite-argument endpoint.',
        [[0, 10, .05, 1], [10, 40, .2, 5], [40, 80, .5, 10], [80, 120, 1, 10], [120, 200, 2, 20]],
        { pMax: Math.log10(10 * Math.tanh(Math.PI)) }),
    FC284_E: { ...common, id: 'FC284_E', label: '(eˣ)*', type: 'linear', tickMode: 'linear',
        min: 0, max: Math.LN10, majorStep: .2, minorDivisions: 10, formula: 'ln(10Y)',
        description: 'Normalised exponential row for the main hairline: x = ln(10Y), so exp(x) = 10Y. The original displaced auxiliary cursor marks are not reproduced; * marks this adaptation.' },
    FC284_EG: { ...common, id: 'FC284_EG', label: '(eˣᵍ)*', type: 'linear', tickMode: 'linear',
        min: 0, max: GON * Math.LN10, majorStep: 10, minorDivisions: 10, unit: 'gon', formula: '200 ln(10Y)/π',
        description: 'Normalised gon exponential row for the main hairline: x = 200 ln(10Y)/pi, so exp(pi x/200) = 10Y. * marks the adaptation from the original auxiliary cursor system.' },
    ...loglogs
};
