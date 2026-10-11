/** Motion policy shared by the range grips, nudge buttons and rule keyboard.
 * Distances are fractions of the graduated rule length, never screen pixels.
 * Keeping this independent of the DOM makes precision and limits testable.
 */
import { clamp } from '#core/numbers.js';

export const MOTION_STEPS = Object.freeze([0.001, 0.0001, 0.00001]);
export const MOTION_LIMITS = Object.freeze({
    slideOffset: Object.freeze([-0.9, 0.9]),
    cursor: Object.freeze([0, 1])
});

export function motionStep(value, finer = false) {
    const requested = Number(value);
    const step = MOTION_STEPS.includes(requested) ? requested : MOTION_STEPS[0];
    return finer ? step / 10 : step;
}

/** A null result means the browser/editor must keep its own key behaviour. */
export function motionKeyCommand(event, step) {
    if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey)
        return null;
    if (event.key === 'Home') return { limit: 'min' };
    if (event.key === 'End') return { limit: 'max' };
    const directions = {
        ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1,
        PageDown: -10, PageUp: 10
    };
    return Object.hasOwn(directions, event.key)
        ? { delta: directions[event.key] * motionStep(step, event.altKey) } : null;
}

export function movedPosition(value, field, command) {
    const limits = MOTION_LIMITS[field];
    if (!limits) throw new Error('Unknown motion target: ' + field);
    const [min, max] = limits;
    if (command.limit === 'min') return min;
    if (command.limit === 'max') return max;
    if (command.position !== undefined) return clamp(command.position, min, max);
    // Do not round or snap here: an imported position may be between steps.
    return clamp(value + command.delta, min, max);
}

export function positionText(value, field) {
    const text = value.toFixed(6);
    // Suppress a rounded negative zero without changing the stored coordinate.
    const unsignedZero = text === '-0.000000' ? '0.000000' : text;
    return field === 'slideOffset' && value >= 0 ? '+' + unsignedZero : unsignedZero;
}

export function positionDescription(value, field) {
    if (field === 'cursor') return positionText(value, field) + ' scale lengths from the left index';
    if (value === 0) return 'Slide indices aligned; offset 0.000000 scale lengths';
    return Math.abs(value).toFixed(6) + ' scale lengths to the ' + (value < 0 ? 'left' : 'right');
}
