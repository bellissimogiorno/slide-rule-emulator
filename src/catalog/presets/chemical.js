/** Sources: Hemmi's No.257 manual and both makers' instrument photographs.
 * Chemistry data and thermophysical fits are deliberately modernised; see notes.
 */
export const chemicalPresets = {
    flyingFish1017: {
        name: 'Flying Fish 1017 - Chemical engineering', group: 'Chemical instruments',
        theme: 'flying-fish', density: 'classic', modelLabel: 'FLYING FISH 1017 - chemical engineering study',
        showFormulas: true,
        description: 'Separate 1017 layout: chemical front with Mz/Xz and M/X, temperature, pressure, steam and near-unity log-log scales; scientific back with reciprocal log-log, A, lg, tangent/cotangent, sine/cosine, CI and C/D. Modern chemical calibrations.',
        instrumentNote: 'Flying Fish 1017: chemical front, scientific back. Photographed row arrangement; modern chemistry and gas models, not a certified historical calibration. Both sides keeps their cursor and slide linked.',
        sides: {
            front: { name: 'Front - chemical engineering',
                note: 'Mz/Xz is fixed; M/X moves. Xz is mass fraction and X mole fraction. Pressure is absolute: kgf/cm2 and mmHg/atm. F(t) uses modern air/CO2 models. The outer LnI-2/Ln-2 rows are near-unity exponentials, not linear logarithms.',
                topStator: ['FF_LNI_M2', 'CHEM_CH_AM', 'CHEM_CH_NZ', 'FF_MZ_XZ'],
                slide: ['FF_M_X', 'CHEM_TF', 'CHEM_TC', 'CHEM_F'],
                bottomStator: ['FF_P_KG', 'CHEM_P_MMHG_ATM', 'CHEM_TW', 'FF_LN_M2'] },
            back: { name: 'Back - scientific calculation',
                note: 'Ln and LnI are natural-exponential log-log scales (positive and reciprocal), despite the different scale names. The lg row is the linear base-10 logarithm. Normalised 0-1 rule length; original end extensions and specialist gauge marks are not transcribed.',
                topStator: ['FF_LNI_M1', 'FF_LNI_0', 'FF_LNI_1', 'FF_A1'],
                slide: ['FF_LG', 'FF_T_COT', 'S_COS', 'CI', 'C'],
                bottomStator: ['D', 'FF_LN_1', 'FF_LN_0', 'FF_LN_M1'] }
        }
    },
    hemmi257: {
        name: 'Hemmi 257 - Chemical engineering', group: 'Chemical instruments',
        theme: 'ke', density: 'classic', modelLabel: 'HEMMI 257 - chemical engineering study',
        showFormulas: true,
        description: 'Hemmi 257-inspired duplex: chemical reference marks, compact M/X concentration scales, temperature, pressure, ice/steam and ideal-gas adiabatic scales. Modern data, not a photographic or historical-calibration facsimile.',
        instrumentNote: 'Choose Both sides for cross-face calculations. Chemical scales use modern data; the F(t) gas fits are not the original Hemmi calibrations.',
        sides: {
            front: { name: 'Front - general calculation', topStator: ['L', 'A', 'DF'],
                slide: ['CF', 'CIF', 'CI', 'C'], bottomStator: ['D', 'LL3', 'LL2', 'LL1'] },
            back: { name: 'Back - chemical engineering',
                note: 'Ch: underline x1, plain x10, overline x100 on D. M1/M2 settings must use the same decade; Xw and X are fractions, not percentages. F(t): air left, CO2 right; modern ideal-gas model. See Chemical scales help for procedures and limits.',
                topStator: ['CHEM_CH_AM', 'CHEM_CH_NZ', 'CHEM_M1_XW'],
                slide: ['CHEM_M2_X', 'CHEM_TF', 'CHEM_TC', 'CHEM_TK', 'CHEM_F'],
                bottomStator: ['CHEM_P_KG', 'CHEM_P_MMHG_ATM', 'CHEM_P_VAC_PSI', 'CHEM_TW'] }
        }
    }
};
