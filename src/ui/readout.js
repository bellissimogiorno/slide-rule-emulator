/** Digital readings use the same mappings and precision as the instrument.
 * Rail headings are shared; compact inline cards never hide or truncate values.
 */
import { formatValue } from "#core/format.js";
import { makeRuntimeScale } from "#core/mappings.js";
import { clamp } from "#core/numbers.js";
import { escapeHtml, railLabel } from "#ui/html.js";
import { visibleSideKeys } from "#model/view.js";

const RAILS = ["topStator", "slide", "bottomStator"];

function positionOnScale(def, p) {
    const rt = makeRuntimeScale(def);
    const min = Number.isFinite(rt.pMin) ? rt.pMin : 0;
    const max = Number.isFinite(rt.pMax) ? rt.pMax : 1;
    return { rt, outside: p < min - 1e-10 || p > max + 1e-10, p: clamp(p, min, max) };
}

function singleReading(def, p) {
    const point = positionOnScale(def, p);
    if (point.outside) return { outside: true, text: "off scale" };
    try {
        return { outside: false, text: formatValue(point.rt.value(point.p), def) };
    } catch {
        return { outside: false, text: "error" };
    }
}

function readings(def, p, library) {
    if (def.type === "syncroLogLog") {
        const point = positionOnScale(def, p);
        let positive = "off scale", negative = "off scale";
        if (!point.outside) {
            try {
                const value = point.rt.value(point.p);
                positive = formatValue(value, def);
                negative = formatValue(1 / value, def);
            } catch {
                positive = negative = "error";
            }
        }
        return { outside: point.outside, multi: true, texts: [`+: ${positive}`, `\u2212: ${negative}`] };
    }
    if (def.referenceOnly) {
        const point = positionOnScale(def, p);
        let nearest, distance = Infinity;
        for (const mark of def.ticks) {
            const delta = Math.abs(point.rt.pos(mark.value) - p);
            if (delta < distance) { nearest = mark; distance = delta; }
        }
        const text = nearest && !point.outside ? `Nearest: ${nearest.label} = ${nearest.mass}` : "off scale";
        return { outside: point.outside, texts: [text] };
    }
    if (Array.isArray(def.layers) && def.layers.length) {
        let outsideAny = false, insideCount = 0;
        const texts = [];
        for (const layer of def.layers) {
            const spec = typeof layer === "string" ? { scale: layer } : layer;
            const child = library[spec.scale];
            if (!child) { texts.push("missing"); continue; }
            const reading = singleReading(child, p);
            outsideAny ||= reading.outside;
            if (reading.outside && def.type === "segmented") continue;
            if (!reading.outside) insideCount++;
            texts.push(`${spec.caption || child.label || spec.scale}: ${reading.text}`);
        }
        return { outside: def.type === "segmented" ? insideCount === 0 : outsideAny,
            multi: true, texts: texts.length ? texts : ["off scale"] };
    }
    const reading = singleReading(def, p);
    return { outside: reading.outside, texts: [reading.text] };
}

function renderCard(id, def, p, library) {
    const value = readings(def, p, library);
    const label = def.compactLabel || def.label || id;
    const classes = ["readout-card", value.outside ? "outside" : "", def.referenceOnly ? "is-reference" : ""].filter(Boolean).join(" ");
    const text = value.multi
        ? value.texts.map(part => `<span>${escapeHtml(part)}</span>`).join("")
        : escapeHtml(value.texts[0]);
    return `<div class="${classes}" data-readout-scale="${escapeHtml(id)}"><span class="scale-id">${escapeHtml(label)}</span><div class="value${value.multi ? " multi" : ""}">${text}</div></div>`;
}

export function renderReadout(state, library) {
    return visibleSideKeys(state).map(key => {
        const side = state.sides[key];
        const groups = RAILS.map(rail => {
            const p = rail === "slide" ? state.cursor - state.slideOffset : state.cursor;
            const cards = side[rail].filter(id => library[id]).map(id => renderCard(id, library[id], p, library)).join("");
            if (!cards) return "";
            return `<section class="readout-rail" data-readout-rail="${rail}" aria-label="${railLabel(rail)}"><h4 class="rail-name">${railLabel(rail)}</h4><div class="readout-cards">${cards}</div></section>`;
        }).join("");
        const title = state.viewMode === "both" ? `<h3 class="readout-side-heading">${escapeHtml(side.name || key)}</h3>` : "";
        return `<div class="readout-face" data-readout-side="${escapeHtml(key)}">${title}${groups || '<div class="readout-empty">No scales on this side.</div>'}</div>`;
    }).join("");
}
