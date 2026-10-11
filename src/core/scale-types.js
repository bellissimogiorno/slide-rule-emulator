/** Supported mappings and their default graduation strategies.
 * A tick strategy chooses meaningful numeric marks; it never changes a mapping.
 */
export const DEFAULT_TICK_MODES = Object.freeze({
    log: 'log', inverseLog: 'log', expression: 'log',
    waterVapor: 'mapped', gasEntropy: 'mapped',
    foldedLog: 'folded', foldedInverse: 'folded', root: 'root',
    linear: 'linear', reverseLinear: 'linear',
    sin: 'sin', cos: 'cos', tan: 'tan', tan2: 'tan2', smallAngle: 'smallAngle',
    pythagorean: 'pythagorean', sinhLow: 'mapped', sinhHigh: 'mapped', tanh: 'mapped',
    hypotenuseLow: 'mapped', hypotenuseHigh: 'mapped', acosh: 'mapped', correction: 'mapped',
    loglog: 'loglog', loglog10: 'loglog10', syncroLogLog: 'syncroLogLog',
    temperature: 'temperature', temperatureC: 'temperature', temperatureF: 'temperature',
    tempDerived: 'temperature', bbWavelength: 'log', bbWavenumber: 'log', bbCurve: 'bbCurve'
});
export const SCALE_TYPES = Object.freeze([...Object.keys(DEFAULT_TICK_MODES), 'composite', 'segmented', 'rootStack']);
export const TICK_MODES = Object.freeze([...new Set(Object.values(DEFAULT_TICK_MODES)), 'reverseLinear', 'tempDerived']);
export const INK_TONES = Object.freeze(['neutral', 'red', 'blue', 'green']);
export const RAILS = Object.freeze(['topStator', 'slide', 'bottomStator']);
export const TICK_KINDS = Object.freeze(['micro', 'minor', 'mid', 'submajor', 'major', 'index', 'gauge']);
export function tickModeFor(definition) {
    return definition.tickMode ?? DEFAULT_TICK_MODES[definition.type];
}
/** Reject combinations that need incompatible domains or a nonexistent inverse. */
export function assertTickStrategy(definition) {
    const mode = tickModeFor(definition);
    if (!TICK_MODES.includes(mode))
        throw new Error('Unknown tick strategy: ' + mode);
    const generic = ['log', 'linear', 'reverseLinear', 'mapped'];
    if (generic.includes(mode)) {
        if (['bbCurve', 'syncroLogLog'].includes(definition.type)) {
            throw new Error(definition.type + ' needs its own shared/branched tick strategy.');
        }
        const { min, max } = definition;
        if (!Number.isFinite(min) || !Number.isFinite(max) || !(max > min)) {
            throw new Error('This tick strategy requires finite min < max.');
        }
        if (mode === 'log' && !(min > 0))
            throw new Error('Logarithmic ticks require a positive minimum.');
        return;
    }
    const expected = DEFAULT_TICK_MODES[definition.type];
    if (mode !== expected && !(mode === 'tempDerived' && expected === 'temperature')) {
        throw new Error('Tick strategy ' + mode + ' is incompatible with mapping ' + definition.type + '.');
    }
}
