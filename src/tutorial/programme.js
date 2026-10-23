/** A temporary teaching layout, independent of the user's programme.
 * Build from application defaults so ordinary rendering and controls keep the
 * same contracts, then remove custom overrides and unrelated instrument rows.
 * This module performs no persistence and does not retain the caller's input.
 */
import { DEFAULT_STATE } from '#catalog/defaults.js';
import { deepClone, deepFreeze } from '#core/objects.js';
import { normalizeState } from '#model/program.js';
import { validateProgram } from '#model/validation.js';

/** Each profile uses genuine catalogue scales. The immutable row lists are
 * cloned into each programme, so a temporary edit cannot alter another lesson.
 */
const teachingLayout = (name, note, topStator = [], slide = ['C'], bottomStator = ['D']) =>
    ({ name, note, topStator, slide, bottomStator });

export const TUTORIAL_LAYOUTS = deepFreeze({
    cd: teachingLayout('Learning C and D',
        'C moves with the slide; D stays fixed. Read both at the red hairline.'),
    reciprocal: teachingLayout('Learning reciprocals',
        'CI and C move together. CI runs in the opposite direction; D stays fixed.', [], ['CI', 'C']),
    squares: teachingLayout('Learning squares and square roots',
        'A and D stay fixed. A gives the square of D at the same hairline.', ['A']),
    cubes: teachingLayout('Learning cubes and cube roots',
        'K and D stay fixed. K gives the cube of D at the same hairline.', ['K']),
    sine: teachingLayout('Learning sines',
        'S is marked in degrees. D gives ten times the sine of the angle.', ['S']),
    tangent: teachingLayout('Learning lower tangents',
        'T₁ uses degrees, from about 5.71° to 45°. D gives ten times the tangent.', ['T1']),
    inverse: teachingLayout('Fixed and sliding inverse scales',
        'DI is fixed; CI moves with C. At zero slide offset, CI and DI both read 10 divided by D.', ['DI'], ['CI', 'C']),
    folded: teachingLayout('Scales folded at π',
        'CF moves and DF stays fixed. Their interior 10|1 indexes are about halfway along the rule.', ['DF'], ['CF', 'C']),
    'folded-inverse': teachingLayout('Folded reciprocal scales',
        'DF and DIF stay fixed; CIF moves. Away from the 10|1 break, DF × DIF = 10; CIF equals DIF only while aligned.', ['DF', 'DIF'], ['CIF']),
    'root-square': teachingLayout('Dedicated square-root branches',
        'Above D = m, √₁ gives √m and √₂ gives √(10m). Choose the radicand decade before reading.', ['R1', 'R2']),
    'root-cube': teachingLayout('Dedicated cube-root branches',
        'Above D = m, ∛₁, ∛₂ and ∛₃ give ∛m, ∛(10m) and ∛(100m).', ['Q1', 'Q2', 'Q3']),
    ab: teachingLayout('Fixed A and sliding B',
        'A stays fixed with D; B moves with C. A = D² and B = C² at the same local position.', ['A'], ['B', 'C']),
    'faber-w': teachingLayout('Faber-Castell 2/83N W scales',
        'W₂ and W₁ stay fixed; W₂′ and W₁′ move together. Each covers half a decade over the full length. Change branch at √10.', ['W2'], ['W2P', 'W1P'], ['W1', 'D']),
    'tangent-high': teachingLayout('Upper tangent range',
        'T₂ uses degrees from 45° to about 84.29°. Read tan θ directly on D.', ['T2']),
    'small-angle': teachingLayout('Small-angle scale',
        'ST uses degrees. D/100 gives the calibrated sine; tangent is a small-angle approximation.', ['ST']),
    pythagorean: teachingLayout('Pythagorean complement',
        'Interpret D as t = D/10. P gives √(1 − t²), not √(1 − D²).', ['P']),
    hypotenuse: teachingLayout('Hypotenuse ranges',
        'H₁ uses t = D/10; H₂ uses t = D. Each gives √(1 + t²) in its range.', ['H1', 'H2']),
    'thornton-ps': teachingLayout('Thornton AA010 Ps relationship',
        'Ps gives √(1 − t²), where t = D/10. Keep the vector component’s decimal place explicit.', ['PS']),
    'thornton-pt': teachingLayout('Thornton Pt mathematical study',
        'H₁/H₂ illustrate the Pt relationship √(1 + t²) as result scales above D/10 or D. These are not the original Thornton Pt input graduations.', ['H1', 'H2']),
    'thornton-direct': teachingLayout('Thornton direct correction study',
        'Sd/Td are normalised layout studies, not calibrated Thornton correction scales. Their labels are angles; do not read a correction factor on D. S/T₁ retain their stated calibrated mappings.', ['S', 'T1'], ['SD', 'TD', 'C']),
    'thornton-inverse': teachingLayout('Thornton inverse correction study',
        'ISd/ITd are normalised layout studies, not calibrated Thornton correction scales. Their labels are function inputs; do not read a correction factor on D. S/T₁ provide the independent inverse-function readings.', ['S', 'T1'], ['ISD', 'ITD', 'C']),
    logarithm: teachingLayout('Common logarithms',
        'L is the base-ten logarithm of the D reading. Add the number’s decade separately.', ['L']),
    'natural-linear': teachingLayout('Linear common and natural logarithms',
        'L gives log₁₀(D); ln gives ln(D). These linear rows differ from the Flying Fish exponential Ln banks.', ['L', 'LN']),
    'folded-log-conversion': teachingLayout('Scales folded at ln(10)',
        'CF/M moves and DF/M stays fixed. M = log₁₀(e); folding at 1/M = ln(10) makes common/natural logarithm conversion convenient.', ['DFM'], ['CFM', 'C']),
    'loglog-banks': teachingLayout('Positive LL ranges',
        'Each LL row gives an absolute eˣ value. LL0 to LL4 use exponents D/1000, D/100, D/10, D and 10D.', ['LL0', 'LL1', 'LL2', 'LL3', 'LL4']),
    'loglog-main': teachingLayout('Powers, roots and natural logarithms',
        'LL1, LL2 and LL3 use exponents D/100, D/10 and D. Their values retain their actual decimal places.', ['LL1', 'LL2', 'LL3']),
    'loglog-negative': teachingLayout('Negative-exponent LL ranges',
        'LL00 to LL04 give e⁻ˣ for x = D/1000, D/100, D/10, D and 10D. Values decrease towards the right.', ['LL00', 'LL01', 'LL02', 'LL03', 'LL04']),
    'loglog-near': teachingLayout('LL values close to one',
        'LL0, LL1 and LL2 use exponents D/1000, D/100 and D/10; do not discard the excess above one.', ['LL0', 'LL1', 'LL2']),
    geometry: teachingLayout('Areas and measurements',
        'A and D stay fixed; C moves. Track whether a given length is a radius, diameter or semi-axis.', ['A']),
    sinh: teachingLayout('Hyperbolic sine',
        'Arguments are dimensionless. Sh₁ gives sinh u = D/10; Sh₂ gives sinh u = D.', ['SH1', 'SH2']),
    cosh: teachingLayout('Hyperbolic cosine',
        'Ch is labelled by a dimensionless argument u. Read cosh u directly on D.', ['CH']),
    tanh: teachingLayout('Hyperbolic tangent',
        'Th is labelled by a dimensionless argument u. Read tanh u = D/10; finite arguments never give 1.', ['TH']),
    hyperbolic: teachingLayout('Inverse hyperbolic functions',
        'Read an argument from the hyperbolic row opposite the given function value on D, using its stated factor of ten.', ['SH1', 'SH2', 'CH', 'TH']),
    catenary: teachingLayout('Catenary height and slope',
        'Ch gives cosh u and Sh₂ gives sinh u. For y = a cosh(x/a), u = x/a is dimensionless.', ['CH', 'SH2']),
    'hyperbolic-identity': teachingLayout('Hyperbolic identity with squares',
        'Ch and Sh₂ give arguments; A squares their D readings. Subtract the two squared readings mentally.', ['CH', 'SH2', 'A'])
});

export function createTutorialProgramme(start, layout = 'cd') {
    // Reject bad teaching targets before normalisation can silently clamp them.
    for (const [field, minimum, maximum] of [['slideOffset', -.9, .9], ['cursor', 0, 1]]) {
        const value = start?.[field];
        if (!Number.isFinite(value) || value < minimum || value > maximum)
            throw new RangeError(`Tutorial ${field} is outside its permitted range.`);
    }
    if (typeof layout !== 'string' || !Object.hasOwn(TUTORIAL_LAYOUTS, layout))
        throw new RangeError('Unknown tutorial layout.');
    const profile = TUTORIAL_LAYOUTS[layout];
    const programme = Object.assign(deepClone(DEFAULT_STATE), {
        activeSide: 'front',
        viewMode: 'single',
        presetId: 'custom',
        modelLabel: 'Learn the slide rule',
        instrumentNote: profile.note,
        theme: 'neutral',
        density: 'comfortable',
        compactScales: false,
        showFormulas: true,
        fullPrecision: false,
        slideWraparound: false,
        magnification: 1,
        graduationMode: 'conventional',
        logGraduations: 'standard',
        adaptiveSpacing: 'balanced',
        cursorShape: 'minimal',
        cursorColour: 'red',
        customScales: [],
        slideOffset: start.slideOffset,
        cursor: start.cursor,
        sides: { front: deepClone(profile) }
    });
    normalizeState(programme); // This function deliberately mutates its argument.
    validateProgram(programme);
    return programme;
}
