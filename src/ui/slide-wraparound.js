/** Repeat only the graduated slide, at its existing physical period.
 *
 * Each source mover keeps its normal transform. Its two neighbouring periods
 * fill the space exposed by motion in either direction, without moving the
 * stators or end gutters. Reuse the copies during dragging; rebuild them only
 * after the source engraving or its collision-aware label layout changes.
 */
const layouts = new WeakMap();
const SOURCE_MOVERS = '.slide-mover:not(.slide-wraparound-copy)';
const REMOVED_ATTRIBUTES = ['id', 'tabindex', 'aria-describedby', 'aria-labelledby'];

function clearCopies(layout) {
    for (const { source, copies } of layout.records) {
        source.classList.remove('slide-wraparound-tile');
        copies.forEach(copy => copy.remove());
    }
    layout.records = [];
}

function copyPeriod(source, period) {
    const copy = source.cloneNode(true);
    copy.classList.add('slide-wraparound-copy');
    copy.dataset.wrapPeriod = String(period);
    copy.setAttribute('aria-hidden', 'true');
    for (const node of [copy, ...copy.querySelectorAll('*')]) {
        REMOVED_ATTRIBUTES.forEach(name => node.removeAttribute(name));
        // A source annotation may currently have its native title suppressed
        // by the hover controller. The repeated annotation is a separate mark.
        if (node.hasAttribute('data-mark-tip'))
            node.setAttribute('title', node.getAttribute('data-mark-tip'));
    }
    source.parentNode.insertBefore(copy, source.nextSibling);
    return copy;
}

function rebuildCopies(layout, sources) {
    clearCopies(layout);
    layout.records = sources.map(source => {
        source.classList.add('slide-wraparound-tile');
        return { source, copies: [-1, 1].map(period => copyPeriod(source, period)) };
    });
}

function positionMover(mover, offset) {
    mover.style.transform = `translateX(${(offset * 100).toFixed(4)}%)`;
}

function positionCopies(layout) {
    for (const { source, copies } of layout.records) {
        positionMover(source, layout.offset);
        copies.forEach(copy => positionMover(copy, layout.offset + Number(copy.dataset.wrapPeriod)));
    }
}

/** Update motion without rebuilding the engraving. Off is the ordinary slide.
 * Offsets retain the application's existing limits; wrapping is a visual
 * repetition and does not jump or reset the physical slide position.
 */
export function updateSlideWraparound(ruleCanvas, offset, enabled = false) {
    let layout = layouts.get(ruleCanvas);
    if (!layout) {
        layout = { records: [], offset, enabled: false };
        layouts.set(ruleCanvas, layout);
    }
    layout.offset = offset;
    layout.enabled = Boolean(enabled);
    ruleCanvas.style.setProperty('--slide-offset', String(offset));
    const sources = [...ruleCanvas.querySelectorAll(SOURCE_MOVERS)];
    if (!layout.enabled) {
        clearCopies(layout);
        sources.forEach(source => positionMover(source, offset));
        return;
    }
    if (sources.length !== layout.records.length ||
        sources.some((source, index) => source !== layout.records[index].source))
        rebuildCopies(layout, sources);
    positionCopies(layout);
}

/** Call after polishing original labels, before rebuilding the reading lens.
 * Copies must inherit the chosen label positions and hidden graduations, not
 * run the label solver again as though they were three independent scales.
 */
export function refreshSlideWraparound(ruleCanvas) {
    const layout = layouts.get(ruleCanvas);
    if (!layout?.enabled) return;
    rebuildCopies(layout, [...ruleCanvas.querySelectorAll(SOURCE_MOVERS)]);
    positionCopies(layout);
}
