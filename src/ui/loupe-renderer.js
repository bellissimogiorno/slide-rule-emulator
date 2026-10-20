/** Paint-sized DOM for the reading lens, not a scaled composited layer.
 *
 * Snapshot the polished face's boxes and text runs in client pixels. Lay out a
 * separate, inert copy at the final reading size: larger fonts, filled strokes
 * and measured positions, with no CSS zoom or scale transform. This preserves
 * label selection and fractional-zoom border rounding without copying pixels.
 * The controller invalidates the snapshot after engraving/size/font changes;
 * ordinary motion only updates the small set of moving containers.
 */
import { LOUPE_FACTOR } from '#ui/loupe-geometry.js';

const PAINT_PROPERTIES = [
    'color', 'background-color', 'background-image', 'background-repeat',
    'background-position', 'background-size', 'border-radius', 'box-shadow',
    'opacity', 'visibility', 'overflow-x', 'overflow-y', 'z-index',
    'font-family', 'font-size', 'font-weight', 'font-style', 'font-stretch',
    'font-variant', 'font-feature-settings', 'font-kerning', 'font-optical-sizing',
    'font-variation-settings', 'letter-spacing', 'word-spacing', 'text-transform',
    'color-scheme'
];
const FONT_PROPERTIES = PAINT_PROPERTIES.filter(name => name.startsWith('font-') ||
    ['color', 'letter-spacing', 'word-spacing', 'text-transform'].includes(name));
const STRIPPED_ATTRIBUTES = ['id', 'tabindex', 'title', 'aria-describedby', 'aria-labelledby'];

/** CSS computed lengths are px; percentages and colour components stay intact. */
export function multiplyPixels(value, factor) {
    return value.replace(/(-?(?:\d+\.?\d*|\.\d+))px\b/g,
        (_, number) => `${Number(number) * factor}px`);
}

function setStyles(node, properties) {
    for (const [name, value] of Object.entries(properties)) {
        const text = String(value);
        if (node.style.getPropertyValue(name) !== text)
            node.style.setProperty(name, text, 'important');
    }
}

/** The copy is detached while being painted. Set its complete frozen style in
 * one mutation per node instead of making a DOM call for every declaration.
 * Values come from CSSOM, so quoted strings and functions retain CSS escaping.
 */
function paintNode(node, properties) {
    node.style.cssText = 'all: initial !important;' + Object.entries(properties)
        .map(([name, value]) => `${name}:${value} !important;`).join('');
}

function paintStyles(style, sizeFactor) {
    return Object.fromEntries(PAINT_PROPERTIES.map(name =>
        [name, multiplyPixels(style.getPropertyValue(name), sizeFactor)]));
}

/** Borders must not round to whole device pixels or change child coordinates.
 * Thin ticks become filled rectangles; ordinary boxes get inset paint-only
 * edges. Neither technique consumes layout space, unlike native CSS borders.
 * Forced colours are already resolved by the source's computed style; preserve
 * them when a border becomes a fill instead of letting it turn into Canvas.
 */
function edges(style, sizeFactor) {
    const shadows = [];
    for (const [side, x, y] of [['top', 0, 1], ['right', -1, 0], ['bottom', 0, -1], ['left', 1, 0]]) {
        const width = parseFloat(style.getPropertyValue(`border-${side}-width`)) * sizeFactor;
        if (width > 0) shadows.push(`inset ${x * width}px ${y * width}px 0 0 ${style.getPropertyValue(`border-${side}-color`)}`);
    }
    const existing = multiplyPixels(style.boxShadow, sizeFactor);
    if (existing && existing !== 'none') shadows.push(existing);
    return shadows.join(', ') || 'none';
}

function boxStyles(box, parent) {
    return { left: `${(box.left - parent.left) * LOUPE_FACTOR}px`,
        top: `${(box.top - parent.top) * LOUPE_FACTOR}px`,
        width: `${box.width * LOUPE_FACTOR}px`, height: `${box.height * LOUPE_FACTOR}px` };
}

function freezeStroke(node, box, parent, style) {
    // Most face nodes are plain graduation strokes. Do not copy font/background
    // machinery or allocate a shadow for each of these filled rectangles.
    paintNode(node, { position: 'absolute', display: 'block', transform: 'none',
        visibility: style.visibility, opacity: style.opacity,
        'forced-color-adjust': 'none',
        'background-color': parseFloat(style.borderLeftWidth) > 0 ? style.borderLeftColor : style.borderTopColor,
        ...boxStyles(box, parent) });
    for (const name of STRIPPED_ATTRIBUTES) node.removeAttribute(name);
}

function freezeBox(node, box, parent, style, sizeFactor) {
    // Explicitly override the original flex/grid/pseudo-class layout, including
    // compact-label !important transforms. Descendants keep their own clipping.
    paintNode(node, { ...paintStyles(style, sizeFactor), position: 'absolute',
        display: style.display === 'none' ? 'none' : 'block', 'box-sizing': 'border-box',
        margin: '0', padding: '0', border: '0', transform: 'none', zoom: '1',
        'pointer-events': 'none', 'user-select': 'none', 'will-change': 'auto',
        'forced-color-adjust': 'none',
        'box-shadow': edges(style, sizeFactor), ...boxStyles(box, parent) });
    for (const name of STRIPPED_ATTRIBUTES) node.removeAttribute(name);
}

/** Only the cursor has generated content inside a face. Resolve its two plain
 * rectangular pseudo-elements into real, paint-sized nodes. The source cursor
 * is borderless, so its border box is also their containing block.
 */
function cursorDecoration(window, cursor, copy, pseudo, parent, sourceZoom, sizeFactor) {
    const style = window.getComputedStyle(cursor, pseudo);
    if (style.content === 'none' || style.content === 'normal' || style.display === 'none') return;
    const px = name => parseFloat(style.getPropertyValue(name)) || 0;
    const outer = (dimension, sides) => px(dimension) + (style.boxSizing === 'border-box' ? 0 :
        sides.reduce((sum, side) => sum + px(`padding-${side}`) + px(`border-${side}-width`), 0));
    const matrix = new window.DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
    const box = { left: parent.left + (px('left') + matrix.e) * sourceZoom,
        top: parent.top + (px('top') + matrix.f) * sourceZoom,
        width: outer('width', ['left', 'right']) * sourceZoom,
        height: outer('height', ['top', 'bottom']) * sourceZoom };
    const node = cursor.ownerDocument.createElement('span');
    node.dataset.loupeDecoration = pseudo.slice(2);
    freezeBox(node, box, parent, style, sizeFactor);
    copy.appendChild(node);
}

export function createLoupeDrawing(face) {
    const document = face.ownerDocument, window = document.defaultView;
    const faceBox = face.getBoundingClientRect();
    const faceStyle = window.getComputedStyle(face);
    const size = { width: parseFloat(faceStyle.width), height: parseFloat(faceStyle.height) };
    const sourceZoom = faceBox.width / size.width;
    const sizeFactor = sourceZoom * LOUPE_FACTOR;
    const copy = face.cloneNode(true);
    const originals = [face, ...face.querySelectorAll('*')];
    const copies = [copy, ...copy.querySelectorAll('*')];
    const boxes = new Map(originals.map(node => [node, node.getBoundingClientRect()]));
    const movers = [];
    const range = document.createRange();

    for (let i = 0; i < originals.length; i++) {
        const original = originals[i], node = copies[i], box = boxes.get(original);
        const parent = boxes.get(original.parentElement) || faceBox;
        const style = window.getComputedStyle(original);
        if (original.matches('.tick, .syncro-tick, .baseline, .syncro-baseline, .root-spine, .cursor-mark-line')) {
            freezeStroke(node, box, parent, style);
            continue;
        }
        freezeBox(node, box, parent, style, sizeFactor);
        // Anonymous flex items and mixed inline text have no element box.
        // Range gives their actual line position, including the chosen font.
        for (const child of [...node.childNodes]) if (child.nodeType === 3) child.remove();
        for (const child of original.childNodes) {
            if (child.nodeType !== 3 || !/\S/.test(child.textContent) || style.visibility === 'hidden' || style.display === 'none') continue;
            range.selectNodeContents(child);
            const textBox = range.getBoundingClientRect();
            const text = document.createElement('span');
            text.dataset.loupeText = '';
            text.textContent = child.textContent;
            paintNode(text, { ...Object.fromEntries(FONT_PROPERTIES.map(name =>
                [name, multiplyPixels(style.getPropertyValue(name), sizeFactor)])),
                position: 'absolute', display: 'block', 'white-space': 'pre', visibility: 'inherit',
                'line-height': `${textBox.height * LOUPE_FACTOR}px`,
                'text-decoration': multiplyPixels(style.textDecoration, sizeFactor),
                'text-underline-offset': multiplyPixels(style.textUnderlineOffset, sizeFactor),
                'pointer-events': 'none', 'forced-color-adjust': 'none', ...boxStyles(textBox, box) });
            node.appendChild(text);
        }
        if (original.matches('.slide-mover, .slide-wraparound-seam, .cursor')) movers.push([original, node]);
        if (original.matches('.cursor')) for (const pseudo of ['::before', '::after'])
            cursorDecoration(window, original, node, pseudo, box, sourceZoom, sizeFactor);
    }
    copy.classList.add('loupe-copy');
    return {
        element: copy,
        size,
        measureMotion() {
            // Share parent measurements between composite/wraparound movers.
            // The controller calls this before attaching or moving any copy.
            const parents = new Map();
            const positions = movers.map(([source, node]) => {
                const parent = source.parentElement;
                if (!parents.has(parent)) parents.set(parent, parent.getBoundingClientRect());
                return [node, source.getBoundingClientRect(), parents.get(parent)];
            });
            return positions;
        },
        place(x, y, positions = []) {
            // Translation moves already full-size text; it never enlarges a
            // raster layer. Pointer-only motion changes just this one property.
            setStyles(copy, { left: '0px', top: '0px', transform: `translate(${x}px, ${y}px)` });
            for (const [node, box, parent] of positions) setStyles(node, boxStyles(box, parent));
        }
    };
}
