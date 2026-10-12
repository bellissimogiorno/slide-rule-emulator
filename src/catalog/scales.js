import { faber282nScales } from '#catalog/scales/faber282n.js';
import { pickett14Scales } from "#catalog/scales/pickett14.js";
import { flyingFishScales } from "#catalog/scales/flying-fish.js";
/** Immutable built-in catalogue. Mathematical mappings live in core/, not here. */
import { chemicalScales } from "#catalog/scales/chemical.js";
import { deepFreeze } from "#core/objects.js";
import { additionalScales } from "#catalog/scales/combined-and-aliases.js";
import { arithmeticScales } from "#catalog/scales/arithmetic.js";
import { rootsScales } from "#catalog/scales/roots.js";
import { trigonometricScales } from "#catalog/scales/trigonometric.js";
import { loglogScales } from "#catalog/scales/loglog.js";
import { hyperbolicScales } from "#catalog/scales/hyperbolic.js";
import { specialistScales } from "#catalog/scales/specialist.js";
import { radiationScales } from "#catalog/scales/radiation.js";
const base = {
    ...faber282nScales,
    ...arithmeticScales,
    ...pickett14Scales,
    ...chemicalScales,
    ...flyingFishScales,
    ...rootsScales,
    ...trigonometricScales,
    ...loglogScales,
    ...hyperbolicScales,
    ...specialistScales,
    ...radiationScales
};
export const BUILTIN_SCALES = deepFreeze({
    ...base,
    ...additionalScales(base)
});
