import { chemicalPresets } from "#catalog/presets/chemical.js";
import { deepFreeze } from "#core/objects.js";
import { historicalPresets } from "#catalog/presets/historical.js";
import { laboratoriesPresets } from "#catalog/presets/laboratories.js";
export const PRESETS = deepFreeze({
    ...historicalPresets,
    ...chemicalPresets,
    ...laboratoriesPresets
});
