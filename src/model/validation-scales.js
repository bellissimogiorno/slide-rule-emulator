/** Custom-scale fields, sampled mathematical checks and layout references.
 * Field and runtime checks run before the scale enters the programme library;
 * cross-scale checks run afterwards, once overrides have all been installed.
 * The check order is intentional: callers retain the first validation error.
 */
import { gasTemperatureRange, WATER_CRITICAL_K } from '#core/chemistry.js';
import { MathExpressions } from '#core/expressions.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { SCALE_TYPES, TICK_MODES, TICK_KINDS, INK_TONES, assertTickStrategy } from '#core/scale-types.js';
import { PROGRAM_LIMITS, object, fail, identifier } from '#model/validation-data.js';
const TEXT_FIELDS = ['label', 'unit', 'formula', 'description', 'family', 'anchor', 'anchorTitle', 'endLabel', 'compactLabel', 'startLabel', 'foldLabel', 'positiveCaption', 'negativeCaption'];
const NUMBER_FIELDS = ['pairedSum', 'pairedProduct', 'min', 'max', 'pMin', 'pMax', 'order', 'branch', 'decade', 'sign', 'power', 'coeff', 'fold', 'majorStep', 'minorDivisions', 'anchorPos', 'u0', 'minTemperature', 'maxTemperature', 'origin'];
/** Validate one definition without modifying it or resolving its child scales. */
export function validateScaleDefinition(definition) {
    validateScaleFields(definition);
    validateRuntime(definition);
}
function validateTickInputs(definition) {
    for (const field of ['ticks', 'gauges']) {
        if (definition[field] === undefined)
            continue;
        if (!Array.isArray(definition[field]) || definition[field].length > PROGRAM_LIMITS.manualTicks)
            fail(field + ' must contain at most 2000 entries.');
        for (const tick of definition[field]) {
            if (!object(tick) || !Number.isFinite(tick.value))
                fail('Each tick or gauge needs a finite value.');
            for (const key of ['label', 'positiveLabel', 'negativeLabel']) {
                if (tick[key] !== undefined && (typeof tick[key] !== 'string' || tick[key].length > 80))
                    fail('Tick labels must be text of at most 80 characters.');
            }
            if (tick.title !== undefined && (typeof tick.title !== 'string' || tick.title.length > 240))
                fail('Tick title must be text of at most 240 characters.');
            if (tick.decade !== undefined && ![0, 1, 2].includes(tick.decade))
                fail('Chemical mark decade must be 0, 1 or 2.');
            if (tick.mass !== undefined && !(Number.isFinite(tick.mass) && tick.mass > 0))
                fail('Reference mass must be finite and positive.');
            if (tick.kind !== undefined && !TICK_KINDS.includes(tick.kind))
                fail('Unknown tick kind.');
        }
    }
}
function validateScaleFields(definition) {
    const d = definition;
    if (d.precisionOrigin !== undefined && d.precisionOrigin !== 1)
        fail('precisionOrigin must be 1 when supplied.');
    if (!SCALE_TYPES.includes(d.type))
        fail('Unknown scale type: ' + d.type);
    for (const key of TEXT_FIELDS)
        if (d[key] !== undefined && typeof d[key] !== 'string')
            fail(key + ' must be text.');
    if (d.label?.length > 80 || d.unit?.length > 80)
        fail('Label and unit must be at most 80 characters.');
    for (const key of NUMBER_FIELDS)
        if (d[key] !== undefined && !Number.isFinite(d[key]))
            fail(key + ' must be a finite number.');
    if (d.angleNotation !== undefined && (d.angleNotation !== 'sexagesimal' || d.unit !== '\u00b0' || d.pairedSum === undefined))
        fail('angleNotation sexagesimal requires a paired angular scale in degrees.');
    if (d.tone !== undefined && !INK_TONES.includes(d.tone))
        fail('Unknown ink tone.');
    if (d.axis !== undefined && !['top', 'bottom'].includes(d.axis))
        fail('axis must be top or bottom.');
    if (d.graduationProfile !== undefined && (d.graduationProfile !== 'faber-w' || d.type !== 'root' || d.order !== 2))
        fail('graduationProfile faber-w requires an order-two root scale.');
    if (d.adaptiveTicks !== undefined && typeof d.adaptiveTicks !== 'boolean')
        fail('adaptiveTicks must be a boolean.');
    if (d.compactLabels !== undefined && typeof d.compactLabels !== 'boolean')
        fail('compactLabels must be a boolean.');
    if (d.labelPacking !== undefined && !['centred', 'auto'].includes(d.labelPacking))
        fail('labelPacking must be centred or auto.');
    if (d.tickMode !== undefined && !TICK_MODES.includes(d.tickMode))
        fail('Unknown tickMode.');
    if (d.majorStep !== undefined && (!(d.majorStep > 0) || (d.max - d.min) / d.majorStep > 1000))
        fail('majorStep must be positive and yield at most 1000 intervals.');
    if (d.minorDivisions !== undefined && (!Number.isInteger(d.minorDivisions) || d.minorDivisions < 2 || d.minorDivisions > 100))
        fail('minorDivisions must be an integer from 2 to 100.');
    if (d.majorStep && (d.max - d.min) / d.majorStep * (d.minorDivisions || 10) > 20000)
        fail('At most 20000 linear subdivisions are supported.');
    if (d.min > 0 && d.max > 0 && Math.abs(Math.log10(d.max) - Math.log10(d.min)) > 45)
        fail('A custom numeric range may span at most 45 decades.');
    if (d.fold !== undefined && !(d.fold > 0))
        fail('fold must be positive.');
    if (d.coeff !== undefined && !(d.coeff > 0))
        fail('coeff must be positive.');
    if (d.power === 0)
        fail('power cannot be zero.');
    if (d.sign !== undefined && ![-1, 1].includes(d.sign))
        fail('sign must be +1 or -1.');
    if (d.logBase !== undefined && !['e', '10', 10].includes(d.logBase))
        fail('logBase must be e or 10.');
    if (['loglog', 'loglog10', 'syncroLogLog'].includes(d.type) && !Number.isFinite(d.decade))
        fail('A log-log scale needs an explicit decade.');
    if (d.decade !== undefined && (d.decade < -8 || d.decade > 1))
        fail('decade must be between -8 and 1.');
    if (d.type === 'root' && (!Number.isInteger(d.order) || d.order < 2 || d.order > 32 || !Number.isInteger(d.branch) || d.branch < 0 || d.branch >= d.order))
        fail('Root order must be 2-32; branch must be 0 through order-1.');
    if (['sin', 'cos', 'tan', 'tan2', 'smallAngle'].includes(d.type) && (!(d.min >= 0) || !(d.max <= 90) || !(d.min < d.max)))
        fail('Angular bounds must satisfy 0 <= min < max <= 90 degrees.');
    if (d.type === 'correction' && !['sd', 'td', 'isd', 'itd'].includes(d.correction))
        fail('Unknown correction mapping.');
    if (d.type === 'bbCurve' && (!['energySpectral', 'photonSpectral', 'energyShort', 'energyLong', 'photonShort', 'photonLong'].includes(d.curve) || !(d.u0 > 0) || !Number.isFinite(d.u0 * 100)))
        fail('Define a supported blackbody curve and finite positive u0.');
    if (d.type === 'tempDerived' && (!['power', 'linear', 'sqrt', 'inverse'].includes(d.relation) || !(d.coeff > 0)))
        fail('Define a temperature relation and positive coefficient.');
    if (d.type === 'tempDerived' && d.relation === 'power' && !Number.isFinite(d.power))
        fail('A power relation needs an explicit nonzero power.');
    // These fields historically implied adjustable calibration but were ignored.
    if (d.minTemperature !== undefined && d.minTemperature !== 100 || d.maxTemperature !== undefined && d.maxTemperature !== 10000)
        fail('Temperature mappings currently use the fixed 100-10000 K domain.');
    if (d.type === 'expression') {
        MathExpressions.compile(d.pos, 'x');
        MathExpressions.compile(d.value, 'p');
    }
    if (d.type === 'waterVapor' && (!(d.min >= -20) || !(d.max <= WATER_CRITICAL_K - 273.15) || !(d.min < d.max)))
        fail('Water-vapor bounds must lie between -20 C and the critical point.');
    if (d.type === 'gasEntropy') {
        const [lo, hi] = gasTemperatureRange(d.gas);
        if (!(d.min + 273.15 >= lo) || !(d.max + 273.15 <= hi) || !(d.min < d.max))
            fail('Temperature is outside the published gas heat-capacity fit.');
    }
    if (d.referenceOnly !== undefined && typeof d.referenceOnly !== 'boolean')
        fail('referenceOnly must be boolean.');
    if (d.refineTicks !== undefined && typeof d.refineTicks !== 'boolean')
        fail('refineTicks must be boolean.');
    if (d.referenceOnly && (['composite', 'segmented', 'rootStack', 'syncroLogLog'].includes(d.type) || !Array.isArray(d.ticks) || !d.ticks.length ||
        d.ticks.some(tick => !Number.isFinite(tick.mass) || !(tick.mass > 0) || !tick.label)))
        fail('A reference-only scale needs labelled manual ticks with positive masses.');
    if (d.layers !== undefined && !['composite', 'segmented', 'rootStack'].includes(d.type))
        fail('Only composite, segmented or rootStack scales may have layers.');
    if (['composite', 'segmented'].includes(d.type) && (!Array.isArray(d.layers) || d.layers.length < 1 || d.layers.length > 2))
        fail('A composite needs one or two layers.');
    if (d.type === 'rootStack') {
        if (!Array.isArray(d.layers) || ![2, 3, 5].includes(d.layers.length))
            fail('A rootStack needs two square-root, three cube-root or five fifth-root branches.');
        // A rootStack is presentation, not an additional scalar mapping. Reject
        // ignored calibration/ticks rather than accepting misleading settings.
        for (const key of [...NUMBER_FIELDS, 'pos', 'value', 'tickMode', 'ticks', 'gauges', 'anchor', 'refineTicks', 'referenceOnly'])
            if (d[key] !== undefined) fail('rootStack: set ' + key + ' on its child scales instead.');
    }
    if (d.anchorTitle !== undefined && d.anchorTitle.length > 240)
        fail('anchorTitle must be at most 240 characters.');
    if (d.pairedSum !== undefined && (!['expression', 'sin', 'tan', 'tan2'].includes(d.type) ||
        !(d.min >= 0 && d.max > d.min && d.max <= d.pairedSum && d.pairedSum <= 1e6) || d.referenceOnly))
        fail('pairedSum requires a scalar angle scale with 0 <= min < max <= pairedSum <= 1000000.');
    if (d.pairedProduct !== undefined) {
        if (!['log', 'inverseLog'].includes(d.type) || d.pairedSum !== undefined || d.referenceOnly ||
            !(d.pairedProduct > 0 && d.min > 0 && d.max > d.min))
            fail('pairedProduct requires a positive log or inverseLog scale; it cannot be combined with pairedSum or referenceOnly.');
        if (![d.min, d.max].every(value => Number.isFinite(d.pairedProduct / value) && d.pairedProduct / value > 0))
            fail('Both secondary endpoint values must be positive and finite.');
    }
    validateTickInputs(d);
}
const INVERSE_SAMPLES = [...Array.from({ length: 65 }, (_, i) => i / 64), ...Array.from({ length: 64 }, (_, i) => ((i + 1) * 0.6180339887498949) % 1)].sort((a, b) => a - b);
function validateRuntime(definition) {
    const d = definition;
    if (['composite', 'segmented', 'rootStack'].includes(d.type))
        return;
    assertTickStrategy(d);
    const rt = makeRuntimeScale(d);
    if (!(rt.pMin >= 0 && rt.pMax <= 1 && rt.pMin < rt.pMax))
        fail('Position bounds must satisfy 0 <= pMin < pMax <= 1.');
    if (['waterVapor', 'gasEntropy'].includes(d.type)) {
        if (d.pMin !== undefined && Math.abs(d.pMin - rt.pMin) > 1e-10 ||
            d.pMax !== undefined && Math.abs(d.pMax - rt.pMax) > 1e-10)
            fail('Chemical position bounds must match the calibrated domain.');
    }
    if (d.type === 'expression') {
        const a = rt.pos(d.min), b = rt.pos(d.max);
        if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(Math.min(a, b) - rt.pMin) > 1e-6 || Math.abs(Math.max(a, b) - rt.pMax) > 1e-6)
            fail('Expression min/max must cover the declared position domain exactly.');
    }
    // Include off-grid samples: checking only i/64 missed expressions oscillating
    // exactly between those points. This remains a finite diagnostic, not a proof.

    let lastValue;
    let direction = 0;
    for (const fraction of INVERSE_SAMPLES) {
        const p = rt.pMin + (rt.pMax - rt.pMin) * fraction;
        const value = rt.value(p);
        if (!Number.isFinite(value))
            fail('Mapping is not finite at p=' + p.toPrecision(5));
        if (Number.isFinite(d.min) && Number.isFinite(d.max)) {
            const lo = Math.min(d.min, d.max), hi = Math.max(d.min, d.max);
            const tolerance = 1e-8 * Math.max(1, Math.abs(lo), Math.abs(hi));
            if (value < lo - tolerance || value > hi + tolerance)
                fail('Mapping values leave the declared numeric range.');
        }
        if (d.type === 'bbCurve')
            continue; // Spectral curves deliberately have two inverse branches.
        const back = rt.pos(value);
        const delta = Math.abs(p - back);
        const cyclic = ['foldedLog', 'foldedInverse'].includes(d.type);
        if (!Number.isFinite(back) || (cyclic ? Math.min(delta, Math.abs(1 - delta)) : delta) > 2e-6)
            fail('pos and value are not inverse mappings at p=' + p.toPrecision(5));
        if (d.type === 'expression') {
            if (value < d.min - Math.abs(d.min) * 1e-8 || value > d.max + Math.abs(d.max) * 1e-8)
                fail('Expression values leave the declared numeric range.');
            if (lastValue !== undefined && value !== lastValue) {
                const next = Math.sign(value - lastValue);
                if (direction && next !== direction)
                    fail('Expression value must be monotonic over its position domain.');
                direction = next;
            }
            lastValue = value;
        }
    }
    for (const tick of [...(d.ticks || []), ...(d.gauges || [])]) {
        const p = rt.pos(tick.value);
        if (!Number.isFinite(p) || p < rt.pMin - 1e-10 || p > rt.pMax + 1e-10)
            fail('A manual tick or gauge is outside the scale domain.');
        const expected = rt.value(p);
        if (['foldedLog', 'foldedInverse'].includes(d.type)) {
            const decades = Math.log10(tick.value) - Math.log10(expected);
            if (Math.abs(decades - Math.round(decades)) > 1e-8)
                fail('Manual tick value disagrees with the folded mapping.');
        }
        else if (Math.abs(expected - tick.value) / Math.max(Math.abs(expected), Math.abs(tick.value), Number.MIN_VALUE) > 1e-8) {
            fail('Manual tick or gauge value is on the wrong branch of the mapping.');
        }
    }
    if (d.anchor && d.anchorPos !== undefined && (d.anchorPos < rt.pMin || d.anchorPos > rt.pMax))
        fail('Anchor position is outside the scale domain.');
    if ((!d.ticks || d.ticks.length) && !generateTicks(d, rt, 1000).length)
        fail('No usable graduations are produced by this definition.');
}
export function validateComposites(library) {
    for (const d of Object.values(library)) {
        if (!['composite', 'segmented', 'rootStack'].includes(d.type))
            continue;
        const rootStack = d.type === 'rootStack';
        if (!Array.isArray(d.layers) || (rootStack ? ![2, 3, 5].includes(d.layers.length) : d.layers.length < 1 || d.layers.length > 2))
            fail(d.id + ': incorrect number of child scales.');
        for (const layer of d.layers) {
            const id = typeof layer === 'string' ? layer : layer?.scale;
            if (!identifier(id) || !Object.hasOwn(library, id))
                fail(d.id + ': missing layer ' + id);
            if (['composite', 'segmented', 'rootStack', 'syncroLogLog'].includes(library[id].type) || library[id].pairedSum !== undefined || library[id].pairedProduct !== undefined)
                fail(d.id + ': a composite layer must be an ordinary single-line scale.');
            if (typeof layer !== 'string') {
                if (!object(layer))
                    fail(d.id + ': a layer must be a scale ID or object.');
                if (layer.caption !== undefined && typeof layer.caption !== 'string')
                    fail(d.id + ': layer caption must be text.');
                if (layer.tone !== undefined && !INK_TONES.includes(layer.tone))
                    fail(d.id + ': unknown layer tone.');
            }
        }
        if (rootStack) {
            d.layers.forEach((layer, branch) => {
                const child = library[typeof layer === 'string' ? layer : layer.scale];
                if (child.type !== 'root' || child.order !== d.layers.length || child.branch !== branch)
                    fail(d.id + ': rootStack children must be consecutive branches of the same square, cube or fifth root, in increasing order.');
                const rt = makeRuntimeScale(child);
                if (rt.pMin !== 0 || rt.pMax !== 1)
                    fail(d.id + ': rootStack children must span the full scale length.');
            });
        }
        if (d.type === 'segmented' && d.layers.length === 2) {
            const intervals = d.layers.map(layer => makeRuntimeScale(library[typeof layer === 'string' ? layer : layer.scale]))
                .sort((a, b) => a.pMin - b.pMin);
            if (intervals[0].pMax > intervals[1].pMin + 1e-9)
                fail(d.id + ': segmented child domains must not overlap.');
        }
    }
}
