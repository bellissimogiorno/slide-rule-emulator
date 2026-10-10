import { loadProgramme, saveProgramme } from "#model/storage.js";
import { standaloneHtml, downloadBlob as saveBlob } from "#ui/files.js";
import { DENSITIES, THEMES } from "#catalog/appearance.js";
import { DEFAULT_STATE } from "#catalog/defaults.js";
import { PRESETS } from "#catalog/presets.js";
import { clamp } from "#core/numbers.js";
import { buildLibrary, deepClone, exportableState, mergeState, normalizeState } from "#model/program.js";
import { validateProgram } from "#model/validation.js";
import { escapeHtml, railLabel, scaleSort, titleCase } from "#ui/html.js";
import { optimizeScaleLabels } from "#ui/labels.js";
import { visibleSideKeys } from "#model/view.js";
import { renderReadout } from "#ui/readout.js";
import { renderRailRows } from "#ui/scale-markup.js";
import { APP_VERSION, DEFAULT_LABEL_W, STORAGE_KEY } from "#version.js";
function createApplication(document) {
    const window = document.defaultView;
    const lifetime = new window.AbortController();
    const listen = (target, type, listener) => target.addEventListener(type, listener, { signal: lifetime.signal });
    let resizeObserver;
    let jsonTimer = 0;
    let destroyed = false;
    let startupMessage = "";
    let recoveryData = null;
    let activeStorageKey = STORAGE_KEY;
    let storageWarningShown = false;
    let saveTimer = 0;
    let stateDirty = false;
    let jsonDirty = false;
    let motionFrame = 0;
    let resizeFrame = 0;
    let renderedTrackWidth = 0;
    let state = loadState();
    let scaleLibrary = buildLibrary(state);
    let dragMode = null;
    let dragFace = null;
    let dragStartX = 0;
    let dragStartOffset = 0;
    let dragPointerId = null;
    let syncJsonSoon = false;
    let scalePolishFrame = 0;
    const dom = {
        sideSelect: document.getElementById("sideSelect"),
        editSideField: document.getElementById("editSideField"),
        editSideSelect: document.getElementById("editSideSelect"),
        magnificationSelect: document.getElementById("magnificationSelect"),
        ruleViewport: document.getElementById("ruleViewport"),
        appStatus: document.getElementById("appStatus"),
        recoveryButton: document.getElementById("recoveryButton"),
        flipButton: document.getElementById("flipButton"),
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
        themeSelect: document.getElementById("themeSelect"),
        densitySelect: document.getElementById("densitySelect"),
        formulaToggle: document.getElementById("formulaToggle"),
        compactScaleToggle: document.getElementById("compactScaleToggle"),
        railEditors: document.getElementById("railEditors"),
        jsonEditor: document.getElementById("jsonEditor"),
        jsonStatus: document.getElementById("jsonStatus"),
        applyJsonButton: document.getElementById("applyJsonButton"),
        syncJsonButton: document.getElementById("syncJsonButton"),
        exportJsonButton: document.getElementById("exportJsonButton"),
        importJsonFile: document.getElementById("importJsonFile"),
        importJsonButton: document.getElementById("importJsonButton"),
        libraryList: document.getElementById("libraryList")
    };
    function init() {
        normalizeState(state);
        bindEvents();
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
            requestJsonSync();
        });
        listen(dom.jsonEditor, "input", () => { jsonDirty = true; });
        listen(dom.recoveryButton, "click", () => {
            downloadBlob(new Blob([recoveryData], { type: "application/json" }), "slide-rule-recovered-state.json");
        });
        listen(dom.ruleCanvas, "keydown", onRuleKeyDown);
        listen(window, "pagehide", flushState);
        listen(document, "visibilitychange", () => {
            if (document.hidden)
                flushState();
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
            requestJsonSync();
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
            state.slideOffset = Number(dom.slideRange.value) / 100;
            scheduleMotion();
            saveState();
            requestJsonSync();
        });
        listen(dom.cursorRange, "input", () => {
            state.cursor = Number(dom.cursorRange.value) / 1000;
            saveState();
            scheduleMotion();
            requestJsonSync();
        });
        listen(dom.ruleCanvas, "pointerdown", onPointerDown);
        listen(window, "pointermove", onPointerMove);
        listen(window, "pointerup", onPointerUp);
        listen(window, "pointercancel", onPointerUp);
        listen(window, "resize", scheduleResize);
        listen(dom.ruleCanvas, "lostpointercapture", onPointerUp);
        listen(dom.loadPresetButton, "click", () => applyPreset(dom.presetSelect.value));
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
        listen(dom.applyJsonButton, "click", applyJsonProgram);
        listen(dom.syncJsonButton, "click", () => {
            if (jsonDirty && !window.confirm("Replace the unapplied JSON draft with the current layout?"))
                return;
            syncJsonEditor(true);
            setJsonStatus("JSON synced from current layout.");
        });
        listen(dom.exportJsonButton, "click", exportJsonProgram);
        listen(dom.importJsonFile, "change", importJsonProgram);
        listen(dom.importJsonButton, "click", () => dom.importJsonFile.click());
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
            dom.readout.innerHTML = renderReadout(state, scaleLibrary);
            updatePositionControls();
        });
    }
    function scheduleResize() {
        if (resizeFrame)
            return;
        resizeFrame = requestAnimationFrame(() => {
            resizeFrame = 0;
            const width = getScalePixelWidth();
            if (Math.abs(width - renderedTrackWidth) > 0.5)
                renderRule();
            else {
                updateCursorPosition();
                scheduleScalePolish();
            }
        });
    }
    function onRuleKeyDown(event) {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
        const field = event.shiftKey ? "slideOffset" : "cursor";
        const step = event.altKey ? 0.0001 : 0.002;
        const lo = field === "cursor" ? 0 : -0.9;
        const hi = field === "cursor" ? 1 : 0.9;
        state[field] = event.key === "Home" ? lo : event.key === "End" ? hi
            : clamp(state[field] + (event.key === "ArrowRight" ? step : -step), lo, hi);
        scheduleMotion();
        saveState();
        requestJsonSync();
        event.preventDefault();
    }
    function render() {
        scaleLibrary = buildLibrary(state);
        normalizeState(state);
        applyAppearance();
        renderSideSelect();
        renderPresetSelect();
        renderRuleAndReadout();
        renderRailEditors();
        renderLibraryList();
        updatePositionControls();
        syncJsonEditor();
        if (!jsonDirty)
            setJsonStatus("");
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
        dom.flipButton.disabled = state.viewMode === "both" || Object.keys(state.sides).length < 2;
        dom.flipButton.title = state.viewMode === "both" ? "Both sides are already visible" : "Show the other face";
        dom.editSideField.hidden = state.viewMode !== "both";
        dom.editSideSelect.innerHTML = options;
        dom.editSideSelect.value = state.activeSide;
        const side = state.sides[state.activeSide] || {};
        dom.ruleTopNote.textContent = state.viewMode === "both" ? "Both sides - linked slide and cursor" : (side.name || state.activeSide).toLowerCase();
        dom.instrumentNote.textContent = side.note || state.instrumentNote || "Drag the slide and cursor; all readings update at the hairline.";
    }
    function renderPresetSelect() {
        const groups = new Map();
        for (const [id, preset] of Object.entries(PRESETS)) {
            const group = preset.group || "Other";
            if (!groups.has(group))
                groups.set(group, []);
            groups.get(group).push([id, preset]);
        }
        const options = [...groups.entries()].map(([group, items]) => {
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
        setJsonStatus(`Loaded preset: ${preset.name}.`);
    }
    function renderRuleAndReadout(preserveJson = true) {
        renderRule();
        dom.readout.innerHTML = renderReadout(state, scaleLibrary);
        updatePositionControls();
        if (!preserveJson)
            requestJsonSync();
    }
    function renderRule() {
        renderedTrackWidth = getScalePixelWidth();
        const context = { library: scaleLibrary, width: renderedTrackWidth,
            minGap: state.density === "comfortable" ? 1.8 : 1.65 };
        dom.ruleCanvas.innerHTML = visibleSideKeys(state).map((key, index) => {
            const side = state.sides[key];
            const heading = state.viewMode === "both"
                ? `<div class="face-heading"><strong>${escapeHtml(side.name || titleCase(key))}</strong>${side.note ? `<span>${escapeHtml(side.note)}</span>` : ""}</div>` : "";
            return `<section class="rule-face" data-side="${escapeHtml(key)}" aria-label="${escapeHtml(side.name || key)}">
                ${heading}<div class="rule-face-body">
                <div class="rail top-stator" data-rail="topStator">${renderRailRows(side.topStator, "topStator", false, context)}</div>
                <div class="rail slide-rail" data-rail="slide" title="Drag to move the slide on both faces">${renderRailRows(side.slide, "slide", true, context)}</div>
                <div class="rail bottom-stator" data-rail="bottomStator">${renderRailRows(side.bottomStator, "bottomStator", false, context)}</div>
                <div id="${index ? "cursor-" + index : "cursor"}" class="cursor" title="Drag the linked cursor"></div>
                </div></section>`;
        }).join("");
        updateSlideTransform();
        updateCursorPosition();
        scheduleScalePolish();
    }
    function scheduleScalePolish() {
        if (scalePolishFrame)
            cancelAnimationFrame(scalePolishFrame);
        scalePolishFrame = requestAnimationFrame(() => {
            scalePolishFrame = 0;
            optimizeScaleLabels(dom.ruleCanvas, state.compactScales);
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
    }
    function updatePositionControls() {
        dom.slideRange.value = String(state.slideOffset * 100);
        dom.cursorRange.value = String(state.cursor * 1000);
        dom.slideText.textContent = state.slideOffset.toFixed(3);
        dom.cursorText.textContent = state.cursor.toFixed(3);
    }
    function renderRailEditors() {
        const side = state.sides[state.activeSide];
        const rails = ["topStator", "slide", "bottomStator"];
        dom.railEditors.innerHTML = rails.map(rail => {
            const rows = (side[rail] || []).map((id, idx) => renderScaleControlRow(rail, id, idx)).join("");
            return `<div class="rail-editor" data-rail="${rail}">
      <div class="rail-editor-title"><span>${railLabel(rail)}</span><button data-action="add" data-rail="${rail}">Add scale</button></div>
      ${rows || `<div class="hint">No scales selected.</div>`}
    </div>`;
        }).join("");
    }
    function renderScaleControlRow(rail, id, idx) {
        const options = Object.keys(scaleLibrary).sort(scaleSort).map(scaleId => {
            const def = scaleLibrary[scaleId];
            const label = `${scaleId} - ${def.description || def.label || "scale"}`;
            return `<option value="${escapeHtml(scaleId)}" ${scaleId === id ? "selected" : ""}>${escapeHtml(label)}</option>`;
        }).join("");
        return `<div class="scale-control-row" data-rail="${rail}" data-index="${idx}">
    <select aria-label="Scale at position ${idx + 1}">${options}</select>
    <button title="Move up" data-action="up">Up</button>
    <button title="Move down" data-action="down">Down</button>
    <button title="Remove" data-action="remove" class="danger">X</button>
  </div>`;
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
        state.sides[state.activeSide][rail][idx] = event.target.value;
        state.presetId = "custom";
        saveState();
        renderRuleAndReadout(false);
        renderPresetSelect();
        syncJsonEditor();
    }
    function onRailEditorClick(event) {
        const button = event.target.closest("button[data-action]");
        if (!button)
            return;
        const action = button.dataset.action;
        const row = button.closest(".scale-control-row");
        const rail = button.dataset.rail || row?.dataset.rail;
        if (!rail)
            return;
        const arr = state.sides[state.activeSide][rail];
        const idx = row ? Number(row.dataset.index) : -1;
        if (action === "add") {
            const totalRows = Object.values(state.sides).reduce((n, side) => n + ["topStator", "slide", "bottomStator"].reduce((m, key) => m + side[key].length, 0), 0);
            if (arr.length >= 40 || totalRows >= 320) {
                showAppStatus("The programme limit is 40 rows per rail and 320 rows in total.");
                return;
            }
            arr.push(defaultScaleForRail(rail));
        }
        else if (action === "remove" && idx >= 0) {
            arr.splice(idx, 1);
        }
        else if (action === "up" && idx > 0) {
            [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
        }
        else if (action === "down" && idx >= 0 && idx < arr.length - 1) {
            [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
        }
        state.presetId = "custom";
        saveState();
        render();
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
            updateCursorFromClientX(event.clientX);
        }
        else {
            dragMode = "slide";
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
            updateCursorFromClientX(event.clientX);
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
        requestJsonSync();
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
    function syncJsonEditor(force = false) {
        if (!force && jsonDirty)
            return;
        dom.jsonEditor.value = JSON.stringify(exportableState(state), null, 2);
        jsonDirty = false;
    }
    function requestJsonSync() {
        if (syncJsonSoon)
            return;
        syncJsonSoon = true;
        jsonTimer = window.setTimeout(() => {
            jsonTimer = 0;
            syncJsonSoon = false;
            syncJsonEditor();
        }, 160);
    }
    function applyJsonProgram() {
        try {
            if (dom.jsonEditor.value.length > 1000000)
                throw new Error("Programme exceeds the 1 MB limit.");
            const parsed = JSON.parse(dom.jsonEditor.value);
            validateProgram(parsed);
            const candidate = mergeState(deepClone(DEFAULT_STATE), parsed);
            if (!parsed.presetId)
                candidate.presetId = "custom";
            normalizeState(candidate);
            const previous = state;
            try {
                state = candidate;
                render();
            }
            catch (error) {
                state = previous;
                render();
                throw error;
            }
            jsonDirty = false;
            syncJsonEditor(true);
            saveState();
            setJsonStatus("JSON applied.");
        }
        catch (error) {
            setJsonStatus(error.message || String(error), true);
        }
    }
    function setJsonStatus(message, isError = false) {
        dom.jsonStatus.textContent = message;
        dom.jsonStatus.classList.toggle("error", Boolean(isError));
    }
    function exportJsonProgram() {
        const blob = new Blob([JSON.stringify(exportableState(state), null, 2)], { type: "application/json" });
        downloadBlob(blob, "slide-rule-program.json");
        setJsonStatus("JSON exported.");
    }
    function importJsonProgram(event) {
        const file = event.target.files && event.target.files[0];
        if (!file)
            return;
        if (file.size > 1000000) {
            setJsonStatus("Programme exceeds the 1 MB limit.", true);
            event.target.value = "";
            return;
        }
        if (jsonDirty && !window.confirm("Replace the unapplied JSON draft with this file?")) {
            event.target.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            dom.jsonEditor.value = String(reader.result || "");
            jsonDirty = true;
            applyJsonProgram();
        };
        reader.onerror = () => setJsonStatus("Could not read that file.", true);
        reader.readAsText(file);
        event.target.value = "";
    }
    function saveStandaloneCopy() {
        if (document.querySelector("script[src]")) {
            setJsonStatus("Use the built dist HTML to save a self-contained copy.", true);
            return;
        }
        const html = standaloneHtml(document, exportableState(state));
        downloadBlob(new Blob([html], { type: "text/html" }), "slide-rule-v" + APP_VERSION + "-configured.html");
        setJsonStatus("Standalone copy saved with the current applied programme.");
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
            flushState();
            lifetime.abort();
            resizeObserver?.disconnect();
            for (const frame of [motionFrame, resizeFrame, scalePolishFrame])
                window.cancelAnimationFrame(frame);
            window.clearTimeout(saveTimer);
            window.clearTimeout(jsonTimer);
        }
    };
}
export { createApplication };
