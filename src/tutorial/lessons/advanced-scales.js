/** Dedicated scalar root branches, moving B, and supplementary main scales.
 * D supplies the radicand's mantissa to a root branch. The chosen branch and
 * external power of ten are separate decisions; neither is inferred by the
 * alignment checker. All authored coordinates are graduated-length fractions.
 */
import { log, position, move, exercise, sectionLessons, ESTIMATE_NOTE } from '#tutorial/lesson-data.js';

const at = value => position(0, log(value));
const degrees = angle => angle * Math.PI / 180;
const tangent = angle => at(Math.tan(degrees(angle)));
const smallAngle = angle => at(100 * Math.sin(degrees(angle)));
const practise = (title, text, target, required, success, readings) =>
    ({ ...exercise(title, text, target, required, success), readings });

export const ADVANCED_POWER_LESSONS = sectionLessons('powers', [
    {
        id: 'root-square-even', title: 'Read the dedicated square-root branches', layout: 'root-square',
        problem: '√2.5 = ?',
        summary: 'Compare √₁ (R1) and √₂ (R2) with D, rather than locating a radicand on A.',
        start: position(),
        steps: [
            move('Compare the two root branches',
                'The square-root rows are labelled √₁ (R1) and √₂ (R2). Put the cursor at D 2: R1 reads √2, about 1.414; R2 reads √20, about 4.472. A compresses two radicand decades onto one scale. These dedicated branches instead put the radicand’s mantissa directly on D and show the two possible root ranges separately.',
                at(2), 'cursor', ['R1', 'R2', 'D']),
            move('Read √2.5 on R1',
                'Move to D 2.5. Write 2.5 as 2.5 × 10⁰: the exponent 0 is even, so select R1. It reads about 1.581. The external multiplier is 10⁰ = 1, giving √2.5 ≈ 1.581. R2 at the same hairline answers a different question, √25.',
                at(2.5), 'cursor', ['R1', 'D'])
        ],
        practice: {
            problem: '√3.6 = ?',
            intro: 'Write the radicand as a mantissa times a power of ten. Select the branch for an even exponent, and read the root at that mantissa on D.',
            note: ESTIMATE_NOTE, start: position(),
            steps: [practise('Find √3.6', 'Put the hairline at D 3.6. Choose R1, since 3.6 = 3.6 × 10⁰.',
                at(3.6), ['cursor'], 'Correct: R1 reads about 1.897. The external factor is 1, so √3.6 ≈ 1.897.', ['R1', 'D'])]
        }
    },
    {
        id: 'root-square-odd', title: 'Choose the odd square-root decade', layout: 'root-square',
        problem: '√25 = ?',
        summary: 'Use R2 when the radicand has an odd power of ten.',
        start: position(),
        steps: [
            move('Find the odd-decade branch',
                'At D 2, R2 reads √20. Its radicand is ten times the D mantissa. This is the branch for an odd exponent; it does not mean moving to D 20 or reading the root of D 2.',
                at(2), 'cursor', ['R2', 'D']),
            move('Read √25 on R2',
                'Move to D 2.5. Now 25 = 2.5 × 10¹: exponent 1 selects R2, whose reading is 5. The remaining external factor is 10⁰ = 1. Thus √25 = 5; the R1 reading here is √2.5 instead.',
                at(2.5), 'cursor', ['R2', 'D'])
        ],
        practice: {
            problem: '√36 = ?',
            intro: 'Reduce 36 to a mantissa and exponent, then choose the odd-decade root branch.',
            note: ESTIMATE_NOTE, start: position(),
            steps: [practise('Find √36', 'Use D 3.6 because 36 = 3.6 × 10¹. Read the odd-decade branch R2.',
                at(3.6), ['cursor'], 'Correct: R2 reads 6. Its external factor is 1, so √36 = 6.', ['R2', 'D'])]
        }
    },
    {
        id: 'root-square-decades', title: 'Scale square roots above and below one', layout: 'root-square',
        problem: '√250 = ?',
        summary: 'Keep the branch choice separate from the external power of ten.',
        start: position(),
        steps: [
            move('Separate the two decisions',
                'At D 2, R1 reads √2. For a radicand written m × 10ᵏ, use R1 for even k and R2 for odd k, then multiply the branch reading by 10 raised to floor(k/2). This floor rule also works for negative exponents.',
                at(2), 'cursor', ['R1', 'D']),
            move('Apply the external factor to √250',
                'Move to D 2.5. Since 250 = 2.5 × 10², choose R1. Its reading is about 1.581; multiply by 10¹, giving √250 ≈ 15.81. Choosing R2 would change the root branch rather than supply this external factor.',
                at(2.5), 'cursor', ['R1', 'D'])
        ],
        practice: {
            problem: '√0.25 = ?',
            intro: 'Write 0.25 = 2.5 × 10⁻¹. An odd negative exponent uses R2. The external power is floor(−1/2) = −1, so multiply its reading by 0.1.',
            note: ESTIMATE_NOTE, start: position(),
            steps: [practise('Find √0.25', 'Put the hairline at D 2.5. Read R2 and apply the external factor 0.1.',
                at(2.5), ['cursor'], 'Correct: R2 reads 5. Multiplying by 0.1 gives √0.25 = 0.5.', ['R2', 'D'])]
        }
    },
    {
        id: 'root-cube-branches', title: 'Choose among three cube-root branches', layout: 'root-cube',
        problem: '∛4 = ?; ∛40 = ?; ∛400 = ?',
        summary: 'Read Q1, Q2 and Q3 at one D mantissa, choosing its decade explicitly.',
        start: position(),
        steps: [
            move('Compare all three branches',
                'The rows ∛₁, ∛₂ and ∛₃ are Q1, Q2 and Q3. At D 2 they read ∛2, ∛20 and ∛200 respectively. For m × 10ᵏ, take the nonnegative remainder of k divided by 3: remainders 0, 1 and 2 select Q1, Q2 and Q3. Multiply the selected reading by 10 raised to floor(k/3).',
                at(2), 'cursor', ['Q1', 'Q2', 'Q3', 'D']),
            move('Read the three roots at D 4',
                'Move to D 4. The exponents in 4 × 10⁰, 4 × 10¹ and 4 × 10² select Q1, Q2 and Q3 respectively. Their readings give ∛4 ≈ 1.587, ∛40 ≈ 3.420 and ∛400 ≈ 7.368. All three external factors are 10⁰ = 1.',
                at(4), 'cursor', ['Q1', 'Q2', 'Q3', 'D'])
        ],
        practice: {
            problem: '∛3.2 = ?; ∛32 = ?; ∛320 = ?',
            intro: 'All three radicands have mantissa 3.2. Use their exponents to select Q1, Q2 and Q3; each external multiplier is 1.',
            note: ESTIMATE_NOTE, start: position(),
            steps: [practise('Read the three cube roots', 'Put the hairline at D 3.2 and read Q1, Q2 and Q3 for the three stated radicands.',
                at(3.2), ['cursor'], 'Correct: ∛3.2 ≈ 1.474, ∛32 ≈ 3.175 and ∛320 ≈ 6.840.', ['Q1', 'Q2', 'Q3', 'D'])]
        }
    },
    {
        id: 'root-cube-decades', title: 'Reduce cube-root decades', layout: 'root-cube',
        problem: '∛4000 = ?',
        summary: 'Use the exponent modulo three, including for numbers below one.',
        start: position(),
        steps: [
            move('Read a branch before rescaling',
                'At D 2, Q1 gives ∛2. Three extra powers of ten in the radicand give one extra power of ten in its cube root. The branch remains Q1 when the radicand’s exponent is divisible by 3.',
                at(2), 'cursor', ['Q1', 'D']),
            move('Read ∛4000',
                'Move to D 4. Write 4000 = 4 × 10³. The remainder of 3 divided by 3 is 0, so use Q1, about 1.587. Multiply by 10¹ to obtain ∛4000 ≈ 15.87.',
                at(4), 'cursor', ['Q1', 'D'])
        ],
        practice: {
            problem: '∛0.4 = ?',
            intro: 'Write 0.4 = 4 × 10⁻¹. The nonnegative remainder of −1 divided by 3 is 2, selecting Q3. Since floor(−1/3) = −1, the external multiplier is 0.1.',
            note: ESTIMATE_NOTE, start: position(),
            steps: [practise('Find ∛0.4', 'Put the hairline at D 4. Read Q3 and multiply that branch reading by 0.1.',
                at(4), ['cursor'], 'Correct: Q3 reads about 7.368. The external factor 0.1 gives ∛0.4 ≈ 0.7368.', ['Q3', 'D'])]
        }
    },
    {
        id: 'root-powers-ratios', title: 'Reverse a branch and take a root ratio', layout: 'root-square',
        problem: '6² = ?; √(9 ÷ 4) = ?',
        summary: 'Recover a square from R2, then read the square root of a C/D quotient.',
        start: position(),
        steps: [
            move('Reverse R2 to square 6',
                'Move to 6 on R2. D reads 3.6, and this branch represents ten times D: 6² = 36. Reversing R1 would give the square directly on D; reversing R2 requires that extra factor of ten.',
                at(3.6), 'cursor', ['R2', 'D']),
            move('Mark the numerator of the ratio',
                'Now find √(9 ÷ 4). First move the hairline to D 9. We will divide on C/D and read the resulting square root on fixed R1.',
                at(9), 'cursor', ['R1', 'D']),
            move('Set up 9 divided by 4',
                'Keep the cursor at D 9 and move C 4 beneath it. The C/D division setting is now fixed.',
                position(log(9 / 4), log(9)), 'slide', ['C', 'D', 'R1']),
            move('Read the quotient and its root',
                'Move the cursor to C’s left-hand 1. D reads 2.25 and R1 reads 1.5: √(9 ÷ 4) = 1.5. In reverse, this same R1-to-D alignment says 1.5² = 2.25.',
                position(log(9 / 4), log(9 / 4)), 'cursor', ['C', 'D', 'R1'])
        ],
        practice: {
            problem: '8² = ?; √(8 ÷ 2) = ?',
            intro: 'First reverse R2 to square 8, accounting for its factor of ten. Then divide 8 by 2 on C/D and read the root of that quotient on R1.',
            note: ESTIMATE_NOTE, start: position(),
            steps: [
                practise('Square 8 using R2', 'Put the hairline at 8 on R2. Read D and apply R2’s factor of ten.',
                    at(6.4), ['cursor'], 'Correct: D reads 6.4, so 8² = 64.', ['R2', 'D']),
                practise('Mark D 8 for the quotient', 'Move the cursor to the numerator, D 8.',
                    at(8), ['cursor'], 'The numerator is marked. Keep the cursor here for the slide alignment.', ['R1', 'D']),
                practise('Align C 2 with D 8', 'Move C 2 beneath D 8. Keep the cursor at the numerator.',
                    position(log(4), log(8)), ['slideOffset'], 'The division setting is ready.', ['C', 'D', 'R1']),
                practise('Read the root of the quotient', 'Move to C’s left-hand 1. Read the quotient on D, then its square root on R1.',
                    position(log(4), log(4)), ['slideOffset', 'cursor'], 'Correct: D reads 4 and R1 reads 2, so √(8 ÷ 2) = 2.', ['C', 'D', 'R1'])
            ]
        }
    },
    {
        id: 'ab-geometry', title: 'Keep moving B distinct from fixed A', layout: 'ab',
        problem: 'At C = 2, B = ?',
        summary: 'B moves with C, while A stays aligned with fixed D.',
        start: position(),
        steps: [
            move('Compare the aligned scales',
                'At D 2 with the slide at zero, A and B both read 4, while C reads 2. A is the square of fixed D. B is the square of moving C.',
                at(2), 'cursor', ['A', 'B', 'C', 'D']),
            move('Move B and C together',
                'Keep the cursor still and move C’s left-hand 1 to D 1.5. Fixed D remains 2 and A remains 4; C now reads about 1.333 and B about 1.778. B follows C, not D.',
                position(log(1.5), log(2)), 'slide', ['A', 'B', 'C', 'D']),
            move('Read B above C 2',
                'Move to C 2, now above D 3. B reads 4, whereas fixed A reads 9. The same hairline therefore shows B = C² and A = D², using two different input numbers.',
                position(log(1.5), log(3)), 'cursor', ['A', 'B', 'C', 'D'])
        ],
        practice: {
            problem: 'At C = 3, B = ?',
            intro: 'Start with the cursor at D 2. Change the slide setting, then use C 3 to read its square on B. Distinguish that reading from fixed A.',
            start: at(2),
            steps: [
                practise('Move C 1 to D 1.25', 'Move the slide until C’s left-hand 1 is at D 1.25. Leave the cursor where it is.',
                    position(log(1.25), log(2)), ['slideOffset'], 'The B/C pair has moved while A and D have stayed fixed.', ['A', 'B', 'C', 'D']),
                practise('Read B at C 3', 'Move the cursor to C 3, and read its square on moving B.',
                    position(log(1.25), log(3.75)), ['slideOffset', 'cursor'], 'Correct: B reads 9. D is 3.75, so fixed A instead reads about 14.06.', ['A', 'B', 'C', 'D'])
            ]
        }
    },
    {
        id: 'ab-multiply', title: 'Multiply on A and B', layout: 'ab',
        problem: '4 × 9 = ?',
        summary: 'Multiply using fixed A and moving B, whose logarithmic lengths each cover two decades.',
        start: position(),
        steps: [
            move('Mark the first A factor', 'Move to A 4. The fixed D reading below it is 2 because A is D squared.',
                at(2), 'cursor', ['A', 'B']),
            move('Align the left B index', 'Move B’s left-hand 1 beneath the hairline at A 4. B and C move as one slide.',
                position(log(2), log(2)), 'slide', ['A', 'B']),
            move('Read the A/B product', 'Move to B 9 in its left-hand decade. A reads 36. This multiplies 4 by 9 directly on the two-decade A/B pair.',
                position(log(2), log(6)), 'cursor', ['A', 'B'])
        ],
        practice: {
            problem: '16 × 4 = ?',
            intro: 'Use A and B directly. Mark the first factor on A, align B’s left-hand 1, then read A at the second B factor.',
            note: ESTIMATE_NOTE, start: position(),
            steps: [
                practise('Mark A 16', 'Move the hairline to A 16 in its right-hand decade.',
                    at(4), ['cursor'], 'The first factor is marked.', ['A', 'B']),
                practise('Align B 1 with A 16', 'Move B’s left-hand 1 beneath the hairline at A 16.',
                    position(log(4), log(4)), ['slideOffset'], 'Keep this A/B multiplication setting.', ['A', 'B']),
                practise('Read at B 4', 'Move to B 4 and read the product on A.',
                    position(log(4), log(8)), ['slideOffset', 'cursor'], 'Correct: A reads 64, so 16 × 4 = 64.', ['A', 'B'])
            ]
        }
    }
]);

export const ADVANCED_TRIG_LESSONS = sectionLessons('trigonometry', [
    {
        id: 'tangent-high', title: 'Use the upper tangent scale T2', layout: 'tangent-high',
        problem: 'tan 60° = ?',
        summary: 'Read tangents above one directly on D using degree-labelled T2.',
        start: position(),
        steps: [
            move('Read above the 45° boundary',
                'Move to 50° on T2. D reads about 1.192. T2 covers the upper tangent range, from 45° to about 84.29°, and its D reading is the tangent directly.',
                tangent(50), 'cursor', ['T2', 'D']),
            move('Read tan 60°',
                'Move to T2 60°. D reads about 1.732, so tan 60° ≈ 1.732. Do not divide this T2 reading by ten: that conversion belongs to the lower T1 range.',
                tangent(60), 'cursor', ['T2', 'D'])
        ],
        practice: {
            problem: 'tan 70° = ?',
            intro: 'Use the degree-labelled T2 scale and read its tangent directly on D.',
            start: position(),
            steps: [practise('Find tan 70°', 'Move the hairline to T2 70°, then read D without a factor-of-ten conversion.',
                tangent(70), ['cursor'], 'Correct: D reads about 2.747, giving tan 70° ≈ 2.747.', ['T2', 'D'])]
        }
    },
    {
        id: 'small-angle', title: 'Use ST for small angles', layout: 'small-angle',
        problem: 'sin 1° ≈ ?; tan 1° ≈ ?',
        summary: 'Separate the exact sine calibration from its small-angle tangent approximation.',
        start: position(),
        steps: [
            move('Use ST’s factor of one hundred',
                'Move to ST 2°. The D reading is about 3.490. Divide by 100 to obtain sin 2° ≈ 0.03490. This emulator calibrates ST with sine; using the same reading for tangent is an approximation.',
                smallAngle(2), 'cursor', ['ST', 'D']),
            move('Quantify the approximation at one degree',
                'Move to ST 1°. D reads about 1.745, so sin 1° ≈ 0.01745. Reusing the unrounded sine reading for tan 1° underestimates the tangent by about 0.0152%; tan 1° is about 0.01746. Sine and tangent are close here, not equal.',
                smallAngle(1), 'cursor', ['ST', 'D'])
        ],
        practice: {
            problem: 'sin 2.5° ≈ ?; tan 2.5° ≈ ?',
            intro: 'Read ST 2.5°, divide D by 100 for the sine, and judge the same value as an approximation to the tangent. Its relative tangent error is below 0.1% here.',
            start: position(),
            steps: [practise('Read the small angle', 'Move to ST 2.5° and read D. Keep the distinction between the sine calibration and the tangent approximation.',
                smallAngle(2.5), ['cursor'], 'Correct: D reads about 4.362, giving sin 2.5° ≈ 0.04362. The true tangent is about 0.04366; the unrounded sine underestimates it by about 0.0952%.', ['ST', 'D'])]
        }
    },
    {
        id: 'pythagorean', title: 'Read the Pythagorean complement P', layout: 'pythagorean',
        problem: '√(1 − 0.6²) = ?',
        summary: 'Interpret D as 0.1–1 to read √(1 − x²) on P.',
        start: position(),
        steps: [
            move('Identify the input decade',
                'Move to D 3, interpreted as x = 0.3. P reads √(1 − 0.3²), about 0.9539. Throughout this comparison x is D divided by ten, ranging from 0.1 to 1; P decreases as that input increases.',
                at(3), 'cursor', ['P', 'D']),
            move('Read the complement of 0.6',
                'Move to D 6, meaning x = 0.6. P reads 0.8. Thus √(1 − 0.6²) = 0.8, which is the other positive leg of a right triangle whose hypotenuse is 1.',
                at(6), 'cursor', ['P', 'D'])
        ],
        practice: {
            problem: '√(1 − 0.8²) = ?',
            intro: 'Convert the stated input to its D position by multiplying it by ten. Read the positive complement on P.',
            start: position(),
            steps: [practise('Find the complement of 0.8', 'Use D 8 for x = 0.8, and read P at the hairline.',
                at(8), ['cursor'], 'Correct: P reads 0.6, so √(1 − 0.8²) = 0.6.', ['P', 'D'])]
        }
    },
    {
        id: 'hypotenuse', title: 'Use both hypotenuse ranges H1 and H2', layout: 'hypotenuse',
        problem: '√(3² + 4²) = ?',
        summary: 'Read √(1 + x²), then restore the length used to normalise the triangle.',
        start: position(),
        steps: [
            move('Normalise by the longer leg for H1',
                'For perpendicular legs 3 and 4, first divide both by 4. The ratio is x = 3/4. Put the cursor at D 7.5: H1 uses x = D/10 and reads √(1 + 0.75²) = 1.25. Multiplying that factor by 4 gives a hypotenuse of 5.',
                at(7.5), 'cursor', ['H1', 'D']),
            move('Normalise by the shorter leg for H2',
                'Alternatively divide by 3, giving x = 4/3. Move to D 4/3, about 1.333. H2 uses x = D directly and reads √(1 + (4/3)²) = 5/3, about 1.6667. Multiply by 3 to recover the same hypotenuse, 5. H1 covers x = 0.1–1; H2 covers x = 1–10.',
                at(4 / 3), 'cursor', ['H2', 'D'])
        ],
        practice: {
            problem: '√(5² + 12²) = ?',
            intro: 'Try both normalisations. H1 uses the smaller-to-larger ratio with D divided by ten; H2 uses the larger-to-smaller ratio directly on D. Multiply each factor by the leg used for normalisation.',
            start: position(),
            steps: [
                practise('Use H1 with 5/12', 'Put the hairline at D 25/6, about 4.167, to represent x = 5/12 on H1. Read its factor and multiply by 12.',
                    at(25 / 6), ['cursor'], 'Correct: H1 reads 13/12, about 1.08333. Multiplying by 12 gives a hypotenuse of 13.', ['H1', 'D']),
                practise('Use H2 with 12/5', 'Move to D 12/5 = 2.4. Read H2 and multiply its factor by 5.',
                    at(12 / 5), ['cursor'], 'Correct: H2 reads 2.6. Multiplying by 5 again gives a hypotenuse of 13.', ['H2', 'D'])
            ]
        }
    }
]);
