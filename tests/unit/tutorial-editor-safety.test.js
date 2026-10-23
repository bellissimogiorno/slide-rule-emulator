import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgrammeEditor } from '#ui/programme-editor.js';

const programme = cursor => ({ cursor, slideOffset: 0,
    sides: { front: { name: 'Original', topStator: [], slide: ['C'], bottomStator: ['D'] } } });
function harness() {
    let nextTimer = 0, current = programme(.75);
    const timers = new Map(), readers = [], applied = [], downloads = [], confirms = [];
    const element = () => {
        const classes = new Set();
        return Object.assign(new EventTarget(), { value: '', textContent: '', files: [], clicks: 0,
            classList: { toggle(name, force) { force ? classes.add(name) : classes.delete(name); },
                contains: name => classes.has(name) },
            click() { this.clicks++; this.dispatchEvent(new Event('click')); }, remove() {} });
    };
    const ids = ['jsonEditor', 'jsonStatus', 'importJsonFile', 'applyJsonButton',
        'syncJsonButton', 'exportJsonButton', 'importJsonButton'];
    const elements = Object.fromEntries(ids.map(id => [id, element()]));
    const lifetime = new AbortController();
    const window = { Blob,
        confirm: text => { confirms.push(text); return true; },
        setTimeout(fn) { const id = ++nextTimer; timers.set(id, fn); return id; },
        clearTimeout(id) { timers.delete(id); },
        URL: { createObjectURL: blob => { downloads.push(blob); return 'blob:fixture'; }, revokeObjectURL() {} },
        FileReader: class {
            constructor() { this.readyState = 0; this.result = null; this.aborted = false; readers.push(this); }
            readAsText(file) { this.file = file; this.readyState = 1; }
            abort() { this.aborted = true; this.readyState = 2; }
            complete(value) { this.result = value; this.readyState = 2; this.onload?.(); }
        }
    };
    const document = { defaultView: window, getElementById: id => elements[id],
        body: { appendChild() {} }, createElement: element };
    const editor = createProgrammeEditor({ document, getProgramme: () => current,
        applyProgramme: value => { applied.push(value); current = value; }, signal: lifetime.signal });
    return { editor, elements, timers, readers, applied, downloads, confirms,
        get current() { return current; }, setProgramme: value => { current = value; },
        draft(value) { elements.jsonEditor.value = value; elements.jsonEditor.dispatchEvent(new Event('input')); },
        import(value) {
            elements.importJsonFile.files = [{ size: value.length, contents: value }];
            elements.importJsonFile.dispatchEvent(new Event('change'));
        },
        flush() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); },
        destroy: () => lifetime.abort() };
}

test('suspension preserves an unapplied draft, dirty flag and existing validation status', t => {
    const ui = harness(); t.after(ui.destroy);
    const draft = '{\n  "unapplied": "keep every space"\n';
    ui.draft(draft); ui.editor.status('Existing error', true);
    ui.editor.suspend(); ui.editor.suspend();
    ui.setProgramme(programme(.1));
    ui.editor.sync(true); ui.editor.scheduleSync(); ui.editor.status('Training status');
    for (const id of ['applyJsonButton', 'syncJsonButton', 'exportJsonButton', 'importJsonButton']) ui.elements[id].click();
    ui.flush();
    assert.equal(ui.elements.jsonEditor.value, draft);
    assert.equal(ui.editor.dirty, true); assert.equal(ui.editor.suspended, true);
    assert.equal(ui.elements.jsonStatus.textContent, 'Existing error');
    assert.equal(ui.elements.jsonStatus.classList.contains('error'), true);
    assert.equal(ui.applied.length, 0); assert.equal(ui.downloads.length, 0);
    assert.equal(ui.elements.importJsonFile.clicks, 0); assert.equal(ui.confirms.length, 0);
    ui.editor.resume();
    assert.equal(ui.elements.jsonEditor.value, draft); assert.equal(ui.editor.dirty, true);
    assert.equal(ui.elements.jsonStatus.textContent, 'Existing error');
});

test('suspension cancels queued clean sync and resume never rewrites the editor by itself', t => {
    const ui = harness(); t.after(ui.destroy);
    ui.editor.sync(); const text = ui.elements.jsonEditor.value;
    ui.editor.scheduleSync(); assert.equal(ui.timers.size, 1);
    ui.editor.suspend(); assert.equal(ui.timers.size, 0);
    ui.setProgramme(programme(.1));
    ui.editor.sync(); ui.editor.sync(true); ui.editor.scheduleSync(); ui.flush();
    assert.equal(ui.elements.jsonEditor.value, text); assert.equal(ui.editor.dirty, false);
    ui.editor.resume(); ui.flush(); assert.equal(ui.elements.jsonEditor.value, text);
    ui.editor.scheduleSync(); ui.flush();
    assert.equal(JSON.parse(ui.elements.jsonEditor.value).cursor, .1);
});

test('suspension aborts an in-flight import and ignores a late completion after resuming', t => {
    const ui = harness(); t.after(ui.destroy);
    ui.editor.sync(); ui.editor.status('Before import');
    const text = ui.elements.jsonEditor.value;
    ui.import(JSON.stringify(programme(.2)));
    const request = ui.readers[0]; assert.equal(request.readyState, 1);
    ui.editor.suspend(); assert.equal(request.aborted, true);
    request.complete(JSON.stringify(programme(.2)));
    assert.equal(ui.elements.jsonEditor.value, text); assert.equal(ui.applied.length, 0);
    ui.editor.resume(); request.complete(JSON.stringify(programme(.3)));
    assert.equal(ui.elements.jsonEditor.value, text); assert.equal(ui.applied.length, 0);
    assert.equal(ui.elements.jsonStatus.textContent, 'Before import');
    assert.equal(ui.editor.dirty, false);
});

test('fake import events while suspended cannot start a reader or show a prompt', t => {
    const ui = harness(); t.after(ui.destroy);
    ui.draft('Unapplied text'); ui.editor.suspend();
    ui.import(JSON.stringify(programme(.2)));
    assert.equal(ui.readers.length, 0); assert.equal(ui.confirms.length, 0);
    assert.equal(ui.elements.jsonEditor.value, 'Unapplied text');
});

test('apply and explicit sync retain their normal behaviour after resume', t => {
    const ui = harness(); t.after(ui.destroy);
    ui.draft(JSON.stringify(programme(.4))); ui.editor.suspend();
    ui.elements.applyJsonButton.click(); assert.equal(ui.applied.length, 0);
    ui.editor.resume(); ui.elements.applyJsonButton.click();
    assert.equal(ui.applied.length, 1); assert.equal(ui.current.cursor, .4);
    assert.equal(ui.editor.dirty, false); assert.equal(ui.elements.jsonStatus.textContent, 'JSON applied.');
    ui.draft('Unapplied text'); ui.elements.syncJsonButton.click();
    assert.equal(ui.confirms.length, 1); assert.equal(JSON.parse(ui.elements.jsonEditor.value).cursor, .4);
    assert.equal(ui.editor.dirty, false);
});

test('file import and JSON export resume without adding duplicate listeners', async t => {
    const ui = harness(); t.after(ui.destroy);
    ui.editor.sync();
    for (let i = 0; i < 5; i++) { ui.editor.suspend(); ui.editor.resume(); }
    ui.elements.importJsonButton.click(); assert.equal(ui.elements.importJsonFile.clicks, 1);
    ui.import(JSON.stringify(programme(.2)));
    assert.equal(ui.readers.length, 1);
    ui.readers[0].complete(JSON.stringify(programme(.2)));
    assert.equal(ui.applied.length, 1); assert.equal(ui.current.cursor, .2);
    ui.elements.exportJsonButton.click();
    assert.equal(ui.downloads.length, 1);
    assert.equal(JSON.parse(await ui.downloads[0].text()).cursor, .2);
    assert.equal(ui.elements.jsonStatus.textContent, 'JSON exported.');
});

test('aborting the application prevents resume from reviving editor work', () => {
    const ui = harness(); ui.editor.sync(); const text = ui.elements.jsonEditor.value;
    ui.editor.scheduleSync(); ui.destroy(); ui.editor.resume();
    ui.setProgramme(programme(.1)); ui.editor.sync(true); ui.editor.scheduleSync();
    ui.elements.applyJsonButton.click(); ui.flush();
    assert.equal(ui.editor.suspended, true); assert.equal(ui.elements.jsonEditor.value, text);
    assert.equal(ui.applied.length, 0); assert.equal(ui.timers.size, 0);
});
