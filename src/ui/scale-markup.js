import { dedupeTicks } from "#core/ticks/common.js";
import { makeRuntimeScale } from "#core/mappings.js";
import { clamp } from "#core/numbers.js";
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
function renderScaleLegend(def, label, compactLabel) {
    const safeName = escapeHtml(def.type === "syncroLogLog" ? label : (compactLabel || label || def.id || ""));
    const safeFormula = escapeHtml(def.formula || compactLabel || label || def.id || "");
    if (def.type === "syncroLogLog") {
        const positive = escapeHtml(def.positiveCaption || "+");
        const negative = escapeHtml(def.negativeCaption || "−");
        return `<div class="scale-legend syncro-legend" title="${escapeHtml(def.description || label)}"><span><strong>${safeName}+</strong> ${positive}</span><span class="negative"><strong>${safeName}−</strong> ${negative}</span></div>`;
    }
    if (def.type === "composite") {
        return `<div class="scale-legend dual-legend" title="${escapeHtml(def.formula || def.description || label)}">${def.layers.map((layer, i) => {
            const spec = typeof layer === "string" ? { scale: layer } : layer;
            return `<span class="ink-${escapeHtml(spec.tone || (i ? "red" : "neutral"))}">${escapeHtml(spec.caption || spec.scale)}</span>`;
        }).join("")}</div>`;
    }
    return `<div class="scale-legend" title="${escapeHtml(def.formula || def.description || label)}"><span class="legend-formula">${safeFormula}</span><span class="legend-name">${safeName}</span></div>`;
}
function renderScaleRow(scaleId, isSlide, rail, index, total, { library: scaleLibrary, width, minGap }) {
    const def = scaleLibrary[scaleId];
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
    if (def.type === "syncroLogLog") {
        classes.push("syncro-scale");
        const rt = makeRuntimeScale(def);
        const ticks = generateTicks(def, rt, width, minGap);
        paneHtml = `<div class="tick-pane"><div class="${moverClass} syncro-track"><div class="syncro-baseline"></div>${ticks.map(t => renderSyncroTick(t)).join("")}${anchor}</div>${endLabel}</div>`;
    }
    else if (def.type === "segmented") {
        classes.push("segmented-scale");
        const ticks = def.layers.flatMap(layer => {
            const spec = typeof layer === "string" ? { scale: layer } : layer;
            const child = scaleLibrary[spec.scale];
            return generateTicks(child, makeRuntimeScale(child), width, minGap).map(t => ({ ...t,
                title: t.title || `${spec.caption || child.label}: ${t.value}`,
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
            const ticks = generateTicks(layerDef, rt, width, minGap);
            const position = layerIndex === 0 ? "upper" : "lower";
            const caption = ""; // Captions belong in the gutter, never on top of graduations.
            return `<div class="tick-layer ${position} ink-${escapeHtml(spec.tone || (layerIndex ? "red" : "neutral"))}"><div class="${moverClass}"><div class="baseline"></div>${ticks.map(t => renderTick(t)).join("")}${caption}${layerIndex === 0 ? anchor : ""}</div></div>`;
        }).join("");
        paneHtml = `<div class="tick-pane">${layerHtml}${endLabel}</div>`;
    }
    else {
        const rt = makeRuntimeScale(def);
        const ticks = generateTicks(def, rt, width, minGap);
        paneHtml = `<div class="tick-pane"><div class="${moverClass}"><div class="baseline"></div>${ticks.map(t => renderTick(t)).join("")}${anchor}</div>${endLabel}</div>`;
    }
    const compactLabel = def.compactLabel || label;
    const labelHtml = def.type === "syncroLogLog"
        ? `<span class="syncro-scale-name"><span>${escapeHtml(label)}+</span><span class="negative">${escapeHtml(label)}−</span></span>`
        : escapeHtml(compactLabel);
    const legendHtml = renderScaleLegend(def, label, compactLabel);
    return `<div class="${classes.join(" ")}" data-scale="${escapeHtml(scaleId)}" data-rail="${escapeHtml(rail)}" title="${escapeHtml(def.description || scaleId)}">
        <div class="scale-name">${labelHtml}${def.unit ? `<small>${escapeHtml(def.unit)}</small>` : ""}</div>
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
function tickLabelPriority(kind, label, pos) {
    let priority = kind === "index" ? 12000 : kind === "gauge" ? 1800 : kind === "major" ? 1200 : kind === "submajor" ? 600 : 200;
    if (pos < 1e-7 || pos > 1 - 1e-7)
        priority += 4000;
    if (/^[1-9]$|^10$|^100$|^1000$/.test(String(label)))
        priority += 250;
    return priority;
}
function edgeClassForPosition(pos) {
    return pos < 0.012 ? " edge-left" : pos > 0.988 ? " edge-right" : "";
}
function renderTick(t) {
    const pos = clamp(t.pos, 0, 1);
    const left = pos * 100;
    const kind = t.kind || "minor";
    const label = t.label == null ? "" : String(t.label);
    const tiny = label.length > 6 ? " tiny" : "";
    const gauge = kind === "gauge" ? " gauge-label" : "";
    const ink = t.ink ? ` ink-${escapeHtml(t.ink)}` : "";
    const decoration = t.decade === 0 ? " mass-underlined" : t.decade === 2 ? " mass-overlined" : "";
    const title = t.title ? ` title="${escapeHtml(t.title)}"` : "";
    const edge = edgeClassForPosition(pos);
    const priority = tickLabelPriority(kind, label, pos);
    return `<div${title} aria-hidden="true" data-pos="${pos.toFixed(7)}" data-kind="${escapeHtml(kind)}" class="tick ${escapeHtml(kind)}${ink}" style="left:${left.toFixed(5)}%"></div>${label ? `<div${title} class="tick-label${ink}${tiny}${gauge}${edge}${decoration}" data-pos="${pos.toFixed(7)}" data-priority="${priority}" data-kind="${escapeHtml(kind)}" data-label-text="${escapeHtml(label)}" style="left:${left.toFixed(5)}%">${escapeHtml(label)}</div>` : ""}`;
}
function renderSyncroTick(t) {
    const pos = clamp(t.pos, 0, 1);
    const left = pos * 100;
    const kind = t.kind || "minor";
    const positive = t.positiveLabel == null ? "" : String(t.positiveLabel);
    const negative = t.negativeLabel == null ? "" : String(t.negativeLabel);
    const positiveTiny = positive.length > 6 ? " tiny" : "";
    const negativeTiny = negative.length > 6 ? " tiny" : "";
    const edge = edgeClassForPosition(pos);
    const priority = tickLabelPriority(kind, positive || negative, pos);
    return `<div aria-hidden="true" data-pos="${pos.toFixed(7)}" data-kind="${escapeHtml(kind)}" class="syncro-tick ${escapeHtml(kind)}" style="left:${left.toFixed(5)}%"></div>${positive ? `<div class="syncro-number positive${positiveTiny}${edge}" data-pos="${pos.toFixed(7)}" data-priority="${priority}" data-kind="${escapeHtml(kind)}" data-label-text="${escapeHtml(positive)}" style="left:${left.toFixed(5)}%">${escapeHtml(positive)}</div>` : ""}${negative ? `<div class="syncro-number negative${negativeTiny}${edge}" data-pos="${pos.toFixed(7)}" data-priority="${priority}" data-kind="${escapeHtml(kind)}" data-label-text="${escapeHtml(negative)}" style="left:${left.toFixed(5)}%">${escapeHtml(negative)}</div>` : ""}`;
}
export { renderRailRows, rowAxis, renderScaleLegend, renderScaleRow, scaleTone, tickLabelPriority, edgeClassForPosition, renderTick, renderSyncroTick };
