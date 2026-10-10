import { makeCompositeScale, makeSyncroLogLogScale, makeTempDerived } from "#catalog/factories.js";
import { ENERGY_PEAK_U, RADIATION_C2 } from "#core/physics.js";
/** Dependent rows and historical aliases, constructed after the base catalogue. */
export function additionalScales(base) {
    return {
        /* Thornton F5100 lettered radiation scales. The stock order follows the
           original instrument; the mathematical mappings use the same Planck,
           Wien, Stefan-Boltzmann and photon relations as the Model 17 preset. */
        F5100_G: Object.assign({}, base.BB_Q_PEAK, {
            id: "F5100_G",
            label: "g",
            formula: "Qλ max ∝ T⁴",
            description: "F5100 scale g: maximum spectral photon flux density."
        }),
        F5100_F: Object.assign({}, base.BB_Q_TOTAL, {
            id: "F5100_F",
            label: "f",
            formula: "Q ∝ T³",
            description: "F5100 scale f: total photon flux density."
        }),
        F5100_E: Object.assign(makeTempDerived("F5100_E", "e", "inverse", RADIATION_C2 / ENERGY_PEAK_U, -1, "µm", "F5100 scale e: wavelength of maximum spectral radiant flux density from Wien's law."), { formula: "λm=2897.77/T" }),
        F5100_D: Object.assign({}, base.BB_T, {
            id: "F5100_D",
            label: "d",
            formula: "T (K)",
            description: "F5100 scale d: absolute temperature."
        }),
        F5100_C: Object.assign({}, base.BB_TC, {
            id: "F5100_C",
            label: "c",
            formula: "T−273.15",
            description: "F5100 scale c: Celsius temperature aligned with absolute temperature."
        }),
        F5100_B: Object.assign({}, base.BB_H_PEAK, {
            id: "F5100_B",
            label: "b",
            formula: "Hλ max ∝ T⁵",
            description: "F5100 scale b: maximum spectral radiant flux density."
        }),
        F5100_A: Object.assign({}, base.BB_H_TOTAL, {
            id: "F5100_A",
            label: "a",
            formula: "H=σT⁴",
            description: "F5100 scale a: total radiant flux density."
        }),
        F5100_H: makeCompositeScale("F5100_H", "h", [{
                scale: "BB_LAMBDA1_E",
                caption: "λ"
            }, {
                scale: "BB_LAMBDA2_E",
                caption: "100λ",
                tone: "red"
            }], "F5100 scale h: wavelength with the red two-decade extension and peak markers.", {
            formula: "λ and 100λ",
            compactLabel: "h"
        }),
        F5100_J: Object.assign({}, base.C, {
            id: "F5100_J",
            label: "j",
            tone: "neutral",
            formula: "energy multiplier",
            description: "F5100 scale j: logarithmic multiplication scale on the energy side."
        }),
        F5100_I: makeCompositeScale("F5100_I", "i", [{
                scale: "BB_H_SPEC1",
                caption: "short λ"
            }, {
                scale: "BB_H_SPEC2",
                caption: "long λ",
                tone: "red"
            }], "F5100 scale i: spectral radiant-flux ratio Hλ/Hλmax, with long-wave extension in red.", {
            formula: "Hλ/Hλmax",
            compactLabel: "i"
        }),
        F5100_L: Object.assign({}, base.BB_H_BAND2, {
            id: "F5100_L",
            label: "l",
            formula: "Hλ–∞/H",
            description: "F5100 scale l: long-wavelength cumulative radiant-energy fraction."
        }),
        F5100_K: Object.assign({}, base.C, {
            id: "F5100_K",
            label: "k",
            tone: "neutral",
            formula: "energy multiplier",
            description: "F5100 scale k: second logarithmic multiplication scale on the energy side."
        }),
        F5100_M: Object.assign({}, base.BB_H_BAND1, {
            id: "F5100_M",
            label: "m",
            formula: "H0–λ/H",
            description: "F5100 scale m: short-wavelength cumulative radiant-energy fraction."
        }),
        F5100_N: Object.assign({}, base.BB_Q_SPEC1, {
            id: "F5100_N",
            label: "n",
            formula: "Qλ/Qλmax",
            description: "F5100 scale n: short-wave spectral photon-flux ratio."
        }),
        F5100_P: Object.assign({}, base.C, {
            id: "F5100_P",
            label: "p",
            tone: "neutral",
            formula: "photon multiplier",
            description: "F5100 scale p: logarithmic multiplication scale on the photon side."
        }),
        F5100_O: Object.assign({}, base.BB_Q_SPEC2, {
            id: "F5100_O",
            label: "o",
            formula: "Qλ/Qλmax",
            tone: "red",
            description: "F5100 scale o: long-wave spectral photon-flux ratio."
        }),
        F5100_R: Object.assign({}, base.BB_Q_BAND2, {
            id: "F5100_R",
            label: "r",
            formula: "Qλ–∞/Q",
            tone: "red",
            description: "F5100 scale r: long-wavelength cumulative photon fraction."
        }),
        F5100_Q: Object.assign({}, base.C, {
            id: "F5100_Q",
            label: "q",
            tone: "neutral",
            formula: "photon multiplier",
            description: "F5100 scale q: second logarithmic multiplication scale on the photon side."
        }),
        F5100_S: Object.assign({}, base.BB_Q_BAND1, {
            id: "F5100_S",
            label: "s",
            formula: "Q0–λ/Q",
            description: "F5100 scale s: short-wavelength cumulative photon fraction."
        }),
        F5100_REF_LAMBDA: {
            id: "F5100_REF_LAMBDA",
            label: "λ",
            type: "expression",
            min: 0.1,
            max: 1000,
            pos: "(Math.log10(x)+1)/4",
            value: "Math.pow(10,4*p-1)",
            tickMode: "log",
            unit: "µm",
            formula: "wavelength",
            description: "F5100 back reference: wavelength.",
            family: "Blackbody radiation"
        },
        F5100_REF_NU: {
            id: "F5100_REF_NU",
            label: "ν̄",
            type: "expression",
            min: 10,
            max: 100000,
            pos: "(5-Math.log10(x))/4",
            value: "Math.pow(10,5-4*p)",
            tickMode: "log",
            unit: "cm⁻¹",
            formula: "10⁴/λ",
            tone: "red",
            description: "F5100 back reference: wavenumber, aligned reciprocally with wavelength.",
            family: "Blackbody radiation"
        },
        F5100_REF_EV: {
            id: "F5100_REF_EV",
            label: "E",
            type: "expression",
            min: 0.001239841984,
            max: 12.39841984,
            pos: "(Math.log10(1.239841984/x)+1)/4",
            value: "1.239841984/Math.pow(10,4*p-1)",
            tickMode: "log",
            unit: "eV",
            formula: "1.23984/λ",
            description: "F5100 back reference: photon energy aligned with wavelength.",
            family: "Blackbody radiation"
        },
        /* N3: conventional natural-exponential LL scales, printed back-to-back
           with their reciprocals.  N4: Pickett's base-10 Syncro geometry. */
        PN3LL0: makeSyncroLogLogScale("PN3LL0", "LL₀", -3, "e", "Pickett N3 LL0+/LL0− pair. The black value e^(0.001D) and its red reciprocal e^(−0.001D) occupy the same graduation.", { compactLabel: "LL0±" }),
        PN3LL1: makeSyncroLogLogScale("PN3LL1", "LL₁", -2, "e", "Pickett N3 LL1+/LL1− paired natural-exponential scale.", { compactLabel: "LL1±" }),
        PN3LL2: makeSyncroLogLogScale("PN3LL2", "LL₂", -1, "e", "Pickett N3 LL2+/LL2− paired natural-exponential scale.", { compactLabel: "LL2±" }),
        PN3LL3: makeSyncroLogLogScale("PN3LL3", "LL₃", 0, "e", "Pickett N3 LL3+/LL3− paired natural-exponential scale.", { compactLabel: "LL3±" }),
        PLL1: makeSyncroLogLogScale("PLL1", "LL₁", -3, 10, "Pickett N4 Syncro LL1. Black 10^(0.001D) and red 10^(−0.001D) share every graduation.", {
            compactLabel: "LL1±",
            syncroName: true
        }),
        PLL2: makeSyncroLogLogScale("PLL2", "LL₂", -2, 10, "Pickett N4 Syncro LL2. Positive and reciprocal values share every graduation.", {
            compactLabel: "LL2±",
            syncroName: true
        }),
        PLL3: makeSyncroLogLogScale("PLL3", "LL₃", -1, 10, "Pickett N4 Syncro LL3. Positive and reciprocal values share every graduation.", {
            compactLabel: "LL3±",
            syncroName: true
        }),
        PLL4: makeSyncroLogLogScale("PLL4", "LL₄", 0, 10, "Pickett N4 Syncro LL4. Positive and reciprocal values share every graduation.", {
            compactLabel: "LL4±",
            syncroName: true
        }),
        T: makeCompositeScale("T", "T", [{
                scale: "T1",
                caption: "T₁"
            }, {
                scale: "T2",
                caption: "T₂",
                tone: "red"
            }], "Double-range tangent scale with lower and upper tangent graduations.", { formula: "tan θ" }),
        S_COS: makeCompositeScale("S_COS", "S", [{
                scale: "S",
                caption: "S"
            }, {
                scale: "COS",
                caption: "Cos",
                tone: "red"
            }], "Pickett combined sine / cosine row.", {
            formula: "sin θ / cos θ",
            compactLabel: "S"
        }),
        PT: makeCompositeScale("PT", "Pt", [{
                scale: "H1",
                caption: "Pt₁"
            }, {
                scale: "H2",
                caption: "Pt₂",
                tone: "red"
            }], "Thornton P-t scale, split for sqrt(1+t²).", { formula: "√(1+t²)" }),
        ISD_ITD: makeCompositeScale("ISD_ITD", "ISd/ITd", [{
                scale: "ISD",
                caption: "ISd"
            }, {
                scale: "ITD",
                caption: "ITd",
                tone: "red"
            }], "Thornton paired inverse sine / tangent correction row.", { formula: "inverse correction" }),
        TD_SD: makeCompositeScale("TD_SD", "Td/Sd", [{
                scale: "TD",
                caption: "Td"
            }, {
                scale: "SD",
                caption: "Sd",
                tone: "red"
            }], "Thornton paired direct tangent / sine correction row.", { formula: "direct correction" }),
        BB_H_SPEC: makeCompositeScale("BB_H_SPEC", "Hλ/Hλm", [{
                scale: "BB_H_SPEC1",
                caption: "λ1"
            }, {
                scale: "BB_H_SPEC2",
                caption: "λ2",
                tone: "red"
            }], "Model 17 paired spectral-energy ratio branches.", { formula: "Planck ratio" }),
        BB_Q_SPEC: makeCompositeScale("BB_Q_SPEC", "Qλ/Qλm", [{
                scale: "BB_Q_SPEC1",
                caption: "λ1"
            }, {
                scale: "BB_Q_SPEC2",
                caption: "λ2",
                tone: "red"
            }], "Model 17 paired spectral-photon ratio branches.", { formula: "photon ratio" }),
        BB_H_BAND: makeCompositeScale("BB_H_BAND", "H band/total", [{
                scale: "BB_H_BAND1",
                caption: "0–λ1"
            }, {
                scale: "BB_H_BAND2",
                caption: "λ2–∞",
                tone: "red"
            }], "Model 17 paired cumulative radiant-energy fractions.", { formula: "fraction of total" }),
        BB_Q_BAND: makeCompositeScale("BB_Q_BAND", "Q band/total", [{
                scale: "BB_Q_BAND1",
                caption: "0–λ1"
            }, {
                scale: "BB_Q_BAND2",
                caption: "λ2–∞",
                tone: "red"
            }], "Model 17 paired cumulative photon fractions.", { formula: "fraction of total" })
    };
}
