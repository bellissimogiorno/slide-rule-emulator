/** The duplex Mathema 2/84N, with the principal .1–1 decade on both faces. */
export const mathemaPresets = {
    faber284n: {
        group: 'Classic instruments',
        name: 'Faber-Castell 2/84N Mathema',
        modelLabel: 'A.W. Faber-Castell 2/84N Mathema',
        theme: 'faber', density: 'faber', showFormulas: true,
        description: 'Mathema duplex: decimal y/Y number scales, parabolic and Pythagorean scales, gon trigonometric and hyperbolic functions, six log-log rows and two linear exponential rows.',
        instrumentNote: 'Mathema 2/84N principal y/Y interval 0.1–1; angles and hyperbolic arguments are in gon (100 gon = 90°). The two starred exponential rows are normalised for the main hairline: exp(x) or exp(πx/200) = 10Y. Original end extensions and auxiliary cursor marks are not reproduced.',
        sides: {
            front: {
                name: 'Front - parabolic / trigonometric / exponential',
                topStator: ['FC284_EG', 'FC284_T', 'FC284_H', 'FC284_A'],
                slide: ['FC284_B', 'FC284_BI', 'FC284_I', 'FC284_y'],
                bottomStator: ['FC284_Y', 'FC284_P', 'FC284_S', 'FC284_E']
            },
            back: {
                name: 'Back - log-log / hyperbolic',
                topStator: ['FC284_LL1', 'FC284_LL2', 'FC284_LL3', 'FC284_Y'],
                slide: ['FC284_y', 'FC284_CH', 'FC284_SH2', 'FC284_SH1'],
                bottomStator: ['FC284_TH', 'FC284_LL03', 'FC284_LL02', 'FC284_LL01']
            }
        }
    }
};
