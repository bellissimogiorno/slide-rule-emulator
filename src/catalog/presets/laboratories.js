/** Mathematical scale laboratories, not historical facsimiles. */
export const laboratoriesPresets = {
    comprehensive: {
        group: "Mathematical laboratories",
        name: "Full scientific complement",
        modelLabel: "Programmable scientific duplex",
        theme: "neutral",
        density: "comfortable",
        showFormulas: true,
        description: "Every built-in mathematical family on two programmable faces: core, reciprocal, folded, square/cube/fifth powers, expanded roots, trig, hyperbolic and ten aligned log-log ranges.",
        instrumentNote: "A large laboratory layout rather than a replica. Use the rail editors to remove or reorder scales.",
        sides: {
            front: {
                name: "Front · powers and expanded roots",
                topStator: ["F5", "F5I", "K", "KI", "A", "AI", "R1", "R2"],
                slide: ["B", "BI", "CI", "C", "CIF", "CF"],
                bottomStator: ["DF", "DIF", "D", "DI", "L", "LN", "Q1", "Q2", "Q3"]
            },
            back: {
                name: "Back · log-log, trig and hyperbolic",
                topStator: ["LL00", "LL01", "LL02", "LL03", "LL04", "H1", "H2", "CH"],
                slide: ["S", "COS", "T1", "T2", "ST", "SH1", "SH2", "TH", "CI", "C"],
                bottomStator: ["LL0", "LL1", "LL2", "LL3", "LL4", "P", "5R1", "5R2", "5R3", "5R4", "5R5", "D"]
            }
        }
    },
    classic: {
        group: "Mathematical laboratories",
        name: "Classic log-log duplex",
        modelLabel: "Classic log-log duplex",
        theme: "faber",
        density: "classic",
        showFormulas: true,
        description: "A compact generic layout with A/B/C/D/K/L, folded and reciprocal scales, trig scales and the four most-used positive and inverse LL ranges.",
        sides: {
            front: {
                name: "Front · classic",
                topStator: ["K", "A"],
                slide: ["B", "CI", "C"],
                bottomStator: ["D", "DI", "L"]
            },
            back: {
                name: "Back · scientific",
                topStator: ["LL00", "LL01", "LL02", "LL03"],
                slide: ["CF", "CIF", "S", "T1", "ST", "C"],
                bottomStator: ["DF", "DIF", "D", "LL0", "LL1", "LL2", "LL3"]
            }
        }
    },
    roots: {
        group: "Mathematical laboratories",
        name: "Roots and powers laboratory",
        modelLabel: "Roots and powers laboratory",
        theme: "pickett-white",
        density: "pickett",
        showFormulas: true,
        description: "Dedicated square-, cube- and fifth-root branches together with direct and reciprocal square, cube and fifth-power scales.",
        sides: {
            front: {
                name: "Front · square and cube",
                topStator: ["K", "KI", "A", "AI", "R1", "R2"],
                slide: ["B", "BI", "CI", "C"],
                bottomStator: ["D", "Q1", "Q2", "Q3", "L"]
            },
            back: {
                name: "Back · fifth roots",
                topStator: ["F5", "F5I"],
                slide: ["CI", "C"],
                bottomStator: ["D", "5R1", "5R2", "5R3", "5R4", "5R5", "LN"]
            }
        }
    },
    loglog: {
        group: "Mathematical laboratories",
        name: "Full log-log laboratory",
        modelLabel: "Full log-log laboratory",
        theme: "neutral",
        density: "classic",
        showFormulas: true,
        description: "All five e^x and five e^-x ranges, aligned by exponent decade, with C/CI and supporting logarithm scales.",
        sides: {
            front: {
                name: "Front · values above 1",
                topStator: ["LL0", "LL1", "LL2", "LL3", "LL4"],
                slide: ["CI", "C"],
                bottomStator: ["D", "L", "LN"]
            },
            back: {
                name: "Back · values below 1",
                topStator: ["LL00", "LL01", "LL02", "LL03", "LL04"],
                slide: ["CI", "C"],
                bottomStator: ["D", "S", "T1", "T2", "ST"]
            }
        }
    },
    trig: {
        group: "Mathematical laboratories",
        name: "Trigonometric laboratory",
        modelLabel: "Trigonometric laboratory",
        theme: "thornton",
        density: "classic",
        showFormulas: true,
        description: "Circular-function layout with sine, cosine, split tangent, small-angle and Pythagorean scales.",
        sides: {
            front: {
                name: "Front · circular functions",
                topStator: ["S", "COS", "P"],
                slide: ["ST", "T1", "T2", "CI", "C"],
                bottomStator: ["D", "DI", "L"]
            },
            back: {
                name: "Back · folded support",
                topStator: ["CF", "CIF"],
                slide: ["S", "COS", "C"],
                bottomStator: ["DF", "DIF", "D", "LN"]
            }
        }
    },
    hyperbolic: {
        group: "Mathematical laboratories",
        name: "Hyperbolic laboratory",
        modelLabel: "Hyperbolic laboratory",
        theme: "pickett-white",
        density: "classic",
        showFormulas: true,
        description: "Split sinh and hypotenuse ranges, tanh and inverse cosh, with C/D and log-log support.",
        sides: {
            front: {
                name: "Front · hyperbolic functions",
                topStator: ["H1", "H2", "CH"],
                slide: ["SH1", "SH2", "TH", "CI", "C"],
                bottomStator: ["D", "DI", "L", "LN"]
            },
            back: {
                name: "Back · exponential support",
                topStator: ["LL00", "LL01", "LL02", "LL03"],
                slide: ["CI", "C"],
                bottomStator: ["D", "LL0", "LL1", "LL2", "LL3"]
            }
        }
    }
};
