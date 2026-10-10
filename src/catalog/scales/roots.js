import { makePowerScale, makeRootScale } from "#catalog/factories.js";
const rootsScales = {
    A: Object.assign(makePowerScale("A", "A", 2, "Fixed two-decade square scale; read squares from D and square roots to D."), { tone: "blue" }),
    B: Object.assign(makePowerScale("B", "B", 2, "Sliding two-decade square scale; read squares from C and square roots to C."), { tone: "blue" }),
    AI: {
        id: "AI",
        label: "AI",
        type: "inverseLog",
        min: 1,
        max: 100,
        formula: "1/x²",
        tone: "red",
        description: "Inverted two-decade A scale for reciprocal squares.",
        family: "Powers and roots"
    },
    BI: {
        id: "BI",
        label: "BI",
        type: "inverseLog",
        min: 1,
        max: 100,
        formula: "1/x²",
        tone: "red",
        description: "Inverted two-decade B scale for reciprocal squares.",
        family: "Powers and roots"
    },
    K: makePowerScale("K", "K", 3, "Three-decade cube scale; read cubes from D and cube roots to D."),
    KI: {
        id: "KI",
        label: "KI",
        type: "inverseLog",
        min: 1,
        max: 1000,
        formula: "1/x³",
        tone: "red",
        description: "Inverted three-decade cube scale for reciprocal cubes.",
        family: "Powers and roots"
    },
    F5: makePowerScale("F5", "x⁵", 5, "Five-decade fifth-power scale; read fifth powers from D and fifth roots to D."),
    F5I: {
        id: "F5I",
        label: "x⁻⁵",
        type: "inverseLog",
        min: 1,
        max: 100000,
        formula: "1/x⁵",
        tone: "red",
        description: "Inverted five-decade fifth-power scale.",
        family: "Powers and roots"
    },
    R1: makeRootScale("R1", "√₁", 2, 0, "Square-root branch for radicands in decades 10^(2k) through 10^(2k+1)."),
    R2: makeRootScale("R2", "√₂", 2, 1, "Square-root branch for radicands in decades 10^(2k+1) through 10^(2k+2)."),
    W1: makeRootScale("W1", "W₁", 2, 0, "Faber-Castell W1 square-root branch.", { formula: "√x" }),
    W2: makeRootScale("W2", "W₂", 2, 1, "Faber-Castell W2 square-root branch.", { formula: "√(10x)" }),
    W1P: makeRootScale("W1P", "W₁′", 2, 0, "Sliding Faber-Castell W1-prime square-root branch.", { formula: "√x" }),
    W2P: makeRootScale("W2P", "W₂′", 2, 1, "Sliding Faber-Castell W2-prime square-root branch.", { formula: "√(10x)" }),
    Q1: makeRootScale("Q1", "∛₁", 3, 0, "Cube-root branch 1 of 3."),
    Q2: makeRootScale("Q2", "∛₂", 3, 1, "Cube-root branch 2 of 3."),
    Q3: makeRootScale("Q3", "∛₃", 3, 2, "Cube-root branch 3 of 3."),
    "5R1": makeRootScale("5R1", "⁵√₁", 5, 0, "Fifth-root branch 1 of 5."),
    "5R2": makeRootScale("5R2", "⁵√₂", 5, 1, "Fifth-root branch 2 of 5."),
    "5R3": makeRootScale("5R3", "⁵√₃", 5, 2, "Fifth-root branch 3 of 5."),
    "5R4": makeRootScale("5R4", "⁵√₄", 5, 3, "Fifth-root branch 4 of 5."),
    "5R5": makeRootScale("5R5", "⁵√₅", 5, 4, "Fifth-root branch 5 of 5.")
};
export { rootsScales };
