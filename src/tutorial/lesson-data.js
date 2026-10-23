/** Shared data constructors keep lesson coordinates and player fields uniform.
 * Each authored movement still names its own operation, target and reading.
 * Positions are fractions of the graduated length, never screen pixels.
 */
import { deepFreeze } from '#core/objects.js';

export const log = Math.log10;
export const position = (slideOffset = 0, cursor = 0) => ({ slideOffset, cursor });
export const move = (title, text, target, focus, readings = ['C', 'D'], duration = 1400) =>
    ({ title, text, target, focus, readings, duration });
export const exercise = (title, text, target, required, success,
    focus = required.length === 1 && required[0] === 'slideOffset' ? 'slide' : 'cursor') =>
    ({ title, text, target, required, success, focus });
export const sectionLessons = (sectionId, lessons) => deepFreeze(lessons.map(lesson =>
    ({ layout: 'cd', ...lesson, sectionId })));
export const ESTIMATE_NOTE = 'The check verifies alignment; choose the decimal place yourself.';
