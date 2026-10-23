import { log, position, move, exercise, sectionLessons, ESTIMATE_NOTE } from '#tutorial/lesson-data.js';

export const RATIO_LESSONS = sectionLessons('ratios', [
    {
        id: 'proportion', title: 'Solve a proportion',
        summary: 'If 3 items need 5 units, find the units needed for 4 or 5 items.',
        problem: '3 items need 5 units. Find the units needed by 4 and 5 items, assuming direct proportion.',
        start: position(),
        steps: [
            move('Mark the known amount', 'Assume the amount is proportional to the number of items. Put the hairline at 5 on D: 3 items need 5 units.',
                position(0, log(5)), 'cursor'),
            move('Set the known ratio', 'Move C 3 under the hairline at D 5. C now represents items and D represents units; the same alignment keeps their ratio constant.',
                position(log(5 / 3), log(5)), 'slide'),
            move('Read the amount for 4 items', 'Move to C 4. D reads about 6.667 units. The fixed slide alignment gives the proportional amount for any item count within range.',
                position(log(5 / 3), log(20 / 3)), 'cursor'),
            move('Read the amount for 5 items', 'Without changing the slide, move to C 5. D reads about 8.333 units. The same ratio has answered a second question.',
                position(log(5 / 3), log(25 / 3)), 'cursor')
        ],
        practice: {
            problem: '4 items need 6 units. Find the units needed by 6 items, assuming direct proportion.',
            intro: 'Now 4 items need 6 units. Find the amount for 6 items, assuming the same proportional relationship.',
            start: position(0, log(6)),
            steps: [
                exercise('Set the known proportion', 'The hairline marks D 6 units. Bring C 4 items to it.',
                    position(log(6 / 4), log(6)), ['slideOffset'], 'The ratio for this new problem is set.'),
                exercise('Find the amount for 6 items', 'Keep the slide still and move the cursor to C 6. Read the corresponding units on D.',
                    position(log(6 / 4), log(9)), ['slideOffset', 'cursor'], 'Correct: 6 items need about 9 units.')
            ]
        }
    },
    {
        id: 'inches-to-centimetres', title: 'Convert inches to centimetres',
        summary: 'Use 1 inch = 2.54 centimetres as a constant multiplication setting.',
        problem: 'Convert 2 in and 3 in to centimetres (1 in = 2.54 cm).',
        start: position(),
        steps: [
            move('Mark the conversion factor', 'One inch is exactly 2.54 centimetres. Put the hairline at 2.54 on D.',
                position(0, log(2.54)), 'cursor'),
            move('Set inches against centimetres', 'Align C 1 with D 2.54. C now reads inches and D reads centimetres.',
                position(log(2.54), log(2.54)), 'slide'),
            move('Convert 2 inches', 'Move to C 2. D reads 5.08, so 2 inches is 5.08 centimetres.',
                position(log(2.54), log(5.08)), 'cursor'),
            move('Convert 3 inches', 'Leave the slide alone and move to C 3. D reads 7.62 centimetres.',
                position(log(2.54), log(7.62)), 'cursor')
        ],
        practice: {
            problem: 'Convert 3.5 in to centimetres (1 in = 2.54 cm).',
            intro: 'Convert 3.5 inches to centimetres. The hairline begins at the conversion factor on D.',
            start: position(0, log(2.54)),
            steps: [
                exercise('Set the conversion', 'Align C’s left-hand 1 with D 2.54 at the hairline.',
                    position(log(2.54), log(2.54)), ['slideOffset'], 'The inch-to-centimetre conversion is set.'),
                exercise('Convert 3.5 inches', 'Move to C 3.5 and read the centimetres on D.',
                    position(log(2.54), log(8.89)), ['slideOffset', 'cursor'], 'Correct: 3.5 inches is about 8.89 centimetres. The conversion factor is exact; a slide-rule reading is approximate.')
            ]
        }
    },
    {
        id: 'chained-calculation', title: 'Chain multiplication and division',
        summary: 'Calculate (2 × 3) ÷ 4 without resetting the rule between operations.',
        problem: 'Solve x = (2 × 3) ÷ 4.',
        start: position(),
        steps: [
            move('Start the multiplication', 'Put the hairline at 2 on D. We will multiply by 3, then divide the result by 4.',
                position(0, log(2)), 'cursor'),
            move('Align C 1 with D 2', 'Bring C’s left-hand 1 to the hairline to set the multiplication.',
                position(log(2), log(2)), 'slide'),
            move('Keep the intermediate result', 'Move to C 3. D reads 6. Leave the cursor here: it now remembers the intermediate result.',
                position(log(2), log(6)), 'cursor'),
            move('Align the next divisor', 'Keep the cursor at D 6. Move C 4 to the same hairline to divide the intermediate result by 4.',
                position(log(6 / 4), log(6)), 'slide'),
            move('Read the final result', 'Move the cursor to C’s left-hand 1. D reads 1.5, so (2 × 3) ÷ 4 = 1.5.',
                position(log(6 / 4), log(1.5)), 'cursor')
        ],
        practice: {
            problem: 'Solve x = (3 × 2) ÷ 5.',
            intro: 'Try (3 × 2) ÷ 5. Keep the intermediate result under the cursor while changing the slide alignment.',
            start: position(0, log(3)),
            steps: [
                exercise('Set the multiplication', 'The hairline marks D 3. Align C’s left-hand 1 with it.',
                    position(log(3), log(3)), ['slideOffset'], 'Now multiply by 2 using the cursor.'),
                exercise('Keep the product', 'Move to C 2 and keep the hairline at the resulting D reading.',
                    position(log(3), log(6)), ['slideOffset', 'cursor'], 'The intermediate product is about 6. Leave the cursor here.'),
                exercise('Set the divisor', 'Bring C 5 to the hairline at D 6 without moving the cursor.',
                    position(log(6 / 5), log(6)), ['slideOffset', 'cursor'], 'The division alignment is set.', 'slide'),
                exercise('Read at C 1', 'Move to C’s left-hand 1 and read the final result on D.',
                    position(log(6 / 5), log(1.2)), ['slideOffset', 'cursor'], 'Correct: (3 × 2) ÷ 5 is about 1.2.')
            ]
        }
    },
    {
        id: 'reciprocals', title: 'Read reciprocals on CI', layout: 'reciprocal',
        summary: 'Compare D with the reversed CI scale to find 1 divided by a number.',
        problem: 'Find x = 1 ÷ 2 and y = 1 ÷ 4.',
        start: position(),
        steps: [
            move('Find the reciprocal of 2', 'The slide is aligned. At D 2, the reversed CI scale reads 5. This CI scale shows 10 divided by D, so divide its reading by ten: 1 ÷ 2 = 0.5.',
                position(0, log(2)), 'cursor', ['CI', 'D']),
            move('Find the reciprocal of 4', 'Move to D 4 without shifting the slide. CI reads 2.5, which represents 0.25 for the reciprocal. Larger D values have smaller reciprocals.',
                position(0, log(4)), 'cursor', ['CI', 'D'])
        ],
        practice: {
            problem: 'Solve x = 1 ÷ 5.',
            intro: 'Find 1 ÷ 5 using CI. Keep the slide aligned at zero offset.',
            note: ESTIMATE_NOTE, start: position(),
            steps: [
                exercise('Read opposite D 5', 'Leave the slide aligned and move the hairline to 5 on D. Read CI and divide that reading by ten.',
                    position(0, log(5)), ['slideOffset', 'cursor'], 'Correct: CI reads about 2 opposite D 5, giving 1 ÷ 5 = 0.2.')
            ]
        }
    }
]);
