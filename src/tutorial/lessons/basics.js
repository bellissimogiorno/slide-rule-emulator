/** The first four lessons retain their original demonstrations and practice. */
import { log, position, move, exercise, sectionLessons } from '#tutorial/lesson-data.js';

export const BASIC_LESSONS = sectionLessons('basics', [
    {
        id: 'read',
        title: 'Read the hairline',
        summary: 'Use the cursor to read a number on the fixed D scale.',
        problem: 'Locate 2 and 3 on D.',
        start: position(),
        steps: [
            move('Find 2 on D',
                'The lower D scale stays still. Watch the cursor move: its vertical hairline now crosses 2 on D.',
                position(0, log(2)), 'cursor', ['D']),
            move('Follow the hairline to 3',
                'The hairline now crosses 3. Read where the line meets the ticks. The numbers become closer together towards the right; their spacing is not uniform.',
                position(0, log(3)), 'cursor', ['D'])
        ],
        practice: {
            problem: 'Locate 4 on D.',
            intro: 'Now move the cursor yourself. Drag the red hairline, or focus the Cursor grip and use the arrow keys.',
            start: position(),
            steps: [
                exercise('Read 4 on D', 'Move the hairline to 4 on the fixed D scale.',
                    position(0, log(4)), ['cursor'],
                    'Correct: the hairline is close to 4 on D. A slide rule gives approximate readings.')
            ]
        }
    },
    {
        id: 'multiply',
        title: 'Multiply 2 × 3',
        summary: 'Align the sliding C scale with D, then read the product.',
        problem: 'Solve x = 2 × 3.',
        start: position(),
        steps: [
            move('Mark the first number',
                'First put the hairline at 2 on D. The cursor marks where the calculation begins.',
                position(0, log(2)), 'cursor'),
            move('Align C 1 with D 2',
                'C is on the moving slide. Watch its left-hand 1 move under the hairline, directly above 2 on D.',
                position(log(2), log(2)), 'slide'),
            move('Move to 3 on C',
                'Keep the slide still and move the hairline to 3 on C. Directly below it, D reads 6: 2 × 3 = 6.',
                position(log(2), log(6)), 'cursor')
        ],
        practice: {
            problem: 'Solve x = 2 × 3.',
            intro: 'Repeat 2 × 3. Set the slide first, then move only the cursor.',
            start: position(0, log(2)),
            steps: [
                exercise('Set the slide',
                    'The hairline marks 2 on D. Move the slide until the left-hand 1 on C lines up with it.',
                    position(log(2), log(2)), ['slideOffset'],
                    'The scales are aligned. Keep the slide here for the next step.'),
                exercise('Read the product',
                    'Move the hairline to 3 on C without changing the slide. Read D beneath it.',
                    position(log(2), log(6)), ['slideOffset', 'cursor'],
                    'Correct: about 3 on C lines up with about 6 on D. The product is 6.')
            ]
        }
    },
    {
        id: 'divide',
        title: 'Divide 6 ÷ 2',
        summary: 'Align the divisor under the hairline, then read at C 1.',
        problem: 'Solve x = 6 ÷ 2.',
        start: position(),
        steps: [
            move('Mark the number to divide',
                'Put the hairline at 6 on D. This is the number we are dividing.',
                position(0, log(6)), 'cursor'),
            move('Bring C 2 to the hairline',
                'Keep the cursor at D 6. Move the slide until 2 on C is directly under the same hairline.',
                position(log(3), log(6)), 'slide'),
            move('Read at C 1',
                'Keep the slide still. Move the hairline to the left-hand 1 on C. D reads 3: 6 ÷ 2 = 3.',
                position(log(3), log(3)), 'cursor')
        ],
        practice: {
            problem: 'Solve x = 6 ÷ 2.',
            intro: 'Repeat 6 ÷ 2. Use the cursor to hold 6 while you align the slide.',
            start: position(),
            steps: [
                exercise('Mark 6 on D', 'Move the hairline to 6 on D.',
                    position(0, log(6)), ['cursor'],
                    'The hairline marks 6. Leave it here while you move the slide.'),
                exercise('Align the divisor',
                    'Move the slide until 2 on C is under the hairline at 6 on D.',
                    position(log(3), log(6)), ['slideOffset', 'cursor'],
                    'C 2 is aligned with D 6. Keep the slide here.', 'slide'),
                exercise('Read the quotient',
                    'Move the hairline to the left-hand 1 on C. Read D beneath it.',
                    position(log(3), log(3)), ['slideOffset', 'cursor'],
                    'Correct: C 1 lines up with about 3 on D. The quotient is 3.')
            ]
        }
    },
    {
        id: 'right-index',
        title: 'Multiply beyond the end',
        summary: 'Use the right-hand index for 4 × 3, then choose the decimal place.',
        problem: 'Solve x = 4 × 3.',
        start: position(),
        steps: [
            move('Mark 4 on D',
                'Put the hairline at 4 on D. We want to multiply this by 3.',
                position(0, log(4)), 'cursor'),
            move('Notice the end of the rule',
                'With C’s left-hand 1 above D 4, the 3 on C lies beyond the right end of D. This alignment will not let us read the product.',
                position(log(4), log(4)), 'slide'),
            move('Use C’s right-hand 10',
                'Move the slide left instead. Its right-hand 10 now lines up with 4 on D. The 3 on C is back within the rule.',
                position(log(4) - 1, log(4)), 'slide', ['C', 'D'], 1800),
            move('Read 1.2, interpret it as 12',
                'Move the hairline to 3 on C. D reads 1.2. Since 4 × 3 is between 10 and 20, the answer is 12. Choose the decimal place by estimation.',
                position(log(4) - 1, log(1.2)), 'cursor')
        ],
        practice: {
            problem: 'Solve x = 4 × 3.',
            intro: 'Repeat 4 × 3 using the right-hand end of C. Keep the estimate in mind as you read the result.',
            note: 'The check verifies alignment; choose the decimal place yourself.',
            start: position(0, log(4)),
            steps: [
                exercise('Use the right-hand index',
                    'The hairline marks 4 on D. Move the slide left until its right-hand 10 on C lines up with it.',
                    position(log(4) - 1, log(4)), ['slideOffset'],
                    'The right-hand index is aligned with D 4. Keep the slide here.'),
                exercise('Read and estimate',
                    'Move the hairline to 3 on C. Read D, then use the estimate 10 to 20 to place the decimal point.',
                    position(log(4) - 1, log(1.2)), ['slideOffset', 'cursor'],
                    'Correct: the hairline reads about 1.2 on D. For 4 × 3, that means 12.')
            ]
        }
    }
]);
