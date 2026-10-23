import { log, position, move, exercise, sectionLessons, ESTIMATE_NOTE } from '#tutorial/lesson-data.js';

// L and LN are fixed linear rows in these teaching layouts. CF/M and DF/M
// retain the ordinary folded logarithmic mapping, with fold ln(10), not pi.
const atD = value => position(0, log(value));
const atLn = value => position(0, value / Math.LN10);
const foldLog = log(Math.LN10);
const folded = value => {
    const p = log(value) - foldLog;
    return p < 0 ? p + 1 : p;
};
const unitIndex = 1 - foldLog;
const demoDivisionOffset = log(2) - folded(3);
const practiceDivisionOffset = log(3) - folded(4);
const BASE_NOTE = 'The check verifies alignment. Use the stated decade and sign to interpret the complete logarithm or power.';

export const LOG_CONVERSION_LESSONS = sectionLessons('log-conversions', [
    {
        id: 'log-characteristic', title: 'Give a common logarithm its characteristic', layout: 'logarithm',
        problem: 'Find x = log₁₀(250) and y = log₁₀(0.04).',
        summary: 'Separate a number into m × 10ᵏ: L supplies log₁₀(m), and k supplies the characteristic.',
        start: position(),
        steps: [
            move('Separate 250 into a mantissa and decade', 'Write 250 = 2.5 × 10². Move to D 2.5 and read L ≈ 0.3979. Add the characteristic 2: log₁₀(250) = 2 + log₁₀(2.5) ≈ 2.3979.',
                atD(2.5), 'cursor', ['L', 'D']),
            move('Keep the negative characteristic separate', 'Write 0.04 = 4 × 10⁻². At D 4, L reads about 0.6021. Hence log₁₀(0.04) = −2 + 0.6021 ≈ −1.3979. The positive L reading is added to −2; it is not made negative by itself.',
                atD(4), 'cursor', ['L', 'D'])
        ],
        practice: {
            problem: 'Find x = log₁₀(600) and y = log₁₀(0.008).',
            intro: 'Express each input as m × 10ᵏ with 1 ≤ m < 10. Add k to the L reading.',
            note: BASE_NOTE,
            start: position(),
            steps: [
                exercise('Read the mantissa for 600', 'Since 600 = 6 × 10², move to D 6. Add 2 to its L reading.',
                    atD(6), ['cursor'], 'Correct: log₁₀(600) = 2 + log₁₀(6) ≈ 2.7782.'),
                exercise('Read the mantissa for 0.008', 'Since 0.008 = 8 × 10⁻³, move to D 8. Add −3 to the positive L reading.',
                    atD(8), ['cursor'], 'Correct: log₁₀(0.008) = −3 + log₁₀(8) ≈ −2.0969.')
            ]
        }
    },
    {
        id: 'extended-common-antilog', title: 'Extend an antilogarithm beyond one decade', layout: 'logarithm',
        problem: 'Find x = 10^2.4 and y = 10^(−1.3).',
        summary: 'Put the fractional part of the exponent on L and carry an integer power of ten separately.',
        start: position(),
        steps: [
            move('Split the exponent 2.4', 'Write 2.4 = 2 + 0.4. At L 0.4, D reads about 2.512. Multiply by 10²: 10^2.4 ≈ 251.2. The integer part determines the decimal place.',
                position(0, .4), 'cursor', ['L', 'D']),
            move('Use a positive fractional remainder', 'Write −1.3 = −2 + 0.7, so the remainder is in L’s 0–1 range. At L 0.7, D reads about 5.012. Multiply by 10⁻²: 10^(−1.3) ≈ 0.05012.',
                position(0, .7), 'cursor', ['L', 'D'])
        ],
        practice: {
            problem: 'Find x = 10^3.2 and y = 10^(−2.4).',
            intro: 'Choose an integer k and a remainder r between 0 and 1, then use 10^(k+r) = 10ᵏ × 10ʳ.',
            note: BASE_NOTE,
            start: position(),
            steps: [
                exercise('Set the fractional part of 3.2', 'Write 3.2 = 3 + 0.2. Put the hairline at L 0.2 and read D; carry the factor 10³.',
                    position(0, .2), ['cursor'], 'Correct: 10^3.2 ≈ 1.585 × 10³, or about 1585.'),
                exercise('Set the fractional part of −2.4', 'Write −2.4 = −3 + 0.6. Put the hairline at L 0.6; multiply the D reading by 10⁻³.',
                    position(0, .6), ['cursor'], 'Correct: 10^(−2.4) ≈ 3.981 × 10⁻³, or about 0.003981.')
            ]
        }
    },
    {
        id: 'linear-natural-log', title: 'Use the linear ln scale', layout: 'natural-linear',
        problem: 'Find x = ln(2), y = ln(7) and z = ln(50).',
        summary: 'Compare L with linear ln and add k ln(10) when a number lies outside the D decade.',
        start: position(),
        steps: [
            move('Compare the two logarithm bases', 'At D 2, linear ln reads about 0.6931 while L reads about 0.3010. They give ln(2) and log₁₀(2). This ln row runs uniformly from 0 to ln(10); UltraLog’s Ln alias has the same mapping.',
                atD(2), 'cursor', ['LN', 'L', 'D']),
            move('Recognise the scale by its mapping', 'Move to D 7. Linear ln reads about 1.946, giving ln(7). This is a logarithm lookup. Flying Fish’s subscripted Ln and LnI rows are exponential log-log banks; the similar name does not make those rows linear logarithm scales.',
                atD(7), 'cursor', ['LN', 'L', 'D']),
            move('Add a natural-log decade', 'Write 50 = 5 × 10. At D 5, ln reads about 1.609. Add ln(10) ≈ 2.302585: ln(50) = ln(5) + ln(10) ≈ 3.912. In general, ln(m × 10ᵏ) = ln(m) + k ln(10).',
                atD(5), 'cursor', ['LN', 'L', 'D'])
        ],
        practice: {
            problem: 'Find x = ln(3) and y = ln(0.4).',
            intro: 'Read ln directly for 3. For 0.4 = 4 × 10⁻¹, subtract one ln(10) from the ln(4) reading.',
            note: BASE_NOTE,
            start: position(),
            steps: [
                exercise('Find ln(3)', 'Put the hairline at D 3 and read the fixed linear ln row.',
                    atD(3), ['cursor'], 'Correct: ln(3) is about 1.099.'),
                exercise('Include the decade for ln(0.4)', 'Put the hairline at D 4. Read ln(4), then subtract ln(10) ≈ 2.302585.',
                    atD(4), ['cursor'], 'Correct: ln(0.4) = ln(4) − ln(10) ≈ −0.9163.')
            ]
        }
    },
    {
        id: 'linear-natural-antilog', title: 'Find powers of e on linear ln', layout: 'natural-linear',
        problem: 'Find x = e^1.5, y = e⁴ and z = e^(−0.4).',
        summary: 'Reverse the linear ln lookup; reduce an exponent by multiples of ln(10) to extend its range.',
        start: position(),
        steps: [
            move('Reverse a direct ln lookup', 'Put the hairline at 1.5 on linear ln. D reads about 4.482, so e^1.5 ≈ 4.482. The exponent fits the row’s 0–ln(10) range.',
                atLn(1.5), 'cursor', ['LN', 'L', 'D']),
            move('Reduce an exponent larger than ln(10)', 'Write 4 = ln(10) + 1.697415. Set 1.697415 on ln and read D ≈ 5.460. Since e^ln(10) = 10, multiply this reading by 10: e⁴ ≈ 54.60.',
                atLn(4 - Math.LN10), 'cursor', ['LN', 'L', 'D']),
            move('Reduce a negative exponent', 'Write −0.4 = −ln(10) + 1.902585. Set the positive remainder 1.902585 on ln. D reads about 6.703; multiply by 10⁻¹ to get e^(−0.4) ≈ 0.6703.',
                atLn(Math.LN10 - .4), 'cursor', ['LN', 'L', 'D'])
        ],
        practice: {
            problem: 'Find x = e^0.8 and y = e^(−1.2).',
            intro: 'Use e^(k ln(10) + r) = 10ᵏ × eʳ with 0 ≤ r < ln(10).',
            note: BASE_NOTE,
            start: position(),
            steps: [
                exercise('Find e^0.8', 'Set the hairline at 0.8 on linear ln and read D directly.',
                    atLn(.8), ['cursor'], 'Correct: e^0.8 is about 2.226.'),
                exercise('Find e^(−1.2)', 'Use −1.2 = −ln(10) + 1.102585. Set 1.102585 on ln, then multiply D by 10⁻¹.',
                    atLn(Math.LN10 - 1.2), ['cursor'], 'Correct: e^(−1.2) is about 0.3012.')
            ]
        }
    },
    {
        id: 'change-log-base', title: 'Change the base of a logarithm', layout: 'natural-linear',
        problem: 'Find x = log₂(6).',
        summary: 'Form a ratio of two logarithms using the same base; their common scaling cancels.',
        start: position(),
        steps: [
            move('Read the logarithm of the base', 'At D 2, read log₁₀(2) ≈ 0.3010 on L. The change-of-base identity is log₂(6) = log₁₀(6)/log₁₀(2). The ln readings could also be used, provided both logarithms use that same base.',
                atD(2), 'cursor', ['L', 'LN', 'D']),
            move('Read the logarithm of the argument', 'Move to D 6 and read log₁₀(6) ≈ 0.7782. We now need 0.7782 ÷ 0.3010. Multiply both by 10 to put them on C and D without changing the ratio.',
                atD(6), 'cursor', ['L', 'LN', 'D']),
            move('Mark ten times the numerator', 'Move to D 7.782, representing 10 log₁₀(6). Use the best values you can read rather than treating the rounded captions as exact.',
                atD(10 * log(6)), 'cursor', ['D']),
            move('Set ten times the denominator', 'Hold the cursor still and put C 3.010, representing 10 log₁₀(2), under the hairline. Equal factors of ten in numerator and denominator cancel.',
                position(log(log(6) / log(2)), log(10 * log(6))), 'slide', ['C', 'D']),
            move('Read the logarithm to base 2', 'Move to C 1. D reads about 2.585, giving log₂(6) ≈ 2.585. This fits the estimate 2 < log₂(6) < 3 because 2² < 6 < 2³.',
                position(log(log(6) / log(2)), log(log(6) / log(2))), 'cursor', ['C', 'D'])
        ],
        practice: {
            problem: 'Find x = log₃(7).',
            intro: 'Use log₃(7) = log₁₀(7)/log₁₀(3). Scale both logarithms by ten before the C/D division.',
            note: ESTIMATE_NOTE,
            start: position(),
            steps: [
                exercise('Read log₁₀(3)', 'Move to D 3 and read L for the denominator.',
                    atD(3), ['cursor'], 'The denominator is log₁₀(3), about 0.4771.'),
                exercise('Read log₁₀(7)', 'Move to D 7 and read L for the numerator.',
                    atD(7), ['cursor'], 'The numerator is log₁₀(7), about 0.8451.'),
                exercise('Mark the scaled numerator', 'Move to D 8.451, representing 10 log₁₀(7).',
                    atD(10 * log(7)), ['cursor'], 'The scaled numerator is held at the hairline.'),
                exercise('Set the scaled denominator', 'Hold the cursor still and put C 4.771, representing 10 log₁₀(3), beneath it.',
                    position(log(log(7) / log(3)), log(10 * log(7))), ['slideOffset', 'cursor'], 'The ratio is set on C and D.', 'slide'),
                exercise('Read at C 1', 'Move the hairline to C 1 and read D. The result must lie between 1 and 2 because 3 < 7 < 9.',
                    position(log(log(7) / log(3)), log(log(7) / log(3))), ['slideOffset', 'cursor'], 'Correct: log₃(7) is about 1.771.')
            ]
        }
    },
    {
        id: 'folded-log-convert', title: 'Convert between common and natural logarithms', layout: 'folded-log-conversion',
        problem: 'Given log₁₀(a) = 0.2, log₁₀(b) = 0.6 and ln(c) = 1.2, find ln(a), ln(b) and log₁₀(c).',
        summary: 'Use the ln(10) fold to multiply or divide by the logarithm-base conversion factor.',
        start: position(),
        steps: [
            move('Convert a common logarithm to a natural one', 'M means log₁₀(e), so 1/M = ln(10) ≈ 2.302585. With the slide aligned, D 2 and C 2 correspond to DF/M and CF/M ≈ 4.605. Thus 0.2 × ln(10) ≈ 0.4605: this is ln(a).',
                atD(2), 'cursor', ['D', 'DFM', 'C', 'CFM']),
            move('Keep the conversion decade when the fold wraps', 'Move to D 6, representing log₁₀(b) = 0.6. DF/M and aligned CF/M read about 1.382 after their 10 | 1 break. The estimate 0.6 × 2.3 ≈ 1.38 confirms ln(b) ≈ 1.382. Unlike π-folded CF/DF, these rows provide the ln(10) factor used in base conversion.',
                atD(6), 'cursor', ['D', 'DFM', 'C', 'CFM']),
            move('Convert a natural logarithm back to base ten', 'Find 1.2 on DF/M, with aligned CF/M agreeing. D reads about 5.212. Since log₁₀(c) = 1.2/ln(10) is about one half, interpret this as 0.5212. Folded rows provide significant digits; the estimate supplies the decade.',
                position(0, folded(1.2)), 'cursor', ['DFM', 'D', 'CFM', 'C'])
        ],
        practice: {
            problem: 'Given log₁₀(a) = 0.4 and ln(b) = 0.8, find ln(a) and log₁₀(b).',
            intro: 'Keep C aligned with D, so CF/M and DF/M agree. Use ln(x) = ln(10) log₁₀(x) in the appropriate direction.',
            note: ESTIMATE_NOTE,
            start: position(),
            steps: [
                exercise('Convert log₁₀(a) = 0.4', 'Move to D 4, representing 0.4. Read DF/M and CF/M, then divide their reading by ten.',
                    atD(4), ['slideOffset', 'cursor'], 'Correct: ln(a) = 0.4 ln(10) ≈ 0.9210.'),
                exercise('Convert ln(b) = 0.8', 'Find 8 on DF/M, representing 0.8. Read D and divide that reading by ten to obtain log₁₀(b). Keep the slide aligned.',
                    position(0, folded(8)), ['slideOffset', 'cursor'], 'Correct: log₁₀(b) = 0.8/ln(10) ≈ 0.3474.')
            ]
        }
    },
    {
        id: 'folded-log-chain', title: 'Calculate with the CF/M and DF/M pair', layout: 'folded-log-conversion',
        problem: 'Find x = ln(100)/3.',
        summary: 'Convert a logarithm with DF/M, then divide it using the moving CF/M partner and its interior unit index.',
        start: position(),
        steps: [
            move('Obtain ln(100) with the fixed conversion', 'Since ln(100) = 2 ln(10), put the hairline at D 2. Fixed DF/M reads about 4.605, the numerator. The ln(10) fold supplies this conversion directly; a π fold would supply a different constant.',
                atD(2), 'cursor', ['D', 'DFM']),
            move('Put the divisor on CF/M', 'Hold the hairline at DF/M 4.605 and move CF/M 3 beneath it. CF/M and DF/M now act as an ordinary folded division pair. Their physical ends represent ln(10), not 1.',
                position(demoDivisionOffset, log(2)), 'slide', ['CFM', 'DFM']),
            move('Read at the interior unit index', 'Move to CF/M’s interior 10 | 1 mark, using it as 1. DF/M reads about 1.535, so ln(100)/3 ≈ 1.535. Use the interior mark rather than the physical end marked 1/M.',
                position(demoDivisionOffset, demoDivisionOffset + unitIndex), 'cursor', ['CFM', 'DFM'])
        ],
        practice: {
            problem: 'Find x = ln(1000)/4.',
            intro: 'First use ln(1000) = 3 ln(10), then divide by 4 entirely on CF/M and DF/M.',
            note: ESTIMATE_NOTE,
            start: position(),
            steps: [
                exercise('Find the logarithm numerator', 'Move to D 3 and read ln(1000) on DF/M.',
                    atD(3), ['cursor'], 'DF/M reads about 6.908, since ln(1000) = 3 ln(10).'),
                exercise('Align the divisor 4', 'Keep the cursor fixed and put CF/M 4 beneath it.',
                    position(practiceDivisionOffset, log(3)), ['slideOffset', 'cursor'], 'The division by 4 is set on the folded pair.', 'slide'),
                exercise('Use the interior 1', 'Move to CF/M’s interior 10 | 1 index, using it as 1. Read DF/M and estimate the quotient.',
                    position(practiceDivisionOffset, practiceDivisionOffset + unitIndex), ['slideOffset', 'cursor'], 'Correct: ln(1000)/4 ≈ 1.727.')
            ]
        }
    }
]);
