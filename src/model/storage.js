/** Persistence boundary. A storage provider is injected so denied storage and
 * corrupt records are testable without a browser or a mock DOM. */
import { DEFAULT_STATE } from '#catalog/defaults.js';
import { deepClone, mergeState } from '#model/program.js';
import { parseProgramText } from '#model/validation.js';
import { STORAGE_KEY } from '#version.js';
export function configuredStorageKey(seed, key = STORAGE_KEY) {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++)
        hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619);
    return key + '.copy.' + (hash >>> 0).toString(16);
}
export function loadProgramme({ seed = '', getStorage, key = STORAGE_KEY } = {}) {
    let programme = deepClone(DEFAULT_STATE);
    let recovery = null;
    let message = '';
    if (seed && seed !== 'null') {
        try {
            programme = mergeState(programme, parseProgramText(seed));
            key = configuredStorageKey(seed, key);
        }
        catch (error) {
            recovery = seed;
            message = 'The embedded programme is invalid; a default instrument was loaded. ' + error.message;
        }
    }
    try {
        const storage = getStorage();
        const oldRecovery = storage.getItem(key + '.recovery');
        if (oldRecovery !== null && recovery === null)
            recovery = oldRecovery;
        const raw = storage.getItem(key);
        if (raw) {
            try {
                programme = mergeState(programme, parseProgramText(raw));
            }
            catch (error) {
                recovery = raw;
                message = 'Saved programme rejected safely. Your original data can be downloaded for repair. ' + error.message;
            }
        }
    }
    catch (error) {
        message ||= 'Browser storage is unavailable. Changes work for this session; export JSON or save a standalone copy to keep them.';
    }
    return { programme, recovery, message, key };
}
/** Preserve rejected data before replacing a record. Exceptions reach the UI. */
export function saveProgramme({ getStorage, key = STORAGE_KEY, programme, recovery = null }) {
    const storage = getStorage();
    if (recovery !== null)
        storage.setItem(key + '.recovery', recovery);
    storage.setItem(key, JSON.stringify(programme));
}
