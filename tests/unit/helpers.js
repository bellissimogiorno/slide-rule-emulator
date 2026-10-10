import assert from 'node:assert/strict';
export const rail = (ids = []) => ({ topStator: [], slide: [], bottomStator: ids });
export const programme = (definition) => ({ customScales: definition ? [definition] : [], sides: { front: rail([definition?.id || 'D']) } });
export function close(actual, expected, relative = 1e-11, absolute = 1e-13, message = '') {
    assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= Math.max(absolute, Math.abs(expected) * relative), `${message}: ${actual} != ${expected}`);
}
export function memoryStorage(initial = {}) {
    const data = new Map(Object.entries(initial));
    return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)) };
}
