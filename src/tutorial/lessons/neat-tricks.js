/** Small identities and useful applications of the ordinary teaching scales.
 * Addition and subtraction are explicitly mental steps. The rule supplies
 * products, quotients, squares and the stated hypotenuse function; it does not
 * acquire an addition scale. Each transition moves one real component.
 */
import { log, position, move, exercise, sectionLessons, ESTIMATE_NOTE } from '#tutorial/lesson-data.js';

const at = value => position(0, log(value));
const practise = (title, text, target, required, success, readings, focus) =>
    ({ ...exercise(title, text, target, required, success, focus), readings });
const goldenSum = 1 + Math.sqrt(5), golden = goldenSum / 2;
const practiceSum = 1 + Math.sqrt(17), practiceRoot = practiceSum / 2;

export const NEAT_TRICK_LESSONS = sectionLessons('neat-tricks', [
    {
        id: 'split-total', title: 'Split a total into a ratio', layout: 'cd',
        problem: 'Split 84 into shares x:y = 2:5. Find x and y.',
        summary: 'Use one alignment to read both shares after adding the ratio parts mentally.',
        start: position(),
        steps: [
            move('Mark the total',
                'Add the ratio parts mentally: 2 + 5 = 7. Each share is its number of parts times 84/7. Put the cursor at D 8.4, representing the total 84 with a factor of ten kept outside the scale.',
                at(8.4), 'cursor', ['D']),
            move('Divide by the number of parts',
                'Hold the cursor still and move C 7 beneath it. This one setting makes D equal 1.2 times C; the actual amounts are ten times those D readings.',
                position(log(1.2), log(8.4)), 'slide', ['C', 'D']),
            move('Read the two-part share',
                'Move to C 2. D reads 2.4, so the first share is 24. Keep the slide in place for the other share.',
                position(log(1.2), log(2.4)), 'cursor', ['C', 'D']),
            move('Read the five-part share',
                'Move to C 5. D reads 6, giving a second share of 60. Check mentally that 24 + 60 = 84 and that 24:60 = 2:5. Both readings came from the same setting.',
                position(log(1.2), log(6)), 'cursor', ['C', 'D'])
        ],
        practice: {
            problem: 'Split 96 into shares x:y = 3:5. Find x and y.',
            intro: 'Add the ratio parts mentally. Align that total number of parts with D 9.6, then read the shares at C 3 and C 5. Restore the external factor of ten.',
            note: ESTIMATE_NOTE, start: position(),
            steps: [
                practise('Mark the total 96', 'Put the cursor at D 9.6, representing 96.',
                    at(9.6), ['cursor'], 'The total is marked.', ['D']),
                practise('Set the total number of parts', 'Since 3 + 5 = 8, move C 8 beneath the held hairline at D 9.6.',
                    position(log(1.2), log(9.6)), ['slideOffset', 'cursor'], 'The ratio setting is ready. Keep the slide here.', ['C', 'D'], 'slide'),
                practise('Read the three-part share', 'Move to C 3. Read D and multiply its value by ten.',
                    position(log(1.2), log(3.6)), ['slideOffset', 'cursor'], 'Correct: D reads 3.6, so the first share is 36.', ['C', 'D']),
                practise('Read the five-part share', 'Move to C 5 without changing the slide. Read the other share.',
                    position(log(1.2), log(6)), ['slideOffset', 'cursor'], 'Correct: the second share is 60. The shares add to 96 and have ratio 3:5.', ['C', 'D'])
            ]
        }
    },
    {
        id: 'parallel-resistance', title: 'Find a parallel resistance with CI', layout: 'reciprocal',
        problem: 'Two ideal resistances, 6 Ω and 3 Ω, are in parallel. Find R = (6 × 3)/(6 + 3).',
        summary: 'Set a constant product on CI/D and divide by a mentally calculated sum.',
        start: position(),
        steps: [
            move('Mark the first resistance',
                'For two ideal positive resistances a and b in parallel, 1/R = 1/a + 1/b, giving R = ab/(a+b). Add 6 + 3 = 9 mentally, then put the cursor at D 6.',
                at(6), 'cursor', ['D']),
            move('Set the product without reading it separately',
                'Hold the cursor at D 6 and move CI 3 beneath it. Because CI runs backwards, the product of CI and D is now 18 everywhere in their common visible range.',
                position(log(18) - 1, log(6)), 'slide', ['CI', 'D']),
            move('Divide by the sum',
                'Move to CI 9, the sum calculated mentally. D reads 2, so the equivalent resistance is 2 Ω. The result is less than either of the two positive resistances, as a parallel equivalent must be.',
                position(log(18) - 1, log(2)), 'cursor', ['CI', 'D'])
        ],
        practice: {
            problem: 'Two ideal resistances, 4 Ω and 2 Ω, are in parallel. Find R = (4 × 2)/(4 + 2).',
            intro: 'Use CI/D to hold the product, then move to the sum of the resistances on CI. Calculate that sum mentally.',
            start: position(),
            steps: [
                practise('Mark D 4', 'Put the cursor at the first resistance, D 4.',
                    at(4), ['cursor'], 'The first resistance is marked.', ['D']),
                practise('Align CI 2 with D 4', 'Move CI 2 beneath the held hairline at D 4.',
                    position(log(8) - 1, log(4)), ['slideOffset', 'cursor'], 'CI and D now have constant product 8.', ['CI', 'D'], 'slide'),
                practise('Read at the sum on CI', 'Add 4 + 2 mentally and move the cursor to CI 6. Read the equivalent resistance on D.',
                    position(log(8) - 1, log(4 / 3)), ['slideOffset', 'cursor'], 'Correct: R = 8/6 Ω = 4/3 Ω, about 1.333 Ω.', ['CI', 'D'])
            ]
        }
    },
    {
        id: 'golden-ratio', title: 'Find the golden ratio from a hypotenuse', layout: 'hypotenuse',
        problem: 'Solve x² − x = 1 for the positive value of x.',
        summary: 'Use H2 for √5, add one mentally, then divide by two on C/D.',
        start: position(),
        steps: [
            move('Find the required square root',
                'Completing the square gives (2x − 1)² = 5, so the positive solution is (1 + √5)/2. Put the cursor at D 2. H2 reads √(1 + 2²) = √5, about 2.236.',
                at(2), 'cursor', ['H2', 'D']),
            move('Transfer the mental sum',
                'Add 1 to the H2 reading mentally, giving about 3.236. Move the cursor to that value on D. This transfers 1 + √5; the addition itself is done mentally.',
                at(goldenSum), 'cursor', ['D']),
            move('Divide the sum by two',
                'Hold the cursor still and move C 2 beneath it. The slide now records division of 1 + √5 by 2.',
                position(log(golden), log(goldenSum)), 'slide', ['C', 'D']),
            move('Read the golden ratio',
                'Move to C’s left-hand 1. D reads about 1.618, the golden ratio φ. Its defining relation is φ² = φ + 1; the other quadratic solution is negative and was excluded by the question.',
                position(log(golden), log(golden)), 'cursor', ['C', 'D'])
        ],
        practice: {
            problem: 'Solve x² − x = 4 for the positive value of x.',
            intro: 'Completing the square now gives (2x − 1)² = 17. Use H2 at D 4 to obtain √17, add 1 mentally, and divide the resulting sum by 2 on C/D.',
            start: position(),
            steps: [
                practise('Read √17 on H2', 'Move to D 4, where H2 gives √(1 + 4²).',
                    at(4), ['cursor'], 'H2 reads √17, about 4.1231.', ['H2', 'D']),
                practise('Transfer one plus the root', 'Add 1 mentally and move the cursor to about 5.123 on D.',
                    at(practiceSum), ['cursor'], 'The sum 1 + √17 is marked on D.', ['D']),
                practise('Set division by two', 'Hold the cursor still and move C 2 beneath it.',
                    position(log(practiceRoot), log(practiceSum)), ['slideOffset', 'cursor'], 'The quotient is set.', ['C', 'D'], 'slide'),
                practise('Read the positive solution', 'Move to C 1 and read the positive solution on D.',
                    position(log(practiceRoot), log(practiceRoot)), ['slideOffset', 'cursor'], 'Correct: x = (1 + √17)/2 ≈ 2.562. It satisfies x² − x = 4.', ['C', 'D'])
            ]
        }
    },
    {
        id: 'pythagorean-triples', title: 'Generate an integer right triangle', layout: 'squares',
        problem: 'For m = 5 and n = 2, find a = m² − n², b = 2mn and c = m² + n².',
        summary: 'Read two squares and a product, then form the sums and differences mentally.',
        start: position(),
        steps: [
            move('Square the larger parameter',
                'For m > n > 0, the lengths m² − n², 2mn and m² + n² form a right triangle. Put the cursor at D 5 and record A 25 for m².',
                at(5), 'cursor', ['A', 'D']),
            move('Square the smaller parameter',
                'Move to D 2 and record A 4 for n². Subtract and add these two square readings mentally: the first leg is 21 and the hypotenuse is 29. We still need 2mn.',
                at(2), 'cursor', ['A', 'D']),
            move('Set the product mn',
                'Hold the cursor at D 2 and move C 1 beneath it. This sets multiplication of n by the next C reading.',
                position(log(2), log(2)), 'slide', ['C', 'D']),
            move('Read the remaining leg',
                'Move to C 5. D reads 10, so mn = 10; double it mentally to obtain the other leg, 20. The resulting integer triangle has legs 21 and 20 and hypotenuse 29: 21² + 20² = 29².',
                position(log(2), 1), 'cursor', ['C', 'D'])
        ],
        practice: {
            problem: 'For m = 4 and n = 3, find a = m² − n², b = 2mn and c = m² + n².',
            intro: 'Read m² and n² on A and form their difference and sum mentally. Use the right C index for the product mn, then double that product mentally.',
            note: ESTIMATE_NOTE, start: position(),
            steps: [
                practise('Read m²', 'Put the cursor at D 4 and record A.',
                    at(4), ['cursor'], 'A reads 16 for m².', ['A', 'D']),
                practise('Read n²', 'Move to D 3 and record A. Form the difference and sum of the two squares mentally.',
                    at(3), ['cursor'], 'A reads 9. The difference is 7 and the sum is 25.', ['A', 'D']),
                practise('Use the right index for mn', 'Hold the cursor at D 3 and move C’s right-hand 10 beneath it. This keeps the product with 4 on the visible rule.',
                    position(log(3) - 1, log(3)), ['slideOffset', 'cursor'], 'The product setting is ready; retain its factor of ten.', ['C', 'D'], 'slide'),
                practise('Read and double mn', 'Move to C 4. Interpret the D reading as mn and double it mentally.',
                    position(log(3) - 1, log(1.2)), ['slideOffset', 'cursor'], 'Correct: D 1.2 represents mn = 12. Doubling gives 24; the triangle has legs 7 and 24 and hypotenuse 25.', ['C', 'D'])
            ]
        }
    },
    {
        id: 'double-tangent', title: 'Double an angle from its tangent', layout: 'squares',
        problem: 'An acute angle θ has tan θ = 0.5. Find tan(2θ).',
        summary: 'Use A and C/D with tan(2θ) = 2t/(1 − t²), where t = tan θ.',
        start: position(),
        steps: [
            move('Square the tangent',
                'The double-angle identity uses t = tan θ. Put the cursor at D 5, interpreted as t = 0.5. A reads 25, representing t² = 0.25 after division by 100.',
                at(5), 'cursor', ['A', 'D']),
            move('Form the numerator and denominator mentally',
                'Calculate 2t = 1 and 1 − t² = 0.75 mentally. Move the cursor to D 1 for the numerator. The desired quotient is 1/0.75.',
                at(1), 'cursor', ['D']),
            move('Set the denominator’s significant digits',
                'Hold the cursor at D 1 and move C 7.5 beneath it. This represents the denominator 0.75. Reading at C 10 will restore that decimal place in the quotient.',
                position(-log(7.5), 0), 'slide', ['C', 'D']),
            move('Read the double-angle tangent',
                'Move to C’s right-hand 10. D reads about 1.333, giving tan(2θ) = 4/3. Since 0 < t < 1, θ is below 45° and the doubled angle is still below 90°.',
                position(-log(7.5), log(4 / 3)), 'cursor', ['C', 'D'])
        ],
        practice: {
            problem: 'An acute angle θ has tan θ = 0.6. Find tan(2θ).',
            intro: 'Use A to square t, calculate 2t and 1 − t² mentally, then divide on C/D. Read at C 10 to account for the denominator’s decimal place.',
            start: position(),
            steps: [
                practise('Square t = 0.6', 'Put the cursor at D 6. Interpret A after division by 100.',
                    at(6), ['cursor'], 'A reads 36, so t² = 0.36.', ['A', 'D']),
                practise('Mark the numerator', 'Calculate 2t = 1.2 and 1 − t² = 0.64 mentally. Move the cursor to D 1.2.',
                    at(1.2), ['cursor'], 'The numerator 1.2 is marked.', ['D']),
                practise('Align the denominator', 'Move C 6.4 beneath the held hairline at D 1.2, representing denominator 0.64.',
                    position(log(1.2 / 6.4), log(1.2)), ['slideOffset', 'cursor'], 'The division is set; use C 10 for the final reading.', ['C', 'D'], 'slide'),
                practise('Read tan(2θ)', 'Move to C 10 and read the doubled-angle tangent on D.',
                    position(log(1.2 / 6.4), log(15 / 8)), ['slideOffset', 'cursor'], 'Correct: tan(2θ) = 1.2/0.64 = 1.875.', ['C', 'D'])
            ]
        }
    },
    {
        id: 'symmetric-percentages', title: 'Track an equal percentage rise and fall', layout: 'squares',
        problem: 'A quantity rises 20%, then falls 20%. Find m = 1.2 × 0.8 and Δ = 100(m − 1)%.',
        summary: 'A square reveals the shortcut (1 + p)(1 − p) = 1 − p²; C/D checks it directly.',
        start: position(),
        steps: [
            move('Read the square of the fractional change',
                'Write 20% as p = 0.2. Put the cursor at D 2 and read A 4, interpreted as p² = 0.04 after division by 100. The identity predicts a final multiplier 1 − 0.04 = 0.96; subtract mentally.',
                at(2), 'cursor', ['A', 'D']),
            move('Set up a direct check',
                'A 20% rise multiplies by 1.2. The following 20% fall multiplies the increased amount by 0.8. Move the cursor to D 1.2 to check the product 1.2 × 0.8.',
                at(1.2), 'cursor', ['D']),
            move('Align the multiplication index', 'Hold the cursor still and move C’s left-hand 1 beneath it.',
                position(log(1.2), log(1.2)), 'slide', ['C', 'D']),
            move('Read the final multiplier',
                'Move to C 8, representing 0.8. D reads 9.6, which represents 0.96 after dividing by ten. The quantity finishes 4% below its starting value, agreeing with the p² shortcut.',
                position(log(1.2), log(9.6)), 'cursor', ['C', 'D'])
        ],
        practice: {
            problem: 'A quantity rises 30%, then falls 30%. Find m = 1.3 × 0.7 and Δ = 100(m − 1)%.',
            intro: 'Use A to find p² for p = 0.3, then check the predicted multiplier by multiplying 1.3 by 0.7 on C/D. Form additions, subtractions and the final percentage mentally.',
            note: ESTIMATE_NOTE, start: position(),
            steps: [
                practise('Find the shortcut’s square', 'Move to D 3. Divide the A reading by 100 to obtain p².',
                    at(3), ['cursor'], 'A reads 9, so p² = 0.09. The shortcut predicts multiplier 1 − 0.09.', ['A', 'D']),
                practise('Mark the rise multiplier', 'Move to D 1.3 to begin the direct check.',
                    at(1.3), ['cursor'], 'The rise multiplier is marked.', ['D']),
                practise('Align C 1', 'Move C’s left-hand 1 beneath the held hairline at D 1.3.',
                    position(log(1.3), log(1.3)), ['slideOffset', 'cursor'], 'The multiplication is ready.', ['C', 'D'], 'slide'),
                practise('Read the fall multiplier', 'Move to C 7, representing 0.7. Interpret D with the appropriate decimal place.',
                    position(log(1.3), log(9.1)), ['slideOffset', 'cursor'], 'Correct: D 9.1 represents multiplier 0.91. The net change is a 9% decrease, agreeing with p² = 0.09.', ['C', 'D'])
            ]
        }
    }
]);
