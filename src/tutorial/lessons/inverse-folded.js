import { log, position, move, exercise, sectionLessons, ESTIMATE_NOTE } from '#tutorial/lesson-data.js';

// A pi-folded ordinary scale starts at pi. Its interior 10 | 1 index is
// 1 - log10(pi) along the rail; the two physical ends both represent pi.
const piLog = log(Math.PI);
const folded = value => {
    const p = log(value) - piLog;
    return p < 0 ? p + 1 : p;
};
const foldedUnit = folded(1);

export const INVERSE_FOLDED_LESSONS = sectionLessons('inverse-folded', [
    {
        id: 'fixed-reciprocals', title: 'Compare DI and CI', layout: 'inverse',
        problem: '1 ÷ 4',
        summary: 'Use fixed DI for a reciprocal and see why moving CI needs an alignment.',
        start: position(),
        steps: [
            move('Read a reciprocal on DI',
                'Put the hairline at D 4. Fixed DI reads 2.5: divide by ten to get 1 ÷ 4 = 0.25. The aligned CI scale also reads 2.5. Both inverse scales run from 10 on the left to 1 on the right.',
                position(0, log(4)), 'cursor', ['DI', 'CI', 'D']),
            move('See which scale moves',
                'Keep the hairline at D 4. Move the slide until CI 5 reaches it. CI now reads 5, while fixed DI still reads 2.5. DI continues to give the reciprocal of D; displaced CI does not.',
                position(log(2), log(4)), 'slide', ['DI', 'CI', 'D']),
            move('Restore the aligned CI reading',
                'Return CI 2.5 to the hairline at D 4. The slide is aligned again and CI agrees with DI. The reciprocal remains 0.25; estimate it as a number smaller than one.',
                position(0, log(4)), 'slide', ['DI', 'CI', 'D'])
        ],
        practice: {
            problem: '1 ÷ 8',
            intro: 'The slide starts displaced. Find 1 ÷ 8 on fixed DI, then align CI so it gives the same reciprocal.',
            note: ESTIMATE_NOTE,
            start: position(log(2)),
            steps: [
                exercise('Mark D 8', 'Move the hairline to D 8. Use fixed DI even though the slide is displaced.',
                    position(log(2), log(8)), ['cursor'],
                    'DI reads about 1.25. Dividing by ten gives 1 ÷ 8 = 0.125, regardless of the slide position.'),
                exercise('Match CI to DI', 'Keep the hairline at D 8. Move the slide until CI agrees with DI at 1.25.',
                    position(0, log(8)), ['slideOffset', 'cursor'],
                    'Correct: the slide is aligned, so CI and DI both read about 1.25. The reciprocal is 0.125.', 'slide')
            ]
        }
    },
    {
        id: 'inverse-arithmetic', title: 'Divide and multiply with CI', layout: 'inverse',
        problem: '6 ÷ 2',
        summary: 'Use CI’s right-hand 1 for division, then read the same alignment in reverse.',
        start: position(),
        steps: [
            move('Hold the dividend', 'Put the hairline at D 6 and hold it there while setting the slide.',
                position(0, log(6)), 'cursor', ['D']),
            move('Use CI’s right-hand 1',
                'Move CI’s 1 at the physical right-hand end to the hairline at D 6. CI is reversed: its left-hand end reads 10. Choose the end labelled 1.',
                position(log(6) - 1, log(6)), 'slide', ['CI', 'D']),
            move('Read the quotient at CI 2',
                'Move left to CI 2. D reads 3, so 6 ÷ 2 = 3. Keep the slide in this position.',
                position(log(6) - 1, log(3)), 'cursor', ['CI', 'D']),
            move('Read the multiplication in reverse',
                'CI 2 is aligned with D 3. Return to CI’s right-hand 1 and read D 6: the same setting shows 3 × 2 = 6. Reversing CI turns the division arrangement into a multiplication arrangement.',
                position(log(6) - 1, log(6)), 'cursor', ['CI', 'D'])
        ],
        practice: {
            problem: '8 ÷ 2',
            intro: 'Divide 8 by 2 with CI, then use the same setting to check the reverse multiplication.',
            note: ESTIMATE_NOTE,
            start: position(),
            steps: [
                exercise('Hold D 8', 'Put the hairline at D 8.',
                    position(0, log(8)), ['cursor'], 'The dividend is marked. Keep the hairline here.'),
                exercise('Align CI’s right-hand 1', 'Move the physical right-hand 1 of CI to the hairline at D 8.',
                    position(log(8) - 1, log(8)), ['slideOffset', 'cursor'],
                    'The division is set. Keep the slide here.', 'slide'),
                exercise('Read at CI 2', 'Move the hairline to CI 2 and read the quotient on D.',
                    position(log(8) - 1, log(4)), ['slideOffset', 'cursor'],
                    'Correct: D reads about 4, giving 8 ÷ 2 = 4.'),
                exercise('Check the reverse multiplication', 'Without moving the slide, return to CI’s right-hand 1. Read D to check 4 × 2.',
                    position(log(8) - 1, log(8)), ['slideOffset', 'cursor'],
                    'Correct: D reads about 8. The same alignment gives 4 × 2 = 8.')
            ]
        }
    },
    {
        id: 'inverse-chain', title: 'Chain a product with CI', layout: 'inverse',
        problem: '2 × 3 × 4',
        summary: 'Use one CI alignment for the first product, then read a third factor on C.',
        start: position(),
        steps: [
            move('Mark the first factor', 'Put the hairline at D 2 for the first factor of 2 × 3 × 4.',
                position(0, log(2)), 'cursor', ['D']),
            move('Put CI 3 at D 2',
                'Move CI 3 to the held hairline at D 2. Since CI runs backwards, the product of the aligned CI and D readings is constant along their common visible range.',
                position(log(6) - 1, log(2)), 'slide', ['CI', 'D']),
            move('See the intermediate product',
                'Move to CI’s 1 at its physical right-hand end. D reads 6, the product 2 × 3. Keep the slide here.',
                position(log(6) - 1, log(6)), 'cursor', ['CI', 'D']),
            move('Take the third factor from C',
                'Now move to 4 on ordinary C, which moves with CI. D reads 2.4. This arrangement gives the three-factor product divided by ten; 2 × 3 × 4 is about 24, so interpret the reading as 24.',
                position(log(6) - 1, log(2.4)), 'cursor', ['C', 'D'])
        ],
        practice: {
            problem: '3 × 2 × 5',
            intro: 'Use CI for the first two factors, then read the third factor on C without resetting the slide. Estimate the final size first.',
            note: ESTIMATE_NOTE,
            start: position(),
            steps: [
                exercise('Mark D 3', 'Move the hairline to D 3.',
                    position(0, log(3)), ['cursor'], 'The first factor is marked.'),
                exercise('Align CI 2 with D 3', 'Move CI 2 to the held hairline at D 3.',
                    position(log(6) - 1, log(3)), ['slideOffset', 'cursor'],
                    'The first multiplication is set. Keep the slide here.', 'slide'),
                exercise('Read the intermediate product', 'Move to CI’s physical right-hand 1 and read D.',
                    position(log(6) - 1, log(6)), ['slideOffset', 'cursor'],
                    'D reads about 6: this is 3 × 2. Keep the slide in place.'),
                exercise('Read the third factor on C', 'Move to C 5. Read D and use your estimate to choose the decimal place.',
                    position(log(6) - 1, log(3)), ['slideOffset', 'cursor'],
                    'Correct: D reads about 3. The three-factor product is 30, since 3 × 2 × 5 = 30.')
            ]
        }
    },
    {
        id: 'multiply-pi', title: 'Multiply by π across the scales', layout: 'folded',
        problem: '2 × π; 3 × π; 4 × π',
        summary: 'Read D against DF, and aligned C against CF, to multiply by π.',
        start: position(),
        steps: [
            move('Read from D 2 to DF',
                'The slide is aligned. Put the hairline at D 2: DF reads about 6.283, giving 2 × π. At this same hairline, C 2 and CF 6.283 show the same relationship. The physical ends of CF and DF are labelled π, not 1.',
                position(0, log(2)), 'cursor', ['D', 'DF', 'C', 'CF']),
            move('Try a second input',
                'Move to D 3. DF reads about 9.425, giving 3 × π. Aligned C and CF agree. The folded scale preserves logarithmic spacing while changing where the decade begins.',
                position(0, log(3)), 'cursor', ['D', 'DF', 'C', 'CF']),
            move('Cross the decimal break',
                'Move to D 4. DF and CF read about 1.257 after their interior 10 | 1 break. Since π is a little greater than 3, 4 × π is about 12.57. The scale gives the significant digits; your estimate supplies the decimal place.',
                position(0, log(4)), 'cursor', ['D', 'DF', 'C', 'CF'])
        ],
        practice: {
            problem: '5 × π',
            intro: 'Keep the slide aligned. Find 5 × π by reading from D to DF, and check the same relationship from C to CF.',
            note: ESTIMATE_NOTE,
            start: position(),
            steps: [
                exercise('Read across at D 5', 'Move the hairline to D 5, keeping C aligned with D. Read DF and CF and choose the decimal place.',
                    position(0, log(5)), ['slideOffset', 'cursor'],
                    'Correct: DF and CF read about 1.571. Therefore 5 × π is about 15.71.')
            ]
        }
    },
    {
        id: 'folded-multiply', title: 'Keep a product on the folded scales', layout: 'folded',
        problem: '4 × 3',
        summary: 'Use the interior unit index on CF to keep a product within the visible rails.',
        start: position(),
        steps: [
            move('Consider the ordinary setup', 'Mark D 4 for 4 × 3. First see why the usual left-hand C index would be inconvenient.',
                position(0, log(4)), 'cursor', ['C', 'D']),
            move('See where C 3 would go',
                'Move C’s left-hand 1 to D 4. C 3 is now beyond the right-hand end of the fixed rule. A different index or a folded pair can keep the calculation visible.',
                position(log(4), log(4)), 'slide', ['C', 'D']),
            move('Start again on DF',
                'Move the hairline to 4 on fixed DF. Its physical ends represent π, so its unit index is inside the scale at the mark labelled 10 | 1.',
                position(log(4), folded(4)), 'cursor', ['DF']),
            move('Align CF’s interior unit index',
                'Move CF’s interior 10 | 1 mark to the hairline at DF 4. Use this mark as 1 for the multiplication. The physical end labelled π is a different index.',
                position(folded(4) - foldedUnit, folded(4)), 'slide', ['CF', 'DF']),
            move('Read the product at CF 3',
                'Move to 3 on CF. DF reads 1.2, comfortably inside the fixed rule. Your estimate puts the result above ten: 4 × 3 = 12. Keep track of the decimal place when crossing the folded scale’s 10 | 1 break.',
                position(folded(4) - foldedUnit, folded(1.2)), 'cursor', ['CF', 'DF'])
        ],
        practice: {
            problem: '6 × 2.5',
            intro: 'Use CF and DF for 6 × 2.5. Align the interior unit index, then read the second factor on CF.',
            note: ESTIMATE_NOTE,
            start: position(),
            steps: [
                exercise('Mark DF 6', 'Move the hairline to 6 on fixed DF.',
                    position(0, folded(6)), ['cursor'], 'The first factor is marked on DF.'),
                exercise('Align CF’s interior 1', 'Move the interior 10 | 1 index on CF to the held hairline at DF 6. Use it as 1.',
                    position(folded(6) - foldedUnit, folded(6)), ['slideOffset', 'cursor'],
                    'The folded multiplication is set. Keep the slide here.', 'slide'),
                exercise('Read at CF 2.5', 'Move the hairline to CF 2.5. Read DF and interpret the result using your estimate.',
                    position(folded(6) - foldedUnit, folded(1.5)), ['slideOffset', 'cursor'],
                    'Correct: DF reads about 1.5. The product 6 × 2.5 is 15.')
            ]
        }
    },
    {
        id: 'folded-divide', title: 'Divide on CF and DF', layout: 'folded',
        problem: '8 ÷ 2',
        summary: 'Align the divisor on CF and read the quotient at CF’s interior unit index.',
        start: position(),
        steps: [
            move('Mark the dividend on DF', 'Move the hairline to DF 8 for 8 ÷ 2.',
                position(0, folded(8)), 'cursor', ['DF']),
            move('Put CF 2 at DF 8', 'Move CF 2 to the held hairline at DF 8. The alignment records the divisor while the cursor holds the dividend.',
                position(folded(8) - folded(2), folded(8)), 'slide', ['CF', 'DF']),
            move('Read at the interior 1',
                'Move the hairline to CF’s interior 10 | 1 mark, using it as 1. DF reads 4, so 8 ÷ 2 = 4. Do not use CF’s physical end labelled π for this step.',
                position(folded(8) - folded(2), folded(4)), 'cursor', ['CF', 'DF'])
        ],
        practice: {
            problem: '9 ÷ 2',
            intro: 'Divide 9 by 2 on the folded pair. Use CF’s interior unit index for the final reading.',
            note: ESTIMATE_NOTE,
            start: position(),
            steps: [
                exercise('Mark DF 9', 'Move the hairline to DF 9.',
                    position(0, folded(9)), ['cursor'], 'The dividend is marked on DF.'),
                exercise('Align CF 2 with DF 9', 'Move CF 2 to the held hairline at DF 9.',
                    position(folded(9) - folded(2), folded(9)), ['slideOffset', 'cursor'],
                    'The division is set. Keep the slide here.', 'slide'),
                exercise('Read at CF’s interior 1', 'Move the hairline to CF’s interior 10 | 1 mark, using it as 1. Read the quotient on DF.',
                    position(folded(9) - folded(2), folded(4.5)), ['slideOffset', 'cursor'],
                    'Correct: DF reads about 4.5, giving 9 ÷ 2 = 4.5.')
            ]
        }
    },
    {
        id: 'folded-reciprocals', title: 'Read folded reciprocals', layout: 'folded-inverse',
        problem: '1 ÷ 4; 1 ÷ 8; 1 ÷ 2',
        summary: 'Read the inverse folded pair DIF and aligned CIF against DF.',
        start: position(),
        steps: [
            move('Compare DF with DIF',
                'Keep the slide aligned and move to DF 4. Fixed DIF and moving CIF both read 2.5: divide by ten to obtain 1 ÷ 4 = 0.25. These scales reverse the folded direction; their physical ends read 10/π, about 3.183, rather than 1.',
                position(0, folded(4)), 'cursor', ['DF', 'DIF', 'CIF']),
            move('Read a smaller reciprocal',
                'Move to DF 8. DIF and aligned CIF read about 1.25, giving 1 ÷ 8 = 0.125 after division by ten. As the DF value increases, its reciprocal decreases.',
                position(0, folded(8)), 'cursor', ['DF', 'DIF', 'CIF']),
            move('Pass the inverse decimal break',
                'Move to DF 2, beyond the interior decimal break. DIF and aligned CIF read 5, giving 1 ÷ 2 = 0.5. DF labels the break 10 | 1; the inverse scales label it 1 | 10. Both marks occupy the same place on aligned rails.',
                position(0, folded(2)), 'cursor', ['DF', 'DIF', 'CIF'])
        ],
        practice: {
            problem: '1 ÷ 5',
            intro: 'Keep CIF’s ends aligned with the fixed rails. Find 1 ÷ 5 using DF with DIF, and confirm that aligned CIF agrees.',
            note: ESTIMATE_NOTE,
            start: position(),
            steps: [
                exercise('Read the inverse at DF 5', 'Move the hairline to DF 5 without shifting the slide. Read DIF and CIF, then divide their reading by ten.',
                    position(0, folded(5)), ['slideOffset', 'cursor'],
                    'Correct: DIF and aligned CIF read about 2. Dividing by ten gives 1 ÷ 5 = 0.2.')
            ]
        }
    }
]);
