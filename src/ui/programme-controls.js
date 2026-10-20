/** Render the programme settings without mutating the applied programme.
 *
 * The application owns state and event handling. These views only project its
 * current state onto existing controls; keeping the button nodes preserves
 * focus, and the main preset chooser may still stage an unapplied choice.
 */
import { DENSITIES, THEMES } from '#catalog/appearance.js';
import { PRESETS } from '#catalog/presets.js';
import { presetMenuGroups } from '#catalog/preset-menu.js';
import { CURSOR_SHAPES, CURSOR_COLOURS } from '#model/cursor-appearance.js';
import { escapeHtml, titleCase } from '#ui/html.js';

export function renderAppearanceControls(document, dom, state) {
    document.body.dataset.theme = state.theme;
    dom.ruleCanvas.parentElement.style.zoom = state.magnification;
    dom.magnificationSelect.value = String(state.magnification);
    document.body.dataset.density = state.density;
    document.body.dataset.formulas = state.showFormulas ? "true" : "false";
    document.body.dataset.compactScales = state.compactScales ? "true" : "false";
    dom.modelBadge.textContent = state.modelLabel || "Programmable scientific duplex";
    dom.themeSelect.innerHTML = Object.entries(THEMES).map(([id, label]) => `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`).join("");
    dom.themeSelect.value = state.theme;
    // Keep the same button nodes so a choice never discards keyboard focus.
    for (const [buttons, field] of [[dom.cursorShapeButtons, 'cursorShape'], [dom.cursorColourButtons, 'cursorColour']]) {
        for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset[field] === state[field]));
    }
    const cursorDescription = `Cursor appearance: ${CURSOR_SHAPES[state.cursorShape]}; ${CURSOR_COLOURS[state.cursorColour]}`;
    for (const button of dom.cursorAppearanceButtons) button.title = cursorDescription;
    dom.densitySelect.innerHTML = Object.entries(DENSITIES).map(([id, label]) => `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`).join("");
    dom.densitySelect.value = state.density;
    dom.graduationModeSelect.value = state.graduationMode;
    dom.adaptiveSpacingSelect.value = state.adaptiveSpacing;
    // One shared options slot; hiding a field never discards its selection.
    const fullyAdaptive = state.graduationMode === "adaptive";
    dom.adaptiveSpacingField.hidden = !fullyAdaptive;
    dom.adaptiveSpacingSelect.disabled = !fullyAdaptive;
    dom.logGraduationsField.hidden = fullyAdaptive;
    dom.logGraduationsSelect.disabled = fullyAdaptive;
    dom.logGraduationsSelect.value = state.logGraduations;
    dom.formulaToggle.checked = Boolean(state.showFormulas);
    dom.compactScaleToggle.checked = Boolean(state.compactScales);
    dom.fullPrecisionToggle.checked = state.fullPrecision;
    dom.slideWraparoundToggle.checked = state.slideWraparound;
}
export function renderFaceControls(dom, state) {
    const options = Object.entries(state.sides).map(([key, side]) => {
        const label = escapeHtml(side.name || titleCase(key));
        return `<option value="${escapeHtml(key)}">${label}</option>`;
    }).join("");
    dom.sideSelect.innerHTML = options + '<option value="">Both sides</option>';
    dom.sideSelect.value = state.viewMode === "both" ? "" : state.activeSide;
    const both = state.viewMode === "both";
    const oneFace = Object.keys(state.sides).length < 2;
    dom.bothSidesButton.setAttribute("aria-pressed", String(both));
    dom.bothSidesButton.disabled = oneFace && !both;
    dom.bothSidesButton.title = both ? "Return to the face selected for editing"
        : oneFace ? "This programme has only one face" : "Show both faces with linked slide and cursor";
    dom.flipButton.disabled = both || oneFace;
    dom.flipButton.title = state.viewMode === "both" ? "Both sides are already visible" : "Show the other face";
    dom.editSideField.hidden = state.viewMode !== "both";
    dom.editSideSelect.innerHTML = options;
    dom.editSideSelect.value = state.activeSide;
    const side = state.sides[state.activeSide] || {};
    dom.ruleTopNote.textContent = state.viewMode === "both" ? "Both sides - linked slide and cursor" : (side.name || state.activeSide).toLowerCase();
    dom.instrumentNote.textContent = side.note || state.instrumentNote || "Drag the slide and cursor; all readings update at the hairline.";
}
export function renderPresetControls(dom, state) {
    const options = presetMenuGroups(PRESETS).map(([group, items]) => {
        const inner = items.map(([id, preset]) => `<option value="${escapeHtml(id)}">${escapeHtml(preset.name)}</option>`).join("");
        return `<optgroup label="${escapeHtml(group)}">${inner}</optgroup>`;
    }).join("");
    const customOption = `<option value="custom">Custom / current layout</option>`;
    dom.presetSelect.innerHTML = options + customOption;
    dom.presetSelect.value = PRESETS[state.presetId] ? state.presetId : "custom";
    // The shortcut shows the applied layout. The main chooser may still
    // stage a different choice until its Load preset button is pressed.
    dom.slidePresetSelect.innerHTML = options + '<option value="custom" disabled>Custom / current layout</option>';
    dom.slidePresetSelect.value = dom.presetSelect.value;
    const preset = PRESETS[dom.presetSelect.value];
    dom.presetDescription.textContent = preset ? preset.description : "Current custom layout. Loading a preset replaces both faces but keeps custom scale definitions.";
}
