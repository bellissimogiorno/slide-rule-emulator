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
import { faberAristoCursors } from '#catalog/cursors/faber-aristo.js';
import { pickettKeCursors } from '#catalog/cursors/pickett-ke.js';
import { otherMakerCursors } from '#catalog/cursors/other-makers.js';

const layouts = {
    ...historicalPresets,
    ...aristoHyperbolicPresets,
    ...mathemaPresets,
    ...ultralogPresets,
    ...graphoplexPresets,
    ...faber282nPresets,
    ...pickett14Presets,
    ...chemicalPresets,
    ...laboratoriesPresets
};

// Keep researched cursor geometry separate from the scale arrangements. The
// public catalogue is the complete instrument: examples, defaults, exports and
// the editor must all use PRESETS rather than the unadorned layout modules.
const cursorProfiles = { ...faberAristoCursors, ...pickettKeCursors, ...otherMakerCursors };
export const PRESETS = deepFreeze(Object.fromEntries(Object.entries(layouts).map(([id, preset]) => [id, {
    ...preset,
    sides: Object.fromEntries(Object.entries(preset.sides).map(([face, side]) =>
        [face, { ...side, ...cursorProfiles[id]?.[face] }]))
}])));
