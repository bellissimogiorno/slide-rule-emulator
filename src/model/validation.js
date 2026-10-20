/** Untrusted JSON enters through this boundary before live state is changed.
 * Validation is deliberately stronger than JSON Schema: it checks references,
 * mathematical domains, sampled inverses and bounded graduation generation.
 * Sampled checks are diagnostics, not a proof about an arbitrary expression.
 *
 * Order matters: inspect data, check structure/metadata, build the validated
 * scale library, then resolve layouts and faces. Preserve the first error when
 * adding checks; import validation is a transactional public boundary.
 */
import { GRADUATION_MODES, ADAPTIVE_SPACING } from '#core/ticks/adaptive.js';
import { LOG_GRADUATIONS } from '#core/ticks/conventional.js';
import { RAILS } from '#core/scale-types.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { THEMES, DENSITIES } from '#catalog/appearance.js';
import { MAGNIFICATIONS } from '#model/view.js';
import { CURSOR_SHAPES, CURSOR_COLOURS } from '#model/cursor-appearance.js';
import { PROGRAM_LIMITS, object, fail, identifier, inspectData } from '#model/validation-data.js';
import { validateScaleDefinition, validateComposites } from '#model/validation-scales.js';
import { validateCursorMarks, validateCursorCaptions } from '#model/validation-cursors.js';
export { PROGRAM_LIMITS } from '#model/validation-data.js';

export function parseProgramText(text) {
    if (typeof text !== 'string' || text.length > PROGRAM_LIMITS.characters)
        fail('Programme exceeds the 1,000,000-character limit.');
    const programme = JSON.parse(text);
    // Accept retired appearance overrides at the JSON boundary so stored and
    // embedded programmes retain their scales, positions and colour. These
    // values mean Instrument now; authored per-face cursorFrame is untouched.
    // Other invalid values still fail validation instead of hiding bad input.
    if (object(programme) && ['clear', 'ivory', 'metal'].includes(programme.cursorShape))
        programme.cursorShape = 'instrument';
    validateProgram(programme);
    return programme;
}
function validateMetadata(programme) {
    for (const [key, values] of [['cursorShape', CURSOR_SHAPES], ['cursorColour', CURSOR_COLOURS]]) {
        if (programme[key] !== undefined && (typeof programme[key] !== 'string' || !Object.hasOwn(values, programme[key])))
            fail(key + ' must be one of ' + Object.keys(values).join(', ') + '.');
    }
    if (programme.viewMode !== undefined && !["single", "both"].includes(programme.viewMode))
        fail("viewMode must be single or both.");
    for (const [key, values] of [['theme', THEMES], ['density', DENSITIES]]) {
        if (programme[key] !== undefined && !Object.hasOwn(values, programme[key]))
            fail('Unknown ' + key + ': ' + programme[key]);
    }
    for (const key of ['showFormulas', 'compactScales', 'fullPrecision', 'slideWraparound']) {
        if (programme[key] !== undefined && typeof programme[key] !== 'boolean')
            fail(key + ' must be a boolean.');
    }
    for (const [key, lo, hi] of [['cursor', 0, 1], ['slideOffset', -0.9, 0.9]]) {
        if (programme[key] !== undefined && (typeof programme[key] !== 'number' || programme[key] < lo || programme[key] > hi))
            fail(key + ' is outside its permitted range.');
    }
    if (programme.graduationMode !== undefined && !GRADUATION_MODES.includes(programme.graduationMode))
        fail('graduationMode must be conventional or adaptive.');
    if (programme.adaptiveSpacing !== undefined && !Object.hasOwn(ADAPTIVE_SPACING, programme.adaptiveSpacing))
        fail('adaptiveSpacing must be clear, balanced or fine.');
    if (programme.logGraduations !== undefined && !LOG_GRADUATIONS.includes(programme.logGraduations))
        fail('logGraduations must be adaptive, pocket, standard or fine.');
    if (programme.magnification !== undefined && !MAGNIFICATIONS.includes(programme.magnification))
        fail('magnification must be one of ' + MAGNIFICATIONS.join(', ') + '.');
    for (const key of ['modelLabel', 'instrumentNote', 'presetId', 'activeSide']) {
        if (programme[key] !== undefined && typeof programme[key] !== 'string')
            fail(key + ' must be text.');
    }
}
export function validateProgram(programme) {
    inspectData(programme);
    if (!object(programme))
        fail('JSON must be an object.');
    if (!object(programme.sides) || !Object.keys(programme.sides).length)
        fail('Include at least one side in a sides object.');
    if (Object.keys(programme.sides).length > PROGRAM_LIMITS.sides)
        fail('At most 8 sides are supported.');
    if (programme.customScales !== undefined && !Array.isArray(programme.customScales))
        fail('customScales must be an array.');
    const custom = programme.customScales || [];
    if (custom.length > PROGRAM_LIMITS.customScales)
        fail('At most 128 custom scales are supported.');
    validateMetadata(programme);
    const library = Object.assign(Object.create(null), BUILTIN_SCALES);
    const ids = new Set();
    for (const d of custom) {
        if (!object(d) || !identifier(d.id))
            fail('Each custom scale needs a non-reserved ID of at most 64 characters.');
        if (ids.has(d.id))
            fail('Duplicate custom scale ID: ' + d.id);
        ids.add(d.id);
        try {
            validateScaleDefinition(d);
        }
        catch (error) {
            fail(d.id + ': ' + error.message);
        }
        library[d.id] = d;
    }
    validateComposites(library); // Includes built-in layers that have been overridden.
    let rows = 0;
    for (const [key, side] of Object.entries(programme.sides)) {
        if (!identifier(key) || !object(side))
            fail('Each side needs a valid ID and object.');
        for (const field of ['name', 'note'])
            if (side[field] !== undefined && typeof side[field] !== 'string')
                fail(key + ': ' + field + ' must be text.');
        validateCursorMarks(side, library);
        validateCursorCaptions(side, library);
        for (const rail of RAILS) {
            if (!Array.isArray(side[rail]) || side[rail].length > PROGRAM_LIMITS.rowsPerRail)
                fail(key + ': ' + rail + ' must be an array of at most 40 scale IDs.');
            rows += side[rail].length;
            for (const id of side[rail])
                if (typeof id !== 'string' || !Object.hasOwn(library, id))
                    fail(key + ': missing scale ' + id);
        }
    }
    if (rows > PROGRAM_LIMITS.rows)
        fail('At most 320 scale rows are supported.');
    if (programme.activeSide !== undefined && !Object.hasOwn(programme.sides, programme.activeSide))
        fail('activeSide must name an existing side.');
}
