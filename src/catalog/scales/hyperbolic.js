const hyperbolicScales = {
    SH1: {
        id: "SH1",
        label: "Sh₁",
        type: "sinhLow",
        tickMode: "mapped",
        min: Math.asinh(0.1),
        max: Math.asinh(1),
        formula: "sinh u",
        description: "Low hyperbolic-sine range, aligned with 0.1 through 1 on D.",
        family: "Hyperbolic"
    },
    SH2: {
        id: "SH2",
        label: "Sh₂",
        type: "sinhHigh",
        tickMode: "mapped",
        min: Math.asinh(1),
        max: Math.asinh(10),
        formula: "sinh u",
        description: "High hyperbolic-sine range, aligned with 1 through 10 on D.",
        family: "Hyperbolic"
    },
    TH: {
        id: "TH",
        label: "Th",
        type: "tanh",
        tickMode: "mapped",
        min: Math.atanh(0.1),
        max: 3,
        formula: "tanh u",
        description: "Hyperbolic-tangent range, stopping before the asymptote.",
        family: "Hyperbolic"
    },
    H1: {
        id: "H1",
        label: "H₁",
        type: "hypotenuseLow",
        tickMode: "mapped",
        min: Math.sqrt(1.01),
        max: Math.sqrt(2),
        formula: "√(1+x²)",
        description: "Low sqrt(1+x^2) range for x from 0.1 through 1.",
        family: "Hyperbolic"
    },
    H2: {
        id: "H2",
        label: "H₂",
        type: "hypotenuseHigh",
        tickMode: "mapped",
        min: Math.sqrt(2),
        max: Math.sqrt(101),
        formula: "√(1+x²)",
        description: "High sqrt(1+x^2) range for x from 1 through 10.",
        family: "Hyperbolic"
    },
    CH: {
        id: "CH",
        label: "Ch",
        type: "acosh",
        tickMode: "mapped",
        min: 0,
        max: Math.acosh(10),
        formula: "cosh u",
        description: "Inverse hyperbolic-cosine argument aligned with cosh(u) on D.",
        family: "Hyperbolic"
    }
};
export { hyperbolicScales };
