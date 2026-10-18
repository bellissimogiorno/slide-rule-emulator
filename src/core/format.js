import { formatSexagesimal } from '#core/sexagesimal.js';
// Precision is a presentation policy: never use these strings as coordinates.
const USEFUL_DIGITS = 4;
function usesUnityPrecision(def = {}) {
    return ['loglog', 'loglog10', 'syncroLogLog', 'hypotenuseLow', 'hypotenuseHigh'].includes(def.type)
        || (def.type === 'expression' && Number.isFinite(def.decade))
        || def.precisionOrigin === 1;
}
function formatUseful(value, def = {}) {
    if (!Number.isFinite(value)) return value > 0 ? '∞' : '--';
    if (value === 0) return '0';
    // Only the shared leading 1 ABOVE unity is excluded from the budget.
    // Below unity the 9s are ordinary significant digits: exp(-.01) rounds
    // directly to .9900, displayed as .99, not from the old caption .99005.
    const excess = value - 1;
    if (usesUnityPrecision(def) && excess > 0 && excess < 1) {
        const decimals = Math.max(0, USEFUL_DIGITS - 1 - Math.floor(Math.log10(excess)));
        return trimZeros(value.toFixed(Math.min(100, decimals)));
    }
    // Convert through Number to remove insignificant zeros in exponential form.
    const rounded = Number(value.toPrecision(USEFUL_DIGITS));
    return Math.abs(rounded) >= 0.001 && Math.abs(rounded) < 100000
        ? String(rounded) : formatSig(Number.isFinite(rounded) ? rounded : value, USEFUL_DIGITS);
}
/** Units-free extended format shared by numerical captions and readouts. */
function formatDetailed(value, def = {}) {
    let base = formatSig(value, 6);
    const distance = Math.abs(value - 1);
    // Extended precision must not hide a near-one difference, on either side
    // of unity. Above unity it must also be at least as precise as useful mode.
    if (usesUnityPrecision(def) && distance > 0 && distance < 1 &&
        (Number(base) === 1 || Math.abs(Number(formatUseful(value, def)) - value) < Math.abs(Number(base) - value))) {
        const decimals = Math.max(0, 5 - Math.floor(Math.log10(distance)));
        base = trimZeros(value.toFixed(Math.min(16, decimals)));
    }
    return base;
}
function formatValue(value, def, fullPrecision = false) {
    if (!Number.isFinite(value))
        return value > 0 ? "∞" : "--";
    if (def.angleNotation === "sexagesimal") return formatSexagesimal(fullPrecision ? value : Number(formatUseful(value)));
    if (def.unit === "°" || def.type === "sin" || def.type === "cos" || def.type === "tan" || def.type === "tan2" || def.type === "smallAngle") {
        return `${fullPrecision ? formatSig(value, 5) : formatUseful(value, def)}°`;
    }
    const base = fullPrecision ? formatDetailed(value, def) : formatUseful(value, def);
    if (def.unit)
        return `${base} ${def.unit}`;
    return base;
}
/** Apply display precision to numerical captions, leaving inscriptions and
 * geometry intact. A caption is considered a rounded spelling of its raw
 * value only when the value falls within its decimal rounding interval.
 * This recovers the underlying number before rounding, including conventional
 * three-figure engravings and generated paired captions on manual scales.
 */
function formatTickPrecision(ticks, def, fullPrecision = false) {
    const number = /^[+\-−]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+\-]?\d+)?$/i;
    const representsValue = (text, printed, value) => {
        if (!Number.isFinite(value)) return false;
        if (printed === value) return true;
        const difference = Math.abs(value - printed);
        const magnitude = Math.max(Math.abs(value), Math.abs(printed));
        // Existing generated captions contain at least three significant
        // figures. This bound rejects different units or decimal-normalised
        // inscriptions even when their last printed digit has a large unit.
        if (difference > magnitude * 0.0051) return false;
        const [mantissa, exponent = '0'] = text.toLowerCase().split('e');
        const decimals = (mantissa.split('.')[1] || '').length;
        const quantum = 10 ** (Number(exponent) - decimals);
        // Allow the small floating-point noise introduced by inverse mappings.
        return difference <= quantum / 2 + magnitude * Number.EPSILON * 8;
    };
    const caption = (label, value, kind) => {
        if (label == null || label === '') return label;
        const text = String(label);
        if (!number.test(text)) return text;
        const normalized = text.replace('−', '-');
        const printed = Number(normalized);
        // Gauge labels are authored inscriptions, sometimes in a deliberately
        // different decade (e.g. '.785' at 78.5398 on Pickett's B scale).
        const raw = kind !== 'gauge' && representsValue(normalized, printed, value);
        // Decimal lattice values can acquire a few ulps through inverse
        // mappings (e.g. -173.15 -> -173.14999999999998). Retain the
        // authored decimal in that case, rather than flip a rounding tie.
        // A distinct near-one value must still retain its useful excess.
        const noiseOnly = raw && Math.abs(value - printed) <= Math.max(Math.abs(value), Math.abs(printed)) * Number.EPSILON * 8
            && !(usesUnityPrecision(def) && printed === 1 && value !== 1);
        const source = raw && !noiseOnly ? value : printed;
        const useful = formatUseful(source, def);
        if (!fullPrecision) return useful;
        // Historical engravings can have fewer digits than the new default.
        // An explicit extended view must never make such a caption less
        // accurate. Preserve existing detail whenever it is already adequate.
        if (raw && Math.abs(Number(useful) - value) < Math.abs(printed - value))
            return formatDetailed(value, def);
        return text;
    };
    return ticks.map(tick => {
        const result = { ...tick };
        if ('label' in tick) result.label = caption(tick.label, tick.value, tick.kind);
        if ('positiveLabel' in tick) result.positiveLabel = caption(tick.positiveLabel, tick.value, tick.kind);
        if ('negativeLabel' in tick) result.negativeLabel = caption(tick.negativeLabel,
            def.pairedSum !== undefined ? def.pairedSum - tick.value : (def.pairedProduct ?? 1) / tick.value,
            tick.kind);
        // DMS is a numerical notation too. Preserve its detailed engraving in
        // extended mode; the default rounds decimal degrees before conversion.
        if (!fullPrecision && def.angleNotation === 'sexagesimal' && tick.kind !== 'gauge') {
            if (tick.positiveLabel) result.positiveLabel = formatSexagesimal(Number(formatUseful(tick.value)));
            if (tick.negativeLabel) result.negativeLabel = formatSexagesimal(Number(formatUseful(def.pairedSum - tick.value)));
        }
        return result;
    });
}
function formatSig(x, sig) {
    if (x === 0)
        return "0";
    const ax = Math.abs(x);
    if (ax >= 100000 || ax < 0.001) {
        const [mantissa, exponent] = x.toExponential(sig - 1).split("e");
        return trimZeros(mantissa) + "e" + Number(exponent);
    }
    return trimZeros(Number(x).toPrecision(sig));
}
function formatCompact(x) {
    if (!Number.isFinite(x))
        return "";
    return formatSig(x, Math.abs(x) >= 10000 ? 3 : 5);
}
function formatLinearLabel(v, min, max, step) {
    if (Number.isFinite(step) && step > 0)
        return formatForStep(v, step);
    const span = Math.abs(max - min);
    if (span <= 1.5)
        return trimZeros(v.toFixed(1));
    if (span <= 20)
        return trimZeros(v.toFixed(0));
    return formatCompact(v);
}
function formatForStep(value, step) {
    const decimals = decimalPlacesForStep(step);
    if (Math.abs(value) >= 100000 || (Math.abs(value) > 0 && Math.abs(value) < 0.0001))
        return formatSig(value, 5);
    return trimZeros(value.toFixed(decimals));
}
function decimalPlacesForStep(step) {
    let scaled = Math.abs(step);
    let decimals = 0;
    while (decimals < 7 && Math.abs(scaled - Math.round(scaled)) > 1e-8) {
        scaled *= 10;
        decimals++;
    }
    return decimals;
}
function smartRound(x) {
    if (!Number.isFinite(x) || x === 0)
        return x;
    // Fixed decimal places erase small, perfectly representable log labels.
    if (Math.abs(x) < 1e-7)
        return Number(x.toPrecision(9));
    const digits = Math.max(0, 8 - Math.floor(Math.log10(Math.abs(x))));
    return Number(x.toFixed(Math.min(10, digits)));
}
function trimZeros(s) {
    return String(s).replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, " ").trim();
}
function formatRootLabel(value, step) {
    const decimals = Math.max(0, -Math.floor(Math.log10(step)) + (step < 0.2 ? 1 : 0));
    return trimZeros(value.toFixed(Math.min(4, decimals)));
}
function formatLogLogLabel(value, decade) {
    if (!Number.isFinite(value))
        return "--";
    if (value >= 100000 || value < 0.0001)
        return formatSig(value, 3);
    const sig = decade <= -2 ? 6 : 5;
    return formatSig(value, sig);
}
function logLogEngraving(value, decade, endpoint = false) {
    if (!Number.isFinite(value))
        return "--";
    // An exact endpoint must not be captioned as a neighbouring graduation.
    // Each decade nearer one needs another digit because ln(value) shrinks.
    if (endpoint && decade < 0)
        return formatSig(value, 6 - Math.floor(decade));
    const magnitude = Math.abs(value);
    /* Classic rules favour a short engraving over calculator-style output.
       Retain the extra digit near unity on the fine LL ranges, but cap the
       wide LL ranges at four significant figures. */
    if (decade <= -3)
        return formatSig(value, Math.max(5, 2 - Math.floor(decade)));
    if (decade <= -1)
        return formatSig(value, 4);
    if (magnitude >= 10000 || (magnitude > 0 && magnitude < 0.0001)) {
        return formatSig(value, 3);
    }
    return formatSig(value, 4);
}
export { formatValue, formatUseful, formatTickPrecision, formatSig, formatCompact, formatLinearLabel, formatForStep, decimalPlacesForStep, smartRound, trimZeros, formatRootLabel, formatLogLogLabel, logLogEngraving };
