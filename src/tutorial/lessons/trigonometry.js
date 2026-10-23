import { log, position, move, exercise, sectionLessons, ESTIMATE_NOTE } from '#tutorial/lesson-data.js';

// S and T₁ are fixed in these teaching layouts. They put 10 times the sine or
// tangent beneath the angle on D; their graduations are labelled in degrees.
const sine30 = log(5), sine60 = log(5 * Math.sqrt(3)), sine45 = log(5 * Math.SQRT2);
const tangent30 = log(10 / Math.sqrt(3)), tangent20 = log(10 * Math.tan(20 * Math.PI / 180));

export const TRIGONOMETRY_LESSONS = sectionLessons('trigonometry', [
    {
        id: 'sine', title: 'Read a sine', layout: 'sine',
        summary: 'Read sine values from the degree-labelled S scale and D.',
        problem: 'Find x = sin 30° and y = sin 60°.',
        start: position(),
        steps: [
            move('Find 30° on S',
                'Move the hairline to 30° on the fixed S scale. D reads 5. Divide that reading by ten: sin 30° = 0.5.',
                position(0, sine30), 'cursor', ['S', 'D']),
            move('Read sin 60°',
                'At 60° on S, D reads about 8.660. Divide by ten again: sin 60° is about 0.8660. Both angles are in degrees.',
                position(0, sine60), 'cursor', ['S', 'D'])
        ],
        practice: {
            problem: 'Find x = sin 45°.',
            intro: 'Find sin 45°. Move the cursor to 45° on S, then divide the D reading by ten.',
            note: 'The check verifies alignment; interpret the D reading yourself.',
            start: position(),
            steps: [
                exercise('Read sin 45°', 'Move the hairline to 45° on the fixed S scale. Read D directly below it.',
                    position(0, sine45), ['cursor'],
                    'Correct: D reads about 7.071. Therefore sin 45° is about 0.7071.')
            ]
        }
    },
    {
        id: 'cosine', title: 'Read a cosine', layout: 'sine',
        summary: 'Use complementary angles on S to find cosines.',
        problem: 'Find x = cos 30° and y = cos 60°.',
        start: position(),
        steps: [
            move('Find cos 30° using S 60°',
                'Cosine of an angle equals sine of its complement to 90°. For cos 30°, move to 60° on S. D reads about 8.660, so cos 30° is about 0.8660.',
                position(0, sine60), 'cursor', ['S', 'D']),
            move('Find cos 60° using S 30°',
                'The complement of 60° is 30°. At S 30°, D reads 5. Divide by ten: cos 60° = 0.5. These S labels are degrees.',
                position(0, sine30), 'cursor', ['S', 'D'])
        ],
        practice: {
            problem: 'Find x = cos 45°.',
            intro: 'Find cos 45°. Its complement is also 45°, so use S 45° and divide the D reading by ten.',
            note: 'The check verifies alignment; interpret the D reading yourself.',
            start: position(),
            steps: [
                exercise('Read cos 45°', 'Move the hairline to 45° on S. Read D beneath it and divide by ten.',
                    position(0, sine45), ['cursor'],
                    'Correct: D reads about 7.071. Therefore cos 45° is about 0.7071.')
            ]
        }
    },
    {
        id: 'tangent', title: 'Read a tangent', layout: 'tangent',
        summary: 'Use the lower-range tangent scale T₁ for angles up to 45°.',
        problem: 'Find x = tan 30° and y = tan 45°.',
        start: position(),
        steps: [
            move('Read tan 30°',
                'Move to 30° on the fixed T₁ scale. D reads about 5.774. Divide by ten: tan 30° is about 0.5774. T₁ labels angles in degrees.',
                position(0, tangent30), 'cursor', ['T1', 'D']),
            move('Read tan 45° at the end',
                'Move to 45° at T₁’s right-hand end. D reads 10. Dividing by ten gives tan 45° = 1. This teaching scale covers only the lower tangent range.',
                position(0, 1), 'cursor', ['T1', 'D'])
        ],
        practice: {
            problem: 'Find x = tan 20°.',
            intro: 'Find tan 20°. Use 20° on T₁, then divide the D reading by ten.',
            note: 'The check verifies alignment; interpret the D reading yourself.',
            start: position(),
            steps: [
                exercise('Read tan 20°', 'Move the hairline to 20° on T₁. Read D beneath it and divide by ten.',
                    position(0, tangent20), ['cursor'],
                    'Correct: D reads about 3.640. Therefore tan 20° is about 0.3640.')
            ]
        }
    },
    {
        id: 'right-triangle', title: 'Find a triangle’s height', layout: 'sine',
        summary: 'Find the height of a 15-unit ramp inclined at 30° to the horizontal.',
        problem: 'A 15-unit ramp makes a 30° angle with the horizontal. Find its height h = 15 × sin 30°.',
        start: position(),
        steps: [
            move('Find the sine of the angle',
                'The ramp is the hypotenuse: its length is 15 units. The height opposite 30° is 15 × sin 30°. At S 30°, D reads 5, giving sin 30° = 0.5.',
                position(0, sine30), 'cursor', ['S', 'D']),
            move('Set up the multiplication',
                'We now use C and D. The product 15 × 0.5 equals 1.5 × 5. Move C’s left-hand 1 to the hairline at D 5.',
                position(sine30, sine30), 'slide', ['C', 'D']),
            move('Read the height',
                'Move the hairline to 1.5 on C. D reads 7.5, so the height is 7.5 units. At 30°, this agrees with the height being half the hypotenuse.',
                position(sine30, log(7.5)), 'cursor', ['C', 'D'])
        ],
        practice: {
            problem: 'A 12-unit ramp makes a 30° angle with the horizontal. Find its height h = 12 × sin 30°.',
            intro: 'Find the height for a 12-unit hypotenuse at 30° to the horizontal. First find sin 30° on S, then multiply the hypotenuse by that sine.',
            note: ESTIMATE_NOTE,
            start: position(),
            steps: [
                exercise('Mark S 30°', 'Move the hairline to 30° on S. Read D beneath it and divide by ten.',
                    position(0, sine30), ['cursor'],
                    'D reads 5, so sin 30° = 0.5. Now calculate 12 × 0.5 by using 1.2 × 5.'),
                exercise('Align C 1 with D 5', 'Move C’s left-hand 1 to the hairline at D 5.',
                    position(sine30, sine30), ['slideOffset'],
                    'The multiplication alignment is set. Keep the slide here.'),
                exercise('Read at C 1.2', 'Move the hairline to 1.2 on C. Read D beneath it and interpret the height.',
                    position(sine30, log(6)), ['slideOffset', 'cursor'],
                    'Correct: D reads about 6. The height is 6 units, half the 12-unit hypotenuse.')
            ]
        }
    }
]);
