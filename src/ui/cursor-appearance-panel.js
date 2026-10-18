/** Two quiet entry points share one non-modal appearance panel and its choices.
 * The panel is outside document flow, so opening it cannot resize the cursor
 * position card or move the instrument. No programme state lives in this UI.
 */
export function bindCursorAppearancePanel({ document, signal }) {
    const window = document.defaultView;
    const panel = document.getElementById('cursorAppearance');
    const triggers = [...document.querySelectorAll('[data-cursor-appearance-trigger]')];
    let invoker = null;
    const listen = (target, type, listener, options = {}) =>
        target.addEventListener(type, listener, { ...options, signal });

    function close(restoreFocus = false) {
        if (panel.hidden) return;
        panel.hidden = true;
        triggers.forEach(button => button.setAttribute('aria-expanded', 'false'));
        if (restoreFocus && invoker?.isConnected) invoker.focus({ preventScroll: true });
    }

    function position() {
        if (panel.hidden || !invoker) return;
        // Visual-viewport bounds also keep the panel reachable after mobile
        // pinch zoom. Desktop falls back to the scrollbar-free viewport width.
        const viewport = window.visualViewport;
        const left = (viewport?.offsetLeft || 0) + 8;
        const top = (viewport?.offsetTop || 0) + 8;
        const width = Math.max(0, (viewport?.width || document.documentElement.clientWidth) - 16);
        const height = Math.max(0, (viewport?.height || window.innerHeight) - 16);
        panel.style.maxWidth = `${width}px`;
        panel.style.maxHeight = `${height}px`;
        const anchor = invoker.getBoundingClientRect();
        const box = panel.getBoundingClientRect();
        const below = anchor.bottom + 6;
        const above = anchor.top - box.height - 6;
        const y = below + box.height <= top + height || above < top ? below : above;
        panel.style.left = `${Math.max(left, Math.min(anchor.left, left + width - box.width))}px`;
        panel.style.top = `${Math.max(top, Math.min(y, top + height - box.height))}px`;
    }

    for (const button of triggers) {
        listen(button, 'click', () => {
            if (!panel.hidden && invoker === button) {
                close(true);
                return;
            }
            invoker = button;
            panel.hidden = false;
            triggers.forEach(trigger => trigger.setAttribute('aria-expanded', 'true'));
            position();
            panel.querySelector('[data-cursor-shape][aria-pressed="true"]').focus({ preventScroll: true });
        });
    }
    listen(panel, 'keydown', event => {
        if (event.key === 'Tab' && event.shiftKey && event.target === panel.querySelector('button')) {
            // Return to whichever button opened the panel, not to the other
            // button that happens to precede the shared panel in DOM order.
            event.preventDefault();
            close(true);
            return;
        }
        if (event.key === 'Escape' && !event.isComposing && !event.defaultPrevented) {
            event.preventDefault();
            event.stopPropagation();
            close(true);
        }
        // Tab visits the ordinary toggle buttons; Enter and Space activate them.
    });
    listen(document, 'pointerdown', event => {
        if (!panel.contains(event.target) && !triggers.some(button => button.contains(event.target))) close();
    });
    listen(document, 'focusin', event => {
        if (!panel.contains(event.target) && !triggers.includes(event.target)) close();
    });
    listen(window, 'resize', position);
    listen(window, 'scroll', position, { capture: true });
    if (window.visualViewport) {
        listen(window.visualViewport, 'resize', position);
        listen(window.visualViewport, 'scroll', position);
    }
    signal.addEventListener('abort', () => close(), { once: true });
}
