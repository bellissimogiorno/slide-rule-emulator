/** Digital readings use the same mappings and precision as the instrument.
 * Rail headings are shared; compact inline cards never hide or truncate values.
 */
import { cursorScaleReadings } from '#ui/readout-values.js';
import { marksForScale } from '#ui/cursor-marks.js';
import { escapeHtml, railLabel } from "#ui/html.js";
import { visibleSideKeys } from "#model/view.js";
import { cursorAppearanceSide } from '#model/cursor-appearance.js';

const RAILS = ["topStator", "slide", "bottomStator"];

function renderCard(id, def, p, library, marks, cursorPosition, fullPrecision) {
    const value = cursorScaleReadings(def, p, library, marks, cursorPosition, fullPrecision);
    const label = def.compactLabel || def.label || id;
    const classes = ["readout-card", value.outside ? "outside" : "", def.referenceOnly ? "is-reference" : ""].filter(Boolean).join(" ");
    const text = value.multi
        ? value.texts.map(part => `<span>${escapeHtml(part)}</span>`).join("")
        : escapeHtml(value.texts[0]);
    return `<div class="${classes}" data-readout-scale="${escapeHtml(id)}"><span class="scale-id">${escapeHtml(label)}</span><div class="value${value.multi ? " multi" : ""}">${text}</div></div>`;
}

export function renderReadout(state, library) {
    return visibleSideKeys(state).map(key => {
        const side = cursorAppearanceSide(state.sides[key], state);
        const groups = RAILS.map(rail => {
            const p = rail === "slide" ? state.cursor - state.slideOffset : state.cursor;
            const cards = side[rail].filter(id => library[id]).map(id =>
                renderCard(id, library[id], p, library, marksForScale(side, id), state.cursor, state.fullPrecision)).join("");
            if (!cards) return "";
            return `<section class="readout-rail" data-readout-rail="${rail}" aria-label="${railLabel(rail)}"><h4 class="rail-name">${railLabel(rail)}</h4><div class="readout-cards">${cards}</div></section>`;
        }).join("");
        const title = state.viewMode === "both" ? `<h3 class="readout-side-heading">${escapeHtml(side.name || key)}</h3>` : "";
        return `<div class="readout-face" data-readout-side="${escapeHtml(key)}">${title}${groups || '<div class="readout-empty">No scales on this side.</div>'}</div>`;
    }).join("");
}
