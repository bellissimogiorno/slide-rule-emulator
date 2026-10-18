/** Browser file boundary: export never mutates the live DOM. */
export function standaloneHtml(document, programme) {
    const clone = document.documentElement.cloneNode(true);
    clone.removeAttribute('data-app-ready');
    for (const node of clone.querySelectorAll('[data-runtime-only]')) node.remove();
    clone.querySelector('#loupeButton')?.setAttribute('aria-pressed', 'false');
    // Retain the chosen cursor, but open a saved copy with its controls tucked away.
    clone.querySelector('#cursorAppearance')?.setAttribute('hidden', '');
    clone.querySelector('#slidePresetPanel')?.setAttribute('hidden', '');
    for (const button of clone.querySelectorAll('[data-cursor-appearance-trigger], [data-slide-preset-trigger]'))
        button.setAttribute('aria-expanded', 'false');
    const seed = clone.querySelector('#embedded-program');
    if (!seed)
        throw new Error('Missing embedded-program block. Rebuild the application.');
    // HTML recognises closing script tags before it parses JSON.
    seed.textContent = JSON.stringify(programme, null, 2).replace(/</g, '\\u003c');
    for (const selector of ['#ruleCanvas', '#readout', '#railEditors', '#libraryList', '#jsonEditor', '#appStatus', '#jsonStatus', '#reorderStatus']) {
        clone.querySelector(selector).textContent = '';
    }
    clone.querySelector('#railEditors').classList.remove('is-reordering');
    clone.querySelector('body').classList.remove('focus-mode');
    clone.querySelector('#focusButton').textContent = 'Focus rule';
    clone.querySelector('#focusButton').setAttribute('aria-pressed', 'false');
    return '<!doctype html>\n' + clone.outerHTML;
}
export function downloadBlob(document, blob, filename) {
    const window = document.defaultView;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}
