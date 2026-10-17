import { ultralogScales } from '#catalog/scales/ultralog.js';
import { aristoHyperbolicScales } from '#catalog/scales/aristo-hyperbolic.js';
import { mathemaScales } from '#catalog/scales/mathema.js';
import { graphoplexScales } from '#catalog/scales/graphoplex.js';
import { faber282nScales } from '#catalog/scales/faber282n.js';
import { pickett14Scales } from "#catalog/scales/pickett14.js";
import { flyingFishScales } from "#catalog/scales/flying-fish.js";
/** Immutable built-in catalogue. Mathematical mappings live in core/, not here. */
import { chemicalScales } from "#catalog/scales/chemical.js";
import { deepFreeze } from "#core/objects.js";
import { additionalScales } from "#catalog/scales/combined-and-aliases.js";
import { arithmeticScales } from "#catalog/scales/arithmetic.js";
import { rootsScales } from "#catalog/scales/roots.js";
import { fifthsScales } from "#catalog/scales/fifths.js";
import { trigonometricScales } from "#catalog/scales/trigonometric.js";
import { loglogScales } from "#catalog/scales/loglog.js";
import { hyperbolicScales } from "#catalog/scales/hyperbolic.js";
import { specialistScales } from "#catalog/scales/specialist.js";
import { radiationScales } from "#catalog/scales/radiation.js";
const base = {
    ...aristoHyperbolicScales,
    ...mathemaScales,
    ...ultralogScales,
    ...graphoplexScales,
    ...faber282nScales,
    ...arithmeticScales,
    ...pickett14Scales,
    ...chemicalScales,
    ...flyingFishScales,
    ...rootsScales,
    ...fifthsScales,
    ...trigonometricScales,
    ...loglogScales,
    ...hyperbolicScales,
    ...specialistScales,
    ...radiationScales
};
const catalogue = { ...base, ...additionalScales(base) };
// Built-in numeric lists describe the conventional engraving, not a discrete
// set of admissible values. Their continuous mappings may be regraduated in the
// opt-in adaptive mode. Chemical reference lists and explicit opt-outs are not.
// User-authored tick lists do not pass through this built-in-only default.
export const BUILTIN_SCALES = deepFreeze(Object.fromEntries(
    Object.entries(catalogue).map(([id, def]) => [id,
        Array.isArray(def.ticks) && !def.referenceOnly && def.adaptiveTicks === undefined
            ? { ...def, adaptiveTicks: true } : def
    ])
));
