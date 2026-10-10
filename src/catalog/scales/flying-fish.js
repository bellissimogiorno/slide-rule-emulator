/** Flying Fish 1017's names and compact rows, not a renamed Hemmi preset.
 *
 * The two photographed 1017 specimens resolve omissions in catalogue captions:
 * the chemical face has LnI-2 (not LnI-1); the scientific slide includes CI.
 * See docs/FLYING_FISH_1017.md for evidence and reproduction limits.
 *
 * No new mathematical runtime is needed. Reusing the tested mappings keeps the
 * modern chemical calibration explicit and avoids two diverging physics models.
 */
import { makeLogLogScale, makeCompositeScale } from '#catalog/factories.js';
import { rootsScales } from '#catalog/scales/roots.js';
import { arithmeticScales } from '#catalog/scales/arithmetic.js';
import { chemicalScales } from '#catalog/scales/chemical.js';

const family = 'Flying Fish 1017';
const alias = (base, id, label, options = {}) => ({ ...base, id, label, family, ...options });

/** The Chinese subscript is one greater than our exponent decade.
 * For D=10^p, Ln_k reads exp(D*10^(k-1)); LnI_k reads its reciprocal.
 * In particular, Ln_-2 is exp(0.001 D), NOT the linear natural-log scale.
 */
function exponential(id, label, subscript, sign) {
    const scale = makeLogLogScale(id, label, subscript - 1, sign,
        `Flying Fish 1017 ${label}: natural-exponential log-log, exponent ${sign} * D * 10^(${subscript - 1}).`);
    return { ...scale, family, refineTicks: true };
}

export const flyingFishScales = {
    FF_LNI_M2: exponential('FF_LNI_M2', 'LnI\u208b\u2082', -2, -1),
    FF_LNI_M1: exponential('FF_LNI_M1', 'LnI\u208b\u2081', -1, -1),
    FF_LNI_0: exponential('FF_LNI_0', 'LnI\u2080', 0, -1),
    FF_LNI_1: exponential('FF_LNI_1', 'LnI\u2081', 1, -1),
    FF_LN_M2: exponential('FF_LN_M2', 'Ln\u208b\u2082', -2, 1),
    FF_LN_M1: exponential('FF_LN_M1', 'Ln\u208b\u2081', -1, 1),
    FF_LN_0: exponential('FF_LN_0', 'Ln\u2080', 0, 1),
    FF_LN_1: exponential('FF_LN_1', 'Ln\u2081', 1, 1),

    FF_A1: alias(rootsScales.A, 'FF_A1', 'A\u2081'),
    FF_LG: alias(arithmeticScales.L, 'FF_LG', 'lg', {
        description: 'Flying Fish linear base-10 logarithm (L), unlike its exponential Ln and LnI rows.'
    }),
    FF_COT: {
        id: 'FF_COT', label: 'cot', family, type: 'expression',
        min: 45, max: 90 - Math.atan(0.1) * 180 / Math.PI,
        pos: 'log10(10/tan(x*PI/180))',
        value: '90-atan(10^(p-1))*180/PI',
        tickMode: 'mapped', refineTicks: true, tone: 'red', unit: '\u00b0',
        formula: 'cot \u03b8',
        description: 'Complementary red angle on the 1017 tangent row. Opposite T=30 degrees, cot reads 60 degrees; not a second increasing tangent decade.'
    },
    FF_T_COT: makeCompositeScale('FF_T_COT', 'T / cot', [
        { scale: 'T1', caption: 'T' },
        { scale: 'FF_COT', caption: 'cot', tone: 'red' }
    ], 'Flying Fish paired tangent/cotangent angles, whose readings sum to 90 degrees.',
    { family, formula: 'tan / cot' }),

    FF_MZ: alias(chemicalScales.CHEM_M1, 'FF_MZ', 'Mz'),
    FF_XZ: alias(chemicalScales.CHEM_XW, 'FF_XZ', 'Xz'),
    FF_M: alias(chemicalScales.CHEM_M2, 'FF_M', 'M'),
    FF_MZ_XZ: alias(chemicalScales.CHEM_M1_XW, 'FF_MZ_XZ', 'Mz / Xz', {
        layers: ['FF_MZ', 'FF_XZ'], formula: 'mass | fraction',
        description: 'Flying Fish fixed mass setting followed by mass fraction. Modern binary-odds calibration shared with the Hemmi study.'
    }),
    FF_M_X: alias(chemicalScales.CHEM_M2_X, 'FF_M_X', 'M / X', {
        layers: ['FF_M', 'CHEM_X'], formula: 'mass | fraction',
        description: 'Flying Fish moving mass setting followed by mole fraction. Both masses must use the same decade.'
    }),
    FF_P_KG: alias(chemicalScales.CHEM_P_KG, 'FF_P_KG', 'P kgf/cm\u00b2')
};
