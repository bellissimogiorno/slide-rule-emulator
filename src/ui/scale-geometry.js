import { DEFAULT_LABEL_W } from '#version.js';

/** Keep local engraving coordinates separate from screen pointer coordinates.
 *
 * A measured tick pane is authoritative, including when browser zoom changes
 * its screen width. Before a face exists (or for a face with no scale rows),
 * use the configured label/legend gutters and current magnification instead.
 * Read magnification lazily because importing a programme replaces state.
 */
export function createScaleGeometry({ canvas, getMagnification }) {
    const window = canvas.ownerDocument.defaultView;

    function gutterWidth(property, fallback) {
        const raw = window.getComputedStyle(canvas).getPropertyValue(property);
        const parsed = parseFloat(raw);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function getLabelWidth() {
        return gutterWidth('--label-w', DEFAULT_LABEL_W);
    }

    function getLegendWidth() {
        return gutterWidth('--legend-w', 0);
    }

    function getScaleGeometry(face = canvas.querySelector('.rule-face-body') || canvas) {
        const pane = face.querySelector('.tick-pane');
        const bounds = face.getBoundingClientRect();
        if (pane) {
            const rect = pane.getBoundingClientRect();
            const zoom = bounds.width / Math.max(1, face.offsetWidth);
            return { left: (rect.left - bounds.left) / zoom, width: rect.width / zoom,
                screenLeft: rect.left, screenWidth: rect.width };
        }
        const left = getLabelWidth(), width = Math.max(1, canvas.clientWidth - left - getLegendWidth());
        const magnification = getMagnification();
        return { left, width, screenLeft: bounds.left + left * magnification,
            screenWidth: width * magnification };
    }

    function getScalePixelWidth() {
        const geometry = getScaleGeometry();
        return Math.max(1, geometry.width || canvas.clientWidth - getLabelWidth() - getLegendWidth());
    }

    return { getScaleGeometry, getScalePixelWidth };
}
