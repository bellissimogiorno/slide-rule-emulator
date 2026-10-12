/** N-model scale order, not the later 24-row 2/82 (see docs/FABER_282N.md). */
export const faber282nPresets = {
    faber282n: {
        group: 'Classic instruments',
        name: 'Faber-Castell 2/82N',
        modelLabel: 'A.W. Faber-Castell 2/82N Castell-Duplex',
        theme: 'faber', density: 'faber', showFormulas: true,
        description: 'The 1962 N-model: paired tangent/cotangent and sine/cosine, movable S-prime and K-prime, reciprocal squares, folded arithmetic and six log-log ranges.',
        instrumentNote: 'N-model main intervals from the manufacturer\u2019s manual. S and S-prime multiply sine values; K and K-prime support cube calculations. Red angular readings are complements, not reciprocals. Original end extensions, every gauge mark and auxiliary cursor lines are not reproduced.',
        sides: {
            front: {
                name: 'Front - trigonometric / S-prime',
                topStator: ['FC282_T1', 'FC282_T2', 'L', 'A'],
                slide: ['B', 'BI', 'CI', 'FC282_SP', 'C'],
                bottomStator: ['D', 'FC282_S', 'ST', 'FC282_P']
            },
            back: {
                name: 'Back - K-prime / folded / log-log',
                topStator: ['LL03', 'LL02', 'LL01', 'K', 'DF'],
                slide: ['CF', 'FC282_KP', 'CIF', 'CI', 'C'],
                bottomStator: ['D', 'LL1', 'LL2', 'LL3']
            }
        }
    }
};
