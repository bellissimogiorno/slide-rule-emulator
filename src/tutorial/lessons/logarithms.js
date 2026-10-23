import { log, position, move, exercise, sectionLessons } from '#tutorial/lesson-data.js';

// D supplies the exponent coefficient on the fixed generic LL banks. These
// scale IDs use the emulator's natural-base numbering, not a maker's LL system.
const atD = (value, slideOffset = 0) => position(slideOffset, log(value));
const ln2 = Math.LN2, ln3 = Math.log(3), ln4 = Math.log(4);
const ln16 = Math.log(16), ln20 = Math.log(20), ln27 = Math.log(27);
const growth = Math.log1p(.002), practiceGrowth = Math.log1p(.003);
const growthD = 1000 * growth, practiceGrowthD = 1000 * practiceGrowth;
const ABSOLUTE_LL_NOTE = 'LL readings are full numerical values. Keep their actual decimal places; the check verifies alignment.';

export const LOGARITHM_LESSONS = sectionLessons('logarithms', [
    {
        id: 'common-log', title: 'Common logarithms and antilogarithms', layout: 'logarithm',
        problem: 'Find x = log₁₀(2), y = log₁₀(5) and z = 10^0.6.',
        summary: 'Read a base-ten logarithm on L, then reverse the comparison to find an antilogarithm.',
        start: position(),
        steps: [
            move('Read the logarithm of 2', 'Move to D 2. The fixed L scale reads about 0.301: log₁₀(2) ≈ 0.301. L is linear from 0 to 1 while D covers 1 to 10.',
                atD(2), 'cursor', ['L', 'D']),
            move('Read the logarithm of 5', 'At D 5, L reads about 0.699. For a number in another decade, add that decade separately: log₁₀(50) = 1 + log₁₀(5).',
                atD(5), 'cursor', ['L', 'D']),
            move('Reverse the comparison', 'Now find L 0.6 and read D at the same hairline. D reads about 3.981, so 10^0.6 ≈ 3.981. This reverses the logarithm lookup.',
                position(0, .6), 'cursor', ['L', 'D'])
        ],
        practice: {
            problem: 'Find x = log₁₀(4) and y = 10^0.8.',
            intro: 'Use D to find a logarithm, then use L to find an antilogarithm.',
            start: position(),
            steps: [
                exercise('Find log₁₀(4)', 'Put the hairline at D 4, then read L.',
                    atD(4), ['cursor'], 'Correct: log₁₀(4) is about 0.6021.'),
                exercise('Find 10^0.8', 'Move to L 0.8 and read D at the same hairline.',
                    position(0, .8), ['cursor'], 'Correct: 10^0.8 is about 6.310.')
            ]
        }
    },
    {
        id: 'll-banks', title: 'Choose the positive LL range', layout: 'loglog-banks',
        problem: 'Find a = e^0.02, b = e^0.3, c = e⁴, d = e²⁰ and f = e^0.005.',
        summary: 'Select the LL bank from the exponent: D/1000, D/100, D/10, D or 10D.',
        start: position(),
        steps: [
            move('LL1: hundredths in the exponent', 'At D 2, read LL1. This row uses exponent D/100, so it gives e^0.02 ≈ 1.02020. Each LL value includes its actual decimal place.',
                atD(2), 'cursor', ['LL1', 'D']),
            move('LL2: tenths in the exponent', 'Move to D 3 and use LL2, whose exponent is D/10. It reads e^0.3 ≈ 1.3499.',
                atD(3), 'cursor', ['LL2', 'D']),
            move('LL3: units in the exponent', 'At D 4, LL3 uses exponent D directly. Read e⁴ ≈ 54.60.',
                atD(4), 'cursor', ['LL3', 'D']),
            move('LL4: tens in the exponent', 'Return to D 2 and read LL4. Its exponent is 10D, so e²⁰ ≈ 4.852 × 10⁸. This large value belongs to LL4, not LL3.',
                atD(2), 'cursor', ['LL4', 'D']),
            move('LL0: thousandths in the exponent', 'At D 5, LL0 uses exponent D/1000. It reads e^0.005 ≈ 1.005013. LL0 through LL4 cover successive exponent ranges; never shift the decimal of an LL answer to substitute for another row.',
                atD(5), 'cursor', ['LL0', 'D'])
        ],
        practice: {
            problem: 'Find x = e^0.06 and y = e³⁰.',
            intro: 'Choose a bank by the exponent before moving the hairline.',
            note: ABSOLUTE_LL_NOTE,
            start: position(),
            steps: [
                exercise('Use LL1 for e^0.06', 'Since 0.06 = 6/100, move to D 6 and read LL1.',
                    atD(6), ['cursor'], 'Correct: LL1 reads about 1.06184.'),
                exercise('Use LL4 for e³⁰', 'Since 30 = 10 × 3, move to D 3 and read LL4.',
                    atD(3), ['cursor'], 'Correct: e³⁰ is about 1.069 × 10¹³.')
            ]
        }
    },
    {
        id: 'exponential', title: 'Evaluate e to a power', layout: 'loglog-main',
        problem: 'Find x = e^0.4 and y = e².',
        summary: 'Use a natural exponential directly, choosing the row that contains its exponent.',
        start: position(),
        steps: [
            move('Evaluate e^0.4', 'The constant e is about 2.718. For exponent 0.4, use LL2 at D 4 because this row uses D/10. Read e^0.4 ≈ 1.4918.',
                atD(4), 'cursor', ['LL2', 'D']),
            move('Evaluate e²', 'Move to D 2 and use LL3, where the exponent equals D. Read e² ≈ 7.389. The LL row gives the exponential; D supplies its exponent with the row’s stated factor.',
                atD(2), 'cursor', ['LL3', 'D'])
        ],
        practice: {
            problem: 'Find x = e^0.7.',
            intro: 'Find e^0.7 using the exponent range on LL2.',
            note: ABSOLUTE_LL_NOTE,
            start: position(),
            steps: [
                exercise('Evaluate e^0.7', 'Move to D 7 and read LL2, whose exponent is D/10.',
                    atD(7), ['cursor'], 'Correct: e^0.7 is about 2.014.')
            ]
        }
    },
    {
        id: 'natural-log', title: 'Read natural logarithms', layout: 'loglog-main',
        problem: 'Find x = ln(2) and y = ln(10).',
        summary: 'Reverse an LL lookup to find the exponent that produces a given number.',
        start: position(),
        steps: [
            move('Find ln(2) on LL2', 'Put the hairline at LL2 2. D reads about 6.931. LL2 uses exponent D/10, so ln(2) ≈ 0.6931. The logarithm is the exponent, not the LL value itself.',
                atD(10 * ln2), 'cursor', ['LL2', 'D']),
            move('Find ln(10) on LL3', 'Find LL3 10. D reads about 2.303; LL3 uses exponent D without an extra factor. Thus ln(10) ≈ 2.303. Natural logarithms use base e, whereas L gives base-ten logarithms.',
                atD(Math.LN10), 'cursor', ['LL3', 'D'])
        ],
        practice: {
            problem: 'Find x = ln(3).',
            intro: 'Find the exponent that makes eˣ equal 3.',
            start: position(),
            steps: [
                exercise('Find ln(3)', 'Find 3 on LL3 and put the hairline there. Read its natural logarithm directly on D.',
                    atD(ln3), ['cursor'], 'Correct: ln(3) is about 1.099.')
            ]
        }
    },
    {
        id: 'positive-power', title: 'Raise a positive number to a power', layout: 'loglog-main',
        problem: 'Find x = 3^2.5.',
        summary: 'Multiply the natural logarithm by the exponent, then read the result on LL.',
        start: position(),
        steps: [
            move('Find the base on LL3', 'Put the hairline at LL3 3. D gives ln(3) ≈ 1.099. The identity 3^2.5 = e^(2.5 ln(3)) turns this power into multiplication of a logarithm.',
                atD(ln3), 'cursor', ['LL3', 'D']),
            move('Set the exponent multiplier', 'Hold the cursor at LL3 3 and slide C 1 under the hairline. This sets multiplication by ln(3), just as an ordinary C/D multiplication sets its first factor.',
                position(log(ln3), log(ln3)), 'slide', ['C', 'LL3', 'D']),
            move('Move to exponent 2.5', 'Move the cursor to C 2.5. D now gives 2.5 ln(3), and LL3 reads about 15.59: 3^2.5 ≈ 15.59. Both the base and result fit the same LL3 range.',
                position(log(ln3), log(2.5 * ln3)), 'cursor', ['C', 'LL3', 'D'])
        ],
        practice: {
            problem: 'Find x = 4^1.5.',
            intro: 'Use 4 as the base and multiply its natural logarithm by 1.5.',
            note: ABSOLUTE_LL_NOTE,
            start: position(),
            steps: [
                exercise('Find the base 4', 'Move the hairline to LL3 4. D gives its natural logarithm.',
                    atD(ln4), ['cursor'], 'The base is set: D reads ln(4), about 1.386.'),
                exercise('Align C 1', 'Keep the cursor fixed and bring C 1 under the hairline.',
                    position(log(ln4), log(ln4)), ['slideOffset', 'cursor'], 'C 1 is aligned with LL3 4.', 'slide'),
                exercise('Use exponent 1.5', 'Move the cursor to C 1.5 and read the answer on LL3.',
                    position(log(ln4), log(1.5 * ln4)), ['slideOffset', 'cursor'], 'Correct: 4^1.5 = 8.')
            ]
        }
    },
    {
        id: 'll-roots', title: 'Find roots by dividing a logarithm', layout: 'loglog-main',
        problem: 'Find x = √16.',
        summary: 'A fractional power divides the logarithm: the nth root of a is e^(ln(a)/n).',
        start: position(),
        steps: [
            move('Find the radicand 16', 'Move to LL3 16. D gives ln(16), about 2.773. To find the square root, divide this logarithm by 2, then return from the logarithm to its LL value.',
                atD(ln16), 'cursor', ['LL3', 'D']),
            move('Place C 2 under the hairline', 'Keep the cursor fixed and move C 2 under it. This sets division of ln(16) by 2.',
                position(log(ln16) - log(2), log(ln16)), 'slide', ['C', 'LL3', 'D']),
            move('Read the root at C 1', 'Move the cursor to C 1. D gives ln(16)/2, about 1.386, and LL3 reads 4. Thus 16^(1/2) = √16 = 4.',
                position(log(ln16) - log(2), log(ln16) - log(2)), 'cursor', ['C', 'LL3', 'D'])
        ],
        practice: {
            problem: 'Find x = ∛27.',
            intro: 'A cube root uses one third of the natural logarithm.',
            note: ABSOLUTE_LL_NOTE,
            start: position(),
            steps: [
                exercise('Find 27 on LL3', 'Put the hairline at LL3 27 to obtain ln(27) on D.',
                    atD(ln27), ['cursor'], 'The cursor now carries ln(27), about 3.296.'),
                exercise('Divide the logarithm by 3', 'Hold the cursor still and slide C 3 beneath it.',
                    position(log(ln27) - log(3), log(ln27)), ['slideOffset', 'cursor'], 'C 3 is aligned with ln(27) on D.', 'slide'),
                exercise('Read the cube root', 'Move the cursor to C 1. Read the root on LL3 at the same hairline.',
                    position(log(ln27) - log(3), log(ln27) - log(3)), ['slideOffset', 'cursor'], 'Correct: 27^(1/3) = ∛27 = 3.')
            ]
        }
    },
    {
        id: 'negative-exponents', title: 'Use negative exponents and inverse LL ranges', layout: 'loglog-negative',
        problem: 'Find a = e^(−0.02), b = e^(−0.3), c = e⁻⁴, d = e⁻²⁰, f = e^(−0.005) and g = 2⁻³.',
        summary: 'Read inverse LL banks for values below one, then use them for a negative power.',
        start: position(),
        steps: [
            move('LL01: exponent −D/100', 'At D 2, LL01 gives e^(−0.02) ≈ 0.9802. The inverse banks decrease as the cursor moves right: larger positive D means a more negative exponent.',
                atD(2), 'cursor', ['LL01', 'D']),
            move('LL02: exponent −D/10', 'Move to D 3 and read LL02. Its exponent is −D/10, so e^(−0.3) ≈ 0.7408.',
                atD(3), 'cursor', ['LL02', 'D']),
            move('LL03: exponent −D', 'At D 4, LL03 gives e⁻⁴ ≈ 0.01832. Keep this full value, including its decimal places.',
                atD(4), 'cursor', ['LL03', 'D']),
            move('LL04: exponent −10D', 'Return to D 2 and use LL04. It gives e⁻²⁰ ≈ 2.061 × 10⁻⁹. The small value is a genuine result, not zero.',
                atD(2), 'cursor', ['LL04', 'D']),
            move('LL00: exponent −D/1000', 'At D 5, LL00 gives e^(−0.005) ≈ 0.9950. LL00 through LL04 cover all five inverse exponent ranges in this emulator.',
                atD(5), 'cursor', ['LL00', 'D']),
            move('Start 2⁻³ from the reciprocal base', 'Since 2⁻³ = (1/2)³, find 0.5 on LL02. D reads about 6.931, representing 10 ln(2). We will multiply the magnitude of this negative logarithm by 3.',
                atD(10 * ln2), 'cursor', ['LL02', 'D']),
            move('Use the right index C 10', 'Keep the cursor at LL02 0.5 and align C 10 beneath it. The right index keeps the coming cursor movement on the rule and reduces the D coefficient by a factor of ten.',
                position(log(10 * ln2) - 1, log(10 * ln2)), 'slide', ['C', 'LL02', 'D']),
            move('Read 2⁻³ on LL03', 'Move to C 3. D now reads 3 ln(2) ≈ 2.079, so use LL03, whose exponent is −D. It reads 0.125: 2⁻³ = 1/8. The index change required a different LL bank, not a shifted decimal in the answer.',
                position(log(10 * ln2) - 1, log(3 * ln2)), 'cursor', ['C', 'LL03', 'D'])
        ],
        practice: {
            problem: 'Find x = 3⁻².',
            intro: 'Write 3⁻² = (1/3)². This example starts and finishes in LL03.',
            note: ABSOLUTE_LL_NOTE,
            start: position(),
            steps: [
                exercise('Find the reciprocal base', 'Move to LL03 1/3, about 0.3333. D then gives ln(3).',
                    atD(ln3), ['cursor'], 'The reciprocal base is set: LL03 reads about 0.3333.'),
                exercise('Set multiplication by ln(3)', 'Keep the cursor still and align C 1 beneath it.',
                    position(log(ln3), log(ln3)), ['slideOffset', 'cursor'], 'C 1 is aligned with the reciprocal base.', 'slide'),
                exercise('Apply the power 2', 'Move to C 2 and read the result on LL03.',
                    position(log(ln3), log(2 * ln3)), ['slideOffset', 'cursor'], 'Correct: 3⁻² = 1/9, about 0.1111.')
            ]
        }
    },
    {
        id: 'compound-growth', title: 'Keep precision for values near one', layout: 'loglog-near',
        problem: 'Find x = (1 + 0.002)⁴ and y = (1 + 0.002)⁸.',
        summary: 'Use LL0 for a small growth factor, then change banks when repeated growth crosses its range.',
        start: position(),
        steps: [
            move('Find the one-period growth factor', 'Growth of 0.2% per period has multiplier 1.002. Find 1.002 on LL0. D reads about 1.998, representing 1000 ln(1.002). Preserve the small excess above one when reading this scale.',
                atD(growthD), 'cursor', ['LL0', 'D']),
            move('Set one period at C 1', 'Keep the cursor at LL0 1.002 and align C 1 beneath it. The C scale will now count periods while D multiplies the logarithm.',
                position(log(growthD), log(growthD)), 'slide', ['C', 'LL0', 'D']),
            move('Read four periods on LL0', 'Move to C 4. LL0 reads about 1.008024, so (1.002)⁴ ≈ 1.008024. The total growth is about 0.8024%, obtained by subtracting 1 from the full multiplier.',
                position(log(growthD), log(4 * growthD)), 'cursor', ['C', 'LL0', 'D']),
            move('Return to the original multiplier', 'Move back to C 1 at LL0 1.002. Eight periods would put the cursor beyond the right end with this slide setting, so we will change index before applying 8.',
                position(log(growthD), log(growthD)), 'cursor', ['C', 'LL0', 'D']),
            move('Align the right index', 'Hold the cursor at 1.002 and slide C 10 beneath it. This changes the D coefficient by a factor of ten, which must be matched by the appropriate LL row.',
                position(log(growthD) - 1, log(growthD)), 'slide', ['C', 'LL0', 'D']),
            move('Read eight periods on LL1', 'Move to C 8 and read LL1. Its exponent D/100 equals 8 ln(1.002), so (1.002)⁸ ≈ 1.01611. That is about 1.611% total growth. LL0 would represent a different exponent at this new position.',
                position(log(growthD) - 1, log(800 * growth)), 'cursor', ['C', 'LL1', 'D'])
        ],
        practice: {
            problem: 'Find x = (1 + 0.003)⁵.',
            intro: 'Find the multiplier for five periods of 0.3% growth per period. Use the right index and change from LL0 to LL1.',
            note: ABSOLUTE_LL_NOTE,
            start: position(),
            steps: [
                exercise('Find 1.003 on LL0', 'Put the hairline at LL0 1.003. D represents 1000 ln(1.003).',
                    atD(practiceGrowthD), ['cursor'], 'The one-period multiplier is set at 1.003.'),
                exercise('Use C 10', 'Keep the hairline fixed and slide the right index C 10 beneath it.',
                    position(log(practiceGrowthD) - 1, log(practiceGrowthD)), ['slideOffset', 'cursor'], 'C 10 is aligned; the result will use LL1.', 'slide'),
                exercise('Apply five periods', 'Move to C 5 and read the full multiplier on LL1. Subtract 1 to obtain the total fractional growth.',
                    position(log(practiceGrowthD) - 1, log(500 * practiceGrowth)), ['slideOffset', 'cursor'], 'Correct: (1.003)⁵ ≈ 1.01509, or about 1.509% total growth.')
            ]
        }
    },
    {
        id: 'solve-exponent', title: 'Solve for an unknown exponent', layout: 'loglog-main',
        problem: 'Solve 4ˣ = 20 for x.',
        summary: 'Use a ratio of natural logarithms: aˣ = b gives x = ln(b)/ln(a).',
        start: position(),
        steps: [
            move('Find the base 4', 'Put the hairline at LL3 4. D gives ln(4), about 1.386. Taking natural logarithms of 4ˣ = 20 gives x ln(4) = ln(20).',
                atD(ln4), 'cursor', ['LL3', 'D']),
            move('Set C 1 at the base', 'Keep the cursor still and align C 1 beneath it. The C reading will now give a D logarithm divided by ln(4).',
                position(log(ln4), log(ln4)), 'slide', ['C', 'LL3', 'D']),
            move('Find the required value 20', 'Move to LL3 20. D gives ln(20), and C reads ln(20)/ln(4) ≈ 2.161. Thus 4^2.161 ≈ 20. Both logarithms use the same LL3 factor, so their ratio needs no bank correction.',
                position(log(ln4), log(ln20)), 'cursor', ['C', 'LL3', 'D'])
        ],
        practice: {
            problem: 'Solve 3ˣ = 15 for x.',
            intro: 'Set C 1 at the base, then read the required exponent opposite the result on LL3.',
            start: position(),
            steps: [
                exercise('Find the base 3', 'Put the hairline at LL3 3.',
                    atD(ln3), ['cursor'], 'D now gives ln(3), the denominator of the logarithm ratio.'),
                exercise('Align C 1 with the base', 'Hold the cursor fixed and align C 1 beneath it.',
                    position(log(ln3), log(ln3)), ['slideOffset', 'cursor'], 'The slide is set to divide logarithms by ln(3).', 'slide'),
                exercise('Find the required result 15', 'Move to LL3 15. Read x on C at the same hairline.',
                    position(log(ln3), log(Math.log(15))), ['slideOffset', 'cursor'], 'Correct: x = ln(15)/ln(3) ≈ 2.465.')
            ]
        }
    }
]);
