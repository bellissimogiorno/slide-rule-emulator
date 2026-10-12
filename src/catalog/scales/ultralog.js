/** Zvi Doron's published 40-row design. Each scalar keeps its own row.
 * The listed Const row has no verifiable inventory in the retrieved design:
 * the clearly identified reference marks below are supplied by this emulator.
 * Mathematical definitions are shared, but this family has independent IDs.
 */
import { arithmeticScales } from '#catalog/scales/arithmetic.js';
import { rootsScales } from '#catalog/scales/roots.js';
import { trigonometricScales } from '#catalog/scales/trigonometric.js';
import { hyperbolicScales } from '#catalog/scales/hyperbolic.js';
import { loglogScales } from '#catalog/scales/loglog.js';
import { constantGauge } from '#core/mark-descriptions.js';
const family = 'UltraLog';
const sources = { ...arithmeticScales, ...rootsScales, ...trigonometricScales, ...hyperbolicScales, ...loglogScales };
const ids = ['LL00', 'LL01', 'LL02', 'LL03', 'DF', 'CF', 'CIF', 'SH1', 'SH2', 'CH', 'TH', 'LN', 'L', 'CI', 'C', 'D', 'LL3', 'LL2', 'LL1', 'LL0', 'R1', 'R2', 'K', 'A', 'B', 'T1', 'T2', 'ST', 'S', 'P', 'H1', 'H2', 'DI', 'Q1', 'Q2', 'Q3'];
const labels = { LL00: 'LL/0', LL01: 'LL/1', LL02: 'LL/2', LL03: 'LL/3',
    LN: 'Ln', R1: 'R1', R2: 'R2', Q1: 'Q1', Q2: 'Q2', Q3: 'Q3',
    SH1: 'SH1', SH2: 'SH2', CH: 'CH', TH: 'TH', T1: 'T1', T2: 'T2', H1: 'H1', H2: 'H2' };
const inverse = new Set(['LL00', 'LL01', 'LL02', 'LL03', 'CIF', 'CI', 'DI']);
const marked = [
    [Math.sqrt(4 / Math.PI), 'c', 'Circle-diameter factor sqrt(4/pi); not the speed of light.'],
    [Math.SQRT2, '\u221a2', 'Square root of two.'],
    [Math.sqrt(3), '\u221a3', 'Square root of three.'],
    [Math.E, 'e', 'Base of natural logarithms.'],
    [Math.PI, '\u03c0', 'Ratio of circumference to diameter of a circle.'],
    [Math.sqrt(10), '\u221a10', 'Square root of ten.'],
    [Math.LN10, 'ln 10', 'Natural logarithm of ten.'],
    [2 * Math.PI, '2\u03c0', 'Angle of a complete turn in radians.']
].map(([value, label, explanation]) => ({ ...constantGauge(value, label, explanation), mass: value, kind: 'gauge' }));
export const ultralogScales = {
    ...Object.fromEntries(ids.map(key => ['UL_' + key, { ...sources[key], id: 'UL_' + key,
        label: labels[key] || sources[key].label, family, tone: inverse.has(key) ? 'red' : 'neutral' }])),
    UL_CONST: { id: 'UL_CONST', label: 'Const', type: 'log', min: 1, max: 10, referenceOnly: true,
        ticks: marked, compactLabels: false, family, tone: 'neutral', formula: 'Reference marks',
        description: 'Emulator-supplied mathematical constants, not a transcription of the UltraLog prototype. The published design names a Const row but its original contents could not be verified. Hover each symbol for the exact relationship and value; the readout identifies the nearest mark.' }
};
