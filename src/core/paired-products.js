/** Two positive readings whose product is fixed. A product of one gives
 * exact reciprocals, not the decade-scaled readings on a reversed 1..10^n row.
 * Secondary captions are calculated from the full value, never its engraving.
 */
import { formatSig } from "#core/format.js";
export function pairedProductTicks(ticks, def) {
    return ticks.map(tick => ({ ...tick,
        positiveLabel: tick.label || "",
        negativeLabel: tick.label ? formatSig(def.pairedProduct / tick.value, 5) : ""
    }));
}
