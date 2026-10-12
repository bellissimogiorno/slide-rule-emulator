/** Supported whole-instrument zoom levels, shared by state and validation. */
export const MAGNIFICATIONS = Object.freeze([0.75, 1, 1.25, 1.5, 2]);

/** View mode is separate from the face being edited. In particular a custom
 * face may legitimately be called "both"; no face identifier is reserved. */
export function visibleSideKeys(state) {
    return state.viewMode === "both" ? Object.keys(state.sides) : [state.activeSide];
}
