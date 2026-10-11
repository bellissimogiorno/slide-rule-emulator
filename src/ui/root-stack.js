/** Pickett's folded root engraving, not reciprocal Syncro log-log engraving.
 *
 * The last two branches face away from ONE shared spine. For cube roots the
 * first branch sits above them without a horizontal baseline, as on the N3/N4
 * specimens. A branch's round-number ticks keep their own exact positions:
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

/** One translated parent keeps ticks, spine and all branches together on a slide. */
export function renderRootStackPane(definition, library, { width, minGap, moverClass }) {
    const layers = rootLayers(definition, library);
    const branch = (layer, placement) => {
        const ticks = generateTicks(layer.child, makeRuntimeScale(layer.child), width, minGap);
        return `<div class="root-branch root-${placement} ink-${escapeHtml(layer.tone)}" data-root-branch="${layer.index}" data-root-scale="${escapeHtml(layer.id)}">${ticks.map(renderTick).join("")}</div>`;
    };
    const single = layers.length === 3
        ? `<div class="root-single">${branch(layers[0], "upper")}</div>` : "";
    const pair = layers.slice(-2);
    return `<div class="tick-pane"><div class="${moverClass} root-stack-track">${single}<div class="root-pair"><div class="root-spine" aria-hidden="true"></div>${branch(pair[0], "upper")}${branch(pair[1], "lower")}</div></div></div>`;
}

/** Names and branch-selection hints occupy the same vertical bands as numerals. */
export function renderRootStackGutter(definition, library, legend) {
    const layers = rootLayers(definition, library);
    const label = (layer, placement) => {
        const digits = layers.length === 2
            ? (layer.index === 0 ? "Odd digits" : "Even digits")
            : `${layer.index + 1}, ${layer.index + 4}, ${layer.index + 7} digits`;
        const text = legend ? digits : layer.caption;
        const title = legend ? "For positive integers. For all positive values use the exponent-residue rule in the root-scale guide." : layer.child.description;
        return `<span class="root-gutter-label root-${placement} ink-${escapeHtml(layer.tone)}" title="${escapeHtml(title || text)}">${escapeHtml(text)}</span>`;
    };
    const single = layers.length === 3
        ? `<div class="root-single">${label(layers[0], "upper")}</div>` : "";
    const pair = layers.slice(-2);
    return `<div class="root-stack-gutter">${single}<div class="root-pair">${label(pair[0], "upper")}${label(pair[1], "lower")}</div></div>`;
}
