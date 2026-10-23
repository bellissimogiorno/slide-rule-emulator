/** Face navigation shares one action across the toolbar, rule ends and a local
 * keyboard shortcut. It never owns programme state or changes rule positions.
 */
export function nextFace(state, locked = false) {
    const keys = Object.keys(state.sides);
    if (locked || state.viewMode === 'both' || keys.length < 2) return null;
    const index = Math.max(0, keys.indexOf(state.activeSide));
    return keys[(index + 1) % keys.length];
}

/** Character shortcuts belong to the instrument, not the surrounding editors.
 * Native range grips may use F; text entry and menu navigation keep their keys.
 */
export function faceFlipShortcut(event) {
    if (event.defaultPrevented || event.isComposing || event.repeat
        || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey
        || String(event.key).toLowerCase() !== 'f') return false;
    const target = event.target;
    if (target?.closest?.('textarea, select, [contenteditable], input:not([type="range"])')
        || target?.closest?.('[data-cursor-appearance-trigger], [data-slide-preset-trigger]')) return false;
    return Boolean(target?.closest?.('#ruleViewport, .position-control'));
}

export function bindFaceNavigation({ document, root, button, signal, getState, isLocked, onFlip }) {
    const buttons = [button, ...document.querySelectorAll('[data-rule-flip]')];
    const flip = () => {
        const side = nextFace(getState(), isLocked());
        if (side === null) return false;
        onFlip(side);
        return true;
    };
    for (const control of buttons) control.addEventListener('click', flip, { signal });
    root.addEventListener('keydown', event => {
        if (faceFlipShortcut(event) && flip()) event.preventDefault();
    }, { signal });
    return {
        refresh() {
            const state = getState(), locked = isLocked();
            const disabled = nextFace(state, locked) === null;
            const title = state.viewMode === 'both' ? 'Both sides are already visible'
                : Object.keys(state.sides).length < 2 ? 'This programme has only one face'
                : locked ? 'Finish the current movement before flipping sides'
                : 'Flip side (F while the rule or a position grip has focus)';
            for (const control of buttons) {
                control.disabled = disabled;
                control.title = title;
            }
        }
    };
}
