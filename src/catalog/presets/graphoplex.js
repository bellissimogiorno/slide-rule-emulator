/** Follow the supplied photographs, not the contradictory catalogue ordering.
 * Both have the same logarithmic face. Ch, Sh2 and Sh1 on the 691A follow the
 * photographed specimen; see docs/GRAPHOPLEX.md for the source cross-check.
 */
const back = () => ({ name: 'Back - folded / natural log-log',
    topStator: ['GP_LL01', 'GP_LL02', 'GP_LL03', 'GP_DF'],
    slide: ['GP_CF', 'GP_CIF', 'GP_K', 'GP_CI', 'GP_C'],
    bottomStator: ['GP_D', 'GP_LL3', 'GP_LL2', 'GP_LL1'] });
const common = { group: 'Classic instruments', theme: 'graphoplex', density: 'classic', showFormulas: true };
export const graphoplexPresets = {
    graphoplex690a: { ...common, name: 'Graphoplex 690A Neperlog', modelLabel: 'Graphoplex 690A Neperlog',
        description: 'Degree/minute trigonometry, eight natural log-log ranges, reciprocal and pi-folded arithmetic. Distinct from the hyperbolic 691A.',
        instrumentNote: 'Main index intervals from the supplied 690A photograph and Graphoplex manual. Angular captions use degrees/minutes/seconds, not decimal minutes. Conventional tick intervals are a mathematical reconstruction, not a tracing. End extensions, auxiliary cursor hairlines and every original gauge are not reproduced.',
        sides: { front: { name: 'Front - degrees/minutes / near-unity log-log',
            topStator: ['GP_LL00', 'GP_L', 'GP690_T2', 'GP_A'],
            slide: ['GP_B', 'GP690_T1', 'GP690_ST', 'GP690_S', 'GP_C'],
            bottomStator: ['GP_D', 'GP_P', 'GP_DI', 'GP_LL0'] }, back: back() }
    },
    graphoplex691a: { ...common, name: 'Graphoplex 691A Neperlog Hyperbolic', modelLabel: 'Graphoplex 691A Neperlog Hyperbolic',
        description: 'Decimal-degree trigonometry and Ch, Th, Sh2, Sh1 hyperbolic rows, with six natural log-log ranges on the reverse.',
        instrumentNote: 'Follows the supplied 691A specimen: Ch above A; Th, Sh2, Sh1 below D. The catalogue summary omits Ch and reverses Sh1/Sh2, so the photograph takes precedence. Main intervals only; end extensions and auxiliary cursor hairlines are not reproduced.',
        sides: { front: { name: 'Front - decimal degrees / hyperbolic',
            topStator: ['GP_L', 'GP_P', 'GP_CH', 'GP_A'],
            slide: ['GP_B', 'GP691_T1', 'GP691_ST', 'GP691_S', 'GP_C'],
            bottomStator: ['GP_D', 'GP_TH', 'GP_SH2', 'GP_SH1'] }, back: back() }
    }
};
