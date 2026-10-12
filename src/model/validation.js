/** Untrusted JSON enters through this boundary before live state is changed.
 * Validation is deliberately stronger than JSON Schema: it checks references,
 * mathematical domains, sampled inverses and bounded graduation generation.
 * Sampled checks are diagnostics, not a proof about an arbitrary expression.
 */
import { gasTemperatureRange, WATER_CRITICAL_K } from '#core/chemistry.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { THEMES, DENSITIES } from '#catalog/appearance.js';
import { MathExpressions } from '#core/expressions.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { SCALE_TYPES, TICK_MODES, TICK_KINDS, INK_TONES, RAILS, assertTickStrategy } from '#core/scale-types.js';
export const PROGRAM_LIMITS = Object.freeze({ characters: 1000000, nodes: 30000, depth: 12, sides: 8, customScales: 128, rowsPerRail: 40, rows: 320, manualTicks: 2000 });
const RESERVED = new Set(['__proto__', 'prototype', 'constructor']);
const TEXT_FIELDS = ['label', 'unit', 'formula', 'description', 'family', 'anchor', 'anchorTitle', 'endLabel', 'compactLabel', 'startLabel', 'foldLabel', 'positiveCaption', 'negativeCaption'];
const NUMBER_FIELDS = ['pairedSum', 'min', 'max', 'pMin', 'pMax', 'order', 'branch', 'decade', 'sign', 'power', 'coeff', 'fold', 'majorStep', 'minorDivisions', 'anchorPos', 'u0', 'minTemperature', 'maxTemperature', 'origin'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = message => { throw new Error(message); };
const identifier = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/.test(value) && !RESERVED.has(value);
function inspectData(value, depth = 0, counter = { nodes: 0 }) {
    if (++counter.nodes > PROGRAM_LIMITS.nodes || depth > PROGRAM_LIMITS.depth)
        fail('Programme is too large or deeply nested.');
    if (typeof value === 'number' && !Number.isFinite(value))
        fail('All numbers must be finite.');
    if (typeof value === 'string' && value.length > 4000)
        fail('A programme string exceeds 4000 characters.');
    if (!['object', 'number', 'string', 'boolean'].includes(typeof value))
        fail('Only JSON data is supported.');
    if (value && typeof value === 'object') {
        for (const [key, child] of Object.entries(value)) {
            if (RESERVED.has(key))
                fail('Reserved property name: ' + key);
            inspectData(child, depth + 1, counter);
        }
    }
}
export function parseProgramText(text) {
    if (typeof text !== 'string' || text.length > PROGRAM_LIMITS.characters)
        fail('Programme exceeds the 1,000,000-character limit.');
    const programme = JSON.parse(text);
    validateProgram(programme);
    return programme;
}
function validateMetadata(programme) {
    if (programme.viewMode !== undefined && !["single", "both"].includes(programme.viewMode))
        fail("viewMode must be single or both.");
    for (const [key, values] of [['theme', THEMES], ['density', DENSITIES]]) {
        if (programme[key] !== undefined && !Object.hasOwn(values, programme[key]))
            fail('Unknown ' + key + ': ' + programme[key]);
    }
    for (const key of ['showFormulas', 'compactScales']) {
        if (programme[key] !== undefined && typeof programme[key] !== 'boolean')
            fail(key + ' must be a boolean.');
    }
    for (const [key, lo, hi] of [['cursor', 0, 1], ['slideOffset', -0.9, 0.9]]) {
        if (programme[key] !== undefined && (typeof programme[key] !== 'number' || programme[key] < lo || programme[key] > hi))
            fail(key + ' is outside its permitted range.');
    }
    if (programme.magnification !== undefined && ![1, 1.25, 1.5, 2].includes(programme.magnification))
        fail('magnification must be 1, 1.25, 1.5 or 2.');
    for (const key of ['modelLabel', 'instrumentNote', 'presetId', 'activeSide']) {
        if (programme[key] !== undefined && typeof programme[key] !== 'string')
            fail(key + ' must be text.');
    }
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
    if (d.tone !== undefined && !INK_TONES.includes(d.tone))
        fail('Unknown ink tone.');
    if (d.axis !== undefined && !['top', 'bottom'].includes(d.axis))
        fail('axis must be top or bottom.');
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
        if (!Array.isArray(d.layers) || ![2, 3].includes(d.layers.length))
            fail('A rootStack needs two square-root or three cube-root branches.');
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
function validateComposites(library) {
    for (const d of Object.values(library)) {
        if (!['composite', 'segmented', 'rootStack'].includes(d.type))
            continue;
        const rootStack = d.type === 'rootStack';
        if (!Array.isArray(d.layers) || (rootStack ? ![2, 3].includes(d.layers.length) : d.layers.length < 1 || d.layers.length > 2))
            fail(d.id + ': incorrect number of child scales.');
        for (const layer of d.layers) {
            const id = typeof layer === 'string' ? layer : layer?.scale;
            if (!identifier(id) || !Object.hasOwn(library, id))
                fail(d.id + ': missing layer ' + id);
            if (['composite', 'segmented', 'rootStack', 'syncroLogLog'].includes(library[id].type) || library[id].pairedSum !== undefined)
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
                    fail(d.id + ': rootStack children must be consecutive branches of the same square or cube root, in increasing order.');
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
export function validateProgram(programme) {
    inspectData(programme);
    if (!object(programme))
        fail('JSON must be an object.');
    if (!object(programme.sides) || !Object.keys(programme.sides).length)
        fail('Include at least one side in a sides object.');
    if (Object.keys(programme.sides).length > PROGRAM_LIMITS.sides)
        fail('At most 8 sides are supported.');
    if (programme.customScales !== undefined && !Array.isArray(programme.customScales))
        fail('customScales must be an array.');
    const custom = programme.customScales || [];
    if (custom.length > PROGRAM_LIMITS.customScales)
        fail('At most 128 custom scales are supported.');
    validateMetadata(programme);
    const library = Object.assign(Object.create(null), BUILTIN_SCALES);
    const ids = new Set();
    for (const d of custom) {
        if (!object(d) || !identifier(d.id))
            fail('Each custom scale needs a non-reserved ID of at most 64 characters.');
        if (ids.has(d.id))
            fail('Duplicate custom scale ID: ' + d.id);
        ids.add(d.id);
        try {
            validateScaleFields(d);
            validateRuntime(d);
        }
        catch (error) {
            fail(d.id + ': ' + error.message);
        }
        library[d.id] = d;
    }
    validateComposites(library); // Includes built-in layers that have been overridden.
    let rows = 0;
    for (const [key, side] of Object.entries(programme.sides)) {
        if (!identifier(key) || !object(side))
            fail('Each side needs a valid ID and object.');
        for (const field of ['name', 'note'])
            if (side[field] !== undefined && typeof side[field] !== 'string')
                fail(key + ': ' + field + ' must be text.');
        for (const rail of RAILS) {
            if (!Array.isArray(side[rail]) || side[rail].length > PROGRAM_LIMITS.rowsPerRail)
                fail(key + ': ' + rail + ' must be an array of at most 40 scale IDs.');
            rows += side[rail].length;
            for (const id of side[rail])
                if (typeof id !== 'string' || !Object.hasOwn(library, id))
                    fail(key + ': missing scale ' + id);
        }
    }
    if (rows > PROGRAM_LIMITS.rows)
        fail('At most 320 scale rows are supported.');
    if (programme.activeSide !== undefined && !Object.hasOwn(programme.sides, programme.activeSide))
        fail('activeSide must name an existing side.');
}
