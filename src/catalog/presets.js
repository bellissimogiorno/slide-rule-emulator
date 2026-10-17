import { ultralogPresets } from '#catalog/presets/ultralog.js';
import { aristoHyperbolicPresets } from '#catalog/presets/aristo-hyperbolic.js';
import { mathemaPresets } from '#catalog/presets/mathema.js';
import { graphoplexPresets } from '#catalog/presets/graphoplex.js';
import { faber282nPresets } from '#catalog/presets/faber282n.js';
import { pickett14Presets } from "#catalog/presets/pickett14.js";
import { chemicalPresets } from "#catalog/presets/chemical.js";
import { deepFreeze } from "#core/objects.js";
import { historicalPresets } from "#catalog/presets/historical.js";
import { laboratoriesPresets } from "#catalog/presets/laboratories.js";
export const PRESETS = deepFreeze({
    ...historicalPresets,
    ...aristoHyperbolicPresets,
    ...mathemaPresets,
    ...ultralogPresets,
    ...graphoplexPresets,
    ...faber282nPresets,
    ...pickett14Presets,
    ...chemicalPresets,
    ...laboratoriesPresets
});
