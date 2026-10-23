import { log, position, move, exercise, sectionLessons } from '#tutorial/lesson-data.js';

export const POWER_LESSONS = sectionLessons('powers', [
    {
        id: 'squares', title: 'Read squares on A', layout: 'squares',
        summary: 'Move from a number on D to its square on the fixed A scale.',
        problem: 'Find x = 2², y = 3² and z = 4².',
        start: position(),
        steps: [
            move('Square 2', 'Put the hairline at D 2. A reads 4 at the same position: 2² = 4. Only the cursor needs to move.',
                position(0, log(2)), 'cursor', ['A', 'D']),
            move('Square 3', 'At D 3, A reads 9. A fits two decades, 1–10 and 10–100, into the same length as D’s single decade.',
                position(0, log(3)), 'cursor', ['A', 'D']),
            move('Square 4', 'Move to D 4. The hairline crosses A 16 in A’s right-hand half. Read the full value: 4² = 16.',
                position(0, log(4)), 'cursor', ['A', 'D'])
        ],
        practice: {
            problem: 'Find x = 5² and y = 1.5².',
            intro: 'Find the squares of 5 and 1.5. Read A at the same hairline as each D number.',
            start: position(),
            steps: [
                exercise('Square 5', 'Move to D 5 and read A in its 10–100 half.',
                    position(0, log(5)), ['cursor'], 'Correct: A reads about 25, so 5² = 25.'),
                exercise('Square 1.5', 'Move to D 1.5 and read A in its 1–10 half.',
                    position(0, log(1.5)), ['cursor'], 'Correct: A reads about 2.25, so 1.5² = 2.25.')
            ]
        }
    },
    {
        id: 'square-roots', title: 'Read square roots from A', layout: 'squares',
        summary: 'Reverse the A-to-D comparison, choosing the correct half of A.',
        problem: 'Find x = √25 and y = √2.5.',
        start: position(),
        steps: [
            move('Take the square root of 25', 'Find A 25 between 20 and 30 in the right-hand 10–100 half. Put the hairline there; D reads 5, so √25 = 5.',
                position(0, log(25) / 2), 'cursor', ['A', 'D']),
            move('Take the square root of 2.5', 'For A 2.5, use the left-hand 1–10 half instead. D reads about 1.581. Since 1² < 2.5 < 2², this is the correct range.',
                position(0, log(2.5) / 2), 'cursor', ['A', 'D'])
        ],
        practice: {
            problem: 'Find x = √36 and y = √3.6.',
            intro: 'Find √36 and √3.6. The decimal point determines which half of A you use.',
            start: position(),
            steps: [
                exercise('Find √36', 'Place the hairline at A 36 in the 10–100 half and read D.',
                    position(0, log(36) / 2), ['cursor'], 'Correct: D reads about 6, so √36 = 6.'),
                exercise('Find √3.6', 'Place the hairline at A 3.6 in the 1–10 half. Its root must lie between 1 and 2.',
                    position(0, log(3.6) / 2), ['cursor'], 'Correct: √3.6 is about 1.897.')
            ]
        }
    },
    {
        id: 'cubes', title: 'Read cubes on K', layout: 'cubes',
        summary: 'Compare D with the three-decade K scale to find cubes.',
        problem: 'Find x = 2³ and y = 3³.',
        start: position(),
        steps: [
            move('Cube 2', 'Put the hairline at D 2. K reads 8 at the same position: 2³ = 8.',
                position(0, log(2)), 'cursor', ['K', 'D']),
            move('Cube 3', 'At D 3, K reads 27. K contains three ranges: 1–10, 10–100 and 100–1000. Read the full value from the appropriate third.',
                position(0, log(3)), 'cursor', ['K', 'D'])
        ],
        practice: {
            problem: 'Find x = 4³ and y = 1.5³.',
            intro: 'Find the cubes of 4 and 1.5. The slide setting does not affect these two fixed scales.',
            start: position(),
            steps: [
                exercise('Cube 4', 'Move to D 4 and read the value on K.',
                    position(0, log(4)), ['cursor'], 'Correct: K reads about 64, so 4³ = 64.'),
                exercise('Cube 1.5', 'Move to D 1.5 and read K in its 1–10 third.',
                    position(0, log(1.5)), ['cursor'], 'Correct: K reads about 3.375, so 1.5³ = 3.375.')
            ]
        }
    },
    {
        id: 'cube-roots', title: 'Read cube roots from K', layout: 'cubes',
        summary: 'Choose the correct third of K, then read the cube root on D.',
        problem: 'Find x = ∛125, y = ∛12.5 and z = ∛1.25.',
        start: position(),
        steps: [
            move('Take the cube root of 125', 'Find K 125 in the 100–1000 third and move the hairline there. D reads 5: ∛125 = 5.',
                position(0, log(125) / 3), 'cursor', ['K', 'D']),
            move('Take the cube root of 12.5', 'Use K 12.5 in the middle 10–100 third. D reads about 2.321, between 2 and 3 because 8 < 12.5 < 27.',
                position(0, log(12.5) / 3), 'cursor', ['K', 'D']),
            move('Take the cube root of 1.25', 'For K 1.25, use the first 1–10 third. D reads about 1.077. Choosing a different third changes the root, not just its printed digits.',
                position(0, log(1.25) / 3), 'cursor', ['K', 'D'])
        ],
        practice: {
            problem: 'Find x = ∛64 and y = ∛6.4.',
            intro: 'Find ∛64 and ∛6.4. Choose the K section that contains the full number.',
            start: position(),
            steps: [
                exercise('Find ∛64', 'Move to K 64 in the 10–100 third and read D.',
                    position(0, log(64) / 3), ['cursor'], 'Correct: D reads about 4, so ∛64 = 4.'),
                exercise('Find ∛6.4', 'Move to K 6.4 in the 1–10 third. The root lies between 1 and 2.',
                    position(0, log(6.4) / 3), ['cursor'], 'Correct: ∛6.4 is about 1.857.')
            ]
        }
    }
]);
