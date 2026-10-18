/** Cursor selections for makers outside the Faber/Aristo/Pickett families.
 * Primary owner descriptions establish the single-line models and materials.
 * Graphoplex's 690/691 manufacturer instructions establish the functional
 * offsets. This is that documented arrangement, not an assertion that every
 * surviving 690A/691A specimen has the same cursor. See CURSORS_OTHER_MAKERS.md.
 *
 * All offsets are fractions of one C/D decade. No photograph was used as a
 * ruler, and undocumented cap lettering or auxiliary gauges are not invented.
 */

const single = (frame, width) => ({
    ...(frame ? { cursorFrame: frame } : {}),
    ...(width ? { cursorWidth: width } : {}),
    cursorLineTone: 'neutral', cursorMarks: [], cursorCaptions: []
});
const duplexSingle = (frame, width) => ({ front: single(frame, width), back: single(frame, width) });

// Use the manual's printed rounded 0.736 kW/CV conversion factor. This is a
// manual-based numerical approximation; the manufactured line spacing has not
// been measured, and the text does not say that 0.736 is engraved on the cursor.
const powerHalfSpan = Math.log10(1 / 0.736) / 2;
const circleOffset = Math.log10(Math.PI / 4) / 2;
// At the short line D=x, the central folded DF value is 3.6*x (decimal powers
// restored). Thus pi*10^(p-main) / 10^(p-short) = 3.6.
const commercialOffset = Math.log10(Math.PI / 3.6);

const outerLines = () => [
    { id: 'graphoplex-kw', label: 'kW', offset: -powerHalfSpan, showLabel: false },
    { id: 'graphoplex-ps', label: 'PS (metric horsepower)', offset: powerHalfSpan, showLabel: false }
];

function graphoplexCursor(width) {
    return {
        // Manufacturer Face II is the emulator's front (A/B and trigonometry).
        front: {
            cursorFrame: 'clear', cursorLineTone: 'neutral',
            ...(width ? { cursorWidth: width } : {}),
            cursorMarks: [
                ...outerLines(),
                { id: 'graphoplex-circle', label: 'Circle area (π/4)',
                    offset: circleOffset, scales: ['GP_A', 'GP_B'], showLabel: false }
            ],
            cursorCaptions: []
        },
        // Manufacturer Face I is the emulator's back (folded and log-log).
        back: {
            cursorFrame: 'clear', cursorLineTone: 'neutral',
            ...(width ? { cursorWidth: width } : {}),
            cursorMarks: [
                ...outerLines(),
                { id: 'graphoplex-360', label: '3.6 (D to DF)',
                    offset: commercialOffset, scales: ['GP_D'], showLabel: false }
            ],
            cursorCaptions: []
        }
    };
}

export const otherMakerCursors = {
    thorntonAA010: duplexSingle('clear', 3.9 / 25),
    hemmi257: duplexSingle('metal', 3 / 25),
    flyingFish1017: duplexSingle('clear', 3.8 / 25),
    thorntonF5100: {
        front: single('clear'),
        // The historical F5100 cursor is front-only. This programme's separately
        // exposed back is a mathematical reference face; its plain virtual
        // cursor is an emulator convenience, not a second physical window.
        back: single()
    },
    graphoplex690a: graphoplexCursor(3.9 / 25),
    graphoplex691a: graphoplexCursor(),
    // Doron's published proposal is not a factory model. A calibrated auxiliary
    // cursor design was not established: retain the plain virtual cursor.
    ultralog: duplexSingle()
};
