/** Pickett's folded root engraving, not reciprocal Syncro log-log engraving.
 *
 * Consecutive branch pairs face away from one shared spine per pair. An odd
 * branch count starts with one unruled upper branch: the historical cube-root
 * arrangement extends naturally to the five-branch laboratory bank. A branch's round-number ticks keep their own exact positions:
 * e.g. R1=2 and R2=6.32 must NOT be snapped together. See docs/PICKETT_ROOTS.md.
 */
import { makeRuntimeScale } from "#core/mappings.js";
import { generateTicks } from "#core/ticks/index.js";
import { escapeHtml } from "#ui/html.js";
import { renderTick } from "#ui/tick-markup.js";

function rootLayers(definition, library) {
    return definition.layers.map((layer, index) => {
        const spec = typeof layer === "string" ? { scale: layer } : layer;
        const child = library[spec.scale];
        return {
            child, index, id: spec.scale,
            caption: spec.caption || child.label || spec.scale,
            // All original root branches increase to the right and use black
            // ink. A later branch is not a reciprocal: never default it to red.
            tone: spec.tone || definition.tone || "neutral"
        };
    });
}

/** One unruled branch for odd orders, followed by adjacent back-to-back pairs.
 * Use the same partition for the graduations and both end gutters.
 */
function renderBands(layers, renderBranch, spines = false) {
    const offset = layers.length % 2;
    let html = offset ? `<div class="root-single">${renderBranch(layers[0], "upper")}</div>` : "";
    for (let i = offset; i < layers.length; i += 2) {
        const index = (i - offset) / 2;
        const position = index ? ` style="--root-pair-index:${index}"` : "";
        html += `<div class="root-pair"${position}>${spines ? '<div class="root-spine" aria-hidden="true"></div>' : ''}${renderBranch(layers[i], "upper")}${renderBranch(layers[i + 1], "lower")}</div>`;
    }
    return html;
}

/** One translated parent keeps ticks, spine and all branches together on a slide. */
export function renderRootStackPane(definition, library, { width, minGap, moverClass, tickOptions = {} }) {
    const layers = rootLayers(definition, library);
    const branch = (layer, placement) => {
        const ticks = generateTicks(layer.child, makeRuntimeScale(layer.child), width, minGap, tickOptions);
        return `<div class="root-branch root-${placement} ink-${escapeHtml(layer.tone)}" data-root-branch="${layer.index}" data-root-scale="${escapeHtml(layer.id)}">${ticks.map(renderTick).join("")}</div>`;
    };
    return `<div class="tick-pane"><div class="${moverClass} root-stack-track">${renderBands(layers, branch, true)}</div></div>`;
}

/** Names and branch-selection hints occupy the same vertical bands as numerals. */
export function renderRootStackGutter(definition, library, legend) {
    const layers = rootLayers(definition, library);
    const label = (layer, placement) => {
        const digits = layers.length === 2
            ? (layer.index === 0 ? "Odd digits" : "Even digits")
            : `${layer.index + 1}, ${layer.index + 1 + layers.length}, ${layer.index + 1 + 2 * layers.length} digits`;
        const text = legend ? digits : layer.caption;
        const title = legend ? "For positive integers. For all positive values use the exponent-residue rule in the root-scale guide." : layer.child.description;
        return `<span class="root-gutter-label root-${placement} ink-${escapeHtml(layer.tone)}" title="${escapeHtml(title || text)}">${escapeHtml(text)}</span>`;
    };
    return `<div class="root-stack-gutter">${renderBands(layers, label)}</div>`;
}
