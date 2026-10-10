/** Selected Hemmi 257 symbols; modern, abridged CIAAW 2024 relative weights.
 * These are educational representative values, not sample-specific masses.
 * Ra[226] is an isotope mass-number convention, NOT a standard atomic weight.
 * Air is a conventional dry-air mean and is not a chemical element.
 * Source: https://ciaaw.org/abridged-atomic-weights.htm
 */
import { deepFreeze } from '#core/objects.js';
export const CHEMICAL_ELEMENTS = deepFreeze({
    H: 1.0080, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011,
    N: 14.007, O: 15.999, F: 18.998, Ne: 20.180, Na: 22.990, Mg: 24.305,
    Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, Ar: 39.95,
    K: 39.098, Ca: 40.078, Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938,
    Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38, As: 74.922,
    Se: 78.971, Br: 79.904, Kr: 83.798, Rb: 85.468, Zr: 91.222, Mo: 95.95,
    Ag: 107.87, Cd: 112.41, Sn: 118.71, Sb: 121.76, I: 126.90, Xe: 131.29,
    Cs: 132.91, Ba: 137.33, W: 183.84, Pt: 195.08, Au: 196.97, Hg: 200.59,
    Pb: 207.2, Bi: 208.98, 'Ra[226]': 226, U: 238.03
});
const groups = {
    CH3: { C: 1, H: 3 }, C2H5: { C: 2, H: 5 }, C6H5: { C: 6, H: 5 },
    CN: { C: 1, N: 1 }, CO: { C: 1, O: 1 }, CO3: { C: 1, O: 3 },
    COOH: { C: 1, O: 2, H: 1 }, H2O: { H: 2, O: 1 }, NH: { N: 1, H: 1 },
    NH2: { N: 1, H: 2 }, NH4: { N: 1, H: 4 }, NO2: { N: 1, O: 2 },
    NO3: { N: 1, O: 3 }, OH: { O: 1, H: 1 }, PO4: { P: 1, O: 4 },
    P2O7: { P: 2, O: 7 }, SO4: { S: 1, O: 4 }
};
export const CHEMICAL_GROUPS = deepFreeze({ Air: 28.96546,
    ...Object.fromEntries(Object.entries(groups).map(([symbol, atoms]) => [symbol,
        Number(Object.entries(atoms).reduce((mass, [atom, n]) => mass + CHEMICAL_ELEMENTS[atom] * n, 0).toPrecision(9))]))
});
export const CHEMICAL_REFERENCES = deepFreeze({ ...CHEMICAL_ELEMENTS, ...CHEMICAL_GROUPS });
