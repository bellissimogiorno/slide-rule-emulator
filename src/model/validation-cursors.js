/** Validate authored per-face cursor geometry and printed annotations.
 * Cursor appearance preferences are programme metadata, checked separately.
 */
import { PROGRAM_LIMITS, object, fail, identifier } from '#model/validation-data.js';
export function validateCursorMarks(side, library) {
    if (side.cursorMarks === undefined) return;
    if (!Array.isArray(side.cursorMarks) || side.cursorMarks.length > PROGRAM_LIMITS.cursorMarks)
        fail('cursorMarks must be an array of at most 16 marks.');
    const ids = new Set();
    for (const mark of side.cursorMarks) {
        if (!object(mark) || !identifier(mark.id) || ids.has(mark.id))
            fail('Each cursor mark needs a unique, non-reserved ID of at most 64 characters.');
        ids.add(mark.id);
        if (Object.keys(mark).some(key => !['id', 'label', 'offset', 'scales', 'labelTone', 'showLabel'].includes(key)))
            fail('Unknown cursor mark field.');
        if (typeof mark.label !== 'string' || !mark.label.trim() || mark.label.length > 80)
            fail('A cursor mark label must contain 1-80 characters.');
        if (!Number.isFinite(mark.offset) || mark.offset < -1 || mark.offset > 1)
            fail('A cursor mark offset must be a finite fraction between -1 and 1.');
        if (mark.labelTone !== undefined && !['neutral', 'red'].includes(mark.labelTone))
            fail('Cursor labelTone must be neutral or red.');
        if (mark.showLabel !== undefined && typeof mark.showLabel !== 'boolean')
            fail('Cursor showLabel must be a boolean.');
        if (mark.scales !== undefined && (!Array.isArray(mark.scales) || !mark.scales.length ||
            mark.scales.length > PROGRAM_LIMITS.rows || new Set(mark.scales).size !== mark.scales.length ||
            mark.scales.some(id => typeof id !== 'string' || !Object.hasOwn(library, id))))
            fail('Cursor mark scales must name 1-320 distinct existing scales.');
    }
}

/** Printed cap/gauge annotations do not define cursor readings. Their position
 * remains explicit JSON data so it survives exports and face customization. */
export function validateCursorCaptions(side, library) {
    if (side.cursorLineTone !== undefined && !['neutral', 'red'].includes(side.cursorLineTone))
        fail('cursorLineTone must be neutral or red.');
    if (side.cursorFrame !== undefined && !['ivory', 'metal', 'clear'].includes(side.cursorFrame))
        fail('cursorFrame must be ivory, metal or clear.');
    if (side.cursorWidth !== undefined && (!Number.isFinite(side.cursorWidth) || side.cursorWidth <= 0 || side.cursorWidth > 1))
        fail('cursorWidth must be a finite track fraction greater than 0 and at most 1.');
    if (side.cursorCaptions === undefined) return;
    if (!Array.isArray(side.cursorCaptions) || side.cursorCaptions.length > PROGRAM_LIMITS.cursorCaptions)
        fail('cursorCaptions must be an array of at most 32 captions.');
    const ids = new Set();
    for (const caption of side.cursorCaptions) {
        if (!object(caption) || !identifier(caption.id) || ids.has(caption.id))
            fail('Each cursor caption needs a unique, non-reserved ID of at most 64 characters.');
        ids.add(caption.id);
        if (Object.keys(caption).some(key => !['id', 'offset', 'lines', 'zone', 'tone', 'scale', 'edge', 'align', 'fraction'].includes(key)))
            fail('Unknown cursor caption field.');
        if (!Number.isFinite(caption.offset) || caption.offset < -1 || caption.offset > 1)
            fail('A cursor caption offset must be a finite fraction between -1 and 1.');
        if (!Array.isArray(caption.lines) || caption.lines.length < 1 || caption.lines.length > 2 ||
            caption.lines.some(line => typeof line !== 'string' || !line.trim() || line.length > 40))
            fail('Cursor caption lines must contain one or two strings of 1-40 characters.');
        if (!['topCap', 'bottomCap', 'row'].includes(caption.zone))
            fail('Cursor caption zone must be topCap, bottomCap or row.');
        if (caption.tone !== undefined && !['neutral', 'red'].includes(caption.tone))
            fail('Cursor caption tone must be neutral or red.');
        if (caption.align !== undefined && !['start', 'center', 'end'].includes(caption.align))
            fail('Cursor caption align must be start, center or end.');
        if (caption.fraction !== undefined && typeof caption.fraction !== 'boolean' ||
            caption.fraction && caption.lines.length !== 2)
            fail('A fraction caption needs fraction:true and exactly two lines.');
        if (caption.zone === 'row') {
            if (typeof caption.scale !== 'string' || !Object.hasOwn(library, caption.scale) || !['top', 'bottom'].includes(caption.edge))
                fail('A row caption needs an existing scale and a top or bottom edge.');
        } else if (caption.scale !== undefined || caption.edge !== undefined) {
            fail('A cap caption cannot also specify a row scale or edge.');
        }
    }
}

