import { createMarkTooltips } from "#ui/mark-tooltips.js";
import { createScaleHistory } from "#model/scale-history.js";
import { moveScale } from "#model/scale-order.js";
import { railEditorMarkup, refreshEditorPositions } from "#ui/rail-editor.js";
import { createRailReorder } from "#ui/rail-reorder.js";
import { createLoupe } from "#ui/loupe.js";
import { createStepControls } from "#ui/step-controls.js";
import { bindPageThemes } from "#ui/page-theme.js";
import { motionStep, motionStepShortcut, motionKeyCommand, movedPosition, positionText, positionDescription } from "#ui/motion.js";
import { loadProgramme, saveProgramme } from "#model/storage.js";
import { standaloneHtml, downloadBlob as saveBlob } from "#ui/files.js";
import { DENSITIES, THEMES } from "#catalog/appearance.js";
import { DEFAULT_STATE } from "#catalog/defaults.js";
import { PRESETS } from "#catalog/presets.js";
import { presetMenuGroups } from "#catalog/preset-menu.js";
import { clamp } from "#core/numbers.js";
import { buildLibrary, deepClone, exportableState, mergeState, normalizeState } from "#model/program.js";
import { escapeHtml, scaleSort, titleCase, railLabel } from "#ui/html.js";
import { optimizeScaleLabels } from "#ui/labels.js";
import { visibleSideKeys } from "#model/view.js";
import { createReadoutView } from '#ui/readout-view.js';
import { createProgrammeEditor } from '#ui/programme-editor.js';
import { renderRailRows } from "#ui/scale-markup.js";
import { APP_VERSION, DEFAULT_LABEL_W, STORAGE_KEY } from "#version.js";
function createApplication(document) {
    const window = document.defaultView;
    const lifetime = new window.AbortController();
    const listen = (target, type, listener) => target.addEventListener(type, listener, { signal: lifetime.signal });
    let resizeObserver;
    let destroyed = false;
    let startupMessage = "";
    let recoveryData = null;
    let activeStorageKey = STORAGE_KEY;
    let storageWarningShown = false;
    let saveTimer = 0;
    let stateDirty = false;
    let motionFrame = 0;
    let resizeFrame = 0;
    let renderedTrackWidth = 0;
    let renderedDisplayScale = 0;
    let state = loadState();
    let libraryDefinitions = state.customScales;
    let scaleLibrary = buildLibrary(state);
    let programmeEditor;
    let readoutView;
    let dragMode = null;
    let dragFace = null;
    let dragStartX = 0;
    let dragStartOffset = 0;
    let dragStartCursor = 0;
    let keyboardTarget = "cursor";
    let lastMotionFocus = null;
    let stepControls;
    let loupe;
    let railReorder;
    const scaleHistory = createScaleHistory();
    let dragPointerId = null;
    let scalePolishFrame = 0;
    const dom = {
        workbench: document.getElementById("workbench"),
        motionStep: document.getElementById("motionStep"),
        loupeButton: document.getElementById("loupeButton"),
        motionTarget: document.getElementById("motionTarget"),
        sideSelect: document.getElementById("sideSelect"),
        editSideField: document.getElementById("editSideField"),
        editSideSelect: document.getElementById("editSideSelect"),
        magnificationSelect: document.getElementById("magnificationSelect"),
        ruleViewport: document.getElementById("ruleViewport"),
        appStatus: document.getElementById("appStatus"),
        recoveryButton: document.getElementById("recoveryButton"),
        flipButton: document.getElementById("flipButton"),
        bothSidesButton: document.getElementById("bothSidesButton"),
        focusButton: document.getElementById("focusButton"),
        resetButton: document.getElementById("resetButton"),
        saveHtmlButton: document.getElementById("saveHtmlButton"),
        slideRange: document.getElementById("slideRange"),
        cursorRange: document.getElementById("cursorRange"),
        slideText: document.getElementById("slideText"),
        cursorText: document.getElementById("cursorText"),
        ruleCanvas: document.getElementById("ruleCanvas"),
        ruleTopNote: document.getElementById("ruleTopNote"),
        modelBadge: document.getElementById("modelBadge"),
        instrumentNote: document.getElementById("instrumentNote"),
        readout: document.getElementById("readout"),
        presetSelect: document.getElementById("presetSelect"),
        loadPresetButton: document.getElementById("loadPresetButton"),
        presetDescription: document.getElementById("presetDescription"),
        presetDetailsButton: document.getElementById("presetDetailsButton"),
        themeSelect: document.getElementById("themeSelect"),
        densitySelect: document.getElementById("densitySelect"),
        graduationModeSelect: document.getElementById("graduationModeSelect"),
        adaptiveSpacingSelect: document.getElementById("adaptiveSpacingSelect"),
        adaptiveSpacingField: document.getElementById("adaptiveSpacingField"),
        logGraduationsSelect: document.getElementById("logGraduationsSelect"),
        logGraduationsField: document.getElementById("logGraduationsField"),
        formulaToggle: document.getElementById("formulaToggle"),
        compactScaleToggle: document.getElementById("compactScaleToggle"),
        railEditors: document.getElementById("railEditors"),
        reorderStatus: document.getElementById("reorderStatus"),
        libraryList: document.getElementById("libraryList")
    };
    function init() {
        normalizeState(state);
        readoutView = createReadoutView(dom.readout);
        programmeEditor = createProgrammeEditor({ document, signal: lifetime.signal,
            getProgramme: () => exportableState(state), applyProgramme: applyProgramme });
        stepControls = createStepControls({
            element: dom.motionStep, signal: lifetime.signal,
            returnTarget: () => lastMotionFocus?.isConnected ? lastMotionFocus : dom.ruleCanvas,
            onChange: () => { if (stepControls) selectMotionTarget(keyboardTarget); }
        });
        bindPageThemes(document, {
            signal: lifetime.signal,
            onStorageFailure: () => showAppStatus("Page theme changed for this session. Browser preferences cannot be saved; a standalone copy retains the chosen page theme.")
        });
        bindEvents();
        railReorder = createRailReorder({
            root: dom.railEditors, status: dom.reorderStatus, onMove: moveEditorScale,
            refresh: () => refreshEditorPositions(dom.railEditors), signal: lifetime.signal
        });
        loupe = createLoupe({
            document, canvas: dom.ruleCanvas, button: dom.loupeButton,
            signal: lifetime.signal,
            returnTarget: () => lastMotionFocus?.isConnected ? lastMotionFocus : dom.ruleCanvas
        });
        createMarkTooltips({ document, canvas: dom.ruleCanvas, signal: lifetime.signal });
        render();
        if (startupMessage)
            showAppStatus(startupMessage);
        dom.recoveryButton.hidden = recoveryData === null;
        if (document.querySelector('script[src]')) {
            dom.saveHtmlButton.disabled = true;
            dom.saveHtmlButton.title = "Build dist/index.html first to export a self-contained copy.";
        }
        resizeObserver = new window.ResizeObserver(scheduleResize);
        resizeObserver.observe(dom.ruleCanvas);
        document.fonts.ready.then(() => {
            if (!destroyed)
                scheduleScalePolish();
        });
    }
    function bindEvents() {
        listen(dom.magnificationSelect, "change", () => {
            state.magnification = Number(dom.magnificationSelect.value);
            applyAppearance();
            scheduleResize();
            saveState();
            programmeEditor.scheduleSync();
        });
        listen(dom.recoveryButton, "click", () => {
            downloadBlob(new Blob([recoveryData], { type: "application/json" }), "slide-rule-recovered-state.json");
        });
        // Delegate once: both native grips and both instrument focus stops work.
        // Form controls outside the motion cards retain their own shortcuts.
        listen(dom.workbench, "keydown", onMotionKeyDown);
        listen(dom.workbench, "focusin", event => {
            const card = event.target.closest?.(".position-control");
            if (card) selectMotionTarget(card.dataset.motion);
            if (card || event.target === dom.ruleCanvas || event.target === dom.ruleViewport)
                lastMotionFocus = event.target;
        });
        dom.workbench.querySelectorAll("[data-nudge]").forEach(button => {
            listen(button, "click", event => {
                const field = button.closest(".position-control").dataset.motion;
                selectMotionTarget(field);
                movePosition(field, { delta: Number(button.dataset.nudge) * motionStep(stepControls.value, event.altKey) });
            });
        });
        // Explicit focus also covers browsers that do not focus a range on drag.
        for (const grip of [dom.slideRange, dom.cursorRange]) {
            listen(grip, "pointerdown", event => {
                if (event.isPrimary !== false && event.button === 0) grip.focus({ preventScroll: true });
            });
        }
        listen(window, "pagehide", () => { endDrag(); flushState(); });
        listen(window, "blur", endDrag);
        listen(document, "visibilitychange", () => {
            if (document.hidden) { endDrag(); flushState(); }
        });
        listen(dom.sideSelect, "change", () => {
            state.viewMode = dom.sideSelect.value === "" ? "both" : "single";
            if (state.viewMode === "single")
                state.activeSide = dom.sideSelect.value;
            saveState();
            render();
        });
        listen(dom.editSideSelect, "change", () => {
            state.activeSide = dom.editSideSelect.value;
            saveState();
            renderRailEditors();
            programmeEditor.scheduleSync();
        });
        listen(dom.bothSidesButton, "click", () => {
            state.viewMode = state.viewMode === "both" ? "single" : "both";
            saveState();
            render();
        });
        listen(dom.flipButton, "click", () => {
            const keys = Object.keys(state.sides);
            const idx = Math.max(0, keys.indexOf(state.activeSide));
            state.activeSide = keys[(idx + 1) % keys.length];
            saveState();
            render();
        });
        listen(dom.focusButton, "click", () => {
            const focused = document.body.classList.toggle("focus-mode");
            dom.focusButton.textContent = focused ? "Show controls" : "Focus rule";
            dom.focusButton.setAttribute("aria-pressed", String(focused));
            if (focused) dom.ruleCanvas.focus({ preventScroll: true });
            scheduleResize();
        });
        listen(dom.resetButton, "click", () => {
            state.slideOffset = 0;
            state.cursor = 0.5;
            saveState();
            renderRuleAndReadout();
            updatePositionControls();
        });
        listen(dom.saveHtmlButton, "click", saveStandaloneCopy);
        listen(dom.slideRange, "input", () => {
            selectMotionTarget("slideOffset");
            movePosition("slideOffset", { position: Number(dom.slideRange.value) / 100 });
        });
        listen(dom.cursorRange, "input", () => {
            selectMotionTarget("cursor");
            movePosition("cursor", { position: Number(dom.cursorRange.value) / 1000 });
        });
        listen(dom.ruleCanvas, "pointerdown", onPointerDown);
        listen(window, "pointermove", onPointerMove);
        listen(window, "pointerup", onPointerUp);
        listen(window, "pointercancel", onPointerUp);
        listen(window, "resize", scheduleResize);
        listen(dom.ruleCanvas, "lostpointercapture", onPointerUp);
        listen(dom.loadPresetButton, "click", () => applyPreset(dom.presetSelect.value));
        listen(dom.presetDetailsButton, "click", () => {
            const expanded = dom.presetDescription.hidden;
            dom.presetDescription.hidden = !expanded;
            dom.presetDetailsButton.setAttribute("aria-expanded", String(expanded));
        });
        listen(dom.presetSelect, "change", () => {
            const preset = PRESETS[dom.presetSelect.value];
            dom.presetDescription.textContent = preset ? preset.description : "Current custom layout.";
        });
        listen(dom.themeSelect, "change", () => {
            state.theme = dom.themeSelect.value;
            saveState();
            applyAppearance();
            renderRuleAndReadout(false);
        });
        for (const [control, field] of [[dom.graduationModeSelect, 'graduationMode'], [dom.adaptiveSpacingSelect, 'adaptiveSpacing']]) {
            listen(control, 'change', () => {
                state[field] = control.value;
                saveState();
                applyAppearance();
                renderRuleAndReadout(false);
            });
        }
        listen(dom.logGraduationsSelect, "change", () => {
            state.logGraduations = dom.logGraduationsSelect.value;
            saveState();
            renderRuleAndReadout(false);
        });
        listen(dom.densitySelect, "change", () => {
            state.density = dom.densitySelect.value;
            saveState();
            applyAppearance();
            renderRuleAndReadout(false);
        });
        listen(dom.formulaToggle, "change", () => {
            state.showFormulas = dom.formulaToggle.checked;
            saveState();
            applyAppearance();
            renderRuleAndReadout(false);
        });
        listen(dom.compactScaleToggle, "change", () => {
            state.compactScales = dom.compactScaleToggle.checked;
            saveState();
            applyAppearance();
            renderRuleAndReadout(false);
        });
        listen(dom.railEditors, "change", onRailEditorChange);
        listen(dom.railEditors, "click", onRailEditorClick);
        listen(dom.railEditors, "keydown", event => {
            // Scope undo to the scale lists; text editors and native selects
            // retain their own editing/navigation shortcuts.
            if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey
                && !event.isComposing && event.key.toLowerCase() === "z"
                && !event.target.closest("input, textarea, select, [contenteditable]")
                && scaleHistory.size) {
                event.preventDefault();
                undoScaleEdit();
            }
        });

    }
    function loadState() {
        const result = loadProgramme({
            seed: document.getElementById("embedded-program")?.textContent.trim(),
            getStorage: () => window.localStorage
        });
        activeStorageKey = result.key;
        recoveryData = result.recovery;
        startupMessage = result.message;
        return result.programme;
    }
    function saveState() {
        stateDirty = true;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(flushState, 200);
    }
    function flushState() {
        clearTimeout(saveTimer);
        saveTimer = 0;
        if (!stateDirty)
            return;
        try {
            saveProgramme({ getStorage: () => window.localStorage, key: activeStorageKey, programme: exportableState(state), recovery: recoveryData });
            stateDirty = false;
        }
        catch (error) {
            if (!storageWarningShown) {
                storageWarningShown = true;
                showAppStatus("Automatic saving is unavailable. Export JSON or save a standalone copy to keep your changes.");
            }
        }
    }
    function showAppStatus(message) {
        dom.appStatus.textContent = message;
        dom.appStatus.hidden = !message;
    }
    function scheduleMotion() {
        if (motionFrame)
            return;
        motionFrame = requestAnimationFrame(() => {
            motionFrame = 0;
            updateSlideTransform();
            updateCursorPosition();
            readoutView.update(state, scaleLibrary);
            updatePositionControls();
        });
    }
    function scheduleResize() {
        if (resizeFrame)
            return;
        resizeFrame = requestAnimationFrame(() => {
            resizeFrame = 0;
            const width = getScalePixelWidth();
            if (Math.abs(width - renderedTrackWidth) > 0.5 || renderedDisplayScale !== state.magnification)
                renderRule();
            else {
                updateCursorPosition();
                scheduleScalePolish();
            }
        });
    }
    function selectMotionTarget(field) {
        keyboardTarget = field;
        dom.workbench.querySelectorAll(".position-control").forEach(card => {
            card.classList.toggle("is-selected", card.dataset.motion === field);
        });
        const description = "On rule: " + (field === "cursor" ? "cursor" : "slide") + " selected; step " + stepControls.value;
        if (dom.motionTarget.textContent !== description) dom.motionTarget.textContent = description;
    }
    function movePosition(field, command) {
        state[field] = movedPosition(state[field], field, command);
        scheduleMotion();
        saveState();
        programmeEditor.scheduleSync();
    }
    function onMotionKeyDown(event) {
        const target = event.target;
        const card = target.closest?.(".position-control");
        const onRule = target.closest?.("#ruleViewport");
        if (!card && !onRule) return;
        // Do not steal browser/OS shortcuts or an input method's composition.
        if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey) return;
        if (!event.altKey && !event.shiftKey && event.key.toLowerCase() === "m") {
            if (!event.repeat) loupe.toggle();
            event.preventDefault();
            return;
        }
        if (event.key === "Escape" && loupe.enabled) {
            loupe.setEnabled(false);
            event.preventDefault();
            return;
        }
        if (onRule && !event.altKey && !event.shiftKey && ["s", "c"].includes(event.key.toLowerCase())) {
            selectMotionTarget(event.key.toLowerCase() === "s" ? "slideOffset" : "cursor");
            event.preventDefault();
            return;
        }
        const step = motionStepShortcut(event);
        if (step !== null) {
            stepControls.select(step);
            event.preventDefault();
            return;
        }
        const command = motionKeyCommand(event, stepControls.value);
        if (!command || dragMode) return;
        // A focused grip always controls itself. Shift on the rule preserves
        // the original slide shortcut; otherwise use the last selected part.
        const field = card ? card.dataset.motion : event.shiftKey ? "slideOffset" : keyboardTarget;
        if (card) selectMotionTarget(field);
        movePosition(field, command);
        event.preventDefault(); // prevent a second, browser-native range step
    }
    function render() {
        normalizeState(state);
        if (state.customScales !== libraryDefinitions) {
            libraryDefinitions = state.customScales;
            scaleLibrary = buildLibrary(state);
        }
        applyAppearance();
        renderSideSelect();
        renderPresetSelect();
        renderRuleAndReadout();
        renderRailEditors();
        renderLibraryList();
        updatePositionControls();
        programmeEditor.sync();
        if (!programmeEditor.dirty)
            programmeEditor.status("");
    }
    function applyAppearance() {
        document.body.dataset.theme = state.theme;
        dom.ruleCanvas.parentElement.style.zoom = state.magnification;
        dom.magnificationSelect.value = String(state.magnification);
        document.body.dataset.density = state.density;
        document.body.dataset.formulas = state.showFormulas ? "true" : "false";
        document.body.dataset.compactScales = state.compactScales ? "true" : "false";
        dom.modelBadge.textContent = state.modelLabel || "Programmable scientific duplex";
        dom.themeSelect.innerHTML = Object.entries(THEMES).map(([id, label]) => `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`).join("");
        dom.themeSelect.value = state.theme;
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
    }
    function renderSideSelect() {
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
    function renderPresetSelect() {
        const options = presetMenuGroups(PRESETS).map(([group, items]) => {
            const inner = items.map(([id, preset]) => `<option value="${escapeHtml(id)}">${escapeHtml(preset.name)}</option>`).join("");
            return `<optgroup label="${escapeHtml(group)}">${inner}</optgroup>`;
        }).join("");
        const customOption = `<option value="custom">Custom / current layout</option>`;
        dom.presetSelect.innerHTML = options + customOption;
        dom.presetSelect.value = PRESETS[state.presetId] ? state.presetId : "custom";
        const preset = PRESETS[dom.presetSelect.value];
        dom.presetDescription.textContent = preset ? preset.description : "Current custom layout. Loading a preset replaces both faces but keeps custom scale definitions.";
    }
    function applyPreset(id) {
        const preset = PRESETS[id];
        if (!preset)
            return;
        scaleHistory.clear();
        dom.reorderStatus.textContent = "";
        state.sides = deepClone(preset.sides);
        state.activeSide = Object.keys(state.sides)[0] || "front";
        state.presetId = id;
        state.theme = preset.theme || state.theme;
        state.density = preset.density || state.density;
        state.modelLabel = preset.modelLabel || preset.name;
        state.instrumentNote = preset.instrumentNote || preset.description || "";
        state.showFormulas = Boolean(preset.showFormulas);
        state.slideOffset = 0;
        state.cursor = 0.5;
        saveState();
        render();
        programmeEditor.status(`Loaded preset: ${preset.name}.`);
    }
    function renderRuleAndReadout(preserveJson = true) {
        renderRule();
        readoutView.update(state, scaleLibrary);
        updatePositionControls();
        if (!preserveJson)
            programmeEditor.scheduleSync();
    }
    function renderRule() {
        // Replacing a face invalidates its captured pointer geometry.
        endDrag();
        renderedTrackWidth = getScalePixelWidth();
        renderedDisplayScale = state.magnification;
        const context = { library: scaleLibrary, width: renderedTrackWidth,
            graduationMode: state.graduationMode, adaptiveSpacing: state.adaptiveSpacing,
            logGraduations: state.logGraduations, displayScale: state.magnification,
            minGap: state.density === "comfortable" ? 1.8 : 1.65 };
        dom.ruleCanvas.innerHTML = visibleSideKeys(state).map((key, index) => {
            const side = state.sides[key];
            const heading = state.viewMode === "both"
                ? `<div class="face-heading"><strong>${escapeHtml(side.name || titleCase(key))}</strong>${side.note ? `<span>${escapeHtml(side.note)}</span>` : ""}</div>` : "";
            return `<section class="rule-face" data-side="${escapeHtml(key)}" aria-label="${escapeHtml(side.name || key)}">
                ${heading}<div class="rule-face-body">
                <div class="rail top-stator" data-rail="topStator">${renderRailRows(side.topStator, "topStator", false, context)}</div>
                <div class="rail slide-rail" data-rail="slide">${renderRailRows(side.slide, "slide", true, context)}</div>
                <div class="rail bottom-stator" data-rail="bottomStator">${renderRailRows(side.bottomStator, "bottomStator", false, context)}</div>
                <div id="${index ? "cursor-" + index : "cursor"}" class="cursor"></div>
                </div></section>`;
        }).join("");
        updateSlideTransform();
        updateCursorPosition();
        loupe.refresh({ structure: true });
        scheduleScalePolish();
    }
    function scheduleScalePolish() {
        if (scalePolishFrame)
            cancelAnimationFrame(scalePolishFrame);
        scalePolishFrame = requestAnimationFrame(() => {
            scalePolishFrame = 0;
            optimizeScaleLabels(dom.ruleCanvas, state.compactScales);
            loupe.refresh({ structure: true });
            updateCursorPosition();
        });
    }
    function updateSlideTransform() {
        dom.ruleCanvas.style.setProperty("--slide-offset", String(state.slideOffset));
        const movers = dom.ruleCanvas.querySelectorAll(".slide-mover");
        movers.forEach(el => {
            el.style.transform = `translateX(${(state.slideOffset * 100).toFixed(4)}%)`;
        });
    }
    function updateCursorPosition() {
        dom.ruleCanvas.querySelectorAll(".rule-face-body").forEach(face => {
            const geometry = getScaleGeometry(face);
            face.querySelector(".cursor").style.left = `${(geometry.left + clamp(state.cursor, 0, 1) * geometry.width).toFixed(3)}px`;
        });
        loupe.refresh();
    }
    function updatePositionControls() {
        dom.slideRange.value = String(state.slideOffset * 100);
        dom.cursorRange.value = String(state.cursor * 1000);
        dom.slideText.textContent = positionText(state.slideOffset, "slideOffset");
        dom.cursorText.textContent = positionText(state.cursor, "cursor");
        dom.slideRange.setAttribute("aria-valuetext", positionDescription(state.slideOffset, "slideOffset"));
        dom.cursorRange.setAttribute("aria-valuetext", positionDescription(state.cursor, "cursor"));
        selectMotionTarget(keyboardTarget);
    }
    function renderRailEditors() {
        railReorder.cancel(false);
        dom.railEditors.innerHTML = railEditorMarkup(state.sides[state.activeSide], scaleLibrary);
        refreshEditorPositions(dom.railEditors);
        refreshUndoButtons();
    }
    function refreshUndoButtons() {
        for (const button of dom.railEditors.querySelectorAll('[data-action="undo"]')) {
            button.disabled = scaleHistory.size === 0;
            const label = scaleHistory.size ? `Undo: ${scaleHistory.description}` : "No scale edits to undo";
            button.setAttribute("aria-label", label);
            button.title = scaleHistory.size ? `${label}. Ctrl+Z or Command+Z in the scale lists.` : label;
        }
    }
    function undoScaleEdit(buttonRail = null) {
        railReorder.cancel(false);
        const restored = scaleHistory.undo(state);
        if (!restored) return;
        state = restored.state;
        saveState();
        render();
        const { rail, index } = restored.focus;
        const list = [...dom.railEditors.querySelectorAll(".rail-row-list")].find(el => el.dataset.rail === rail);
        const rows = list ? [...list.querySelectorAll(".scale-control-row")] : [];
        const row = rows[Math.min(index, rows.length - 1)];
        const undoButton = buttonRail && [...dom.railEditors.querySelectorAll('[data-action="undo"]')]
            .find(el => el.dataset.rail === buttonRail);
        const addButton = [...dom.railEditors.querySelectorAll('[data-action="add"]')].find(el => el.dataset.rail === rail);
        const focus = undoButton && !undoButton.disabled ? undoButton : row?.querySelector(".scale-grip") || addButton;
        focus?.focus({ preventScroll: true });
        dom.reorderStatus.textContent = `Undone: ${restored.description}. ${scaleHistory.size ? "Undo is available for earlier scale edits." : "No more scale edits to undo."}`;
    }
    function moveEditorScale(from, to) {
        try {
            const side = state.sides[state.activeSide];
            const next = moveScale(side, from, to);
            if (next === side) return true;
            scaleHistory.remember(state, `Move ${side[from.rail][from.index]} to ${railLabel(to.rail)}`, from);
            state.sides[state.activeSide] = next;
            state.presetId = "custom";
            saveState();
            renderRuleAndReadout(false);
            renderPresetSelect();
            programmeEditor.sync();
            refreshUndoButtons();
            return true;
        } catch (error) {
            showAppStatus(error.message);
            return false;
        }
    }
    function renderLibraryList() {
        const items = Object.keys(scaleLibrary).sort(scaleSort).map(id => {
            const def = scaleLibrary[id];
            const desc = def.description || `${def.type || "custom"} scale`;
            const family = def.family || (def.type === "expression" ? "Custom" : "Other");
            return `<div class="library-item"><strong>${escapeHtml(id)}</strong><span>${escapeHtml(desc)}<em>${escapeHtml(family)}</em></span></div>`;
        }).join("");
        dom.libraryList.innerHTML = items;
    }
    function onRailEditorChange(event) {
        const row = event.target.closest(".scale-control-row");
        if (!row || event.target.tagName !== "SELECT")
            return;
        const rail = row.dataset.rail;
        const idx = Number(row.dataset.index);
        const old = state.sides[state.activeSide][rail][idx];
        if (old === event.target.value) return;
        scaleHistory.remember(state, `Replace ${old} with ${event.target.value}`, { rail, index: idx });
        state.sides[state.activeSide][rail][idx] = event.target.value;
        refreshEditorPositions(dom.railEditors);
        state.presetId = "custom";
        saveState();
        renderRuleAndReadout(false);
        renderPresetSelect();
        programmeEditor.sync();
        refreshUndoButtons();
        dom.reorderStatus.textContent = `${old} replaced with ${event.target.value}. Undo is available.`;
    }
    function onRailEditorClick(event) {
        const button = event.target.closest("button[data-action]");
        if (!button || button.disabled) return;
        const action = button.dataset.action;
        if (action === "undo") { undoScaleEdit(button.dataset.rail); return; }
        if (!["add", "remove"].includes(action)) return;
        const row = button.closest(".scale-control-row");
        const rail = button.dataset.rail || row?.dataset.rail;
        if (!rail) return;
        const arr = state.sides[state.activeSide][rail];
        const idx = row ? Number(row.dataset.index) : arr.length;
        let message;
        if (action === "add") {
            const totalRows = Object.values(state.sides).reduce((n, side) => n + ["topStator", "slide", "bottomStator"].reduce((m, key) => m + side[key].length, 0), 0);
            if (arr.length >= 40 || totalRows >= 320) {
                showAppStatus("The programme limit is 40 rows per rail and 320 rows in total.");
                return;
            }
            const id = defaultScaleForRail(rail);
            scaleHistory.remember(state, `Add ${id} to ${railLabel(rail)}`, { rail, index: idx });
            arr.push(id);
            message = `${id} added. Undo is available.`;
        } else {
            if (!Number.isInteger(idx) || idx < 0 || idx >= arr.length) return;
            const id = arr[idx];
            scaleHistory.remember(state, `Remove ${id} from ${railLabel(rail)}`, { rail, index: idx });
            arr.splice(idx, 1);
            message = `${id} removed from ${railLabel(rail)}. Use Undo to restore it.`;
        }
        state.presetId = "custom";
        saveState();
        // The library is unchanged: update the face and lists without rebuilding
        // every library description or losing an unapplied JSON draft.
        renderRuleAndReadout(false);
        renderRailEditors();
        renderPresetSelect();
        programmeEditor.sync();
        dom.reorderStatus.textContent = message;
        const list = [...dom.railEditors.querySelectorAll(".rail-row-list")].find(el => el.dataset.rail === rail);
        const focus = action === "remove"
            ? [...dom.railEditors.querySelectorAll('[data-action="undo"]')].find(el => el.dataset.rail === rail)
            : list?.querySelectorAll("select")[idx];
        focus?.focus({ preventScroll: true });
    }
    function defaultScaleForRail(rail) {
        if (rail === "slide")
            return scaleLibrary.C ? "C" : Object.keys(scaleLibrary)[0];
        return scaleLibrary.D ? "D" : Object.keys(scaleLibrary)[0];
    }
    function onPointerDown(event) {
        if (dragMode || event.isPrimary === false || (event.button !== undefined && event.button !== 0))
            return;
        dom.ruleCanvas.focus({ preventScroll: true });
        const target = event.target;
        dragFace = target.closest?.(".rule-face-body");
        if (!dragFace)
            return;
        const onCursor = target.closest && target.closest(".cursor");
        const onSlide = target.closest && target.closest(".slide-rail");
        dragStartX = event.clientX;
        dragStartOffset = state.slideOffset;
        dragPointerId = event.pointerId;
        if (onCursor || !onSlide) {
            dragMode = "cursor";
            selectMotionTarget("cursor");
            // Grabbing the glass away from its hairline must not move it.
            // Clicking a stator still deliberately places the hairline there.
            if (!onCursor) updateCursorFromClientX(event.clientX);
            dragStartCursor = state.cursor;
        }
        else {
            dragMode = "slide";
            selectMotionTarget("slideOffset");
            dom.ruleCanvas.classList.add("is-dragging");
            const slideRail = dragFace?.querySelector(".slide-rail");
            if (slideRail)
                slideRail.classList.add("dragging");
        }
        dom.ruleCanvas.setPointerCapture?.(event.pointerId);
        saveState();
        event.preventDefault();
    }
    function onPointerMove(event) {
        if (!dragMode)
            return;
        if (dragPointerId !== null && event.pointerId !== dragPointerId)
            return;
        if (dragMode === "cursor") {
            const geometry = getScaleGeometry(dragFace);
            state.cursor = clamp(dragStartCursor + (event.clientX - dragStartX) / Math.max(1, geometry.screenWidth), 0, 1);
            scheduleMotion();
        }
        else if (dragMode === "slide") {
            const geometry = getScaleGeometry(dragFace);
            const workW = Math.max(1, geometry.screenWidth);
            const dx = event.clientX - dragStartX;
            state.slideOffset = clamp(dragStartOffset + dx / workW, -0.9, 0.9);
            scheduleMotion();
        }
        saveState();
        event.preventDefault();
    }
    function onPointerUp(event) {
        if (!dragMode || event.pointerId !== dragPointerId)
            return;
        endDrag();
    }
    function endDrag() {
        if (!dragMode) return;
        const pointer = dragPointerId;
        dragMode = null;
        dragPointerId = null;
        try {
            dom.ruleCanvas.releasePointerCapture?.(pointer);
        }
        catch (_) { /* capture already lost */ }
        flushState();
        dom.ruleCanvas.classList.remove("is-dragging");
        const slideRail = dragFace?.querySelector(".slide-rail");
        if (slideRail)
            slideRail.classList.remove("dragging");
        dragFace = null;
        programmeEditor.scheduleSync();
    }
    function updateCursorFromClientX(clientX) {
        const geometry = getScaleGeometry(dragFace);
        const workW = Math.max(1, geometry.screenWidth);
        state.cursor = clamp((clientX - geometry.screenLeft) / workW, 0, 1);
        scheduleMotion();
    }
    function getLabelWidth() {
        const raw = getComputedStyle(dom.ruleCanvas).getPropertyValue("--label-w");
        const parsed = parseFloat(raw);
        return Number.isFinite(parsed) ? parsed : DEFAULT_LABEL_W;
    }
    function getLegendWidth() {
        const raw = getComputedStyle(dom.ruleCanvas).getPropertyValue("--legend-w");
        const parsed = parseFloat(raw);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    function getScaleGeometry(face = dom.ruleCanvas.querySelector(".rule-face-body") || dom.ruleCanvas) {
        const pane = face.querySelector(".tick-pane");
        const canvas = face.getBoundingClientRect();
        if (pane) {
            const rect = pane.getBoundingClientRect();
            const zoom = canvas.width / Math.max(1, face.offsetWidth);
            return { left: (rect.left - canvas.left) / zoom, width: rect.width / zoom,
                screenLeft: rect.left, screenWidth: rect.width };
        }
        const left = getLabelWidth(), width = Math.max(1, dom.ruleCanvas.clientWidth - left - getLegendWidth());
        return { left, width, screenLeft: canvas.left + left * state.magnification,
            screenWidth: width * state.magnification };
    }
    function getScalePixelWidth() {
        const geometry = getScaleGeometry();
        return Math.max(1, geometry.width || dom.ruleCanvas.clientWidth - getLabelWidth() - getLegendWidth());
    }
    function applyProgramme(parsed) {
        const candidate = mergeState(deepClone(DEFAULT_STATE), parsed);
        if (!parsed.presetId) candidate.presetId = "custom";
        normalizeState(candidate);
        const previous = state;
        try {
            state = candidate;
            render();
        } catch (error) {
            state = previous;
            render();
            throw error;
        }
        scaleHistory.clear();
        refreshUndoButtons();
        dom.reorderStatus.textContent = "";
        saveState();
    }
    function saveStandaloneCopy() {
        if (document.querySelector("script[src]")) {
            programmeEditor.status("Use the built dist HTML to save a self-contained copy.", true);
            return;
        }
        const html = standaloneHtml(document, exportableState(state));
        downloadBlob(new Blob([html], { type: "text/html" }), "slide-rule-v" + APP_VERSION + "-configured.html");
        programmeEditor.status("Standalone copy saved with the current applied programme.");
    }
    function downloadBlob(blob, filename) {
        saveBlob(document, blob, filename);
    }
    init();
    return {
        getProgram: () => exportableState(state),
        destroy() {
            if (destroyed)
                return;
            destroyed = true;
            endDrag();
            flushState();
            lifetime.abort();
            scaleHistory.clear();
            loupe.destroy();
            resizeObserver?.disconnect();
            for (const frame of [motionFrame, resizeFrame, scalePolishFrame])
                window.cancelAnimationFrame(frame);
            window.clearTimeout(saveTimer);
        }
    };
}
export { createApplication };
