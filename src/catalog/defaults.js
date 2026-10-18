import { PRESETS } from "#catalog/presets.js";
import { deepClone, deepFreeze } from "#core/objects.js";
const DEFAULT_STATE = deepFreeze({
    activeSide: "front",
    viewMode: "single",
    presetId: "faber283n",
    theme: PRESETS.faber283n.theme,
    density: PRESETS.faber283n.density,
    modelLabel: PRESETS.faber283n.modelLabel,
    instrumentNote: PRESETS.faber283n.instrumentNote,
    showFormulas: PRESETS.faber283n.showFormulas,
    compactScales: true,
    fullPrecision: false,
    slideWraparound: false,
    magnification: 1,
    logGraduations: "adaptive",
    graduationMode: "conventional",
    adaptiveSpacing: "balanced",
    slideOffset: 0,
    cursor: 0.5,
    cursorShape: "instrument",
    cursorColour: "instrument",
    customScales: [
        {
            id: "X2",
            label: "X2",
            type: "expression",
            min: 1,
            max: 100,
            pos: "Math.log10(x) / 2",
            value: "Math.pow(10, 2 * p)",
            tickMode: "log",
            formula: "x²",
            description: "Example custom square scale made from expressions.",
            family: "Custom"
        }
    ],
    sides: deepClone(PRESETS.faber283n.sides)
});
export { DEFAULT_STATE };
