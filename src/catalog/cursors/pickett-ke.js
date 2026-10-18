/** Single-hairline instruments reviewed against specimen records and manuals.
 * These are deliberately not given the multi-line cursor of another maker.
 * See docs/CURSORS_PICKETT_KE.md for model/variant evidence and limits.
 * A neutral Pickett line and clear housing are conservative screen styling;
 * the K&E red line and metal frame are explicitly documented features.
 */
// Rounded screen proportions from the recorded 29 mm / 35 mm housing widths
// on nominal 25 cm / ten-inch rules; these are not calibration constants.
const PICKETT_WIDTH = 0.115;
const DECILON_WIDTH = 0.14;
const single = (cursorLineTone, cursorFrame, cursorWidth) => ({ cursorLineTone, cursorFrame, cursorWidth });
const duplex = (tone, frame, width) => ({ front: single(tone, frame, width), back: single(tone, frame, width) });

export const pickettKeCursors = {
    pickettN3: duplex('neutral', 'clear', PICKETT_WIDTH),
    pickettN4: duplex('neutral', 'clear', PICKETT_WIDTH),
    pickettN16: duplex('neutral', 'clear', PICKETT_WIDTH),
    pickett14: duplex('neutral', 'clear', PICKETT_WIDTH),
    blackbody17: duplex('neutral', 'clear', PICKETT_WIDTH),
    keDecilon: duplex('red', 'metal', DECILON_WIDTH)
};
