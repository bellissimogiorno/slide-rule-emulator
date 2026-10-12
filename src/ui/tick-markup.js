/** Escaped markup shared by ordinary, back-to-back and Syncro graduations. */
import { clamp } from "#core/numbers.js";
import { escapeHtml } from "#ui/html.js";
function markAttributes(t) {
    return t.title ? ` title="${escapeHtml(t.title)}" data-mark-tip="${escapeHtml(t.title)}"` : "";
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
    const title = markAttributes(t);
    const edge = edgeClassForPosition(pos);
    const priority = tickLabelPriority(kind, label, pos);
    return `<div${title} aria-hidden="true" data-pos="${pos.toFixed(7)}" data-kind="${escapeHtml(kind)}" class="tick ${escapeHtml(kind)}${ink}" style="left:${left.toFixed(5)}%"></div>${label ? `<div${title} class="tick-label${ink}${tiny}${gauge}${edge}${decoration}" data-pos="${pos.toFixed(7)}" data-priority="${priority}" data-kind="${escapeHtml(kind)}" data-label-text="${escapeHtml(label)}" style="left:${left.toFixed(5)}%">${escapeHtml(label)}</div>` : ""}`;
}
function renderSyncroTick(t) {
    const pos = clamp(t.pos, 0, 1);
    const left = pos * 100;
    const kind = t.kind || "minor";
    const title = markAttributes(t);
    const positive = t.positiveLabel == null ? "" : String(t.positiveLabel);
    const negative = t.negativeLabel == null ? "" : String(t.negativeLabel);
    const positiveTiny = positive.length > 6 ? " tiny" : "";
    const negativeTiny = negative.length > 6 ? " tiny" : "";
    const edge = edgeClassForPosition(pos);
    const priority = tickLabelPriority(kind, positive || negative, pos);
    return `<div${title} aria-hidden="true" data-pos="${pos.toFixed(7)}" data-kind="${escapeHtml(kind)}" class="syncro-tick ${escapeHtml(kind)}" style="left:${left.toFixed(5)}%"></div>${positive ? `<div${title} class="syncro-number positive${positiveTiny}${edge}" data-pos="${pos.toFixed(7)}" data-priority="${priority}" data-kind="${escapeHtml(kind)}" data-label-text="${escapeHtml(positive)}" style="left:${left.toFixed(5)}%">${escapeHtml(positive)}</div>` : ""}${negative ? `<div${title} class="syncro-number negative${negativeTiny}${edge}" data-pos="${pos.toFixed(7)}" data-priority="${priority}" data-kind="${escapeHtml(kind)}" data-label-text="${escapeHtml(negative)}" style="left:${left.toFixed(5)}%">${escapeHtml(negative)}</div>` : ""}`;
}
export { tickLabelPriority, edgeClassForPosition, renderTick, renderSyncroTick };
