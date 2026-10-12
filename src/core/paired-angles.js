/** Two angle readings at one graduation: complementary or supplementary.
 * Unlike a reciprocal log-log pair, the second reading is sum - angle.
 */
import { formatSig } from "#core/format.js";
export function pairedAngleTicks(ticks, def) {
    return ticks.map(tick => ({ ...tick,
        positiveLabel: tick.label || "",
        negativeLabel: tick.label ? formatSig(def.pairedSum - tick.value, 5) : ""
    }));
}
