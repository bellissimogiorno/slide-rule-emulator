import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE } from '#catalog/defaults.js';
import { PRESETS } from '#catalog/presets.js';
import { CURSOR_SHAPES, CURSOR_COLOURS } from '#model/cursor-appearance.js';
import { renderAppearanceControls, renderFaceControls, renderPresetControls } from '#ui/programme-controls.js';

function node(dataset = {}) {
    return { dataset, attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } };
}

function fixture() {
    const fields = ['magnificationSelect', 'modelBadge', 'themeSelect', 'densitySelect',
        'graduationModeSelect', 'adaptiveSpacingSelect', 'adaptiveSpacingField',
        'logGraduationsField', 'logGraduationsSelect', 'formulaToggle', 'compactScaleToggle',
        'fullPrecisionToggle', 'slideWraparoundToggle', 'sideSelect', 'bothSidesButton',
        'flipButton', 'editSideField', 'editSideSelect', 'ruleTopNote', 'instrumentNote',
        'presetSelect', 'slidePresetSelect', 'presetDescription'];
    const dom = Object.fromEntries(fields.map(id => [id, node()]));
    dom.ruleCanvas = { parentElement: { style: {} } };
    dom.cursorShapeButtons = Object.keys(CURSOR_SHAPES).map(cursorShape => node({ cursorShape }));
    dom.cursorColourButtons = Object.keys(CURSOR_COLOURS).map(cursorColour => node({ cursorColour }));
    dom.cursorAppearanceButtons = [node(), node()];
    return { document: { body: { dataset: {} } }, dom };
}

test('appearance refresh preserves button identity, programme data and inactive graduation choices', () => {
    const f = fixture();
    const state = structuredClone(DEFAULT_STATE);
    Object.assign(state, { adaptiveSpacing: 'fine', logGraduations: 'pocket', fullPrecision: true, slideWraparound: true });
    const before = structuredClone(state);
    const buttons = [...f.dom.cursorShapeButtons, ...f.dom.cursorColourButtons];
    for (const graduationMode of ['adaptive', 'conventional']) {
        state.graduationMode = graduationMode;
        renderAppearanceControls(f.document, f.dom, state);
        assert.equal(f.dom.adaptiveSpacingSelect.value, 'fine');
        assert.equal(f.dom.logGraduationsSelect.value, 'pocket');
        assert.equal(f.dom.adaptiveSpacingSelect.disabled, graduationMode !== 'adaptive');
        assert.equal(f.dom.logGraduationsSelect.disabled, graduationMode === 'adaptive');
        assert.equal(f.dom.fullPrecisionToggle.checked, true);
        assert.equal(f.dom.slideWraparoundToggle.checked, true);
        assert.equal(f.dom.cursorShapeButtons.filter(button => button.attributes['aria-pressed'] === 'true').length, 1);
        assert.equal(f.dom.cursorColourButtons.filter(button => button.attributes['aria-pressed'] === 'true').length, 1);
        assert.deepEqual([...f.dom.cursorShapeButtons, ...f.dom.cursorColourButtons], buttons);
        assert.deepEqual(state, { ...before, graduationMode });
    }
});

test('face controls retain the single-face, duplex and linked-view availability rules', () => {
    const f = fixture();
    for (const count of [1, 2]) for (const viewMode of ['single', 'both']) {
        const state = { activeSide: 'front', viewMode, sides: { front: { name: 'Front', note: 'First face' } } };
        if (count === 2) state.sides.back = { name: 'Back' };
        const before = structuredClone(state);
        renderFaceControls(f.dom, state);
        assert.equal(f.dom.sideSelect.value, viewMode === 'both' ? '' : 'front');
        assert.equal(f.dom.editSideSelect.value, 'front');
        assert.equal(f.dom.flipButton.disabled, count === 1 || viewMode === 'both');
        assert.equal(f.dom.bothSidesButton.disabled, count === 1 && viewMode === 'single');
        assert.equal(f.dom.editSideField.hidden, viewMode === 'single');
        assert.equal(f.dom.instrumentNote.textContent, 'First face');
        assert.deepEqual(state, before);
    }
});

test('custom face names and keys are escaped in option markup and kept as plain note text', () => {
    const f = fixture();
    const key = '<custom"face>';
    renderFaceControls(f.dom, { activeSide: key, viewMode: 'single', sides: { [key]: { name: '<img> & rule', note: '<b>Note</b>' } } });
    assert.match(f.dom.sideSelect.innerHTML, /value="&lt;custom&quot;face&gt;"/);
    assert.match(f.dom.sideSelect.innerHTML, /&lt;img&gt; &amp; rule/);
    assert.doesNotMatch(f.dom.sideSelect.innerHTML, /<img>/);
    assert.equal(f.dom.instrumentNote.textContent, '<b>Note</b>');
});

test('both preset menus reflect every applied layout while custom remains unavailable in the slide shortcut', () => {
    const f = fixture();
    for (const presetId of [...Object.keys(PRESETS), 'custom', 'unknown']) {
        const state = { presetId };
        renderPresetControls(f.dom, state);
        const selected = Object.hasOwn(PRESETS, presetId) ? presetId : 'custom';
        assert.equal(f.dom.presetSelect.value, selected);
        assert.equal(f.dom.slidePresetSelect.value, selected);
        assert.equal(f.dom.presetDescription.textContent, selected === 'custom'
            ? 'Current custom layout. Loading a preset replaces both faces but keeps custom scale definitions.'
            : PRESETS[presetId].description);
        assert.match(f.dom.presetSelect.innerHTML, /<option value="custom">/);
        assert.match(f.dom.slidePresetSelect.innerHTML, /<option value="custom" disabled>/);
        assert.deepEqual(state, { presetId });
    }
});
