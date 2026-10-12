/** Descriptions identify values in context, never guess from a letter alone. */
export function markNumber(value) {
    return Number(value.toPrecision(13)).toString();
}
export function constantGauge(value, label, explanation) {
    return { value, label, title: `${label} = ${markNumber(value)}. ${explanation}` };
}
export function gaugeDescription(gauge) {
    return gauge.title || `${gauge.label || "Reference mark"}: scale value ${markNumber(gauge.value)}. User-defined reference mark.`;
}
export function anchorDescription(def, value) {
    return def.anchorTitle || `${def.anchor}: alignment index at scale value ${markNumber(value)}; not a universal constant.`;
}
export function foldedIndexDescription(def, value) {
    const fold = def.fold ?? Math.PI;
    const inverse = def.type === "foldedInverse";
    let meaning = "Folded logarithmic index";
    // A custom label may say anything: the explanation follows the calibration.
    if (Math.abs(fold - Math.PI) < 1e-14)
        meaning = inverse ? "10/pi, the decimal-normalised reciprocal pi index" : "Pi, the circumference-to-diameter ratio of a circle";
    else if (Math.abs(fold - Math.LN10) < 1e-14)
        meaning = inverse ? "10/ln(10), the decimal-normalised reciprocal natural-log index" : "1/M = ln(10), where M = log10(e) = 0.4342944819033; converts common and natural logarithms";
    return `${meaning}. Scale value ${markNumber(value)}. Both ends represent the same folded index.`;
}
