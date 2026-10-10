/** Hemmi-inspired chemistry. Historical row order; openly modern calibrations.
 * Child domains preserve the original compact M / X arrangement. A segment is
 * not stretched to fill its row: the shared logarithmic pitch is essential.
 */
import { CHEMICAL_REFERENCES } from '#catalog/chemical-data.js';
import { chemicalRuntime, KG_FORCE_CM2, ATMOSPHERE, MMHG, PSI, INHG,
    WATER_CRITICAL_K } from '#core/chemistry.js';
const family = 'Chemical engineering';
const degreeC = '\u00b0C';
const expression = (id, label, min, max, pos, value, options = {}) => ({
    id, label, type: 'expression', min, max, pos, value, tickMode: 'mapped', family, ...options
});
const segmented = (id, label, left, right, description, formula = label) => ({
    id, label, type: 'segmented', family, layers: [left, right], description, formula
});
function referenceRow(id, label, from, to) {
    const ticks = Object.entries(CHEMICAL_REFERENCES).filter(([symbol]) => symbol[0] >= from && symbol[0] <= to)
        .map(([symbol, mass]) => {
            const decade = Math.floor(Math.log10(mass));
            return { value: mass / 10 ** decade, label: symbol, mass, decade, kind: 'gauge',
                title: `${symbol}: ${mass}; D reading times ${10 ** decade}${symbol === 'Ra[226]' ? '; isotope mass-number convention' : ''}` };
        });
    return { id, label, type: 'log', min: 1, max: 10, tickMode: 'log', family, ticks,
        referenceOnly: true, compactLabels: false, formula: 'D x decade',
        description: 'Chemical reference marks, CIAAW 2024 representative values. Underline: D x 1; no line: D x 10; overline: D x 100. Readout identifies the nearest mark, not an interpolated mass.' };
}
const mass = (id, label) => expression(id, label, 1, 100, 'log10(x)/8', '10^(8*p)', {
    tickMode: 'log', pMin: 0, pMax: 0.25, formula: 'log M / 8',
    description: 'Molar mass or density setting, 1-100 over the first quarter of the row. Rescale BOTH M settings by the same power of ten when needed.'
});
function fraction(id, label) {
    const ticks = [];
    for (const [lo, hi, step] of [[0.001, 0.01, 0.0001], [0.01, 0.1, 0.001], [0.1, 0.9, 0.005], [0.9, 0.99, 0.001], [0.99, 0.999, 0.0001]]) {
        for (let i = Math.round(lo / step); i <= Math.round(hi / step); i++) {
            const value = Number((i * step).toFixed(6));
            const major = i % 10 === 0 || Math.abs(value - 0.5) < 1e-9 || value === 0.001 || value === 0.999;
            ticks.push({ value, label: major ? String(value) : '', kind: major ? 'major' : i % 5 === 0 ? 'mid' : 'minor' });
        }
    }
    return expression(id, label, 0.001, 0.999, '(log10(x/(1-x))+5)/8', '1/(1+10^(5-8*p))', {
        pMin: (Math.log10(0.001 / 0.999) + 5) / 8, pMax: (Math.log10(0.999 / 0.001) + 5) / 8,
        ticks, formula: 'logit(x) / 8', description: 'Fraction, not percent: 0.2 means 20%. Paired with the eight-decade M pitch for binary mass/mole or ideal additive-volume conversions.'
    });
}
function temperature(id, label, toK, fromK, min, max, unit) {
    const ticks = [];
    const step = unit === 'K' ? 5 : 10;
    for (let value = Math.ceil(min / step) * step; value <= max; value += step)
        ticks.push({ value, label: value % (unit === 'K' && value < 200 ? 20 : 50) === 0 ? String(value) : '',
            kind: value % 50 === 0 ? 'major' : value % 20 === 0 ? 'mid' : 'minor' });
    ticks.push({ value: min, label: String(Number(min.toFixed(2))), kind: 'index' }, { value: max, label: String(Number(max.toFixed(2))), kind: 'index' });
    return expression(id, label, min, max, `log10((${toK})/100)`, fromK, { ticks, unit,
        formula: '100-1000 K', description: 'One-decade absolute-temperature conversion, aligned with C on the opposite face. Modern 273.15 K Celsius zero.' });
}
/** A trusted affine pressure conversion supplies both expression text and
 * endpoint values. No expression is evaluated while constructing the catalogue.
 * The zero clamp removes round-off at atmospheric gauge/vacuum zero only.
 */
function pressure(id, label, min, max, factor, offset, unit, tickMode = 'log', majors = []) {
    const toPa = `(${offset}+x*(${factor}))`;
    // expm1 preserves small gauge/vacuum values without subtracting nearly
    // equal absolute pressures. The atmospheric index maps to exact zero.
    const zero = (Math.log10(offset / KG_FORCE_CM2) + 3) / 6;
    const fromPa = offset ? `max(0,${offset}*expm1((p-(${zero}))*6*log(10))/(${factor}))`
        : `${KG_FORCE_CM2}*10^(6*p-3)/(${factor})`;
    const ticks = majors.length ? [...new Set([min, ...majors, max])].filter(x => x >= min && x <= max)
        .map(value => ({value, label: String(Number(value.toPrecision(6))),
            kind: value === min || value === max ? 'index' : 'major'})) : undefined;
    return expression(id, label, min, max, `(log10(${toPa}/${KG_FORCE_CM2})+3)/6`, fromPa, {
        ...(ticks ? {ticks} : {}),
        unit, tickMode, refineTicks: tickMode === 'mapped',
        pMin: (Math.log10((offset + min * factor) / KG_FORCE_CM2) + 3) / 6,
        pMax: (Math.log10((offset + max * factor) / KG_FORCE_CM2) + 3) / 6,
        formula: 'absolute P',
        description: 'Pressure conversion on the common six-decade absolute-pressure coordinate. Gauge and vacuum references use one standard atmosphere.'
    });
}
const minimumPa = KG_FORCE_CM2 * 0.001, maximumPa = KG_FORCE_CM2 * 1000;
const chemistry = {
    CHEM_CH_AM: referenceRow('CHEM_CH_AM', 'Ch A-M', 'A', 'M'),
    CHEM_CH_NZ: referenceRow('CHEM_CH_NZ', 'Ch N-Z', 'N', 'Z'),
    CHEM_M1: mass('CHEM_M1', 'M1'), CHEM_M2: mass('CHEM_M2', 'M2'),
    CHEM_XW: fraction('CHEM_XW', 'Xw'), CHEM_X: fraction('CHEM_X', 'X'),
    CHEM_M1_XW: segmented('CHEM_M1_XW', 'M1 / Xw', 'CHEM_M1', 'CHEM_XW', 'Fixed mass/density setting followed by weight fraction.'),
    CHEM_M2_X: segmented('CHEM_M2_X', 'M2 / X', 'CHEM_M2', 'CHEM_X', 'Moving mass/density setting followed by mole or ideal volume fraction.'),
    CHEM_TK: temperature('CHEM_TK', 'T K', 'x', '100*10^p', 100, 1000, 'K'),
    CHEM_TC: temperature('CHEM_TC', 'T C', 'x+273.15', '100*10^p-273.15', -173.15, 726.85, degreeC),
    CHEM_TF: temperature('CHEM_TF', 'T F', '(x+459.67)/1.8', '180*10^p-459.67', -279.67, 1340.33, '\u00b0F'),
    CHEM_P_KG: pressure('CHEM_P_KG', 'P', 0.001, 1000, KG_FORCE_CM2, 0, 'kgf/cm2 abs'),
    CHEM_P_MMHG: pressure('CHEM_P_MMHG', 'P mmHg', minimumPa / MMHG, ATMOSPHERE / MMHG, MMHG, 0, 'mmHg abs'),
    CHEM_P_ATM: pressure('CHEM_P_ATM', 'P atm', 1, maximumPa / ATMOSPHERE, ATMOSPHERE, 0, 'atm abs'),
    CHEM_P_VAC: pressure('CHEM_P_VAC', 'Vacuum', 0, (ATMOSPHERE - minimumPa) / INHG, -INHG, ATMOSPHERE, 'inHg vac', 'mapped', [0, 5, 10, 15, 20, 25, 28, 29, 29.5, 29.7, 29.8, 29.85, 29.88, 29.89]),
    CHEM_P_PSI: pressure('CHEM_P_PSI', 'P gauge', 0, (maximumPa - ATMOSPHERE) / PSI, PSI, ATMOSPHERE, 'psi gauge', 'mapped', [0, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]),
    CHEM_P_MMHG_ATM: segmented('CHEM_P_MMHG_ATM', 'P mmHg', 'CHEM_P_MMHG', 'CHEM_P_ATM', 'Absolute pressure: mmHg below one atmosphere, atm above it.', 'mmHg | atm'),
    CHEM_P_VAC_PSI: segmented('CHEM_P_VAC_PSI', 'Vac / psi', 'CHEM_P_VAC', 'CHEM_P_PSI', 'Vacuum below atmospheric pressure, psi gauge above it.', 'vac | gauge'),
    CHEM_TW: { id: 'CHEM_TW', label: 'tw', type: 'waterVapor', min: -20, max: WATER_CRITICAL_K - 273.15,
        tickMode: 'mapped', family, unit: degreeC, formula: 'ice / steam', description: 'Saturation temperature aligned with the P scales; ice below the triple point, liquid-water/steam above. Ends at the modern critical point, 373.946 C.' },
    CHEM_F_AIR: { id: 'CHEM_F_AIR', label: 'F air', type: 'gasEntropy', gas: 'air', origin: 0,
        min: -73.15, max: 726.85, tickMode: 'mapped', unit: degreeC, family,
        description: 'Modern ideal-gas entropy scale: fixed 79% N2 / 21% O2 mixture; NIST Shomate Cp(T). Slide against absolute pressure for reversible adiabatic calculations.' },
    CHEM_F_CO2: { id: 'CHEM_F_CO2', label: 'F CO2', type: 'gasEntropy', gas: 'co2', origin: 0.5,
        min: 25, max: 626.85, tickMode: 'mapped', unit: degreeC, family,
        description: 'Modern ideal CO2 entropy scale; 298.15-900 K, within NIST Shomate fit. Not a real-gas or phase-equilibrium model.' },
    CHEM_F: segmented('CHEM_F', 'F(t)', 'CHEM_F_AIR', 'CHEM_F_CO2', 'Air on the left, CO2 on the right; modern ideal-gas calibrations, not the original Hemmi heat-capacity fit.', 'air | CO2')
};
// Vacuum decreases as absolute pressure increases; only that segment is red.
// Explicit neutral ink also avoids the generic inverse-scale suffix heuristic.
chemistry.CHEM_P_VAC.tone = 'red';
chemistry.CHEM_P_PSI.tone = 'neutral';
chemistry.CHEM_P_VAC_PSI.tone = 'neutral';
// Derived position bounds are part of the catalogue so domain validation also
// protects segmented rows and hand-edited programme overrides.
for (const definition of Object.values(chemistry)) {
    if (['waterVapor', 'gasEntropy'].includes(definition.type)) {
        const runtime = chemicalRuntime(definition);
        definition.pMin = runtime.pMin;
        definition.pMax = runtime.pMax;
    }
    if (Number.isFinite(definition.pMin) && Number.isFinite(definition.pMax)) {
        [definition.pMin, definition.pMax] = [Math.min(definition.pMin, definition.pMax), Math.max(definition.pMin, definition.pMax)];
        if (Math.abs(definition.pMin) < 1e-10) definition.pMin = 0;
        if (Math.abs(definition.pMax - 1) < 1e-10) definition.pMax = 1;
    }
}
export const chemicalScales = chemistry;
