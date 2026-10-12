/** Pickett Model 14: main index-to-index mathematical scales.
 * Sources, supplementary angles and omitted overhangs: docs/PICKETT_14.md.
 * No ballistic tables, projectile models or weapon-specific corrections.
 */
import { constantGauge } from "#core/mark-descriptions.js";
const FAMILY = "Pickett 14";
const DEG = Math.PI / 180;
const MIL = Math.PI / 3200; // 6400 mils per turn; not milliradians.
const R = 180 / Math.PI;
const standard = [
    constantGauge(Math.PI, "\u03c0", "Pi, the circumference-to-diameter ratio of a circle."),
    constantGauge(Math.E, "e", "Euler's number, the base of natural logarithms."),
    { value: R / 10, label: "R", title: "R = 180/pi = 57.29577951308 degrees per radian. Decimal-normalised C/D mark: 5.729577951308; R itself is ten times that scale value." }
];
function logarithmic(id, label, min, max, description, gauges = []) {
    return { id, label, type: "log", min, max, tickMode: "log", tone: "neutral", family: FAMILY, description, gauges };
}
function angle(id, label, unit, fn, factor, min, max, majorStep, pairedSum) {
    const radians = unit === "mil" ? "PI/3200" : "PI/180";
    const toUnits = unit === "mil" ? "3200/PI" : "180/PI";
    const forward = fn === "linear" ? `x*(${radians})` : `${fn}(x*(${radians}))`;
    const inverse = fn === "linear" ? `10^p/${factor}` : `a${fn}(min(1,10^p/${factor}))`;
    // Only sine has a unit-domain clamp. A tangent inverse can exceed one.
    const value = fn === "tan" ? `atan(10^p/${factor})*${toUnits}` : `(${inverse})*${toUnits}`;
    const rad = unit === "mil" ? MIL : DEG;
    const f = x => fn === "sin" ? Math.sin(x * rad) : fn === "tan" ? Math.tan(x * rad) : x * rad;
    const ticks = [];
    const addRegion = (lo, hi, step) => {
        for (let i = Math.ceil(lo / step); i * step <= hi; i++) {
            const v = Number((i * step).toPrecision(12));
            if (v > min && v < max && !ticks.some(tick => tick.value === v))
                ticks.push({ value: v, label: String(v), kind: "major" });
        }
    };
    addRegion(min, max, majorStep);
    if (unit === "mil") {
        addRegion(10, 20, 1); addRegion(20, 100, 5);
        addRegion(100, 200, 10); addRegion(200, 400, 20);
    } else {
        addRegion(1, 20, 1); addRegion(20, 40, 2);
    }
    ticks.push({ value: min, label: Number(min.toPrecision(5)).toString(), kind: "index" },
        { value: max, label: Number(max.toPrecision(5)).toString(), kind: "index" });
    const def = { id, label, unit, family: FAMILY, tone: "neutral", type: "expression", min, max,
        pos: `log10(${factor}*(${forward}))`, value, tickMode: "mapped", ticks, refineTicks: true,
        pMin: Math.max(0, Math.log10(factor * f(min))), pMax: Math.min(1, Math.log10(factor * f(max))),
        formula: fn === "linear" ? "small angle" : `${fn} angle`,
        description: `Pickett 14 ${label}: ${unit === "mil" ? "6400-mil" : "degree"} angle graduation. Main calibrated interval; original end extensions are not reproduced.` };
    if (pairedSum !== undefined) {
        def.pairedSum = pairedSum;
        def.description += ` Black/red angle readings sum to ${pairedSum} ${unit} and share each tick.`;
    }
    return def;
}
export const pickett14Scales = {
    P14_A: logarithmic("P14_A", "A", 1, 100, "Pickett 14 two-decade square scale."),
    P14_B: logarithmic("P14_B", "B", 1, 100, "Pickett 14 sliding two-decade square scale.", [
        constantGauge(Math.PI, "\u03c0", "Pi, the circumference-to-diameter ratio of a circle."),
        { value: 25 * Math.PI, label: ".785", title: ".785 denotes pi/4 = 0.7853981633974, the circle-area factor: area = (pi/4) times diameter squared. This two-decade scale carries its equivalent mark at 78.53981633974." }
    ]),
    P14_C: logarithmic("P14_C", "C", 1, 10, "Pickett 14 sliding arithmetic scale.", standard),
    P14_D: logarithmic("P14_D", "D", 1, 10, "Pickett 14 fixed arithmetic scale.", standard),
    P14_T: angle("P14_T", "T", "\u00b0", "tan", 10, Math.atan(.1) / DEG, 45, 5, 90),
    P14_S: angle("P14_S", "S", "\u00b0", "sin", 10, Math.asin(.1) / DEG, 90, 5, 90),
    P14_ST: { ...angle("P14_ST", "ST", "\u00b0", "linear", 100, .01 / DEG, .1 / DEG, .5),
        gauges: [
            { value: 60 * R * R / 1e5, label: "\u2032", title: "Arcminute conversion index: 1 arcminute = pi/10800 = 0.0002908882086657 radians. The ST graduation is at 1.969683810007 degrees, not at 1 arcminute." },
            { value: 3600 * R * R / 1e7, label: "\u2033", title: "Arcsecond conversion index: 1 arcsecond = pi/648000 = 0.000004848136811095 radians. The ST graduation is at 1.181810286004 degrees, not at 1 arcsecond." }
        ], description: "Pickett 14 small-angle radian approximation, with minute and second conversion indices. Not an exact sine or tangent away from zero." },
    P14_OPP_DEG: angle("P14_OPP_DEG", "Opp. deg", "\u00b0", "sin", 2, 30, 90, 5, 180),
    P14_OPP_MIL: angle("P14_OPP_MIL", "Opp. mil", "mil", "sin", 2, 6400 / 12, 1600, 100, 3200),
    P14_APEX_MIL: angle("P14_APEX_MIL", "Apex mil", "mil", "sin", 20, Math.asin(.05) / MIL, 6400 / 12, 50),
    P14_APEX_DEG: angle("P14_APEX_DEG", "Apex deg", "\u00b0", "sin", 20, Math.asin(.05) / DEG, 30, 2),
    P14_T_MIL: angle("P14_T_MIL", "TAN", "mil", "tan", 10, Math.atan(.1) / MIL, 800, 100, 1600),
    P14_ST_MIL: angle("P14_ST_MIL", "SIN-TAN", "mil", "linear", 100, .01 / MIL, .1 / MIL, 10),
    P14_S_MIL: angle("P14_S_MIL", "SIN", "mil", "sin", 10, Math.asin(.1) / MIL, 1600, 100, 1600),
    P14_BASE: logarithmic("P14_BASE", "Base C", 100, 1000, "Pickett 14 C-labelled arithmetic decade: 100 to 1000. Decimal places are explicit."),
    P14_DISTANCE: { ...logarithmic("P14_DISTANCE", "Distance D", 1000, 10000, "Pickett 14 D-labelled arithmetic decade: 1000 to 10000. Decimal places are explicit."), compactLabel: "Dist. D" }
};
