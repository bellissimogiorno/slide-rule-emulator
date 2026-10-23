import { log, position, move, exercise, sectionLessons } from '#tutorial/lesson-data.js';

// Hyperbolic arguments are dimensionless. These positions are calculated from
// the defining functions, independently of the catalogue's inverse mappings.
const lowSinh = u => log(10 * Math.sinh(u));
const highSinh = u => log(Math.sinh(u));
const cosine = u => log(Math.cosh(u));
const tangent = u => log(10 * Math.tanh(u));

export const HYPERBOLIC_LESSONS = sectionLessons('hyperbolic', [
    {
        id: 'hyperbolic-sine', title: 'Read sinh in two ranges', layout: 'sinh',
        problem: 'Find x = sinh(0.5) and y = sinh(1.5). The arguments 0.5 and 1.5 are dimensionless.',
        summary: 'Choose Sh₁ for results below one and Sh₂ for results above one.',
        start: position(),
        steps: [
            move('Use the lower sinh range', 'Move to 0.5 on Sh₁. D reads about 5.211. Sh₁ uses D/10, so sinh(0.5) ≈ 0.5211. Its argument is not an angle in degrees.',
                position(0, lowSinh(.5)), 'cursor', ['SH1', 'D']),
            move('Use the upper sinh range', 'Move to 1.5 on Sh₂. D reads about 2.129 directly: sinh(1.5) ≈ 2.129. The two rows meet where sinh u = 1, at u ≈ 0.8814.',
                position(0, highSinh(1.5)), 'cursor', ['SH2', 'D'])
        ],
        practice: {
            problem: 'Find x = sinh(0.4) and y = sinh(1.2), with dimensionless arguments.',
            intro: 'Choose the sinh range for each argument and apply its stated D factor.',
            start: position(),
            steps: [
                exercise('Read sinh(0.4)', 'Move to 0.4 on Sh₁. Interpret the D reading as D/10.',
                    position(0, lowSinh(.4)), ['cursor'], 'Correct: D ≈ 4.108 gives sinh(0.4) ≈ 0.4108.'),
                exercise('Read sinh(1.2)', 'Move to 1.2 on Sh₂ and read D directly.',
                    position(0, highSinh(1.2)), ['cursor'], 'Correct: sinh(1.2) ≈ 1.509.')
            ]
        }
    },
    {
        id: 'hyperbolic-cosine', title: 'Read cosh on Ch', layout: 'cosh',
        problem: 'Find x = cosh(0.5), y = cosh(1.5) and z = cosh(0). Arguments are dimensionless.',
        summary: 'Use Ch to read the hyperbolic cosine directly on D.',
        start: position(),
        steps: [
            move('Read cosh(0.5)', 'Move to 0.5 on Ch. D reads about 1.128, which is cosh(0.5). Ch is labelled by the argument; D gives the function value.',
                position(0, cosine(.5)), 'cursor', ['CH', 'D']),
            move('Read cosh(1.5)', 'At Ch 1.5, D reads about 2.352. No factor of ten is needed for this row.',
                position(0, cosine(1.5)), 'cursor', ['CH', 'D']),
            move('Inspect the minimum', 'Move back to Ch 0 at the left D index. D reads 1: cosh(0) = 1. For real arguments, cosh is at least one; negative arguments have the same cosh as their positive opposites.',
                position(), 'cursor', ['CH', 'D'])
        ],
        practice: {
            problem: 'Find x = cosh(1) and y = cosh(2), with dimensionless arguments.',
            intro: 'Read each argument on Ch and its function value on D.',
            start: position(),
            steps: [
                exercise('Read cosh(1)', 'Move to 1 on Ch and read D directly.', position(0, cosine(1)), ['cursor'], 'Correct: cosh(1) ≈ 1.543.'),
                exercise('Read cosh(2)', 'Move to 2 on Ch and read D directly.', position(0, cosine(2)), ['cursor'], 'Correct: cosh(2) ≈ 3.762.')
            ]
        }
    },
    {
        id: 'hyperbolic-tangent', title: 'Read tanh and its upper limit', layout: 'tanh',
        problem: 'Find x = tanh(0.5), y = tanh(2) and z = tanh(3). Arguments are dimensionless.',
        summary: 'Use Th with D/10 and see why a finite argument does not give one.',
        start: position(),
        steps: [
            move('Read tanh(0.5)', 'Move to 0.5 on Th. D reads about 4.621. Divide by ten: tanh(0.5) ≈ 0.4621.',
                position(0, tangent(.5)), 'cursor', ['TH', 'D']),
            move('Read tanh(2)', 'At Th 2, D reads about 9.640, so tanh(2) ≈ 0.9640. The result approaches one as the argument grows.',
                position(0, tangent(2)), 'cursor', ['TH', 'D']),
            move('Inspect the engraved endpoint', 'Th stops at argument 3, slightly before D 10. Its value is tanh(3) ≈ 0.9951. A finite argument never gives exactly one; the remaining blank part is outside this row’s range.',
                position(0, tangent(3)), 'cursor', ['TH', 'D'])
        ],
        practice: {
            problem: 'Find x = tanh(1) and y = tanh(1.5), with dimensionless arguments.',
            intro: 'Use Th and divide its corresponding D reading by ten.',
            start: position(),
            steps: [
                exercise('Read tanh(1)', 'Move to 1 on Th, then interpret D/10.', position(0, tangent(1)), ['cursor'], 'Correct: tanh(1) ≈ 0.7616.'),
                exercise('Read tanh(1.5)', 'Move to 1.5 on Th and interpret D/10 again.', position(0, tangent(1.5)), ['cursor'], 'Correct: tanh(1.5) ≈ 0.9051.')
            ]
        }
    },
    {
        id: 'inverse-hyperbolic', title: 'Read inverse hyperbolic functions', layout: 'hyperbolic',
        problem: 'Solve sinh u = 2, cosh v = 3 and tanh w = 0.5 for nonnegative u, v, w.',
        summary: 'Reverse the reading: set the function value on D and read its argument.',
        start: position(),
        steps: [
            move('Solve sinh u = 2', 'Set D 2. Read Sh₂ at the same hairline: u = asinh(2) ≈ 1.444. An inverse function returns the argument.',
                position(0, log(2)), 'cursor', ['SH2', 'D']),
            move('Solve cosh v = 3', 'Set D 3. Ch reads v = acosh(3) ≈ 1.763. This lesson asks for the nonnegative solution; cosh also gives the same value at −v.',
                position(0, log(3)), 'cursor', ['CH', 'D']),
            move('Solve tanh w = 0.5', 'Th uses D/10, so set D 5 to represent 0.5. Read w = atanh(0.5) ≈ 0.5493 on Th.',
                position(0, log(5)), 'cursor', ['TH', 'D'])
        ],
        practice: {
            problem: 'Solve sinh u = 3, cosh v = 2 and tanh w = 0.6 for nonnegative u, v, w.',
            intro: 'Set the given function value on D, with the appropriate factor of ten, then read its argument.',
            start: position(),
            steps: [
                exercise('Solve sinh u = 3', 'Set D 3 and read u on Sh₂.', position(0, log(3)), ['cursor'], 'Correct: u = asinh(3) ≈ 1.818.'),
                exercise('Solve cosh v = 2', 'Set D 2 and read the nonnegative argument on Ch.', position(0, log(2)), ['cursor'], 'Correct: v = acosh(2) ≈ 1.317.'),
                exercise('Solve tanh w = 0.6', 'Set D 6 to represent 0.6, then read Th.', position(0, log(6)), ['cursor'], 'Correct: w = atanh(0.6) ≈ 0.6931.')
            ]
        }
    },
    {
        id: 'catenary', title: 'Catenary height and slope', layout: 'catenary',
        problem: 'y = a cosh(x/a), a = 2 m, x = 3 m. Find y in metres and the dimensionless slope dy/dx = sinh(x/a).',
        summary: 'Combine division, cosh, multiplication and sinh in one curve calculation.',
        start: position(),
        steps: [
            move('Mark the horizontal coordinate', 'The model is y = a cosh(x/a), with its lowest point at y = a. Start x/a by marking D 3 for x = 3 m.',
                position(0, log(3)), 'cursor'),
            move('Divide by the length parameter', 'Bring C 2 to D 3 to divide x by a = 2 m. The ratio x/a is dimensionless.',
                position(log(1.5), log(3)), 'slide'),
            move('Read the argument', 'Move to C’s left-hand 1. D reads u = x/a = 1.5.',
                position(log(1.5), log(1.5)), 'cursor'),
            move('Find cosh of the argument', 'Move to Ch 1.5 on the fixed row. D reads cosh(1.5) ≈ 2.352.',
                position(log(1.5), cosine(1.5)), 'cursor', ['CH', 'D']),
            move('Set the multiplication by a', 'Bring C’s left-hand 1 to the hairline at the cosh value. This sets up multiplication by a = 2.',
                position(cosine(1.5), cosine(1.5)), 'slide'),
            move('Read the vertical coordinate', 'Move to C 2. D reads y ≈ 4.705 m. This is the vertical coordinate in the stated model, whose lowest point has y = 2 m.',
                position(cosine(1.5), log(2 * Math.cosh(1.5))), 'cursor'),
            move('Read the slope', 'Move to argument 1.5 on fixed Sh₂. D gives dy/dx = sinh(1.5) ≈ 2.129. The slope is dimensionless; the slide setting does not affect these fixed rows.',
                position(cosine(1.5), highSinh(1.5)), 'cursor', ['SH2', 'D'])
        ],
        practice: {
            problem: 'y = a cosh(x/a), a = 2 m, x = 2.4 m. Find y and dy/dx = sinh(x/a).',
            intro: 'Apply the complete method at another point on the same catenary.',
            start: position(),
            steps: [
                exercise('Mark x', 'Put the hairline at D 2.4 for the horizontal coordinate.', position(0, log(2.4)), ['cursor'], 'Keep this coordinate while setting the division.'),
                exercise('Set x/a', 'Bring C 2 to the hairline at D 2.4.', position(log(1.2), log(2.4)), ['slideOffset', 'cursor'], 'The division alignment is set.', 'slide'),
                exercise('Read u = x/a', 'Move to C’s left-hand 1 and read the argument on D.', position(log(1.2), log(1.2)), ['slideOffset', 'cursor'], 'The dimensionless argument is 1.2.'),
                exercise('Read cosh u', 'Move to 1.2 on fixed Ch; its value is on D.', position(log(1.2), cosine(1.2)), ['cursor'], 'cosh(1.2) ≈ 1.811.'),
                exercise('Set multiplication by a', 'Bring C’s left-hand 1 to the hairline at the cosh value.', position(cosine(1.2), cosine(1.2)), ['slideOffset', 'cursor'], 'Now multiply this value by 2.', 'slide'),
                exercise('Read y', 'Move to C 2 and read the vertical coordinate on D.', position(cosine(1.2), log(2 * Math.cosh(1.2))), ['slideOffset', 'cursor'], 'Correct: y ≈ 3.621 m.'),
                exercise('Read the slope', 'Move to 1.2 on fixed Sh₂. Read the dimensionless slope on D.', position(cosine(1.2), highSinh(1.2)), ['cursor'], 'Correct: dy/dx = sinh(1.2) ≈ 1.509.')
            ]
        }
    },
    {
        id: 'hyperbolic-identity', title: 'Check a hyperbolic identity', layout: 'hyperbolic-identity',
        problem: 'Find q = cosh² u − sinh² u for u = 1. Square the readings on A and subtract mentally.',
        summary: 'Use Ch, Sh₂ and A to verify cosh² u − sinh² u = 1.',
        start: position(),
        steps: [
            move('Square the cosh value', 'Move to Ch 1. D reads cosh(1) ≈ 1.543 and fixed A reads its square, about 2.381. Remember the A reading.',
                position(0, cosine(1)), 'cursor', ['CH', 'A', 'D']),
            move('Square the sinh value', 'Move to Sh₂ 1. D reads sinh(1) ≈ 1.175 and A reads about 1.381. Subtract the remembered readings mentally: 2.381 − 1.381 ≈ 1. The exact identity is cosh² u − sinh² u = 1; a logarithmic slide rule does not perform this subtraction directly.',
                position(0, highSinh(1)), 'cursor', ['SH2', 'A', 'D'])
        ],
        practice: {
            problem: 'Find q = cosh²(1.2) − sinh²(1.2), using Ch, Sh₂ and A, then mental subtraction.',
            intro: 'Check the same identity at a different argument. Keep all squared readings in the same decimal range.',
            start: position(),
            steps: [
                exercise('Square cosh(1.2)', 'Move to Ch 1.2 and remember the corresponding A reading.', position(0, cosine(1.2)), ['cursor'], 'A gives cosh²(1.2) ≈ 3.278.'),
                exercise('Square sinh(1.2)', 'Move to Sh₂ 1.2 and read A. Subtract this value mentally from the previous A reading.', position(0, highSinh(1.2)), ['cursor'], 'A gives sinh²(1.2) ≈ 2.278. Their difference is about 1; the identity is exact.')
            ]
        }
    }
]);
