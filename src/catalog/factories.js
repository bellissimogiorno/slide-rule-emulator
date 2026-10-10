function makePowerScale(id, label, power, description, family = "Powers and roots") {
    return {
        id,
        label,
        type: "log",
        min: 1,
        max: Math.pow(10, power),
        power,
        tickMode: "log",
        formula: `x${power === 2 ? "²" : power === 3 ? "³" : `^${power}`}`,
        description,
        family
    };
}
function makeRootScale(id, label, order, branch, description, options = {}) {
    return Object.assign({
        id,
        label,
        type: "root",
        order,
        branch,
        min: Math.pow(10, branch / order),
        max: Math.pow(10, (branch + 1) / order),
        tickMode: "root",
        formula: `${order === 2 ? "√" : order === 3 ? "∛" : `${order}√`}x · branch ${branch + 1}`,
        description,
        family: "Powers and roots",
        tone: "blue"
    }, options);
}
function makeLogLogScale(id, label, decade, sign, description) {
    return {
        id,
        label,
        type: "loglog",
        decade,
        sign,
        min: Math.exp(sign * Math.pow(10, decade)),
        max: Math.exp(sign * Math.pow(10, decade + 1)),
        tickMode: "loglog",
        formula: sign > 0 ? "eˣ" : "e⁻ˣ",
        tone: sign > 0 ? "neutral" : "red",
        description,
        family: sign > 0 ? "Log-log, values above 1" : "Log-log, values below 1"
    };
}
function makePickettLogLogScale(id, label, decade, sign, description) {
    return {
        id,
        label,
        type: "loglog10",
        decade,
        sign,
        min: Math.pow(10, sign * Math.pow(10, decade)),
        max: Math.pow(10, sign * Math.pow(10, decade + 1)),
        tickMode: "loglog10",
        formula: sign > 0 ? "10ˣ" : "10⁻ˣ",
        tone: sign > 0 ? "neutral" : "red",
        description,
        family: "Pickett dual-base log-log"
    };
}
function makeSyncroLogLogScale(id, label, decade, logBase, description, options = {}) {
    const base = String(logBase).toLowerCase() === "e" ? Math.E : 10;
    const startExponent = Math.pow(10, decade);
    const endExponent = Math.pow(10, decade + 1);
    const baseGlyph = base === Math.E ? "e" : "10";
    return Object.assign({
        id,
        label,
        type: "syncroLogLog",
        decade,
        logBase: base === Math.E ? "e" : "10",
        min: Math.pow(base, startExponent),
        max: Math.pow(base, endExponent),
        tickMode: "syncroLogLog",
        formula: `${baseGlyph}±${formatExponentFactor(startExponent)}D`,
        positiveCaption: `+${formatExponentFactor(startExponent)}D`,
        negativeCaption: `−${formatExponentFactor(startExponent)}D`,
        description,
        family: "Pickett combined / Syncro log-log"
    }, options);
}
function formatExponentFactor(value) {
    if (value === 1)
        return "";
    if (value >= 0.1)
        return String(value).replace(/^0/, "");
    return value.toFixed(Math.max(0, -Math.floor(Math.log10(value)))).replace(/^0/, "");
}
function makeFoldedScale(id, label, inverse, description, fold = Math.PI, foldLabel = "π") {
    return {
        id,
        label,
        type: inverse ? "foldedInverse" : "foldedLog",
        fold,
        foldLabel,
        min: 1,
        max: 10,
        tickMode: "folded",
        formula: inverse ? `1/(${foldLabel}x)` : `${foldLabel}x`,
        tone: inverse ? "red" : "green",
        description,
        family: "Folded and reciprocal"
    };
}
function makeCompositeScale(id, label, layers, description, options = {}) {
    return Object.assign({
        id,
        label,
        type: "composite",
        layers,
        description,
        family: "Combined / double indexed"
    }, options);
}
function makeTempDerived(id, label, relation, coeff, power, unit, description) {
    return {
        id,
        label,
        type: "tempDerived",
        relation,
        coeff,
        power,
        minTemperature: 100,
        maxTemperature: 10000,
        tickMode: "tempDerived",
        unit,
        description,
        family: "Blackbody radiation"
    };
}
export { makePowerScale, makeRootScale, makeLogLogScale, makePickettLogLogScale, makeSyncroLogLogScale, formatExponentFactor, makeFoldedScale, makeCompositeScale, makeTempDerived };
