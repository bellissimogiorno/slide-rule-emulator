/** Scale editor markup and accessible position labels. Reordering keeps these
 * same DOM rows alive, preserving focus and distinguishing repeated scale IDs.
 */
import { EDITOR_RAILS, adjacentScalePosition } from "#model/scale-order.js";
import { escapeHtml, railLabel, scaleSort } from "#ui/html.js";

// Filled arrows are reliably bold in every platform font; SVG is decorative.
const arrow = direction => `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="${direction === "up" ? "M8 1 1 8h4v7h6V8h4Z" : "m8 15 7-7h-4V1H5v7H1Z"}"/></svg>`;
const grip = '<svg viewBox="0 0 16 20" width="16" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 3h3v3H3zm7 0h3v3h-3zM3 9h3v3H3zm7 0h3v3h-3zM3 15h3v3H3zm7 0h3v3h-3z"/></svg>';

function renderRow(rail, id, index, library) {
    const options = Object.keys(library).sort(scaleSort).map(key => {
        const def = library[key];
        return `<option value="${escapeHtml(key)}"${key === id ? " selected" : ""}>${escapeHtml(`${key} - ${def.description || def.label || "scale"}`)}</option>`;
    }).join("");
    return `<div class="scale-control-row" data-rail="${rail}" data-index="${index}">
        <button type="button" class="scale-grip" aria-describedby="reorderHelp">${grip}</button>
        <select>${options}</select>
        <div class="scale-row-arrows">
            <button type="button" class="scale-arrow" data-action="up">${arrow("up")}</button>
            <button type="button" class="scale-arrow" data-action="down">${arrow("down")}</button>
        </div>
        <button type="button" title="Remove" data-action="remove" class="danger"><span aria-hidden="true">\u00d7</span></button>
    </div>`;
}

export function railEditorMarkup(side, library) {
    return EDITOR_RAILS.map(rail => `<section class="rail-editor" data-rail="${rail}" aria-label="${railLabel(rail)} scales">
        <div class="rail-editor-title"><span>${railLabel(rail)}</span><div class="rail-editor-actions">
            <button type="button" data-action="add" data-rail="${rail}">Add scale</button>
            <button type="button" class="scale-undo" data-action="undo" data-rail="${rail}" aria-controls="railEditors" disabled>
                <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false"><path d="M7 3 2 8l5 5M3 8h9a5 5 0 0 1 0 10h-2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Undo</span>
            </button>
        </div></div>
        <div class="rail-row-list" data-rail="${rail}">${side[rail].map((id, index) => renderRow(rail, id, index, library)).join("")}<div class="rail-empty hint">No scales. Add one or drag a scale here.</div></div>
    </section>`).join("");
}

/** Call after a committed move or a selected scale change, never mid-preview. */
export function refreshEditorPositions(root) {
    const lists = [...root.querySelectorAll(".rail-row-list")];
    const side = Object.fromEntries(lists.map(list => [list.dataset.rail,
        [...list.querySelectorAll("select")].map(select => select.value)]));
    for (const list of lists) {
        const rows = [...list.querySelectorAll(".scale-control-row")];
        rows.forEach((row, index) => {
            row.dataset.rail = list.dataset.rail;
            row.dataset.index = String(index);
            const select = row.querySelector("select");
            const name = `${select.value}, ${railLabel(list.dataset.rail)}, position ${index + 1} of ${rows.length}`;
            select.setAttribute("aria-label", `Scale at ${name}`);
            for (const [selector, label] of [[".scale-grip", `Move ${name}`], ['[data-action="up"]', `Move ${select.value} up`], ['[data-action="down"]', `Move ${select.value} down`], ['[data-action="remove"]', `Remove ${name}`]]) {
                const button = row.querySelector(selector);
                button.setAttribute("aria-label", label);
                button.title = selector === ".scale-grip" ? `${label}. Drag, or use arrow keys when focused.` : label;
            }
            for (const [action, direction] of [["up", -1], ["down", 1]]) {
                const button = row.querySelector(`[data-action="${action}"]`);
                const destination = adjacentScalePosition(side, { rail: list.dataset.rail, index }, direction);
                const crossing = destination && destination.rail !== list.dataset.rail;
                const full = crossing && side[destination.rail].length >= 40;
                button.disabled = !destination || full;
                const label = full ? `${railLabel(destination.rail)} already has 40 scales`
                    : crossing ? `Move ${select.value} ${action} to ${railLabel(destination.rail)}`
                    : `Move ${select.value} ${action}`;
                button.setAttribute("aria-label", label);
                button.title = label;
            }
        });
    }
}
