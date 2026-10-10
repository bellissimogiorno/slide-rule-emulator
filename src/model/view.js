/** View mode is separate from the face being edited. In particular a custom
 * face may legitimately be called "both"; no face identifier is reserved. */
export function visibleSideKeys(state) {
    return state.viewMode === "both" ? Object.keys(state.sides) : [state.activeSide];
}
