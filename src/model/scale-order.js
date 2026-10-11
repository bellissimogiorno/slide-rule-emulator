/** Immutable, occurrence-based scale movement (duplicate scale IDs are valid).
 * The destination index is in the target rail AFTER removing the source row.
 * Keeping this transaction separate from the drag preview makes Escape/cancel
 * a genuine no-op: nothing has been saved until a drop is accepted.
 */
export const EDITOR_RAILS = Object.freeze(["topStator", "slide", "bottomStator"]);

export function moveScale(side, from, to) {
    for (const point of [from, to]) {
        if (!point || !EDITOR_RAILS.includes(point.rail) || !Number.isInteger(point.index))
            throw new Error("Invalid scale position.");
    }
    const source = side[from.rail], target = side[to.rail];
    if (!Array.isArray(source) || !Array.isArray(target) || from.index < 0 || from.index >= source.length)
        throw new Error("The source scale no longer exists.");
    const sameRail = from.rail === to.rail;
    const targetLength = target.length - (sameRail ? 1 : 0);
    if (to.index < 0 || to.index > targetLength) throw new Error("Invalid destination position.");
    if (!sameRail && target.length >= 40) throw new Error("The programme limit is 40 rows per rail.");
    if (sameRail && from.index === to.index) return side;
    const result = { ...side, [from.rail]: [...source] };
    if (!sameRail) result[to.rail] = [...target];
    const [scale] = result[from.rail].splice(from.index, 1);
    result[to.rail].splice(to.index, 0, scale);
    return result;
}

/** One vertical step, entering the adjacent rail at its nearest end. Empty
 * rails are valid destinations, not gaps to skip. Global ends return null.
 * Capacity is checked by moveScale so a full destination never loses a row.
 */
export function adjacentScalePosition(side, from, direction) {
    const railIndex = EDITOR_RAILS.indexOf(from?.rail);
    if (railIndex < 0 || !Number.isInteger(from.index) || from.index < 0
        || from.index >= side[from.rail]?.length || ![-1, 1].includes(direction))
        throw new Error("Invalid scale step.");
    const index = from.index + direction;
    if (index >= 0 && index < side[from.rail].length) return { rail: from.rail, index };
    const rail = EDITOR_RAILS[railIndex + direction];
    return rail ? { rail, index: direction < 0 ? side[rail].length : 0 } : null;
}
