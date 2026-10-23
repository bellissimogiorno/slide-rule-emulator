import { log, position, move, exercise, sectionLessons, ESTIMATE_NOTE } from '#tutorial/lesson-data.js';

export const ARITHMETIC_LESSONS = sectionLessons('arithmetic', [
    {
        id: 'decimal-multiply', title: 'Multiply decimal numbers',
        summary: 'Calculate 2.4 × 3, then use an estimate to read the result.',
        problem: 'Solve x = 2.4 × 3.',
        start: position(),
        steps: [
            move('Mark 2.4 on D',
                'Put the hairline at 2.4 on D, between 2 and 3. We will multiply it by 3.',
                position(0, log(2.4)), 'cursor'),
            move('Set the multiplication alignment',
                'Bring C’s left-hand 1 to the hairline at D 2.4. The same method works for decimal numbers.',
                position(log(2.4), log(2.4)), 'slide'),
            move('Read 7.2 at C 3',
                'Move the hairline to C 3. D reads 7.2. This agrees with the estimate 2 to 3 times 3 is 6 to 9.',
                position(log(2.4), log(7.2)), 'cursor')
        ],
        practice: {
            problem: 'Solve x = 1.6 × 4.',
            intro: 'Try 1.6 × 4. The hairline starts at 1.6 on D; estimate the answer before reading it.',
            note: ESTIMATE_NOTE, start: position(0, log(1.6)),
            steps: [
                exercise('Align C 1 with D 1.6', 'Move the slide until C’s left-hand 1 is at the hairline.',
                    position(log(1.6), log(1.6)), ['slideOffset'], 'The multiplication alignment is set.'),
                exercise('Read at C 4', 'Keep the slide still and move the hairline to 4 on C. Read D beneath it.',
                    position(log(1.6), log(6.4)), ['slideOffset', 'cursor'],
                    'Correct: D reads about 6.4, so 1.6 × 4 = 6.4.')
            ]
        }
    },
    {
        id: 'small-product', title: 'Multiply numbers below one',
        summary: 'Use 6 and 4 to calculate 0.6 × 0.4, then restore the decimal place.',
        problem: 'Solve x = 0.6 × 0.4.',
        start: position(),
        steps: [
            move('Use the significant digits',
                'For 0.6 × 0.4, begin with 6 and 4. Put the hairline at 6 on D. The answer must be less than 0.6.',
                position(0, log(6)), 'cursor'),
            move('Use C’s right-hand 10',
                'Align C’s right-hand 10 with D 6, so C 4 will remain within the rule.',
                position(log(6) - 1, log(6)), 'slide'),
            move('Read the digits, then estimate',
                'At C 4, D reads 2.4. Six times four is 24; the original factors were each divided by ten. Therefore 0.6 × 0.4 = 0.24.',
                position(log(6) - 1, log(2.4)), 'cursor')
        ],
        practice: {
            problem: 'Solve x = 0.7 × 0.4.',
            intro: 'Try 0.7 × 0.4. The hairline marks D 7; work with 7 and 4, then choose the decimal place.',
            note: ESTIMATE_NOTE, start: position(0, log(7)),
            steps: [
                exercise('Use the right-hand index', 'Align C’s right-hand 10 with D 7 at the hairline.',
                    position(log(7) - 1, log(7)), ['slideOffset'], 'C 10 is aligned with D 7.'),
                exercise('Read at C 4', 'Keep the slide still and move to 4 on C. Interpret the D reading for 0.7 × 0.4.',
                    position(log(7) - 1, log(2.8)), ['slideOffset', 'cursor'],
                    'Correct: D reads about 2.8. The original decimal calculation gives 0.28.')
            ]
        }
    },
    {
        id: 'small-quotient', title: 'Divide to get less than one',
        summary: 'Calculate 2 ÷ 5 by reading the result at C’s right-hand 10.',
        problem: 'Solve x = 2 ÷ 5.',
        start: position(),
        steps: [
            move('Mark the dividend', 'Put the hairline at 2 on D. Dividing 2 by 5 will give a result below one.',
                position(0, log(2)), 'cursor'),
            move('Align C 5 with D 2', 'Leave the cursor at D 2 and bring 5 on C to the hairline.',
                position(log(2 / 5), log(2)), 'slide'),
            move('Read at C 10',
                'C’s left-hand 1 is off the rule, so move to its right-hand 10. D reads 4. Because 0.5 < 2 < 5, dividing by 5 puts the quotient between 0.1 and 1. Read the result as 0.4.',
                position(log(2 / 5), log(4)), 'cursor')
        ],
        practice: {
            problem: 'Solve x = 3 ÷ 4.',
            intro: 'Try 3 ÷ 4. Since 2 < 3 < 4, the quotient lies between 0.5 and 1. Use the right-hand 10 on C to read it.',
            note: ESTIMATE_NOTE, start: position(),
            steps: [
                exercise('Mark 3 on D', 'Move the hairline to 3 on the fixed D scale.',
                    position(0, log(3)), ['cursor'], 'Keep the hairline at D 3 while aligning the divisor.'),
                exercise('Align C 4 with D 3', 'Move C 4 to the hairline without changing the cursor.',
                    position(log(3 / 4), log(3)), ['slideOffset', 'cursor'],
                    'C 4 is aligned with D 3. Keep the slide here.', 'slide'),
                exercise('Read at the right-hand 10', 'Move the hairline to C 10 and read D. Use the estimate 0.5 to 1 to place the decimal point.',
                    position(log(3 / 4), log(7.5)), ['slideOffset', 'cursor'],
                    'Correct: D reads about 7.5; 3 ÷ 4 = 0.75.')
            ]
        }
    },
    {
        id: 'repeated-products', title: 'Reuse a multiplication setting',
        summary: 'Set a factor once, then read several products without moving the slide.',
        problem: 'Find x = 2.5 × 2 and y = 2.5 × 3.',
        start: position(),
        steps: [
            move('Mark the common factor', 'Put the hairline at 2.5 on D. We will multiply 2.5 by more than one number.',
                position(0, log(2.5)), 'cursor'),
            move('Set C 1 over D 2.5', 'Equal ratios span equal distances on C and D. Align C 1 with D 2.5. Where the scales overlap, each D reading is 2.5 times the C reading.',
                position(log(2.5), log(2.5)), 'slide'),
            move('Read the first product', 'Move to C 2. D reads 5, so 2.5 × 2 = 5.',
                position(log(2.5), log(5)), 'cursor'),
            move('Read another product', 'Move only the cursor to C 3. D now reads 7.5: the same setting gives 2.5 × 3 = 7.5.',
                position(log(2.5), log(7.5)), 'cursor')
        ],
        practice: {
            problem: 'Find x = 1.5 × 4 and y = 1.5 × 6.',
            intro: 'Set 1.5 as the common factor, then find 1.5 × 4 and 1.5 × 6.',
            start: position(0, log(1.5)),
            steps: [
                exercise('Set the common factor', 'The hairline marks D 1.5. Align C’s left-hand 1 with it.',
                    position(log(1.5), log(1.5)), ['slideOffset'], 'Leave the slide at this setting for both readings.'),
                exercise('Read 1.5 × 4', 'Move the cursor to C 4 and read D.',
                    position(log(1.5), log(6)), ['slideOffset', 'cursor'], 'Correct: the first product is about 6.'),
                exercise('Read 1.5 × 6', 'Keep the same slide setting and move the cursor to C 6.',
                    position(log(1.5), log(9)), ['slideOffset', 'cursor'], 'Correct: the second product is about 9.')
            ]
        }
    }
]);
