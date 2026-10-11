/** Page colours are a browser preference, independent of instrument programmes.
 * The HTML attribute is also a portable default in a configured standalone copy.
 * Never write to the programme's `theme` field or its recovery/storage namespace.
 */
export const PAGE_THEMES = Object.freeze(['light', 'dark', 'solarised']);
export const PAGE_THEME_STORAGE_KEY = 'slide-rule-page-theme-v1';

export function normalisePageTheme(value) {
    return PAGE_THEMES.includes(value) ? value : 'light';
}

export function loadPageTheme(getStorage, embeddedTheme) {
    try {
        const stored = getStorage().getItem(PAGE_THEME_STORAGE_KEY);
        if (PAGE_THEMES.includes(stored)) return stored;
    }
    catch (_) { /* A denied preference store must not prevent the app starting. */ }
    return normalisePageTheme(embeddedTheme);
}

export function savePageTheme(getStorage, theme) {
    try {
        getStorage().setItem(PAGE_THEME_STORAGE_KEY, normalisePageTheme(theme));
        return true;
    }
    catch (_) { return false; }
}

export function bindPageThemes(document, { signal, onStorageFailure } = {}) {
    const root = document.documentElement;
    const buttons = [...document.querySelectorAll('#pageThemes button[data-page-theme]')];
    const storage = () => document.defaultView.localStorage;
    let warned = false;
    function apply(theme) {
        root.dataset.pageTheme = theme;
        for (const button of buttons)
            button.setAttribute('aria-pressed', String(button.dataset.pageTheme === theme));
    }
    apply(loadPageTheme(storage, root.dataset.pageTheme));
    for (const button of buttons) {
        button.addEventListener('click', () => {
            const theme = normalisePageTheme(button.dataset.pageTheme);
            apply(theme);
            if (!savePageTheme(storage, theme) && !warned) {
                warned = true;
                onStorageFailure?.();
            }
        }, { signal });
    }
}
