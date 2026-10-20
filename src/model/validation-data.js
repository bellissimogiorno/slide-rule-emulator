/** Shared limits and the recursive JSON-data boundary.
 * Keep these guards independent of programme, scale and cursor semantics so
 * every entry point applies the same size and reserved-name policy.
 */
export const PROGRAM_LIMITS = Object.freeze({ characters: 1000000, nodes: 30000, depth: 12, sides: 8, customScales: 128, rowsPerRail: 40, rows: 320, manualTicks: 2000, cursorMarks: 16, cursorCaptions: 32 });
const RESERVED = new Set(['__proto__', 'prototype', 'constructor']);
export const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export const fail = message => { throw new Error(message); };
export const identifier = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/.test(value) && !RESERVED.has(value);
export function inspectData(value, depth = 0, counter = { nodes: 0 }) {
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
