/** Programme-wide cursor preferences. Authored side metadata remains intact so
 * choosing Instrument can restore every face's calibrated cursor exactly. */
export const CURSOR_SHAPES = Object.freeze({
    instrument: 'Instrument',
    minimal: 'Minimal'
});
export const CURSOR_COLOURS = Object.freeze({
    instrument: 'Instrument',
    red: 'Red',
    black: 'Black',
    blue: 'Blue',
    green: 'Green'
});

/** The original plain cursor defaults to red; a rendered frame, width, mark or
 * caption selects the advanced cursor, whose default is neutral. Resolve that
 * authored default before changing shape so the two preferences stay separate.
 * Scoped details on rows that were removed do not create an advanced cursor. */
function authoredDefaultColour(side) {
    const scales = new Set(['topStator', 'slide', 'bottomStator'].flatMap(rail => side[rail]));
    const visibleMark = (side.cursorMarks || []).some(mark => !mark.scales || mark.scales.some(scale => scales.has(scale)));
    const visibleCaption = (side.cursorCaptions || []).some(caption => caption.zone !== 'row' || scales.has(caption.scale));
    return side.cursorFrame || side.cursorWidth !== undefined || visibleMark || visibleCaption ? 'black' : 'red';
}

/** Project a side for rendering and cursor readings; never edit catalogue or
 * programme data. Minimal uses the original narrow, single-line cursor;
 * Instrument retains the authored frame, marks and inscriptions. cursorColour is a
 * transient rendering hint: the persisted preference lives on the programme. */
export function cursorAppearanceSide(side, state = {}) {
    const shape = typeof state.cursorShape === 'string' && Object.hasOwn(CURSOR_SHAPES, state.cursorShape)
        ? state.cursorShape : 'instrument';
    const colour = typeof state.cursorColour === 'string' && Object.hasOwn(CURSOR_COLOURS, state.cursorColour)
        ? state.cursorColour : 'instrument';
    if (shape === 'instrument' && colour === 'instrument') return side;
    const projected = { ...side };
    if (shape === 'minimal') {
        for (const key of ['cursorFrame', 'cursorWidth', 'cursorMarks', 'cursorCaptions']) delete projected[key];
    }
    if (colour !== 'instrument') projected.cursorColour = colour;
    else if (shape !== 'instrument' && side.cursorLineTone === undefined) projected.cursorColour = authoredDefaultColour(side);
    return projected;
}
