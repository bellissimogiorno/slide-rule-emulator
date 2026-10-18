import { renderTick, renderSyncroTick, tickLabelPriority, edgeClassForPosition } from "#ui/tick-markup.js";
import { renderRootStackPane, renderRootStackGutter } from "#ui/root-stack.js";
import { dedupeTicks } from "#core/ticks/common.js";
import { makeRuntimeScale } from "#core/mappings.js";
import { generateTicks } from "#core/ticks/index.js";
import { escapeHtml, railShortLabel } from "#ui/html.js";
function renderRailRows(scaleIds, rail, isSlide, context) {
    if (!scaleIds.length) {
        return `<div class="empty-scale"><div class="scale-name">${railShortLabel(rail)}</div><div>No scales selected</div></div>`;
    }
    return scaleIds.map((id, index) => renderScaleRow(id, isSlide, rail, index, scaleIds.length, context)).join("");
}
function rowAxis(rail, index, total, def) {
    if (def && (def.axis === "top" || def.axis === "bottom"))
        return def.axis;
    if (rail === "topStator")
        return "bottom";
    if (rail === "bottomStator")
        return "top";
    if (total <= 1)
        return "bottom";
    return index < Math.ceil(total / 2) ? "top" : "bottom";
}
// Native titles inherit through descendants. Put scale-wide help only on the
// two end panels, never on a row or a graduation pane used for calculation.
function scaleHelpTitle(def, label) {
    return escapeHtml(def.description || def.formula || label || def.id || "");
}
function renderScaleLegend(def, label, compactLabel) {
    const safeName = escapeHtml(def.type === "syncroLogLog" ? label : (compactLabel || label || def.id || ""));
    const safeFormula = escapeHtml(def.formula || compactLabel || label || def.id || "");
    if (def.type === "syncroLogLog") {
        const positive = escapeHtml(def.positiveCaption || "+");
        const negative = escapeHtml(def.negativeCaption || "−");
        return `<div class="scale-legend syncro-legend" title="${scaleHelpTitle(def, label)}"><span><strong>${safeName}+</strong> ${positive}</span><span class="negative"><strong>${safeName}−</strong> ${negative}</span></div>`;
    }
    if (def.pairedProduct !== undefined) {
        return `<div class="scale-legend syncro-legend" title="${scaleHelpTitle(def, label)}">${renderProductCaptions(def)}</div>`;
    }
    if (def.type === "composite") {
        return `<div class="scale-legend dual-legend" title="${scaleHelpTitle(def, label)}">${def.layers.map((layer, i) => {
            const spec = typeof layer === "string" ? { scale: layer } : layer;
            return `<span class="ink-${escapeHtml(spec.tone || (i ? "red" : "neutral"))}">${escapeHtml(spec.caption || spec.scale)}</span>`;
        }).join("")}</div>`;
    }
    return `<div class="scale-legend" title="${scaleHelpTitle(def, label)}"><span class="legend-formula">${safeFormula}</span><span class="legend-name">${safeName}</span></div>`;
}
function renderProductCaptions(def) {
    return `<span>${escapeHtml(def.positiveCaption || "Primary")}</span><span class="negative">${escapeHtml(def.negativeCaption || "Secondary")}</span>`;
}
function renderScaleRow(scaleId, isSlide, rail, index, total, { library: scaleLibrary, width, minGap, logGraduations = "adaptive", displayScale = 1, graduationMode = "conventional", adaptiveSpacing = "balanced", fullPrecision = false }) {
    const def = scaleLibrary[scaleId];
    const tickOptions = { logGraduations, displayScale, graduationMode, adaptiveSpacing, fullPrecision };
    const label = def ? (def.label || def.id) : scaleId;
    if (!def) {
        return `<div class="scale-row axis-bottom missing"><div class="scale-name">${escapeHtml(scaleId)}</div><div class="tick-pane"><div class="baseline"></div><span class="hint" style="position:absolute;left:12px;top:6px">Missing scale definition</span></div><div class="scale-legend"><span class="legend-name">?</span></div></div>`;
    }
    const tone = escapeHtml(scaleTone(scaleId, def));
    const axis = rowAxis(rail, index, total, def);
    const classes = ["scale-row", `tone-${tone}`, `axis-${axis}`];
    if (def.compactLabels === false || def.labelPacking === "centred")
        classes.push("no-compact-labels");
    const moverClass = isSlide ? "tick-mover slide-mover" : "tick-mover";
    const endLabel = "";
    const anchor = ""; // Anchors are regular collision-aware gauge graduations.
    let paneHtml = "";
    if (def.type === "rootStack") {
        classes.push("root-stack", `root-stack-${def.layers.length}`);
        if (def.layers.some(layer => {
            const child = scaleLibrary[typeof layer === "string" ? layer : layer.scale];
            return child.compactLabels === false || child.labelPacking === "centred";
        })) classes.push("no-compact-labels");
        paneHtml = renderRootStackPane(def, scaleLibrary, { width, minGap, moverClass, tickOptions });
    }
    else if (def.type === "syncroLogLog" || def.pairedSum !== undefined || def.pairedProduct !== undefined) {
        classes.push("syncro-scale");
        const rt = makeRuntimeScale(def);
        const ticks = generateTicks(def, rt, width, minGap, tickOptions);
        const domain = def.pairedSum === undefined && def.pairedProduct === undefined ? "" : ` style="left:${100 * rt.pMin}%;right:auto;width:${100 * (rt.pMax - rt.pMin)}%"`;
        if (def.pairedSum !== undefined) classes.push("paired-angle-scale");
        if (def.pairedProduct !== undefined) classes.push("paired-product-scale");
        paneHtml = `<div class="tick-pane"><div class="${moverClass} syncro-track"><div class="syncro-baseline"${domain}></div>${ticks.map(t => renderSyncroTick(t)).join("")}${anchor}</div>${endLabel}</div>`;
    }
    else if (def.type === "segmented") {
        classes.push("segmented-scale");
        const ticks = def.layers.flatMap(layer => {
            const spec = typeof layer === "string" ? { scale: layer } : layer;
            const child = scaleLibrary[spec.scale];
            return generateTicks(child, makeRuntimeScale(child), width, minGap, tickOptions).map(t => ({ ...t,
                ink: spec.tone || scaleTone(spec.scale, child) }));
        });
        paneHtml = `<div class="tick-pane"><div class="${moverClass}"><div class="baseline"></div>${dedupeTicks(ticks).map(renderTick).join("")}</div></div>`;
    }
    else if (Array.isArray(def.layers) && def.layers.length) {
        classes.push("dual-scale");
        const layerHtml = def.layers.slice(0, 2).map((layerSpec, layerIndex) => {
            const spec = typeof layerSpec === "string" ? { scale: layerSpec } : layerSpec;
            const layerDef = scaleLibrary[spec.scale];
            if (!layerDef)
                return "";
            const rt = makeRuntimeScale(layerDef);
            const ticks = generateTicks(layerDef, rt, width, minGap, tickOptions);
            const position = layerIndex === 0 ? "upper" : "lower";
            const caption = ""; // Captions belong in the gutter, never on top of graduations.
            return `<div class="tick-layer ${position} ink-${escapeHtml(spec.tone || (layerIndex ? "red" : "neutral"))}"><div class="${moverClass}"><div class="baseline"></div>${ticks.map(t => renderTick(t)).join("")}${caption}${layerIndex === 0 ? anchor : ""}</div></div>`;
        }).join("");
        paneHtml = `<div class="tick-pane">${layerHtml}${endLabel}</div>`;
    }
    else {
        const rt = makeRuntimeScale(def);
        const ticks = generateTicks(def, rt, width, minGap, tickOptions);
        paneHtml = `<div class="tick-pane"><div class="${moverClass}"><div class="baseline"></div>${ticks.map(t => renderTick(t)).join("")}${anchor}</div>${endLabel}</div>`;
    }
    const compactLabel = def.compactLabel || label;
    const labelHtml = def.type === "rootStack"
        ? renderRootStackGutter(def, scaleLibrary, false)
        : def.pairedProduct !== undefined
        ? `<span class="syncro-scale-name">${renderProductCaptions(def)}</span>`
        : def.type === "syncroLogLog"
        ? `<span class="syncro-scale-name"><span>${escapeHtml(label)}+</span><span class="negative">${escapeHtml(label)}−</span></span>`
        : escapeHtml(compactLabel);
    const legendHtml = def.type === "rootStack"
        ? `<div class="scale-legend root-stack-legend" title="${scaleHelpTitle(def, label)}">${renderRootStackGutter(def, scaleLibrary, true)}</div>`
        : renderScaleLegend(def, label, compactLabel);
    return `<div class="${classes.join(" ")}" data-scale="${escapeHtml(scaleId)}" data-rail="${escapeHtml(rail)}">
        <div class="scale-name" title="${scaleHelpTitle(def, label)}">${labelHtml}${def.unit ? `<small>${escapeHtml(def.unit)}</small>` : ""}</div>
        ${paneHtml}
        ${legendHtml}
      </div>`;
}
function scaleTone(scaleId, def) {
    if (def.tone)
        return def.tone;
    if (Number(def.sign) < 0 || /(^|_)(CI|DI|CIF|DIF)|I$/.test(scaleId))
        return "red";
    if (["C", "CF", "CFM", "B"].includes(scaleId))
        return "green";
    if (/^(A|B|W|R|Q|5R)/.test(scaleId))
        return "blue";
    return "neutral";
}

export { renderRailRows, rowAxis, renderScaleLegend, renderScaleRow, scaleTone, tickLabelPriority, edgeClassForPosition, renderTick, renderSyncroTick };
