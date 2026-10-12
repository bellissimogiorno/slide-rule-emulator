/** Mathematical extensions of Pickett-style engraving, not historical models.
 * Keep these components independent of legacy 5R overrides and F5I's reversed
 * 1..100000 numbering. See docs/FIFTH_ROOTS.md for the decimal conventions.
 */
import { makePowerScale, makeRootScale } from "#catalog/factories.js";

const labels = ["\u2075\u221a\u2081", "\u2075\u221a\u2082", "\u2075\u221a\u2083", "\u2075\u221a\u2084", "\u2075\u221a\u2085"];
const branches = labels.map((label, branch) => ({
    ...makeRootScale(`PICKETT_5R${branch + 1}`, label, 5, branch,
        `Pickett-style fifth-root branch ${branch + 1}: (10^${branch} times x)^(1/5), where x is the local C/D reading from 1 to 10.`),
    family: "Pickett-style fifth roots and powers", tone: "neutral"
}));

export const fifthsScales = {
    ...Object.fromEntries(branches.map(def => [def.id, def])),
    PICKETT_FIFTH_ROOT: {
        id: "PICKETT_FIFTH_ROOT", label: "Fifth roots", type: "rootStack",
        family: "Pickett-style fifth roots and powers", tone: "neutral",
        layers: branches.map(def => ({ scale: def.id, caption: def.label })),
        formula: "(10^j x)^(1/5), j=0..4",
        description: "Pickett-style extension: one unruled fifth-root branch, then two back-to-back pairs on two shared lines. All five branches increase left to right; each keeps its own exact graduations. Not a historical Pickett scale."
    },
    F5_PAIR: {
        ...makePowerScale("F5_PAIR", "x\u2075 / x\u207b\u2075", 5,
            "Shared fifth-power ticks: black x^5 from 1 to 100000 and red x^(-5) from 1 to 0.00001. Each black/red pair multiplies to 1, not 100000. x is the local C/D reading. A mathematical extension, not a historical Pickett scale."),
        family: "Pickett-style fifth roots and powers", tone: "neutral",
        pairedProduct: 1, positiveCaption: "x\u2075", negativeCaption: "x\u207b\u2075",
        formula: "x^5 / x^(-5)"
    }
};
