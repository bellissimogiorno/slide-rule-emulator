/** Both Cursor buttons share the same appearance choices and popup behaviour. */
import { bindFloatingPanel } from '#ui/floating-panel.js';
export function bindCursorAppearancePanel({ document, signal }) {
    const panel = document.getElementById('cursorAppearance');
    return bindFloatingPanel({ document, signal, panel,
        triggers: [...document.querySelectorAll('[data-cursor-appearance-trigger]')],
        initialFocus: () => panel.querySelector('[data-cursor-shape][aria-pressed="true"]')
    });
}
