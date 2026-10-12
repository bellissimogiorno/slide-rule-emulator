/** Live, non-interactive 2.5x reading lens. The drawing module paints fresh
 * full-size text and geometry; this controller owns hover, motion and lifetime.
 * Neither module changes the mathematical programme or its engraving choices.
 */
import { createInactivityTimer } from '#ui/inactivity.js';
import { loupeGeometry } from '#ui/loupe-geometry.js';
import { createLoupeDrawing } from '#ui/loupe-renderer.js';

export function createLoupe({ document, canvas, button, signal, returnTarget }) {
    const window = document.defaultView;
    const lifetime = new window.AbortController();
    const heldKeys = new Set();
    const lens = document.createElement('div');
    lens.className = 'rule-loupe';
    lens.dataset.runtimeOnly = '';
    lens.setAttribute('aria-hidden', 'true');
    lens.setAttribute('inert', '');
    lens.hidden = true;
    document.body.appendChild(lens);
    let enabled = false;
    let pointer = null;
    let source = null;
    let drawing = null;
    let dirty = true;
    let frame = 0;
    let destroyed = false;
    const listen = (target, name, handler, options = {}) =>
        target.addEventListener(name, handler, { ...options, signal: lifetime.signal });
    const inactivity = createInactivityTimer({ clock: window, onChange: idle => {
        lens.classList.toggle('is-idle', idle);
        if (!idle) refresh();
    } });

    function discardCopy() {
        lens.replaceChildren();
        source = drawing = null;
    }
    function rebuild(face) {
        source = face;
        drawing = createLoupeDrawing(face);
        lens.replaceChildren(drawing.element);
        dirty = false;
    }
    function paint() {
        frame = 0;
        if (destroyed || !enabled || !pointer) { lens.hidden = true; return; }
        if (inactivity.idle) return; // retain the transparent copy, but do no idle work
        // Hit-test the real page, not the captured event target during a drag.
        // The lens and all its descendants have pointer-events:none.
        const face = document.elementFromPoint(pointer.x, pointer.y)?.closest('.rule-face-body');
        if (!face || !canvas.contains(face)) { lens.hidden = true; return; }
        if (dirty || source !== face) rebuild(face);
        const rect = face.getBoundingClientRect();
        const computed = window.getComputedStyle(face);
        const width = parseFloat(computed.width), height = parseFloat(computed.height);
        if (!(width > 0 && height > 0 && rect.width > 0 && rect.height > 0)) { lens.hidden = true; return; }
        const visual = window.visualViewport;
        const viewport = visual ? { left: visual.offsetLeft, top: visual.offsetTop, width: visual.width, height: visual.height }
            : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
        const g = loupeGeometry(pointer, rect, { width, height }, viewport);
        for (const key of ['left', 'top', 'width', 'height']) lens.style[key] = g[key] + 'px';
        drawing.place(g.x, g.y);
        lens.hidden = false;
    }
    function refresh({ structure = false } = {}) {
        dirty ||= structure;
        if (!destroyed && enabled && pointer && !inactivity.idle && !frame) frame = window.requestAnimationFrame(paint);
    }
    function setEnabled(value) {
        enabled = Boolean(value) && !destroyed;
        button.setAttribute('aria-pressed', String(enabled));
        inactivity.setActive(enabled && pointer !== null);
        if (enabled) refresh();
        else {
            heldKeys.clear();
            inactivity.setHeld(false);
            lens.hidden = true;
            window.cancelAnimationFrame(frame);
            frame = 0;
            discardCopy();
        }
    }
    function clearPointer() {
        pointer = null;
        inactivity.setActive(false);
        lens.hidden = true;
    }
    listen(button, 'pointerdown', event => {
        if (event.isPrimary !== false && event.button === 0) event.preventDefault();
    });
    listen(button, 'click', () => {
        setEnabled(!enabled);
        const target = returnTarget();
        if (target && target !== document.activeElement) target.focus({ preventScroll: true });
    });
    listen(window, 'pointermove', event => {
        if (event.isPrimary === false) return;
        if (event.pointerType === 'touch') { clearPointer(); return; }
        const first = pointer === null;
        const moved = first || pointer.x !== event.clientX || pointer.y !== event.clientY;
        pointer = { x: event.clientX, y: event.clientY };
        if (first) inactivity.setActive(enabled);
        else if (moved) inactivity.activity();
        refresh();
    }, { passive: true });
    listen(window, 'pointerdown', event => {
        if (event.pointerType === 'touch') clearPointer();
        else inactivity.activity();
    }, { passive: true });
    listen(window, 'keydown', event => {
        if (!enabled) return;
        heldKeys.add(event.code || event.key);
        inactivity.setHeld(true);
    });
    listen(window, 'keyup', event => {
        if (heldKeys.delete(event.code || event.key)) inactivity.setHeld(heldKeys.size > 0);
    });
    listen(window, 'pointerout', event => { if (!event.relatedTarget) clearPointer(); });
    listen(window, 'pointercancel', clearPointer);
    function loseFocus() {
        heldKeys.clear();
        clearPointer();
        inactivity.setHeld(false);
    }
    listen(window, 'blur', loseFocus);
    listen(document, 'visibilitychange', () => { if (document.hidden) loseFocus(); });
    // Capture sees page scrolling and the horizontally scrollable rule alike.
    listen(window, 'scroll', () => refresh(), { capture: true, passive: true });
    listen(window, 'resize', () => refresh({ structure: true }));
    listen(window.matchMedia('(forced-colors: active)'), 'change', () => refresh({ structure: true }));
    listen(document.fonts, 'loadingdone', () => refresh({ structure: true }));
    if (window.visualViewport) {
        listen(window.visualViewport, 'resize', () => refresh({ structure: true }));
        listen(window.visualViewport, 'scroll', () => refresh());
    }
    function destroy() {
        if (destroyed) return;
        setEnabled(false);
        destroyed = true;
        inactivity.destroy();
        lifetime.abort();
        lens.remove();
    }
    setEnabled(false);
    signal?.addEventListener('abort', destroy, { once: true });
    if (signal?.aborted) destroy();
    return {
        get enabled() { return enabled; },
        toggle() { setEnabled(!enabled); },
        setEnabled, refresh, destroy
    };
}
