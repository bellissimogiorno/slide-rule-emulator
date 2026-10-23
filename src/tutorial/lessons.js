/** Flat lesson access remains compatible with the tutorial player. */
import { deepFreeze } from '#core/objects.js';
import { TUTORIAL_SECTIONS } from '#tutorial/course.js';

export const TUTORIAL_LESSONS = deepFreeze(TUTORIAL_SECTIONS.flatMap(section => section.lessons));

/** Check only the quantities the current practice step asks the learner to set.
 * A fixed fraction of the graduated length tolerates a few screen pixels while
 * keeping slide alignment and cursor reading independently necessary. The
 * result describes alignment; it does not assess the learner's mental estimate.
 */
export function checkTutorialAlignment(position, step, tolerance = .004) {
    if (!Number.isFinite(tolerance) || tolerance < 0)
        throw new RangeError('Tutorial tolerance must be a finite nonnegative number.');
    if (!Array.isArray(step?.required) || !step.required.length ||
        step.required.some(field => !['slideOffset', 'cursor'].includes(field)))
        throw new TypeError('A tutorial practice step must name its required coordinates.');
    const misses = step.required.filter(field => {
        const value = position?.[field], target = step.target?.[field];
        return !Number.isFinite(value) || !Number.isFinite(target) ||
            value < target - tolerance || value > target + tolerance;
    });
    return { passed: misses.length === 0, misses };
}
