/** A bounded inactivity timer. Activity wakes immediately; holding a key
 * suspends the countdown. Rendering, scrolling and resizing are not activity.
 * Injecting the clock keeps the four-second boundary testable without sleeps.
 */
export function createInactivityTimer({ clock, onChange, delay = 4000 }) {
    if (!(Number.isFinite(delay) && delay > 0)) throw new Error("Invalid inactivity delay.");
    let timer = null, active = false, held = false, idle = false, destroyed = false;
    function clear() {
        if (timer !== null) clock.clearTimeout(timer);
        timer = null;
    }
    function change(value) {
        if (idle === value) return;
        idle = value;
        onChange(idle);
    }
    function activity() {
        clear();
        if (destroyed || !active) return;
        change(false);
        if (!held) timer = clock.setTimeout(() => { timer = null; change(true); }, delay);
    }
    return {
        get idle() { return idle; },
        activity,
        setActive(value) {
            if (destroyed) return;
            clear();
            active = Boolean(value) && !destroyed;
            if (active) activity();
            else change(false);
        },
        setHeld(value) { if (!destroyed) { held = Boolean(value); activity(); } },
        destroy() { clear(); active = false; destroyed = true; }
    };
}
