/** A four-detent precision selector: shared rail and grip, four real buttons.
 * Pointer capture permits dragging without taking focus from a motion control.
 * Native button activation remains available to keyboard/assistive technology.
 * Selection changes the motion policy only, never either instrument position.
 */
import { DEFAULT_MOTION_STEP, MOTION_STEPS, motionStep } from '#ui/motion.js';

/** Equal-width hit regions; positions between detents always snap to a choice. */
export function stepIndexAt(clientX, left, width) {
    if (!Number.isFinite(clientX) || !Number.isFinite(left) || !Number.isFinite(width) || !(width > 0)) return 1;
    return Math.max(0, Math.min(MOTION_STEPS.length - 1,
        Math.floor((clientX - left) / width * MOTION_STEPS.length)));
}

export function createStepControls({ element, signal, returnTarget, onChange }) {
    let value = DEFAULT_MOTION_STEP;
    let pointerId = null;
    let pointerStartValue = value;
    let suppressPointerClick = false;
    const rail = element.querySelector('.step-switch');
    const buttons = [...element.querySelectorAll('button[data-step]')];
    const listen = (target, name, handler) => target.addEventListener(name, handler, { signal });
    function select(requested) {
        value = motionStep(requested);
        rail.style.setProperty('--step-index', String(MOTION_STEPS.indexOf(value)));
        for (const button of buttons)
            button.setAttribute('aria-pressed', String(Number(button.dataset.step) === value));
        onChange?.(value);
    }
    function restoreFocus() {
        const target = returnTarget();
        if (target && target !== element.ownerDocument.activeElement)
            target.focus({ preventScroll: true });
    }
    function selectAt(event) {
        const rect = rail.getBoundingClientRect();
        select(MOTION_STEPS[stepIndexAt(event.clientX, rect.left, rect.width)]);
    }
    listen(rail, 'pointerdown', event => {
        if (pointerId !== null || event.isPrimary === false || event.button !== 0) return;
        event.preventDefault(); // Keep the previously focused rule/grip focused.
        suppressPointerClick = false;
        pointerId = event.pointerId;
        pointerStartValue = value;
        rail.setPointerCapture?.(pointerId);
        selectAt(event);
        restoreFocus();
    });
    listen(rail, 'pointermove', event => {
        if (event.pointerId !== pointerId) return;
        event.preventDefault();
        selectAt(event);
    });
    function finish(event) {
        if (event.pointerId !== pointerId) return;
        const pointer = pointerId;
        pointerId = null;
        // Cancellation (e.g. a touch gesture interrupted by the system) restores
        // the original choice. A capture loss merely commits the last detent.
        if (event.type === 'pointercancel') select(pointerStartValue);
        suppressPointerClick = true;
        try { rail.releasePointerCapture?.(pointer); }
        catch (_) { /* Already released by the browser. */ }
        restoreFocus();
    }
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(rail, name, finish);
    for (const button of buttons) {
        listen(button, 'click', event => {
            // The click following a captured drag can refer to its starting
            // button. Do not undo the final detent; keyboard clicks have detail 0.
            if (event.detail > 0 && suppressPointerClick) {
                suppressPointerClick = false;
                return;
            }
            select(button.dataset.step);
            restoreFocus();
        });
    }
    signal?.addEventListener('abort', () => {
        const pointer = pointerId;
        pointerId = null;
        if (pointer !== null) {
            try { rail.releasePointerCapture?.(pointer); }
            catch (_) { /* Capture may already be gone. */ }
        }
    }, { once: true });
    // Exported HTML may carry a previous pressed state; precision is session-only.
    select(value);
    return { get value() { return value; }, select };
}
