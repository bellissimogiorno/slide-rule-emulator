/** Aristo HyperboLog 0971 / HyperLog 0972 main intervals.
 * H1/H2 give sqrt(1+x^2) directly at x on D: they are not sinh scales.
 * Source, row-order cross-check and reconstruction scope: docs/ARISTO_HYPERBOLIC.md.
 */
import { hyperbolicScales } from '#catalog/scales/hyperbolic.js';
import { trigonometricScales } from '#catalog/scales/trigonometric.js';

const family = 'Aristo HyperboLog / HyperLog';
const alias = (id, label, source, description, extra = {}) => ({
    ...source, id, label, family, tone: 'neutral', description, ...extra
});
const stMinimum = 1.8 / Math.PI, stMaximum = 18 / Math.PI;
// Decimal angular subdivisions of the radian-calibrated interval. Integer
// counters avoid accumulated rounding; these are not traced specimen strokes.
const stTicks = [{ value: stMinimum, label: '', kind: 'index' }];
for (let hundredths = 58; hundredths <= 572; hundredths += 2) {
    const value = hundredths / 100;
    const labelled = hundredths % 100 === 0 || hundredths < 100 && hundredths % 10 === 0 || hundredths === 570;
    stTicks.push({ value, label: labelled ? String(value) : '',
        kind: labelled ? 'major' : hundredths % 10 === 0 ? 'submajor' : 'minor' });
}
stTicks.push({ value: stMaximum, label: '', kind: 'index' });

export const aristoHyperbolicScales = {
    ARISTO_SH1: alias('ARISTO_SH1', 'Sh\u2081', hyperbolicScales.SH1,
        'Lower hyperbolic-sine argument u. Read sinh(u) on D with D interpreted as 0.1 to 1; conversely Sh1 gives asinh(D/10). Arguments are dimensionless.'),
    ARISTO_SH2: alias('ARISTO_SH2', 'Sh\u2082', hyperbolicScales.SH2,
        'Upper hyperbolic-sine argument u. Read sinh(u) directly on D from 1 to 10; conversely Sh2 gives asinh(D). Arguments are dimensionless.'),
    ARISTO_TH: alias('ARISTO_TH', 'Th', hyperbolicScales.TH,
        'Hyperbolic-tangent argument u. Read tanh(u) on D interpreted as 0.1 to 1. The engraved finite range ends at u = 3, before the right D index; tanh(u) never reaches 1 for finite u.'),
    ARISTO_CH: alias('ARISTO_CH', 'Ch', hyperbolicScales.CH,
        'Hyperbolic-cosine argument u. Read cosh(u) directly on D from 1 to 10; conversely Ch gives acosh(D). Ch = 0 is at D = 1.'),
    ARISTO_H1: alias('ARISTO_H1', 'H\u2081', hyperbolicScales.H1,
        'Lower hypotenuse range: set x on D interpreted as 0.1 to 1, then read sqrt(1+x^2) on H1. Main range sqrt(1.01) to sqrt(2).'),
    ARISTO_H2: alias('ARISTO_H2', 'H\u2082', hyperbolicScales.H2,
        'Upper hypotenuse range: set x directly on D from 1 to 10, then read sqrt(1+x^2) on H2. Main range sqrt(2) to sqrt(101).'),
    ARISTO_T: alias('ARISTO_T', 'T', trigonometricScales.T1,
        'Tangent/cotangent row. Black tangent and red cotangent arguments sum to 90 degrees at each shared graduation. Read the function value on C interpreted as 0.1 to 1.',
        { pairedSum: 90 }),
    ARISTO_S: alias('ARISTO_S', 'S', trigonometricScales.S,
        'Sine/cosine row. Black sine and red cosine arguments sum to 90 degrees at each shared graduation. Read the function value on C interpreted as 0.1 to 1.',
        { pairedSum: 90 }),
    ARISTO_ST: {
        id: 'ARISTO_ST', label: 'ST', family, tone: 'neutral',
        type: 'expression', tickMode: 'mapped', unit: '\u00b0',
        min: stMinimum, max: stMaximum, pairedSum: 90,
        pos: 'log10(100*x*PI/180)', value: '180*10^(p-2)/PI',
        formula: '\u03b8 rad \u2248 sin \u03b8 \u2248 tan \u03b8',
        description: 'Radian-calibrated small-angle row: C/100 equals the black angle in radians. Sine and tangent are approximations to that radian value. Red angles are the complements for cosine/cotangent; black and red sum to 90 degrees.',
        ticks: stTicks, adaptiveTicks: true
    },
    ARISTO_P: alias('ARISTO_P', 'P', trigonometricScales.P,
        'Reverse Pythagorean row: with the slide aligned, set x on D interpreted as 0.1 to 1 and read sqrt(1-x^2) on P. As P is on the slide, it follows C when the slide moves.',
        { tone: 'red' })
};
