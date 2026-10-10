/** Recursively freeze acyclic catalogue/definition data after validation. */
export function deepFreeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        for (const child of Object.values(value))
            deepFreeze(child);
        Object.freeze(value);
    }
    return value;
}
/** Clone JSON programme data without retaining mutable caller references. */
export function deepClone(value) { return JSON.parse(JSON.stringify(value)); }
