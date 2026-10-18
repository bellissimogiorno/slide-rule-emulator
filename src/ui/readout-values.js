/** Pure numerical reading selection, shared by HTML export and live updates. */
import { formatValue, formatUseful } from '#core/format.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { clamp } from '#core/numbers.js';

/** Locate the visible copy of a point on the moving slide. The repeated image
 * has the length of the complete track, even when a scale occupies only part
 * of it. Keep the original endpoints distinct: the unshifted right index of
 * C still reads 10, not 1. Retain the same boundary tolerance as scale readings.
 */
export function wrapSlidePosition(p) {
    if (p >= -1e-10 && p <= 1 + 1e-10) return p;
    return p - Math.floor(p);
}

function positionOnScale(def, p) {
    const rt = makeRuntimeScale(def);
    const min = Number.isFinite(rt.pMin) ? rt.pMin : 0;
    const max = Number.isFinite(rt.pMax) ? rt.pMax : 1;
    return { rt, outside: p < min - 1e-10 || p > max + 1e-10, p: clamp(p, min, max) };
}

function singleReading(def, p, fullPrecision) {
    const point = positionOnScale(def, p);
    if (point.outside) return { outside: true, text: "off scale" };
    try {
        return { outside: false, text: formatValue(point.rt.value(point.p), def, fullPrecision) };
    } catch {
        return { outside: false, text: "error" };
    }
}

export function scaleReadings(def, p, library, fullPrecision = false) {
    if (def.type === "syncroLogLog" || def.pairedSum !== undefined || def.pairedProduct !== undefined) {
        const point = positionOnScale(def, p);
        let positive = "off scale", negative = "off scale";
        if (!point.outside) {
            try {
                const value = point.rt.value(point.p);
                positive = formatValue(value, def, fullPrecision);
                negative = formatValue(def.pairedSum === undefined ? (def.pairedProduct ?? 1) / value : def.pairedSum - value, def, fullPrecision);
            } catch {
                positive = negative = "error";
            }
        }
        if (def.pairedProduct !== undefined) {
            return { outside: point.outside, multi: true,
                texts: [`${def.positiveCaption || "Primary"}: ${positive}`, `${def.negativeCaption || "Secondary"}: ${negative}`] };
        }
        return { outside: point.outside, multi: true, texts: def.pairedSum === undefined ? [`+: ${positive}`, `\u2212: ${negative}`] : [`Black: ${positive}`, `Red: ${negative}`] };
    }
    if (def.referenceOnly) {
        const point = positionOnScale(def, p);
        let nearest, distance = Infinity;
        for (const mark of def.ticks) {
            const delta = Math.abs(point.rt.pos(mark.value) - p);
            if (delta < distance) { nearest = mark; distance = delta; }
        }
        const text = nearest && !point.outside ? `Nearest: ${nearest.label} = ${fullPrecision ? nearest.mass : formatUseful(nearest.mass)}` : "off scale";
        return { outside: point.outside, texts: [text] };
    }
    if (Array.isArray(def.layers) && def.layers.length) {
        let outsideAny = false, insideCount = 0;
        const texts = [];
        for (const layer of def.layers) {
            const spec = typeof layer === "string" ? { scale: layer } : layer;
            const child = library[spec.scale];
            if (!child) { texts.push("missing"); continue; }
            const reading = singleReading(child, p, fullPrecision);
            outsideAny ||= reading.outside;
            if (reading.outside && def.type === "segmented") continue;
            if (!reading.outside) insideCount++;
            texts.push(`${spec.caption || child.label || spec.scale}: ${reading.text}`);
        }
        return { outside: def.type === "segmented" ? insideCount === 0 : outsideAny,
            multi: true, texts: texts.length ? texts : ["off scale"] };
    }
    const reading = singleReading(def, p, fullPrecision);
    return { outside: reading.outside, texts: [reading.text] };
}

/** Report exactly the same coordinates as the painted cursor marks. Physical
 * off-track marks remain off scale even when a translated slide would supply
 * a mathematical value beyond the visible window. Never clamp an offset. */
export function cursorScaleReadings(def, p, library, marks = [], cursorPosition = p, fullPrecision = false, wraparound = false) {
    const read = position => scaleReadings(def, wraparound ? wrapSlidePosition(position) : position, library, fullPrecision);
    const main = read(p);
    if (!marks.length) return main;
    const readings = [{ label: 'Main', result: main }, ...marks.map(mark => {
        const physical = cursorPosition + mark.offset;
        const result = physical < -1e-10 || physical > 1 + 1e-10
            ? { outside: true, texts: ['off scale'] }
            : read(p + mark.offset);
        return { label: mark.label, result };
    })];
    return { outside: readings.every(({ result }) => result.outside), multi: true,
        texts: readings.flatMap(({ label, result }) => result.texts.map(text => `${label}: ${text}`)) };
}

