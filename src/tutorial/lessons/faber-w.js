/** Faber-Castell 2/83N W arithmetic follows the manufacturer's instructions,
 * "Calculations with the Root Scales W", printed pp. 20–22. The dividing
 * index is identified by its mathematical value, not its historical red ink.
 * The geometric-mean example applies those multiplication/root operations.
 */
import { log, position, move, exercise, sectionLessons, ESTIMATE_NOTE } from '#tutorial/lesson-data.js';

const lower = value => 2 * log(value);
const upper = value => 2 * log(value) - 1;
const practise = (title, text, target, required, success, readings,
    focus = required.length === 1 && required[0] === 'slideOffset' ? 'slide' : 'cursor') =>
    ({ ...exercise(title, text, target, required, success, focus), readings });

export const FABER_W_LESSONS = sectionLessons('faber-w', [
    {
        id: 'faber-w-read', title: 'Read the two halves of a long W scale', layout: 'faber-w',
        problem: '√4 = ?; √40 = ?; √25 = ?; 3² = ?',
        summary: 'Connect W₁ and W₂ to D, and compare their aligned moving copies.',
        start: position(),
        steps: [
            move('Compare the two W ranges',
                'Move to D 4. W₁ reads √4 = 2; W₂ reads √40, about 6.325. With the slide aligned, W₁′ and W₂′ agree with the fixed rows. W₁ covers 1 to √10 and W₂ continues from √10 to 10: one logarithmic decade occupies two rail lengths, giving wider spacing for reading and setting.',
                position(0, log(4)), 'cursor', ['W1', 'W2', 'W1P', 'W2P', 'D']),
            move('Choose the branch for √25',
                'Move to D 2.5. For √25, use W₂ because its radicand is ten times D: it reads 5. W₂′ also reads 5 while aligned. W₁ here would give √2.5 instead. The branch choice matters even though the hairline is the same.',
                position(0, log(2.5)), 'cursor', ['W1', 'W2', 'W2P', 'D']),
            move('Reverse the comparison to square 3',
                'Move to 3 on W₁. D reads 9, giving 3² = 9. For a value on W₂, its square would be ten times the D reading. Wider W spacing helps you position the input; interpolation still limits the digits you can read.',
                position(0, lower(3)), 'cursor', ['W1', 'D'])
        ],
        practice: {
            problem: '√6.25 = ?; √62.5 = ?; 7² = ?',
            intro: 'Keep the slide aligned for the first comparison. Use the two W ranges to find the roots, then reverse W₂ to square 7.',
            note: ESTIMATE_NOTE,
            start: position(),
            steps: [
                practise('Read both roots at D 6.25', 'Move to D 6.25. Read W₁ for √6.25 and W₂ for √62.5. Confirm that their aligned primed copies agree.',
                    position(0, log(6.25)), ['slideOffset', 'cursor'],
                    'Correct: W₁ and W₁′ read 2.5; W₂ and W₂′ read about 7.906. These are √6.25 and √62.5 respectively.', ['W1', 'W2', 'W1P', 'W2P', 'D']),
                practise('Square 7 using W₂', 'Move to 7 on fixed W₂. Read D and multiply that reading by ten.',
                    position(0, upper(7)), ['cursor'],
                    'Correct: D reads about 4.9, so 7² = 49.', ['W2', 'D'])
            ]
        }
    },
    {
        id: 'faber-w-multiply', title: 'Multiply with the W₁′ unit index', layout: 'faber-w',
        problem: '1.5 × 4 = ?',
        summary: 'Set W₁′ 1 at the first factor and read the product beside the second factor.',
        start: position(),
        steps: [
            move('Mark the first factor on W₁', 'Move to 1.5 on fixed W₁. The W scales spread each logarithmic distance twice as far as ordinary C and D.',
                position(0, lower(1.5)), 'cursor', ['W1']),
            move('Align W₁′ 1', 'Keep the hairline at W₁ 1.5 and bring W₁′ 1, at the left-hand end of its moving row, under it. This sets multiplication by 1.5 on the W pairs.',
                position(lower(1.5), lower(1.5)), 'slide', ['W1P', 'W1']),
            move('Read beside W₂′ 4', 'The second factor 4 is on W₂′. Move to it and read 6 on adjacent fixed W₂: 1.5 × 4 = 6. With the ordinary 1 index, use the fixed W row beside the moving row that carries the second factor.',
                position(lower(1.5), upper(6)), 'cursor', ['W2P', 'W2'])
        ],
        practice: {
            problem: '1.6 × 4.5 = ?',
            intro: 'Set multiplication by 1.6 with W₁′ 1, then use W₂′ for the second factor.',
            note: ESTIMATE_NOTE,
            start: position(),
            steps: [
                practise('Mark W₁ 1.6', 'Move the hairline to 1.6 on fixed W₁.',
                    position(0, lower(1.6)), ['cursor'], 'The first factor is marked.', ['W1']),
                practise('Align W₁′ 1', 'Bring W₁′ 1 to the held hairline at W₁ 1.6.',
                    position(lower(1.6), lower(1.6)), ['slideOffset', 'cursor'], 'The W multiplication is set. Keep the slide here.', ['W1P', 'W1'], 'slide'),
                practise('Read beside W₂′ 4.5', 'Move to 4.5 on W₂′ and read the adjacent fixed W₂ row.',
                    position(lower(1.6), upper(7.2)), ['slideOffset', 'cursor'], 'Correct: W₂ reads about 7.2, so 1.6 × 4.5 = 7.2.', ['W2P', 'W2'])
            ]
        }
    },
    {
        id: 'faber-w-cross-multiply', title: 'Change W index and cross to the other row', layout: 'faber-w',
        problem: '1.8 × 7.5 = ?',
        summary: 'Use the √10 dividing index when the ordinary W unit setting would run off the rule.',
        start: position(),
        steps: [
            move('Mark W₁ 1.8', 'Move to 1.8 on fixed W₁ for 1.8 × 7.5. Estimate the product as greater than ten.',
                position(0, lower(1.8)), 'cursor', ['W1']),
            move('See the limit of the ordinary index', 'Put W₁′ 1 under the hairline. At this setting, W₂′ 7.5 would lie beyond the fixed rule’s right-hand end. We need a different index before setting that factor.',
                position(lower(1.8), lower(1.8)), 'slide', ['W1P', 'W1']),
            move('Use W₁′’s right-hand √10 index', 'Hold the cursor still and bring W₁′’s right-hand end, √10, under it. The endpoint is displayed as 3.162. The manufacturer calls this the dividing index. With this index, read the result on the opposite fixed W row rather than the row adjacent to the second factor.',
                position(lower(1.8) - 1, lower(1.8)), 'slide', ['W1P', 'W1']),
            move('Read W₁ opposite W₂′ 7.5', 'Move to 7.5 on W₂′. Read the opposite fixed row W₁, which shows 1.35. Your estimate places the decimal: 1.8 × 7.5 = 13.5. Reading adjacent W₂ here would introduce an incorrect factor of √10.',
                position(lower(1.8) - 1, lower(1.35)), 'cursor', ['W2P', 'W1'])
        ],
        practice: {
            problem: '1.9 × 8 = ?',
            intro: 'Use W₁′’s right-hand √10 index at the first factor, then cross from W₂′ to fixed W₁ for the result.',
            note: ESTIMATE_NOTE,
            start: position(),
            steps: [
                practise('Mark W₁ 1.9', 'Move to 1.9 on fixed W₁.',
                    position(0, lower(1.9)), ['cursor'], 'The first factor is marked.', ['W1']),
                practise('Align the right-hand √10 index', 'Bring W₁′’s right-hand 3.162 endpoint to the held hairline at W₁ 1.9.',
                    position(lower(1.9) - 1, lower(1.9)), ['slideOffset', 'cursor'], 'The dividing index is aligned. Keep the slide here.', ['W1P', 'W1'], 'slide'),
                practise('Cross from W₂′ 8 to W₁', 'Move to 8 on W₂′. Read fixed W₁ and choose the decimal place from your estimate.',
                    position(lower(1.9) - 1, lower(1.52)), ['slideOffset', 'cursor'], 'Correct: W₁ reads about 1.52, giving 1.9 × 8 = 15.2.', ['W2P', 'W1'])
            ]
        }
    },
    {
        id: 'faber-w-divide', title: 'Divide on adjacent W rows', layout: 'faber-w',
        problem: '6 ÷ 4 = ?',
        summary: 'Align dividend and divisor on a matching W pair, then read at W₁′ 1.',
        start: position(),
        steps: [
            move('Mark the dividend on W₂', 'Move the hairline to 6 on fixed W₂ for 6 ÷ 4.',
                position(0, upper(6)), 'cursor', ['W2']),
            move('Align W₂′ 4 with W₂ 6', 'Keep the cursor at the dividend. Bring 4 on moving W₂′ under it. The operands are now aligned on adjacent W₂ and W₂′.',
                position(upper(6) - upper(4), upper(6)), 'slide', ['W2P', 'W2']),
            move('Read at W₁′ 1', 'Move to W₁′’s left-hand 1. Fixed W₁ reads 1.5, so 6 ÷ 4 = 1.5. This reverses the ordinary-index W multiplication.',
                position(upper(6) - upper(4), lower(1.5)), 'cursor', ['W1P', 'W1'])
        ],
        practice: {
            problem: '7.5 ÷ 3.5 = ?',
            intro: 'Align both operands on W₂ and W₂′, then read the quotient at W₁′ 1.',
            note: ESTIMATE_NOTE,
            start: position(),
            steps: [
                practise('Mark W₂ 7.5', 'Move the hairline to 7.5 on fixed W₂.',
                    position(0, upper(7.5)), ['cursor'], 'The dividend is marked.', ['W2']),
                practise('Align W₂′ 3.5', 'Bring 3.5 on moving W₂′ to the held hairline at W₂ 7.5.',
                    position(upper(7.5) - upper(3.5), upper(7.5)), ['slideOffset', 'cursor'], 'The division is set. Keep the slide here.', ['W2P', 'W2'], 'slide'),
                practise('Read at W₁′ 1', 'Move to W₁′’s left-hand 1 and read the quotient on fixed W₁.',
                    position(upper(7.5) - upper(3.5), lower(7.5 / 3.5)), ['slideOffset', 'cursor'], 'Correct: W₁ reads about 2.143, so 7.5 ÷ 3.5 ≈ 2.143.', ['W1P', 'W1'])
            ]
        }
    },
    {
        id: 'faber-w-cross-divide', title: 'Divide across the two W ranges', layout: 'faber-w',
        problem: '13.5 ÷ 7.5 = ?',
        summary: 'When the operands use opposite W branches, read at the √10 dividing index.',
        start: position(),
        steps: [
            move('Represent 13.5 on W₁', 'Put the hairline at W₁ 1.35, interpreted as 13.5. The quotient 13.5 ÷ 7.5 should be between one and two; keep that estimate for the decimal place.',
                position(0, lower(1.35)), 'cursor', ['W1']),
            move('Set the divisor on W₂′', 'Bring W₂′ 7.5 to the held hairline. The dividend is on W₁ and the divisor on the opposite moving branch W₂′, so use the √10 dividing index for the answer.',
                position(lower(1.35) - upper(7.5), lower(1.35)), 'slide', ['W2P', 'W1']),
            move('Read at W₁′’s right-hand √10', 'Move to W₁′’s right-hand 3.162 endpoint. Fixed W₁ reads 1.8, agreeing with the estimate: 13.5 ÷ 7.5 = 1.8. Use this W row and index together; the other row at the same hairline gives a different value.',
                position(lower(1.35) - upper(7.5), lower(1.8)), 'cursor', ['W1P', 'W1'])
        ],
        practice: {
            problem: '17.6 ÷ 8 = ?',
            intro: 'Represent the dividend on W₁ and align the divisor on W₂′. Read the quotient at W₁′’s right-hand √10 index.',
            note: ESTIMATE_NOTE,
            start: position(),
            steps: [
                practise('Mark the dividend as W₁ 1.76', 'Move to W₁ 1.76, interpreted as 17.6.',
                    position(0, lower(1.76)), ['cursor'], 'The dividend is marked. The quotient should be a little above two.', ['W1']),
                practise('Align W₂′ 8', 'Bring W₂′ 8 to the held hairline at W₁ 1.76.',
                    position(lower(1.76) - upper(8), lower(1.76)), ['slideOffset', 'cursor'], 'The opposite-branch division is set. Keep the slide here.', ['W2P', 'W1'], 'slide'),
                practise('Read at the dividing index', 'Move to W₁′’s right-hand 3.162 endpoint and read the quotient on fixed W₁.',
                    position(lower(1.76) - upper(8), lower(2.2)), ['slideOffset', 'cursor'], 'Correct: W₁ reads about 2.2, giving 17.6 ÷ 8 = 2.2.', ['W1P', 'W1'])
            ]
        }
    },
    {
        id: 'faber-w-geometric-mean', title: 'Find a geometric mean with W', layout: 'faber-w',
        problem: '√(2 × 4.5) = ?',
        summary: 'Multiply on W, then transfer the product to D to read its square root.',
        start: position(),
        steps: [
            move('Start the product', 'The geometric mean of two positive numbers is the square root of their product. To find √(2 × 4.5), first mark W₁ 2.',
                position(0, lower(2)), 'cursor', ['W1']),
            move('Set multiplication by 2', 'Bring W₁′ 1 to the held hairline at W₁ 2.',
                position(lower(2), lower(2)), 'slide', ['W1P', 'W1']),
            move('Read the product on W₂', 'Move to W₂′ 4.5. Adjacent fixed W₂ reads 9, the product of 2 and 4.5. We now need the square root of that product.',
                position(lower(2), upper(9)), 'cursor', ['W2P', 'W2']),
            move('Transfer 9 to D and take its root', 'The multiplication is finished. Move the hairline to D 9 and read fixed W₁: it gives 3. Therefore √(2 × 4.5) = 3. This is a deliberate transfer of the product from W₂ to D; keeping the cursor at W₂ 9 would not take its square root.',
                position(lower(2), log(9)), 'cursor', ['W1', 'D'])
        ],
        practice: {
            problem: '√(1.6 × 4) = ?',
            intro: 'Multiply the two positive numbers on W, then transfer their product to D to take its square root on fixed W₁.',
            note: ESTIMATE_NOTE,
            start: position(),
            steps: [
                practise('Mark W₁ 1.6', 'Move to 1.6 on fixed W₁.',
                    position(0, lower(1.6)), ['cursor'], 'The first factor is marked.', ['W1']),
                practise('Align W₁′ 1', 'Bring W₁′ 1 to the held hairline at W₁ 1.6.',
                    position(lower(1.6), lower(1.6)), ['slideOffset', 'cursor'], 'The multiplication is set. Keep the slide here.', ['W1P', 'W1'], 'slide'),
                practise('Read the product at W₂′ 4', 'Move to W₂′ 4 and read adjacent fixed W₂.',
                    position(lower(1.6), upper(6.4)), ['slideOffset', 'cursor'], 'W₂ reads about 6.4, the product 1.6 × 4. Next find its square root.', ['W2P', 'W2']),
                practise('Transfer the product to D', 'Move the hairline to D 6.4. Use fixed W₁ to read the square root of the product.',
                    position(lower(1.6), log(6.4)), ['cursor'], 'Correct: W₁ reads about 2.530. The geometric mean √(1.6 × 4) is about 2.530.', ['W1', 'D'])
            ]
        }
    }
]);
