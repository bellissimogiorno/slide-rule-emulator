import { formatValue } from "#core/format.js";
import { makeRuntimeScale } from "#core/mappings.js";
import { clamp } from "#core/numbers.js";
import { escapeHtml, railLabel } from "#ui/html.js";
function renderReadout(state, scaleLibrary) {
    if (state.viewMode === "both") {
        return Object.entries(state.sides).map(([key, side]) =>
            `<div class="readout-side-heading">${escapeHtml(side.name || key)}</div>` +
            renderReadout({ ...state, activeSide: key, viewMode: "single" }, scaleLibrary)).join("");
    }
    const side = state.sides[state.activeSide];
    const cards = [];
    for (const rail of ["topStator", "slide", "bottomStator"]) {
        const isSlide = rail === "slide";
        for (const id of side[rail]) {
            const def = scaleLibrary[id];
            if (!def)
                continue;
            const readoutLabel = def.compactLabel || def.label || id;
            const p = isSlide ? state.cursor - state.slideOffset : state.cursor;
            if (def.type === "syncroLogLog") {
                const rt = makeRuntimeScale(def);
                const pMin = Number.isFinite(rt.pMin) ? rt.pMin : 0;
                const pMax = Number.isFinite(rt.pMax) ? rt.pMax : 1;
                const outside = p < pMin - 1e-10 || p > pMax + 1e-10;
                let positiveText = "off scale";
                let negativeText = "off scale";
                if (!outside) {
                    try {
                        const positiveValue = rt.value(clamp(p, pMin, pMax));
                        positiveText = formatValue(positiveValue, def);
                        negativeText = formatValue(1 / positiveValue, def);
                    }
                    catch (err) {
                        positiveText = negativeText = "error";
                    }
                }
                cards.push(`<div class="readout-card ${outside ? "outside" : ""}"><div><span class="scale-id">${escapeHtml(readoutLabel)}</span><span class="rail-name">${railLabel(rail)}</span></div><div class="value multi"><span>+: ${escapeHtml(positiveText)}</span><span>−: ${escapeHtml(negativeText)}</span></div></div>`);
                continue;
            }
            if (def.referenceOnly) {
                const rt = makeRuntimeScale(def);
                let nearest, distance = Infinity;
                for (const mark of def.ticks) {
                    const delta = Math.abs(rt.pos(mark.value) - p);
                    if (delta < distance) { nearest = mark; distance = delta; }
                }
                const text = nearest && p >= rt.pMin - 1e-10 && p <= rt.pMax + 1e-10
                    ? `Nearest: ${nearest.label} = ${nearest.mass}` : "off scale";
                cards.push(`<div class="readout-card"><div><span class="scale-id">${escapeHtml(readoutLabel)}</span><span class="rail-name">${railLabel(rail)}</span></div><div class="value">${escapeHtml(text)}</div></div>`);
                continue;
            }
            if (Array.isArray(def.layers) && def.layers.length) {
                let outsideAny = false;
                let insideCount = 0;
                const values = def.layers.slice(0, 2).map(layerSpec => {
                    const spec = typeof layerSpec === "string" ? { scale: layerSpec } : layerSpec;
                    const layerDef = scaleLibrary[spec.scale];
                    if (!layerDef)
                        return `<span>missing</span>`;
                    const rt = makeRuntimeScale(layerDef);
                    const pMin = Number.isFinite(rt.pMin) ? rt.pMin : 0;
                    const pMax = Number.isFinite(rt.pMax) ? rt.pMax : 1;
                    const outside = p < pMin - 1e-10 || p > pMax + 1e-10;
                    outsideAny ||= outside;
                    if (outside && def.type === "segmented") return "";
                    if (!outside) insideCount++;
                    let valueText = "off scale";
                    if (!outside) {
                        try {
                            valueText = formatValue(rt.value(clamp(p, pMin, pMax)), layerDef);
                        }
                        catch (err) {
                            valueText = "error";
                        }
                    }
                    return `<span>${escapeHtml(spec.caption || layerDef.label || spec.scale)}: ${escapeHtml(valueText)}</span>`;
                }).join("");
                if (def.type === "segmented") outsideAny = insideCount === 0;
                cards.push(`<div class="readout-card ${outsideAny ? "outside" : ""}"><div><span class="scale-id">${escapeHtml(readoutLabel)}</span><span class="rail-name">${railLabel(rail)}</span></div><div class="value multi">${values || "off scale"}</div></div>`);
                continue;
            }
            const rt = makeRuntimeScale(def);
            const pMin = Number.isFinite(rt.pMin) ? rt.pMin : 0;
            const pMax = Number.isFinite(rt.pMax) ? rt.pMax : 1;
            const outside = p < pMin - 1e-10 || p > pMax + 1e-10;
            let valueText = "off scale";
            if (!outside) {
                try {
                    valueText = formatValue(rt.value(clamp(p, pMin, pMax)), def);
                }
                catch (err) {
                    valueText = "error";
                }
            }
            cards.push(`<div class="readout-card ${outside ? "outside" : ""}"><div><span class="scale-id">${escapeHtml(readoutLabel)}</span><span class="rail-name">${railLabel(rail)}</span></div><div class="value">${escapeHtml(valueText)}</div></div>`);
        }
    }
    return cards.join("") || `<div class="readout-card"><div class="value">No scales on this side.</div></div>`;
}
export { renderReadout };
