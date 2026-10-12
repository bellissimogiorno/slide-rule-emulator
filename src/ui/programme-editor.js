/** Programme text, file imports and draft ownership. The application remains
 * the sole owner of applied mathematical state. Delayed I/O must never replace
 * a newer draft, programme or import. Nothing is executed as JavaScript. */
import { parseProgramText, PROGRAM_LIMITS } from '#model/validation.js';
import { downloadBlob } from '#ui/files.js';

export function createProgrammeEditor({ document, getProgramme, applyProgramme, signal }) {
    const window = document.defaultView;
    const element = id => document.getElementById(id);
    const editor = element('jsonEditor'), message = element('jsonStatus');
    const fileInput = element('importJsonFile');
    const listen = (target, name, handler) => target.addEventListener(name, handler, { signal });
    let dirty = false, revision = 0, timer = 0, reader = null;

    function status(text, error = false) {
        message.textContent = text;
        message.classList.toggle('error', error);
    }
    function sync(force = false) {
        if (dirty && !force) return;
        const text = JSON.stringify(getProgramme(), null, 2);
        if (text !== editor.value || force) revision++;
        editor.value = text;
        dirty = false;
    }
    function scheduleSync() {
        if (timer) return;
        timer = window.setTimeout(() => { timer = 0; sync(); }, 160);
    }
    function apply() {
        try {
            const programme = parseProgramText(editor.value);
            applyProgramme(programme);
            dirty = false;
            sync(true);
            status('JSON applied.');
        } catch (error) {
            status(error.message || String(error), true);
        }
    }
    function cancelImport() {
        const previous = reader;
        reader = null;
        if (previous?.readyState === 1) previous.abort();
    }
    function importFile() {
        const file = fileInput.files?.[0];
        fileInput.value = '';
        if (!file) return;
        cancelImport();
        if (file.size > PROGRAM_LIMITS.characters) {
            status('Programme exceeds the 1 MB file limit.', true);
            return;
        }
        if (dirty && !window.confirm('Replace the unapplied JSON draft with this file?')) return;
        const expectedRevision = revision, expectedText = editor.value;
        const expectedProgramme = JSON.stringify(getProgramme());
        const request = reader = new window.FileReader();
        request.onload = () => {
            if (signal.aborted || reader !== request) return;
            reader = null;
            if (revision !== expectedRevision || editor.value !== expectedText ||
                JSON.stringify(getProgramme()) !== expectedProgramme) {
                status('Import discarded because the draft or programme changed while the file was being read. Import again to use that file.');
                return;
            }
            editor.value = String(request.result || '');
            dirty = true;
            revision++;
            apply();
        };
        request.onerror = () => {
            if (reader !== request || signal.aborted) return;
            reader = null;
            status('Could not read that file.', true);
        };
        request.readAsText(file);
    }
    listen(editor, 'input', () => { dirty = true; revision++; });
    listen(element('applyJsonButton'), 'click', apply);
    listen(element('syncJsonButton'), 'click', () => {
        if (dirty && !window.confirm('Replace the unapplied JSON draft with the current layout?')) return;
        sync(true);
        status('JSON synced from current layout.');
    });
    listen(element('exportJsonButton'), 'click', () => {
        const blob = new window.Blob([JSON.stringify(getProgramme(), null, 2)], { type: 'application/json' });
        downloadBlob(document, blob, 'slide-rule-program.json');
        status('JSON exported.');
    });
    listen(fileInput, 'change', importFile);
    listen(element('importJsonButton'), 'click', () => fileInput.click());
    signal.addEventListener('abort', () => {
        window.clearTimeout(timer);
        cancelImport();
    }, { once: true });
    return { get dirty() { return dirty; }, sync, scheduleSync, status };
}
