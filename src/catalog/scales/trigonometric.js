const trigonometricScales = {
    P: {
        id: "P",
        label: "P",
        type: "pythagorean",
        min: 0,
        max: Math.sqrt(0.99),
        formula: "√(1−x²)",
        description: "Pythagorean scale sqrt(1-x^2), useful for cosines and right triangles.",
        family: "Trigonometric"
    },
    PS: {
        id: "PS",
        label: "Ps",
        type: "pythagorean",
        min: 0,
        max: Math.sqrt(0.99),
        formula: "√(1−s²)",
        description: "Thornton P-s scale.",
        family: "Trigonometric"
    },
    S: {
        id: "S",
        label: "S",
        type: "sin",
        tickMode: "sin",
        min: 5.739170477,
        max: 90,
        unit: "°",
        formula: "sin θ",
        description: "Sine scale, labelled in degrees from asin(0.1) to 90 degrees.",
        family: "Trigonometric"
    },
    COS: {
        id: "COS",
        label: "COS",
        type: "cos",
        tickMode: "cos",
        min: 0,
        max: 84.260829523,
        unit: "°",
        formula: "cos θ",
        tone: "red",
        description: "Cosine scale, labelled in degrees from 0 to acos(0.1).",
        family: "Trigonometric"
    },
    T1: {
        id: "T1",
        label: "T₁",
        type: "tan",
        tickMode: "tan",
        min: 5.710593137,
        max: 45,
        unit: "°",
        formula: "tan θ",
        description: "Tangent scale from atan(0.1) to 45 degrees.",
        family: "Trigonometric"
    },
    T2: {
        id: "T2",
        label: "T₂",
        type: "tan2",
        tickMode: "tan2",
        min: 45,
        max: 84.289406863,
        unit: "°",
        formula: "tan θ",
        tone: "red",
        description: "Upper tangent scale from 45 degrees to atan(10).",
        family: "Trigonometric"
    },
    ST: {
        id: "ST",
        label: "ST",
        type: "smallAngle",
        tickMode: "smallAngle",
        min: 0.5729673449,
        max: 5.739170477,
        unit: "°",
        formula: "sin θ ≈ tan θ",
        description: "Small-angle sine/tangent scale from about 0.573 to 5.739 degrees.",
        family: "Trigonometric"
    }
};
export { trigonometricScales };
