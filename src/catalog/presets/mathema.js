/** Mathema 2/84N layout and cursor, calibrated from the supplied specimen.
 * Offsets are fractions of the displayed spine, not the shorter .1–1 decade.
 * The main hairline is implicit. The middle marks of both exponent banks
 * coincide with it; the two banks have slightly different exact spacing.
 */
import { MATHEMA_SPAN } from '#catalog/scales/mathema.js';

const ordinaryOffset = Math.log10(Math.PI / 2) / (2 * MATHEMA_SPAN);
const pi4Offset = Math.log10(Math.PI / 4) / (2 * MATHEMA_SPAN);
const ordinaryScales = ['FC284_T', 'FC284_H', 'FC284_A', 'FC284_B', 'FC284_BI',
    'FC284_I', 'FC284_y', 'FC284_Y', 'FC284_P', 'FC284_S'];
const ordinaryMarks = (front = false) => [
    { id: 'mathema-left', label: front ? '1 (Y)' : 'Left', offset: -ordinaryOffset,
        ...(front ? { labelTone: 'red', showLabel: false, scales: [...ordinaryScales] } : {}) },
    { id: 'mathema-right', label: front ? 'π/2' : 'Right', offset: ordinaryOffset,
        ...(front ? { labelTone: 'red', showLabel: false, scales: [...ordinaryScales] } : {}) }
];
const multipliers = ['10', '10²', '10³', '10⁴', '10⁵'];
function exponentMarks(gon = false) {
    const step = gon ? 140 : 2.2;
    const argumentPerDecade = gon ? 200 * Math.LN10 / Math.PI : Math.LN10;
    return multipliers.map((multiplier, j) => ({
        id: `mathema-${gon ? 'eg' : 'e'}-${j}`,
        label: `${j === 0 ? (gon ? 'Xᵍ' : 'X') : Number((j * step).toPrecision(12))}; ×${multiplier}`,
        labelTone: 'red',
        showLabel: false,
        offset: (j - 2) * (1 - step / argumentPerDecade) / MATHEMA_SPAN,
        scales: [gon ? 'FC284_EG' : 'FC284_E']
    }));
}
const upperExponentMarks = exponentMarks(true);
const lowerExponentMarks = exponentMarks();

/** Captions are separate from hairlines: engraved operators and the extra
 * upper '1' must not create extra draggable marks or change the arithmetic.
 * The supplied close-up fixes their order and row placement; all horizontal
 * offsets still derive from the scale equations, never from pixel readings.
 */
function exponentCaptions(marks, gon) {
    return marks.map((mark, j) => {
        const constant = j === 0 ? 'X' : String(Number((j * (gon ? 140 : 2.2)).toPrecision(12)));
        return { id: `${mark.id}-caption`, offset: mark.offset,
            lines: gon ? [multipliers[j], constant] : [constant, multipliers[j]],
            zone: gon ? 'topCap' : 'bottomCap', tone: 'red' };
    });
}
const frontCaptions = [
    ...exponentCaptions(upperExponentMarks, true),
    ...exponentCaptions(lowerExponentMarks, false),
    { id: 'mathema-upper-operation',
        offset: (upperExponentMarks[0].offset + upperExponentMarks[1].offset) / 2,
        lines: ['y', '+'], zone: 'topCap', tone: 'red' },
    { id: 'mathema-lower-operation',
        offset: (lowerExponentMarks[0].offset + lowerExponentMarks[1].offset) / 2,
        lines: ['+', 'y'], zone: 'bottomCap', tone: 'red' },
    { id: 'mathema-upper-pi4', offset: pi4Offset, lines: ['π', '4'], fraction: true,
        zone: 'row', scale: 'FC284_A', edge: 'top', align: 'center', tone: 'red' },
    { id: 'mathema-upper-one', offset: 0, lines: ['1'],
        zone: 'row', scale: 'FC284_A', edge: 'top', align: 'end', tone: 'red' },
    { id: 'mathema-upper-pi2', offset: ordinaryOffset, lines: ['π', '2'], fraction: true,
        zone: 'row', scale: 'FC284_A', edge: 'top', align: 'end', tone: 'red' },
    { id: 'mathema-lower-one', offset: -ordinaryOffset, lines: ['1'],
        zone: 'row', scale: 'FC284_Y', edge: 'bottom', align: 'start', tone: 'red' },
    { id: 'mathema-lower-pi2', offset: ordinaryOffset, lines: ['π', '2'], fraction: true,
        zone: 'row', scale: 'FC284_Y', edge: 'bottom', align: 'end', tone: 'red' }
];

export const mathemaPresets = {
    faber284n: {
        group: 'Classic instruments',
        name: 'Faber-Castell 2/84N Mathema',
        modelLabel: 'A.W. Faber-Castell 2/84N Mathema',
        theme: 'faber', density: 'faber', showFormulas: true,
        description: 'Mathema duplex with extended decimal y/Y scales, calibrated auxiliary cursor marks, parabolic and Pythagorean scales, gon circular and hyperbolic functions, six log-log rows and two linear exponential rows.',
        instrumentNote: 'Mathema 2/84N: the principal y/Y decade is 0.1–1, with engraved end extensions. Circular and hyperbolic arguments use gon (100 gon = 90°). For an exponential, subtract the chosen cursor mark’s constant from the argument, align that mark with the remainder on the appropriate exponential row, then multiply the main-hairline Y reading by the marked power of ten; the X mark has constant zero. The π/4 mark serves the quadratic rows; the two outer long hairlines provide the π/2 factor on Y. See the Mathema guide for examples and the scope of the reproduction.',
        sides: {
            front: {
                name: 'Front - parabolic / trigonometric / exponential',
                topStator: ['FC284_EG', 'FC284_T', 'FC284_H', 'FC284_A'],
                slide: ['FC284_B', 'FC284_BI', 'FC284_I', 'FC284_y'],
                bottomStator: ['FC284_Y', 'FC284_P', 'FC284_S', 'FC284_E'],
                cursorLineTone: 'red',
                cursorMarks: [
                    ...ordinaryMarks(true),
                    ...upperExponentMarks,
                    ...lowerExponentMarks,
                    { id: 'mathema-pi4', label: 'π/4', labelTone: 'red', showLabel: false,
                        offset: pi4Offset,
                        scales: ['FC284_A', 'FC284_B'] }
                ],
                cursorCaptions: frontCaptions
            },
            back: {
                name: 'Back - log-log / hyperbolic',
                topStator: ['FC284_LL1', 'FC284_LL2', 'FC284_LL3', 'FC284_Y'],
                slide: ['FC284_y', 'FC284_CH', 'FC284_SH2', 'FC284_SH1'],
                bottomStator: ['FC284_TH', 'FC284_LL03', 'FC284_LL02', 'FC284_LL01'],
                cursorMarks: ordinaryMarks()
            }
        }
    }
};
