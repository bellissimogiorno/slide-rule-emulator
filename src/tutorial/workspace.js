/** A temporary training programme must never become the saved or exported one.
 * Keep the actual original reference, including any session-local ownership
 * associated with it. The caller owns rendering and editor/UI suspension.
 * If a state write throws, retain the original so leave() can retry safely.
 */
export function createTutorialWorkspace({ getState, setState, beforeEnter = () => {} }) {
    if (typeof getState !== 'function' || typeof setState !== 'function' || typeof beforeEnter !== 'function')
        throw new TypeError('Tutorial workspace callbacks must be functions.');
    let original = null, active = false, changing = false;
    const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    function enter(trainingState) {
        if (!object(trainingState)) throw new TypeError('A tutorial programme must be an object.');
        if (changing) throw new Error('Tutorial workspace is already changing programme.');
        changing = true;
        try {
            if (!active) {
                beforeEnter();
                const current = getState();
                if (!object(current)) throw new TypeError('The current programme must be an object.');
                original = current;
                active = true;
            }
            setState(trainingState);
            return trainingState;
        } finally { changing = false; }
    }
    function leave() {
        if (changing) throw new Error('Tutorial workspace is already changing programme.');
        if (!active) return null;
        changing = true;
        try {
            const restored = original;
            setState(restored);
            original = null;
            active = false;
            return restored;
        } finally { changing = false; }
    }
    return { enter, leave,
        get active() { return active; },
        getPersistentState() { return active ? original : getState(); } };
}
