/** Physical row order checked against Aristo specimen records.
 * ST precedes S on both instruments. Shared front/back slide motion is retained.
 */
const common = {
    group: 'Classic instruments', manufacturer: 'Aristo',
    theme: 'neutral', density: 'classic', showFormulas: true
};

export const aristoHyperbolicPresets = {
    aristo0971: {
        ...common,
        name: 'Aristo 0971 HyperboLog', modelLabel: 'Aristo 0971 HyperboLog',
        description: 'Twenty-five rows: hyperbolic sine and tangent, paired sine/cosine and tangent/cotangent, folded arithmetic and six log-log ranges.',
        instrumentNote: 'Documented 0971 row order and main mathematical intervals. Sh1 and Th use D as 0.1 to 1; Sh2 uses D as 1 to 10. Red angular readings are complements. Th stops at argument 3. The cursor includes the documented circle, metric-PS and 36 conversion marks. End extensions and the full original gauge inventory are not reproduced.',
        sides: {
            front: {
                name: 'Front - hyperbolic / trigonometric',
                topStator: ['ARISTO_TH', 'K', 'A'],
                slide: ['B', 'ARISTO_T', 'ARISTO_ST', 'ARISTO_S', 'C'],
                bottomStator: ['D', 'DI', 'ARISTO_SH2', 'ARISTO_SH1']
            },
            back: {
                name: 'Back - folded / log-log',
                topStator: ['LL01', 'LL02', 'LL03', 'DF'],
                slide: ['CF', 'CIF', 'L', 'CI', 'C'],
                bottomStator: ['D', 'LL3', 'LL2', 'LL1']
            }
        }
    },
    aristo0972: {
        ...common,
        name: 'Aristo 0972 HyperLog', modelLabel: 'Aristo 0972 HyperLog',
        description: 'Thirty-one rows: hyperbolic sine, cosine and tangent, H1/H2 hypotenuse ranges, Pythagorean P, paired trigonometry, folded arithmetic and eight log-log ranges.',
        instrumentNote: 'Documented 0972 row order and main mathematical intervals. H1/H2 read sqrt(1+x^2) at x on D (0.1 to 1 / 1 to 10). Ch gives the argument of cosh. Red angular readings are complements. Th stops at argument 3. The cursor includes the documented circle, metric-PS and 36 conversion marks. End extensions and the full original gauge inventory are not reproduced.',
        sides: {
            front: {
                name: 'Front - hyperbolic / Pythagorean',
                topStator: ['ARISTO_H2', 'ARISTO_SH2', 'ARISTO_TH', 'K', 'A'],
                slide: ['B', 'ARISTO_T', 'ARISTO_ST', 'ARISTO_S', 'ARISTO_P', 'C'],
                bottomStator: ['D', 'DI', 'ARISTO_CH', 'ARISTO_SH1', 'ARISTO_H1']
            },
            back: {
                name: 'Back - folded / log-log',
                topStator: ['LL00', 'LL01', 'LL02', 'LL03', 'DF'],
                slide: ['CF', 'CIF', 'L', 'CI', 'C'],
                bottomStator: ['D', 'LL3', 'LL2', 'LL1', 'LL0']
            }
        }
    }
};
