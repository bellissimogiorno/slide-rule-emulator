import { GRADUATION_MODES, ADAPTIVE_SPACING } from "#core/ticks/adaptive.js";
import { LOG_GRADUATIONS } from "#core/ticks/conventional.js";
import { MAGNIFICATIONS } from "#model/view.js";
import { CURSOR_SHAPES, CURSOR_COLOURS } from "#model/cursor-appearance.js";
import { deepFreeze, deepClone } from "#core/objects.js";
import { DENSITIES, THEMES } from "#catalog/appearance.js";
import { DEFAULT_STATE } from "#catalog/defaults.js";
import { PRESETS } from "#catalog/presets.js";
import { BUILTIN_SCALES } from "#catalog/scales.js";
import { clamp } from "#core/numbers.js";
function mergeState(base, incoming) {
    if (!incoming || typeof incoming !== "object")
        return base;
    const out = Object.assign({}, base, incoming);
    out.sides = incoming.sides && typeof incoming.sides === "object" ? deepClone(incoming.sides) : deepClone(base.sides || {});
    out.customScales = deepClone(Array.isArray(incoming.customScales) ? incoming.customScales : (base.customScales || []));
    return out;
}
function normalizeState(s) {
    s.viewMode = s.viewMode === "both" ? "both" : "single";
    if (!s.sides || typeof s.sides !== "object" || !Object.keys(s.sides).length)
        s.sides = deepClone(DEFAULT_STATE.sides);
    for (const [sideKey, side] of Object.entries(s.sides)) {
        side.name = side.name || sideKey.charAt(0).toUpperCase() + sideKey.slice(1);
        for (const rail of ["topStator", "slide", "bottomStator"]) {
            if (!Array.isArray(side[rail]))
                side[rail] = [];
            side[rail] = side[rail].map(String);
        }
    }
    if (!s.sides[s.activeSide])
        s.activeSide = Object.keys(s.sides)[0] || "front";
    if (!s.presetId || !Object.hasOwn(PRESETS, s.presetId))
        s.presetId = "custom";
    if (!Object.hasOwn(THEMES, s.theme))
        s.theme = DEFAULT_STATE.theme;
    if (!Object.hasOwn(DENSITIES, s.density))
        s.density = DEFAULT_STATE.density;
    s.modelLabel = String(s.modelLabel || "Programmable scientific duplex");
    s.instrumentNote = String(s.instrumentNote || "");
    s.showFormulas = Boolean(s.showFormulas);
    s.compactScales = s.compactScales !== false;
    s.fullPrecision = s.fullPrecision === true;
    s.slideOffset = clamp(Number(s.slideOffset) || 0, -0.9, 0.9);
    s.cursor = clamp(Number.isFinite(Number(s.cursor)) ? Number(s.cursor) : 0.5, 0, 1);
    s.cursorShape = typeof s.cursorShape === 'string' && Object.hasOwn(CURSOR_SHAPES, s.cursorShape) ? s.cursorShape : 'instrument';
    s.cursorColour = typeof s.cursorColour === 'string' && Object.hasOwn(CURSOR_COLOURS, s.cursorColour) ? s.cursorColour : 'instrument';
    s.graduationMode = GRADUATION_MODES.includes(s.graduationMode) ? s.graduationMode : 'conventional';
    s.adaptiveSpacing = Object.hasOwn(ADAPTIVE_SPACING, s.adaptiveSpacing) ? s.adaptiveSpacing : 'balanced';
    s.logGraduations = LOG_GRADUATIONS.includes(s.logGraduations) ? s.logGraduations : "adaptive";
    s.magnification = MAGNIFICATIONS.includes(s.magnification) ? s.magnification : 1;
    if (!Array.isArray(s.customScales))
        s.customScales = [];
}
/** Built-ins are already deeply immutable: share them across programmes.
 * Clone only custom definitions, never freezing or retaining caller data. */
function buildLibrary(programme) {
    const lib = Object.assign(Object.create(null), BUILTIN_SCALES);
    for (const rawDef of programme.customScales || []) {
        if (!rawDef || typeof rawDef !== "object" || !rawDef.id)
            continue;
        const id = String(rawDef.id).trim();
        if (!id)
            continue;
        lib[id] = Object.assign({}, deepClone(rawDef), { id });
    }
    return deepFreeze(lib);
}
function exportableState(state) {
    return {
        activeSide: state.activeSide,
        viewMode: state.viewMode === "both" ? "both" : "single",
        presetId: state.presetId || "custom",
        theme: state.theme,
        density: state.density,
        modelLabel: state.modelLabel,
        instrumentNote: state.instrumentNote,
        showFormulas: Boolean(state.showFormulas),
        compactScales: Boolean(state.compactScales),
        fullPrecision: state.fullPrecision === true,
        magnification: state.magnification,
        graduationMode: state.graduationMode || 'conventional',
        adaptiveSpacing: state.adaptiveSpacing || 'balanced',
        logGraduations: state.logGraduations || "adaptive",
        slideOffset: state.slideOffset,
        cursor: state.cursor,
        cursorShape: typeof state.cursorShape === 'string' && Object.hasOwn(CURSOR_SHAPES, state.cursorShape) ? state.cursorShape : 'instrument',
        cursorColour: typeof state.cursorColour === 'string' && Object.hasOwn(CURSOR_COLOURS, state.cursorColour) ? state.cursorColour : 'instrument',
        customScales: deepClone(state.customScales || []),
        sides: deepClone(state.sides)
    };
}
export { deepClone, mergeState, normalizeState, buildLibrary, exportableState };
