import { makeFoldedScale } from "#catalog/factories.js";
const STANDARD_GAUGES = [{
        value: Math.sqrt(4 / Math.PI),
        label: "c"
    }, {
        value: Math.E,
        label: "e"
    }, {
        value: Math.PI,
        label: "π"
    }];
const arithmeticScales = {
    D: {
        id: "D",
        label: "D",
        type: "log",
        min: 1,
        max: 10,
        gauges: STANDARD_GAUGES,
        formula: "x",
        tone: "neutral",
        description: "Fixed fundamental logarithmic scale for multiplication and division.",
        family: "Fundamental"
    },
    C: {
        id: "C",
        label: "C",
        type: "log",
        min: 1,
        max: 10,
        gauges: STANDARD_GAUGES,
        formula: "x",
        tone: "green",
        description: "Sliding fundamental logarithmic scale for multiplication and division.",
        family: "Fundamental"
    },
    CI: {
        id: "CI",
        label: "CI",
        type: "inverseLog",
        min: 1,
        max: 10,
        formula: "10/x",
        tone: "red",
        description: "Inverted C scale for reciprocals and chained products.",
        family: "Folded and reciprocal"
    },
    DI: {
        id: "DI",
        label: "DI",
        type: "inverseLog",
        min: 1,
        max: 10,
        formula: "10/x",
        tone: "red",
        description: "Inverted D scale for reciprocals.",
        family: "Folded and reciprocal"
    },
    CF: makeFoldedScale("CF", "CF", false, "C scale folded at pi, useful for avoiding off-scale products and multiplying by pi."),
    DF: makeFoldedScale("DF", "DF", false, "D scale folded at pi, useful for avoiding off-scale products and multiplying by pi."),
    CIF: makeFoldedScale("CIF", "CIF", true, "True reciprocal of the CF scale, folded at pi."),
    DIF: makeFoldedScale("DIF", "DIF", true, "True reciprocal of the DF scale, folded at pi."),
    CFM: makeFoldedScale("CFM", "CF/M", false, "Pickett folded C scale at 1/M = ln(10), where M = log10(e).", Math.LN10, "1/M"),
    DFM: makeFoldedScale("DFM", "DF/M", false, "Pickett folded D scale at 1/M = ln(10), where M = log10(e).", Math.LN10, "1/M"),
    L: {
        id: "L",
        label: "L",
        type: "linear",
        min: 0,
        max: 1,
        majorStep: 0.1,
        formula: "log₁₀x",
        description: "Linear mantissa scale for common logarithms.",
        family: "Logarithms"
    },
    LN: {
        id: "LN",
        label: "ln",
        type: "linear",
        min: 0,
        max: Math.LN10,
        majorStep: 0.2,
        formula: "ln x",
        description: "Natural logarithm of the D-scale mantissa, from 0 to ln(10).",
        family: "Logarithms"
    }
};
export { arithmeticScales };
