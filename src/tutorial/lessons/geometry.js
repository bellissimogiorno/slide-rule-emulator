/** Geometry uses the ordinary continuous mappings, with one moving component
 * per instruction. Transferring an A/K result to D is an explicit cursor move;
 * decimal places and physical units remain the learner's responsibility.
 */
import { log, position, move, exercise, sectionLessons } from '#tutorial/lesson-data.js';

const pi = Math.PI;
const NOTE = 'The check verifies alignment; interpret the decimal place and units yourself.';
const piDefinition = 'π is the circle constant.';

export const GEOMETRY_LESSONS = sectionLessons('geometry', [
    {
        id: 'circumference', title: 'Circle circumference from diameter',
        summary: 'Multiply a diameter by π to find the distance around a circle.',
        problem: `C = πd; d = 2 cm. C is circumference in cm; d is diameter. ${piDefinition} Find C.`,
        start: position(),
        steps: [
            move('Mark the diameter', 'The diameter is the full distance across the circle through its centre. Put the hairline at D 2 for the 2 cm diameter.',
                position(0, log(2)), 'cursor', ['D']),
            move('Set multiplication by the diameter', 'Align C’s left-hand 1 with D 2. Here the scale name C is separate from the circumference symbol C in the formula.',
                position(log(2), log(2)), 'slide'),
            move('Read at π on C', 'Move to the π mark on the sliding C scale. D reads about 6.283. The circumference is approximately 6.283 cm. π is an exact factor; the reading is approximate.',
                position(log(2), log(2 * pi)), 'cursor')
        ],
        practice: {
            problem: `C = πd; d = 3 cm. C is circumference in cm; d is diameter. ${piDefinition} Find C.`,
            intro: 'Find the circumference of a circle with diameter 3 cm. Set the diameter, then read at π.',
            note: NOTE, start: position(),
            steps: [
                exercise('Mark the diameter', 'Move the hairline to D 3 for the diameter.', position(0, log(3)), ['cursor'], 'The diameter is marked.'),
                exercise('Align C 1 with D 3', 'Keep the hairline at D 3 and bring C’s left-hand 1 to it.',
                    position(log(3), log(3)), ['slideOffset', 'cursor'], 'The multiplication alignment is set.', 'slide'),
                exercise('Read at C π', 'Move to π on C and read D. Give the circumference in cm.',
                    position(log(3), log(3 * pi)), ['slideOffset', 'cursor'], 'Correct: the circumference is approximately 9.425 cm.')
            ]
        }
    },
    {
        id: 'disc-area-radius', title: 'Disc area from radius', layout: 'geometry',
        summary: 'Square the radius on A, transfer the result to D, then multiply by π.',
        problem: `A = πr²; r = 1.5 cm. A is disc area in cm²; r is radius, half the diameter. ${piDefinition} Find A.`,
        start: position(),
        steps: [
            move('Square the radius', 'Put the hairline at D 1.5. The fixed A scale reads 2.25: this is r² in cm².',
                position(0, log(1.5)), 'cursor', ['A', 'D']),
            move('Transfer the square to D', 'Remember A’s 2.25, then move the hairline to D 2.25. A and D are different mappings; this transfer needs a cursor movement.',
                position(0, log(2.25)), 'cursor', ['D']),
            move('Set the π multiplication', 'Align C’s left-hand 1 with D 2.25.',
                position(log(2.25), log(2.25)), 'slide'),
            move('Read the disc area', 'Move to π on C. D reads about 7.069, giving an area of approximately 7.069 cm². The radius, rather than the diameter, was squared.',
                position(log(2.25), log(2.25 * pi)), 'cursor')
        ],
        practice: {
            problem: `A = πr²; r = 1.2 cm. A is disc area in cm²; r is radius. ${piDefinition} Find A.`,
            intro: 'Find the area of a disc with radius 1.2 cm. Square first, then multiply the square by π.',
            note: NOTE, start: position(),
            steps: [
                exercise('Square 1.2', 'Put the hairline at D 1.2 and read r² on A.', position(0, log(1.2)), ['cursor'], 'A reads about 1.44 cm².'),
                exercise('Transfer the square', 'Move the hairline to D 1.44.', position(0, log(1.44)), ['cursor'], 'The squared radius is now on D.'),
                exercise('Set multiplication', 'Align C’s left-hand 1 with D 1.44.', position(log(1.44), log(1.44)), ['slideOffset', 'cursor'], 'Keep this slide setting.', 'slide'),
                exercise('Read at π', 'Move to C π and read the area on D in cm².', position(log(1.44), log(1.44 * pi)), ['slideOffset', 'cursor'], 'Correct: the disc area is approximately 4.524 cm².')
            ]
        }
    },
    {
        id: 'disc-area-diameter', title: 'Disc area from diameter', layout: 'geometry',
        summary: 'Square the full diameter, divide by four, then multiply by π.',
        problem: `A = πd²/4; d = 4 cm. A is disc area in cm²; d is diameter, twice the radius. ${piDefinition} Find A.`,
        start: position(),
        steps: [
            move('Square the diameter', 'At D 4, A reads 16. Squaring a diameter gives four times the squared radius, so we must divide this result by four.',
                position(0, log(4)), 'cursor', ['A', 'D']),
            move('Transfer 16 to D', 'D has only one decade. Move to D 1.6 and remember that it represents 16 cm² for this calculation.',
                position(0, log(1.6)), 'cursor', ['D']),
            move('Divide by four', 'Bring C 4 to the hairline at D 1.6. Keep the cursor still while setting the division.',
                position(log(.4), log(1.6)), 'slide'),
            move('Read at the right-hand index', 'C 1 is off the left end. At C 10, D reads 4. Restoring the decade gives 16 ÷ 4 = 4 cm², the squared radius.',
                position(log(.4), log(4)), 'cursor'),
            move('Multiply by π', 'The existing C 10 over D 4 also sets right-index multiplication. Move to C π: D reads about 1.257. Since 4π is between 12 and 13, the area is approximately 12.57 cm².',
                position(log(.4), log(.4 * pi)), 'cursor')
        ],
        practice: {
            problem: `A = πd²/4; d = 3 cm. A is disc area in cm²; d is diameter. ${piDefinition} Find A.`,
            intro: 'Find the disc area from a 3 cm diameter. Divide its square by four before multiplying by π.',
            note: NOTE, start: position(),
            steps: [
                exercise('Square the diameter', 'Move to D 3 and read d² on A.', position(0, log(3)), ['cursor'], 'The square is 9 cm².'),
                exercise('Transfer the square', 'Move the hairline to D 9.', position(0, log(9)), ['cursor'], 'The squared diameter is now on D.'),
                exercise('Divide by four', 'Bring C 4 to D 9 under the hairline.', position(log(2.25), log(9)), ['slideOffset', 'cursor'], 'The division is set.', 'slide'),
                exercise('Read the squared radius', 'Move to C’s left-hand 1 and read D.', position(log(2.25), log(2.25)), ['slideOffset', 'cursor'], 'The squared radius is about 2.25 cm².'),
                exercise('Multiply by π', 'Keep the slide fixed and move to C π. Read the area in cm².', position(log(2.25), log(2.25 * pi)), ['slideOffset', 'cursor'], 'Correct: the disc area is approximately 7.069 cm².')
            ]
        }
    },
    {
        id: 'disc-diameter-from-area', title: 'Disc diameter from area', layout: 'geometry',
        summary: 'Divide the area by π, take its square root, then double the radius.',
        problem: `d = 2√(A/π); A = 18 cm². A is disc area; d is diameter in cm. The square root gives radius. ${piDefinition} Find d.`,
        start: position(),
        steps: [
            move('Mark the given area', 'Use D 1.8 to represent the given area of 18 cm². We first divide the area by π.',
                position(0, log(1.8)), 'cursor', ['D']),
            move('Set division by π', 'Bring C π to the hairline at D 1.8.',
                position(log(1.8 / pi), log(1.8)), 'slide'),
            move('Read the squared radius', 'At C 10, D reads about 5.730. For the original area this is 18 ÷ π, the squared radius in cm².',
                position(log(1.8 / pi), log(18 / pi)), 'cursor'),
            move('Take the square root on A', 'Remember about 5.730. Move to that full value on the fixed A scale, in its 1–10 half. D now reads about 2.394 cm: the radius.',
                position(log(1.8 / pi), log(18 / pi) / 2), 'cursor', ['A', 'D']),
            move('Set doubling', 'The diameter is twice the radius. Align C’s left-hand 1 with the radius at D 2.394.',
                position(log(18 / pi) / 2, log(18 / pi) / 2), 'slide'),
            move('Read the diameter', 'Move to C 2. D reads approximately 4.787 cm. The root was a radius; doubling it gives the requested diameter.',
                position(log(18 / pi) / 2, log(2 * Math.sqrt(18 / pi))), 'cursor')
        ],
        practice: {
            problem: `d = 2√(A/π); A = 25 cm². A is disc area; d is diameter in cm. The square root gives radius. ${piDefinition} Find d.`,
            intro: 'Find the diameter of a disc whose area is 25 cm². Divide, take a square root, then double.',
            note: NOTE, start: position(),
            steps: [
                exercise('Mark the area', 'Move to D 2.5, representing 25 cm².', position(0, log(2.5)), ['cursor'], 'The given area is marked.'),
                exercise('Divide by π', 'Bring C π to the hairline at D 2.5.', position(log(2.5 / pi), log(2.5)), ['slideOffset', 'cursor'], 'Division by π is set.', 'slide'),
                exercise('Read at C 10', 'Move to C 10 and read the squared radius on D.', position(log(2.5 / pi), log(25 / pi)), ['slideOffset', 'cursor'], 'The squared radius is about 7.958 cm².'),
                exercise('Take the square root', 'Move the hairline to A 7.958 in its 1–10 half. Read the radius on D.', position(log(2.5 / pi), log(25 / pi) / 2), ['cursor'], 'D gives a radius of approximately 2.821 cm.'),
                exercise('Set doubling', 'Align C’s left-hand 1 with the radius under the hairline.', position(log(25 / pi) / 2, log(25 / pi) / 2), ['slideOffset', 'cursor'], 'Now read at C 2.', 'slide'),
                exercise('Read the diameter', 'Move to C 2 and read the diameter in cm.', position(log(25 / pi) / 2, log(2 * Math.sqrt(25 / pi))), ['slideOffset', 'cursor'], 'Correct: the diameter is approximately 5.642 cm.')
            ]
        }
    },
    {
        id: 'rectangle-area', title: 'Rectangle area',
        summary: 'Multiply two perpendicular side lengths and interpret the result in square units.',
        problem: 'A = ab; a = 2.4 cm and b = 3 cm. a and b are the rectangle’s perpendicular side lengths; A is area in cm². Find A.',
        start: position(),
        steps: [
            move('Mark the first side', 'Put the hairline at D 2.4 for the first side length. Both lengths are in cm.', position(0, log(2.4)), 'cursor', ['D']),
            move('Set multiplication', 'Bring C’s left-hand 1 to D 2.4 under the hairline.', position(log(2.4), log(2.4)), 'slide'),
            move('Read at the second side', 'Move to C 3. D reads 7.2. Multiplying cm by cm gives cm², so the rectangle’s area is 7.2 cm².', position(log(2.4), log(7.2)), 'cursor')
        ],
        practice: {
            problem: 'A = ab; a = 1.6 cm and b = 4 cm. a and b are perpendicular rectangle side lengths; A is area in cm². Find A.',
            intro: 'Find the area of a 1.6 cm by 4 cm rectangle.', note: NOTE, start: position(),
            steps: [
                exercise('Mark the first side', 'Move the hairline to D 1.6.', position(0, log(1.6)), ['cursor'], 'The first side is marked.'),
                exercise('Set the multiplication', 'Align C’s left-hand 1 with D 1.6.', position(log(1.6), log(1.6)), ['slideOffset', 'cursor'], 'The multiplication is set.', 'slide'),
                exercise('Read at the second side', 'Move to C 4 and give the area in cm².', position(log(1.6), log(6.4)), ['slideOffset', 'cursor'], 'Correct: the rectangle’s area is approximately 6.4 cm².')
            ]
        }
    },
    {
        id: 'triangle-area', title: 'Triangle area',
        summary: 'Multiply base by perpendicular height, then divide by two.',
        problem: 'A = bh/2; b = 4 cm and h = 3 cm. b is triangle base; h is its perpendicular height; A is area in cm². Find A.',
        start: position(),
        steps: [
            move('Mark the base', 'Put the hairline at D 4 for the base. The height must be perpendicular to this base, not a sloping side.', position(0, log(4)), 'cursor', ['D']),
            move('Use the right-hand index', 'Align C 10 with D 4 so the height at C 3 remains within the rule.', position(log(.4), log(4)), 'slide'),
            move('Read base times height', 'At C 3, D reads 1.2. For 4 × 3 this represents 12 cm². Keep the cursor here to divide this intermediate result by two.', position(log(.4), log(1.2)), 'cursor'),
            move('Set division by two', 'Bring C 2 to the hairline at D 1.2. The original intermediate result is still 12, despite the one-decade D reading.', position(log(.6), log(1.2)), 'slide'),
            move('Read the triangle area', 'C 1 is off the left end, so move to C 10. D reads 6: half of 12 is 6 cm².', position(log(.6), log(6)), 'cursor')
        ],
        practice: {
            problem: 'A = bh/2; b = 5 cm and h = 3 cm. b is triangle base; h is its perpendicular height; A is area in cm². Find A.',
            intro: 'Find the area of a triangle with base 5 cm and perpendicular height 3 cm.', note: NOTE, start: position(),
            steps: [
                exercise('Mark the base', 'Move to D 5 for the base.', position(0, log(5)), ['cursor'], 'The base is marked.'),
                exercise('Set right-index multiplication', 'Align C 10 with D 5.', position(log(.5), log(5)), ['slideOffset', 'cursor'], 'Read the height at C 3 next.', 'slide'),
                exercise('Multiply by the height', 'Move to C 3. Interpret the D reading for 5 × 3.', position(log(.5), log(1.5)), ['slideOffset', 'cursor'], 'D 1.5 represents 15 cm². Keep the cursor here.'),
                exercise('Divide by two', 'Bring C 2 to the hairline without moving the cursor.', position(log(.75), log(1.5)), ['slideOffset', 'cursor'], 'The division by two is set.', 'slide'),
                exercise('Read at C 10', 'Move to C 10 and give the triangle area in cm².', position(log(.75), log(7.5)), ['slideOffset', 'cursor'], 'Correct: the triangle’s area is approximately 7.5 cm².')
            ]
        }
    },
    {
        id: 'ellipse-area', title: 'Ellipse area from semi-axes',
        summary: 'Multiply the two semi-axis lengths, then multiply by π.',
        problem: `A = πab; a = 2 cm and b = 1.2 cm. a and b are ellipse semi-axes, each half a full axis; A is area in cm². ${piDefinition} Find A.`,
        start: position(),
        steps: [
            move('Mark one semi-axis', 'Put the hairline at D 2. This is a semi-axis, measured from the centre to the edge; do not use the full width.', position(0, log(2)), 'cursor', ['D']),
            move('Set multiplication by the other semi-axis', 'Align C’s left-hand 1 with D 2.', position(log(2), log(2)), 'slide'),
            move('Read the semi-axis product', 'Move to C 1.2. D reads 2.4 cm², the product ab.', position(log(2), log(2.4)), 'cursor'),
            move('Set multiplication by π', 'Keep the intermediate product at the hairline. Bring C’s left-hand 1 to D 2.4.', position(log(2.4), log(2.4)), 'slide'),
            move('Read the ellipse area', 'Move to C π. D reads approximately 7.540 cm². Using full axes instead of semi-axes would make the result four times too large.', position(log(2.4), log(2.4 * pi)), 'cursor')
        ],
        practice: {
            problem: `A = πab; a = 1.5 cm and b = 1.2 cm. a and b are ellipse semi-axes, not full axis lengths; A is area in cm². ${piDefinition} Find A.`,
            intro: 'Find the area of an ellipse with semi-axes 1.5 cm and 1.2 cm.', note: NOTE, start: position(),
            steps: [
                exercise('Mark a semi-axis', 'Move to D 1.5.', position(0, log(1.5)), ['cursor'], 'The first semi-axis is marked.'),
                exercise('Set multiplication', 'Align C’s left-hand 1 with D 1.5.', position(log(1.5), log(1.5)), ['slideOffset', 'cursor'], 'Now multiply by the second semi-axis.', 'slide'),
                exercise('Read the product ab', 'Move to C 1.2 and keep the resulting D reading under the hairline.', position(log(1.5), log(1.8)), ['slideOffset', 'cursor'], 'The semi-axis product is about 1.8 cm².'),
                exercise('Set the π factor', 'Bring C’s left-hand 1 to the hairline at D 1.8.', position(log(1.8), log(1.8)), ['slideOffset', 'cursor'], 'Now read at π.', 'slide'),
                exercise('Read the area', 'Move to C π and give the area in cm².', position(log(1.8), log(1.8 * pi)), ['slideOffset', 'cursor'], 'Correct: the ellipse’s area is approximately 5.655 cm².')
            ]
        }
    },
    {
        id: 'sector-area', title: 'Circular sector area', layout: 'geometry',
        summary: 'Take the appropriate fraction of the full disc area using an angle in degrees.',
        problem: `A = (θ/360)πr²; θ = 90° and r = 3 cm. θ is the numerical central angle in degrees; r is radius; A is sector area in cm². ${piDefinition} Find A.`,
        start: position(),
        steps: [
            move('Square the radius', 'The 90° sector is one quarter of a 360° circle: 90/360 = 1/4. This simple fraction is reduced mentally. At D 3, A gives r² = 9 cm².', position(0, log(3)), 'cursor', ['A', 'D']),
            move('Transfer the square', 'Move the hairline to D 9. We can divide the square by four before multiplying by π.', position(0, log(9)), 'cursor', ['D']),
            move('Divide by four', 'Bring C 4 to D 9 under the stationary hairline.', position(log(2.25), log(9)), 'slide'),
            move('Read one quarter of the square', 'Move to C 1. D reads 2.25 cm², one quarter of r².', position(log(2.25), log(2.25)), 'cursor'),
            move('Apply π', 'Keep the slide here and move to C π. D reads approximately 7.069 cm², the area of the 90° sector.', position(log(2.25), log(2.25 * pi)), 'cursor')
        ],
        practice: {
            problem: `A = (θ/360)πr²; θ = 60° and r = 2 cm. θ is the numerical central angle in degrees; r is radius; A is sector area in cm². ${piDefinition} Find A.`,
            intro: 'Find the area of a 60° sector of radius 2 cm. Reduce 60/360 mentally to 1/6, then divide r² by six before multiplying by π.', note: NOTE, start: position(),
            steps: [
                exercise('Square the radius', 'Move to D 2 and read the squared radius on A.', position(0, log(2)), ['cursor'], 'The squared radius is 4 cm².'),
                exercise('Transfer the square', 'Move to D 4.', position(0, log(4)), ['cursor'], 'Now divide this value by six.'),
                exercise('Set division by six', 'Bring C 6 to D 4 under the hairline.', position(log(2 / 3), log(4)), ['slideOffset', 'cursor'], 'The division is set.', 'slide'),
                exercise('Read the fraction', 'Move to C 10. D reads about 6.667; for 4 ÷ 6, interpret that as about 0.6667 cm².', position(log(2 / 3), log(20 / 3)), ['slideOffset', 'cursor'], 'This C 10 alignment also serves as right-index multiplication for the next π factor.'),
                exercise('Multiply by π', 'Keep the slide fixed and move to C π. Read the sector area in cm².', position(log(2 / 3), log(2 * pi / 3)), ['slideOffset', 'cursor'], 'Correct: the sector’s area is approximately 2.094 cm².')
            ]
        }
    },
    {
        id: 'cylinder-volume', title: 'Cylinder volume', layout: 'geometry',
        summary: 'Find the circular base area, then multiply it by the perpendicular height.',
        problem: `V = πr²h; r = 1.5 cm and h = 2 cm. r is cylinder radius; h is perpendicular height; V is volume in cm³. ${piDefinition} Find V.`,
        start: position(),
        steps: [
            move('Square the base radius', 'At D 1.5, A reads 2.25 cm². Use the radius of the circular base, not its diameter.', position(0, log(1.5)), 'cursor', ['A', 'D']),
            move('Transfer the square to D', 'Move to D 2.25, retaining the squared-radius value.', position(0, log(2.25)), 'cursor', ['D']),
            move('Set the base-area multiplication', 'Align C’s left-hand 1 with D 2.25.', position(log(2.25), log(2.25)), 'slide'),
            move('Read the base area', 'At C π, D reads about 7.069 cm². Keep this intermediate area under the hairline.', position(log(2.25), log(2.25 * pi)), 'cursor'),
            move('Set multiplication by height', 'The volume exceeds ten, so use the right-hand index: bring C 10 to the base-area reading at D 7.069.', position(log(2.25 * pi) - 1, log(2.25 * pi)), 'slide'),
            move('Read the volume', 'Move to C 2 for the 2 cm height. D reads about 1.414; the estimate 7 × 2 places the volume at approximately 14.14 cm³.', position(log(2.25 * pi) - 1, log(.45 * pi)), 'cursor')
        ],
        practice: {
            problem: `V = πr²h; r = 1.2 cm and h = 2 cm. r is cylinder radius; h is perpendicular height; V is volume in cm³. ${piDefinition} Find V.`,
            intro: 'Find the volume of a cylinder of radius 1.2 cm and height 2 cm. This example fits within D’s first decade.', note: NOTE, start: position(),
            steps: [
                exercise('Square the radius', 'Move to D 1.2 and read A.', position(0, log(1.2)), ['cursor'], 'The squared radius is about 1.44 cm².'),
                exercise('Transfer the square', 'Move to D 1.44.', position(0, log(1.44)), ['cursor'], 'The square is now on D.'),
                exercise('Set the π multiplication', 'Align C’s left-hand 1 with D 1.44.', position(log(1.44), log(1.44)), ['slideOffset', 'cursor'], 'Read the circular base area next.', 'slide'),
                exercise('Read the base area', 'Move to C π and retain the D reading.', position(log(1.44), log(1.44 * pi)), ['slideOffset', 'cursor'], 'The base area is approximately 4.524 cm².'),
                exercise('Set multiplication by height', 'Bring C’s left-hand 1 to the base area under the hairline.', position(log(1.44 * pi), log(1.44 * pi)), ['slideOffset', 'cursor'], 'Multiply this area by the height of 2 cm.', 'slide'),
                exercise('Read the volume', 'Move to C 2 and give the volume in cm³.', position(log(1.44 * pi), log(2.88 * pi)), ['slideOffset', 'cursor'], 'Correct: the cylinder’s volume is approximately 9.048 cm³.')
            ]
        }
    },
    {
        id: 'sphere-volume', title: 'Sphere volume', layout: 'cubes',
        summary: 'Calculate the factor 4π/3, cube the radius on K, then multiply.',
        problem: `V = (4/3)πr³; r = 1.2 cm. r is sphere radius, half its diameter; V is volume in cm³. ${piDefinition} Find V.`,
        start: position(),
        steps: [
            move('Begin the constant factor', 'First calculate 4π/3 on the rule. Put the hairline at D 4.', position(0, log(4)), 'cursor', ['D']),
            move('Divide four by three', 'Bring C 3 to D 4 under the stationary hairline.', position(log(4 / 3), log(4)), 'slide'),
            move('Read four thirds', 'Move to C 1. D reads about 1.333, the value 4/3.', position(log(4 / 3), log(4 / 3)), 'cursor'),
            move('Complete the factor', 'Without changing the slide, move to C π. D reads about 4.189. Remember this factor 4π/3 for the final multiplication.', position(log(4 / 3), log(4 * pi / 3)), 'cursor'),
            move('Cube the radius on K', 'Move the hairline to D 1.2. K reads 1.728: this is r³ in cm³. K and D stay fixed, so the earlier slide setting does not affect this cube.', position(log(4 / 3), log(1.2)), 'cursor', ['K', 'D']),
            move('Transfer the cube to D', 'Move to D 1.728, retaining the cube from K.', position(log(4 / 3), log(1.728)), 'cursor', ['D']),
            move('Set the final multiplication', 'Bring C’s left-hand 1 to D 1.728.', position(log(1.728), log(1.728)), 'slide'),
            move('Read at the remembered factor', 'Move to C 4.189, the approximate factor 4π/3. D reads approximately 7.238 cm³. The radius was cubed; using the diameter would give eight times the volume.', position(log(1.728), log(4 * pi * 1.728 / 3)), 'cursor')
        ],
        practice: {
            problem: `V = (4/3)πr³; r = 1.3 cm. r is sphere radius, not diameter; V is volume in cm³. ${piDefinition} Find V.`,
            intro: 'Find the volume of a sphere of radius 1.3 cm. Rebuild the constant factor, then cube and multiply.', note: NOTE, start: position(),
            steps: [
                exercise('Start the factor', 'Move to D 4.', position(0, log(4)), ['cursor'], 'Now divide by three.'),
                exercise('Set division by three', 'Bring C 3 to D 4.', position(log(4 / 3), log(4)), ['slideOffset', 'cursor'], 'The division is set.', 'slide'),
                exercise('Read four thirds', 'Move to C 1 and read D.', position(log(4 / 3), log(4 / 3)), ['slideOffset', 'cursor'], 'D reads about 1.333.'),
                exercise('Complete the factor', 'Move to C π and remember the D reading.', position(log(4 / 3), log(4 * pi / 3)), ['slideOffset', 'cursor'], 'The factor 4π/3 is approximately 4.189.'),
                exercise('Cube the radius', 'Move to D 1.3 and read r³ on K.', position(log(4 / 3), log(1.3)), ['cursor'], 'K gives approximately 2.197 cm³.'),
                exercise('Transfer the cube', 'Move to D 2.197.', position(log(4 / 3), log(2.197)), ['cursor'], 'The cube is now on D.'),
                exercise('Set multiplication', 'Bring C’s left-hand 1 to D 2.197.', position(log(2.197), log(2.197)), ['slideOffset', 'cursor'], 'Multiply by the remembered factor next.', 'slide'),
                exercise('Read the volume', 'Move to C 4.189, representing 4π/3, and give the D result in cm³.', position(log(2.197), log(4 * pi * 2.197 / 3)), ['slideOffset', 'cursor'], 'Correct: the sphere’s volume is approximately 9.203 cm³.')
            ]
        }
    }
]);
