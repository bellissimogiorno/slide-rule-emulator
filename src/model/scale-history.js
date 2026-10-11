/** Session-local, bounded undo for scale-list edits. An entry restores one face
 * and its preset attribution, never cursor positions, viewing mode or themes.
 * Reset on successful programme/preset replacement; invalid imports keep it.
 */
import { deepClone } from "#core/objects.js";

export const SCALE_HISTORY_LIMIT = 100;

export function createScaleHistory(limit = SCALE_HISTORY_LIMIT) {
    if (!Number.isInteger(limit) || limit < 1) throw new Error("Invalid undo history limit.");
    const entries = [];
    return {
        get size() { return entries.length; },
        get description() { return entries.at(-1)?.description || ""; },
        remember(state, description, focus) {
            const sideKey = state.activeSide;
            if (!Object.hasOwn(state.sides, sideKey)) throw new Error("Cannot remember an absent face.");
            entries.push({ sideKey, side: deepClone(state.sides[sideKey]),
                presetId: state.presetId, description: String(description), focus: { ...focus } });
            if (entries.length > limit) entries.shift();
        },
        undo(state) {
            const entry = entries.at(-1);
            if (!entry) return null;
            // Do not consume an entry if its programme has been replaced.
            if (!Object.hasOwn(state.sides, entry.sideKey)) throw new Error("The edited face no longer exists.");
            entries.pop();
            return { state: { ...state, activeSide: entry.sideKey, presetId: entry.presetId,
                sides: { ...state.sides, [entry.sideKey]: deepClone(entry.side) } },
                description: entry.description, focus: { ...entry.focus } };
        },
        clear() { entries.length = 0; }
    };
}
