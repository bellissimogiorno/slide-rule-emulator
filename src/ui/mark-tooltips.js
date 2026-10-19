/** Hover explanations for annotated marks, including marks under cursor glass.
 * Purely informational: no pointer capture, focus changes or motion commands.
 * The native title remains a fallback if this enhancement is not running.
 */
export function visibleMarkBounds(mark) {
    const box = mark.getBoundingClientRect();
    let { left, right, top, bottom } = box;
    // Bounding boxes include clipped-away ink. Restrict the hit area to the
    // graduated pane and (when repeated) the image's own one-period window.
    // Otherwise a hidden copy can show a tooltip over a fixed end gutter.
    for (const selector of ['.tick-pane', '.slide-wraparound-tile']) {
        const clip = mark.closest(selector);
        if (!clip) continue;
        const bounds = clip.getBoundingClientRect();
        left = Math.max(left, bounds.left); right = Math.min(right, bounds.right);
        top = Math.max(top, bounds.top); bottom = Math.min(bottom, bounds.bottom);
    }
    return right > left && bottom > top ? { left, right, top, bottom } : null;
}

export function createMarkTooltips({ document, canvas, signal }) {
    const window = document.defaultView;
    const tooltip = document.createElement('div');
    tooltip.className = 'mark-tooltip';
    tooltip.dataset.runtimeOnly = 'true';
    tooltip.id = 'markTooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.hidden = true;
    document.body.append(tooltip);
    let current = null;
    let marks = null;
    let frame = 0;
    let point = null;
    let suppressed = false;
    function hide() {
        if (current) {
            current.setAttribute('title', current.dataset.markTip);
            current.removeAttribute('aria-describedby');
        }
        current = null;
        tooltip.hidden = true;
    }
    function update() {
        frame = 0;
        if (!point || suppressed || point.buttons) { hide(); return; }
        const { x, y } = point;
        // Hit-test annotation bounds rather than event.target: the cursor glass
        // deliberately sits over the original graduations and receives drags.
        let best = null, distance = Infinity;
        for (const mark of marks ||= [...canvas.querySelectorAll('[data-mark-tip]')]) {
            if (mark.classList.contains('label-hidden')) continue;
            const rect = visibleMarkBounds(mark);
            if (!rect) continue;
            const dx = Math.max(rect.left - x, 0, x - rect.right);
            const dy = Math.max(rect.top - y, 0, y - rect.bottom);
            const gap = Math.hypot(dx, dy);
            if (gap > 4 || window.getComputedStyle(mark).display === 'none') continue;
            // The yellow overlay is above the engraving. While the pointer is
            // inside it, explain the seam even if an annotated constant lies
            // underneath; outside the bar retain the usual nearest-mark help.
            if (gap === 0 && mark.classList.contains('slide-wraparound-seam')) { best = mark; break; }
            if (gap < distance) { best = mark; distance = gap; }
        }
        if (!best) { hide(); return; }
        if (best !== current) {
            hide(); current = best;
            tooltip.textContent = best.dataset.markTip; // Never interpret custom HTML.
            best.setAttribute('title', ''); // Avoid a second native popup.
            best.setAttribute('aria-describedby', tooltip.id);
        }
        tooltip.hidden = false;
        const width = tooltip.offsetWidth, height = tooltip.offsetHeight;
        const left = Math.max(8, Math.min(x + 16, window.innerWidth - width - 8));
        const top = y + height + 24 <= window.innerHeight ? y + 20 : Math.max(8, y - height - 12);
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }
    function schedule() {
        if (!frame) frame = window.requestAnimationFrame(update);
    }
    function onMove(event) {
        point = { x: event.clientX, y: event.clientY, buttons: event.buttons };
        suppressed = false; schedule();
    }
    const listen = (target, name, fn, extra = {}) => target.addEventListener(name, fn, { signal, ...extra });
    listen(canvas, 'pointermove', onMove);
    listen(canvas, 'pointerup', onMove);
    listen(canvas, 'pointerleave', () => { point = null; hide(); });
    listen(canvas, 'pointerdown', () => { suppressed = true; hide(); });
    listen(document, 'keydown', event => {
        // Escape dismisses the information without stealing the instrument's
        // own key command. Other keys can move a graduation away from the mouse.
        if (event.key === 'Escape') { suppressed = true; hide(); }
        else schedule();
    });
    // Scroll events may arrive after the first mouse move following an automatic
    // scroll. Re-hit-test at the remembered client point instead of discarding
    // that real movement and requiring another wiggle to reveal the tooltip.
    listen(window, 'scroll', () => { hide(); schedule(); }, { capture: true });
    listen(window, 'resize', () => { hide(); schedule(); });
    listen(window, 'blur', () => { point = null; hide(); });
    const observer = new window.MutationObserver(() => { marks = null; if (current && !current.isConnected) hide(); });
    observer.observe(canvas, { childList: true, subtree: true });
    function destroy() {
        hide(); observer.disconnect(); window.cancelAnimationFrame(frame); tooltip.remove();
    }
    signal.addEventListener('abort', destroy, { once: true });
    return { destroy };
}
