/** Published arrangement from Zvi Doron's Scale Design page. */
export const ultralogPresets = {
    ultralog: {
        group: 'Classic instruments', name: 'UltraLog - Zvi Doron design', modelLabel: 'UltraLog - Zvi Doron',
        theme: 'ultralog', density: 'classic', showFormulas: true,
        description: 'Forty separately ruled rows: eight log-log ranges, a wide hyperbolic/logarithmic slide, expanded square/cube roots and trigonometric/hypotenuse scales.',
        instrumentNote: 'Mathematical implementation of Zvi Doron\u2019s published 40-row proposal, not a production facsimile. No back-to-back rows. Const contains explicitly emulator-supplied mathematical references: the original inventory could not be verified. Source artwork is not included. See docs/ULTRALOG.md for attribution, source access and scope.',
        sides: {
            front: { name: 'Front - log-log / hyperbolic',
                topStator: ['UL_LL00', 'UL_LL01', 'UL_LL02', 'UL_LL03', 'UL_DF'],
                slide: ['UL_CF', 'UL_CIF', 'UL_SH1', 'UL_SH2', 'UL_CH', 'UL_TH', 'UL_LN', 'UL_L', 'UL_CI', 'UL_C'],
                bottomStator: ['UL_D', 'UL_LL3', 'UL_LL2', 'UL_LL1', 'UL_LL0'] },
            back: { name: 'Back - roots / trigonometric',
                topStator: ['UL_CONST', 'UL_R1', 'UL_R2', 'UL_K', 'UL_A'],
                slide: ['UL_B', 'UL_T1', 'UL_T2', 'UL_ST', 'UL_S', 'UL_P', 'UL_H1', 'UL_H2', 'UL_CI', 'UL_C'],
                bottomStator: ['UL_D', 'UL_DI', 'UL_Q1', 'UL_Q2', 'UL_Q3'] }
        }
    }
};
