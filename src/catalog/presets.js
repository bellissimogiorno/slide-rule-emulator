import { faber282nPresets } from '#catalog/presets/faber282n.js';
import { pickett14Presets } from "#catalog/presets/pickett14.js";
import { chemicalPresets } from "#catalog/presets/chemical.js";
import { deepFreeze } from "#core/objects.js";
import { historicalPresets } from "#catalog/presets/historical.js";
import { laboratoriesPresets } from "#catalog/presets/laboratories.js";
export const PRESETS = deepFreeze({
    ...historicalPresets,
    ...faber282nPresets,
    ...pickett14Presets,
    ...chemicalPresets,
    ...laboratoriesPresets
});
