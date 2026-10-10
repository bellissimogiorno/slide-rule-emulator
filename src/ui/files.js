/** Browser file boundary: export never mutates the live DOM. */
export function standaloneHtml(document, programme) {
    const clone = document.documentElement.cloneNode(true);
    clone.removeAttribute('data-app-ready');
    const seed = clone.querySelector('#embedded-program');
    if (!seed)
        throw new Error('Missing embedded-program block. Rebuild the application.');
    // HTML recognises closing script tags before it parses JSON.
    seed.textContent = JSON.stringify(programme, null, 2).replace(/</g, '\\u003c');
    for (const selector of ['#ruleCanvas', '#readout', '#railEditors', '#libraryList', '#jsonEditor', '#appStatus', '#jsonStatus']) {
        clone.querySelector(selector).textContent = '';
    }
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
