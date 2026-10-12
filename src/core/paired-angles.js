/** Two angle readings at one graduation: complementary or supplementary.
 * Unlike a reciprocal log-log pair, the second reading is sum - angle.
 */
import { formatSig } from "#core/format.js";
import { formatSexagesimal } from "#core/sexagesimal.js";
export function pairedAngleTicks(ticks, def) {
    const caption = value => def.angleNotation === "sexagesimal" ? formatSexagesimal(value) : formatSig(value, 5);
    return ticks.map(tick => ({ ...tick,
        positiveLabel: tick.label ? (def.angleNotation === "sexagesimal" && tick.kind !== "gauge" ? caption(tick.value) : tick.label) : "",
        negativeLabel: tick.label ? caption(def.pairedSum - tick.value) : ""
    }));
}
