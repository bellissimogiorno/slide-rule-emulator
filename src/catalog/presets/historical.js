/** Historical-inspired layouts; consult docs/HISTORICAL_FIDELITY.md before specialist calculations. */
export const historicalPresets = {
    faber283n: {
        group: "Classic instruments",
        name: "Faber-Castell 2/83N",
        modelLabel: "A.W. Faber-Castell 2/83N Novo-Duplex",
        theme: "faber",
        density: "faber",
        showFormulas: true,
        description: "Novo-Duplex arrangement with coloured C/CF and A/B/W bands, a W1/W2 root face, inverse scales in red, and self-documenting formula captions.",
        instrumentNote: "W₁/W₁′ cover the first square-root branch; W₂/W₂′ cover the second. Formula captions echo the 2/83N self-documenting style.",
        sides: {
            front: {
                name: "Front · trigonometric / folded",
                topStator: ["T1", "T2", "K", "A", "DF"],
                slide: ["CF", "B", "CIF", "CI", "C"],
                bottomStator: ["D", "DI", "S", "ST", "P"]
            },
            back: {
                name: "Back · W roots / log-log",
                topStator: ["LL03", "LL02", "LL01", "LL00", "W2"],
                slide: ["W2P", "CI", "L", "C", "W1P"],
                bottomStator: ["W1", "D", "LL0", "LL1", "LL2", "LL3"]
            }
        }
    },
    thorntonAA010: {
        group: "Classic instruments",
        name: "Thornton AA010 / P221",
        modelLabel: "British Thornton AA010 · Comprehensive",
        theme: "thornton",
        density: "classic",
        showFormulas: true,
        description: "Comprehensive Thornton arrangement with Ps/Pt, paired direct and inverse correction scales, folded scales and three positive plus three inverse log-log ranges.",
        instrumentNote: "Correction rows ISd/ITd and Td/Sd are normalised layout studies, not calibrated Thornton correction scales. The ordinary arithmetic, root, trig and log-log scales use their stated mathematical mappings.",
        sides: {
            front: {
                name: "Front · log-log / corrections",
                topStator: ["LL01", "LL02", "LL03", "DF"],
                slide: ["CF", "CI", "ISD_ITD", "TD_SD", "C"],
                bottomStator: ["D", "LL3", "LL2", "LL1"]
            },
            back: {
                name: "Back · trig / power",
                topStator: ["S", "ST", "T", "A"],
                slide: ["B", "L", "K", "C"],
                bottomStator: ["D", "DI", "PS", "PT"]
            }
        }
    },
    keDecilon: {
        group: "Classic instruments",
        name: "K&E 68-1100 Deci-Lon",
        modelLabel: "Keuffel & Esser 68-1100 · Deci-Lon",
        theme: "ke",
        density: "classic",
        showFormulas: false,
        description: "A Deci-Lon layout study with compact Lon/log-log banks, Sq1/Sq2 roots, folded and reciprocal scales, and the characteristic clean K&E cream-and-red engraving.",
        instrumentNote: "The scale order follows the published Deci-Lon families. This preset is included chiefly as a legibility reference: restrained numerals, strong index hierarchy, and clear opposing C/D baselines.",
        sides: {
            front: {
                name: "Front · Lon / trigonometric",
                topStator: ["LL03", "LL02", "LL01", "LL00", "A"],
                slide: ["B", "T", "ST", "S", "C"],
                bottomStator: ["D", "DI", "K"]
            },
            back: {
                name: "Back · square roots / folded / Lon",
                topStator: ["R1", "R2", "DF"],
                slide: ["CF", "CIF", "L", "CI", "C"],
                bottomStator: ["D", "LL0", "LL1", "LL2", "LL3"]
            }
        }
    },
    pickettN3: {
        group: "Classic instruments",
        name: "Pickett N3-T / N3-ES",
        modelLabel: "Pickett N3 · All-purpose log-log duplex",
        theme: "pickett-es",
        density: "pickett",
        showFormulas: false,
        description: "Catalogued N3 arrangement: two full-length square-root and three cube-root branches on one face, with paired natural-exponential LL0+/− through LL3+/− rows on the other.",
        instrumentNote: "On the log-log face, each black e^(+kD) reading and its red reciprocal e^(−kD) are printed against the same graduation. The root bank uses only five narrow rows for two square-root and three cube-root branches.",
        sides: {
            front: {
                name: "Root / trigonometric face",
                topStator: ["R1", "R2", "K", "A"],
                slide: ["B", "ST", "S", "T1", "T2", "CI", "C"],
                bottomStator: ["D", "DI", "Q1", "Q2", "Q3"]
            },
            back: {
                name: "Combined LL+/− log-log face",
                topStator: ["PN3LL0", "PN3LL1", "DF"],
                slide: ["CF", "CIF", "LN", "L", "CI", "C"],
                bottomStator: ["D", "PN3LL2", "PN3LL3"]
            }
        }
    },
    pickettN4: {
        group: "Classic instruments",
        name: "Pickett N4-T / N4-ES",
        modelLabel: "Pickett N4 · Vector-type log-log duplex",
        theme: "pickett-es",
        density: "pickett",
        showFormulas: false,
        description: "Catalogued N4 arrangement: compact cube- and square-root banks, paired S/Cos and tangent graduations, plus Pickett syncro log-log and hyperbolic scales.",
        instrumentNote: "These are genuine Pickett Syncro rows: each black 10^(+kD) value and its red reciprocal 10^(−kD) share one physical tick. DF/M and CF/M fold at ln(10), so the same LL rows also work in base e.",
        sides: {
            front: {
                name: "Root / trigonometric face",
                topStator: ["Q1", "Q2", "Q3", "DF"],
                slide: ["CF", "CIF", "T1", "T2", "ST", "S_COS", "CI", "C"],
                bottomStator: ["D", "DI", "R1", "R2"]
            },
            back: {
                name: "Syncro combined LL+/− / hyperbolic face",
                topStator: ["PLL1", "PLL2", "DFM"],
                slide: ["CFM", "TH", "SH1", "SH2", "LN", "L", "CI", "C"],
                bottomStator: ["D", "PLL3", "PLL4"]
            }
        }
    },
    pickettN16: {
        group: "Classic instruments",
        name: "Pickett N16-ES Electronics",
        modelLabel: "Pickett N16-ES · Electronic engineering",
        theme: "pickett-es",
        density: "pickett",
        showFormulas: false,
        description: "Scientific face plus an electronics-labelled layout study. The specialist reverse is not a calibrated electrical calculator.",
        instrumentNote: "Electronics reverse: layout study only, not an electrical calculator. Its phase, dB and circuit rows are illustrative mappings and are not calibrated to work together. The scientific face uses the stated mathematical mappings.",
        sides: {
            front: {
                name: "Scientific face",
                topStator: ["SH1", "SH2", "TH", "DF"],
                slide: ["CF", "L", "S", "ST", "T", "CI", "C"],
                bottomStator: ["D", "LL3", "LL2", "LL1", "LN"]
            },
            back: {
                name: "Electronics face · layout study only",
                topStator: ["THETA_R", "THETA_C", "DB", "DQ", "XL", "ZX_XC"],
                slide: ["CL", "FREQ", "WAVELENGTH", "OMEGA", "TAU", "TAUR_XCP", "CR"],
                bottomStator: ["LR", "DB", "COS_THETA", "TCP_CP"]
            }
        }
    },
    blackbody17: {
        group: "Specialist instruments",
        name: "Pickett Model 17 Blackbody Radiation",
        modelLabel: "Pickett Model 17 · Blackbody radiation computer",
        theme: "blackbody",
        density: "blackbody",
        showFormulas: true,
        description: "Two-face blackbody calculator with energy and photon quantities, Kelvin/Celsius/Fahrenheit scales, dual wavelength/wavenumber branches, normalised Planck curves and cumulative radiation fractions.",
        instrumentNote: "Align the red T index at the centre of M(Hλm) or M(Qλm) with the required temperature. Read the matching λ₁/λ₂ branch at the cursor; black and red paired rows represent the short- and long-wavelength branches.",
        sides: {
            front: {
                name: "Energy radiation face",
                topStator: ["BB_H_TOTAL", "BB_H_PEAK", "BB_TF", "BB_TC", "BB_T"],
                slide: ["BB_H_SPEC", "BB_HM", "BB_HT", "BB_H_BAND", "C"],
                bottomStator: ["D", "BB_LAMBDA1_E", "BB_LAMBDA2_E", "BB_NU1_E", "BB_NU2_E", "BB_NOISE"]
            },
            back: {
                name: "Photon radiation face",
                topStator: ["BB_Q_TOTAL", "BB_Q_PEAK", "BB_TF", "BB_TC", "BB_T"],
                slide: ["BB_Q_SPEC", "BB_QM", "BB_QT", "BB_Q_BAND", "C"],
                bottomStator: ["BB_LAMBDA1_Q", "BB_LAMBDA2_Q", "BB_NU1_Q", "BB_NU2_Q", "BB_EPEAK"]
            }
        }
    },
    thorntonF5100: {
        group: "Specialist instruments",
        name: "Thornton / Blundell Harling F5100 Radiation",
        modelLabel: "A.G. Thornton F5100 · Radiation slide rule",
        theme: "blackbody-wood",
        density: "blackbody",
        showFormulas: true,
        description: "Lettered F5100 radiation layout: PHOTONS g–e above the slide, ENERGY d–a below it, the h–m energy slide, n–s photon reverse, and the wavelength/wavenumber/electron-volt reference scales.",
        instrumentNote: "Layout study only: the F5100 letter order is retained, but its moving wavelength and curve rows do not reproduce the original calculation geometry. Fixed temperature-derived and reverse wavelength / wavenumber / photon-energy references are valid individually. Use Model 17 for the documented temperature-to-Planck-ratio workflow.",
        sides: {
            front: {
                name: "Front · PHOTONS / ENERGY",
                topStator: ["F5100_G", "F5100_F", "F5100_E"],
                slide: ["F5100_H", "F5100_J", "F5100_I", "F5100_L", "F5100_K", "F5100_M"],
                bottomStator: ["F5100_D", "F5100_C", "F5100_B", "F5100_A"]
            },
            back: {
                name: "Back · reverse slide / references",
                topStator: ["F5100_REF_LAMBDA"],
                slide: ["F5100_N", "F5100_P", "F5100_O", "F5100_R", "F5100_Q", "F5100_S"],
                bottomStator: ["F5100_REF_NU", "F5100_REF_EV"]
            }
        }
    }
};
