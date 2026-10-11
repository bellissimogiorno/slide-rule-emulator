/** Screen-space geometry for a pointer-centred reading lens.
 * Input coordinates are client CSS pixels. CSS instrument zoom is represented
 * by the source rectangle / unzoomed size ratio, so 2.5x is relative to the
 * instrument as displayed, including any existing magnification.
 */
import { clamp } from '#core/numbers.js';
export const LOUPE_FACTOR = 2.5;

export function loupeGeometry(point, source, size, viewport) {
    const margin = 8;
    // Keep the 320px reading width, now with equal height. Only a viewport
    // too narrow or short to contain it reduces BOTH dimensions together.
    const width = Math.min(320, Math.max(1, viewport.width - 2 * margin),
        Math.max(1, viewport.height - 2 * margin));
    const height = width;
    const left = clamp(point.x - width / 2, viewport.left + margin,
        viewport.left + Math.max(margin, viewport.width - width - margin));
    const top = clamp(point.y - height / 2, viewport.top + margin,
        viewport.top + Math.max(margin, viewport.height - height - margin));
    return {
        left, top, width, height,
        // Keeping the sampled point under the pointer also prevents a jump
        // when the lens is constrained by an edge of the browser viewport.
        x: point.x - left - (point.x - source.left) * LOUPE_FACTOR,
        y: point.y - top - (point.y - source.top) * LOUPE_FACTOR,
        scaleX: LOUPE_FACTOR * source.width / size.width,
        scaleY: LOUPE_FACTOR * source.height / size.height
    };
}
