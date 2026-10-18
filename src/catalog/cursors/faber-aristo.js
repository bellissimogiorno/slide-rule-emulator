/** Evidence-bounded cursor reconstructions. See docs/CURSORS_FABER_ARISTO.md.
 * The main hairline is implicit and remains at offset zero. All auxiliary
 * offsets are fractions of the index-to-index track, derived from the scale
 * equations. No offsets are guessed from inaccessible photographs.
 */
const circleOffset = Math.log10(4 / Math.PI) / 2;
const folded36Offset = Math.log10(3.6 / Math.PI);
// Metric horsepower (PS), not the distinct English mechanical horsepower.
const metricPsKilowatts = 75 * 9.80665 / 1000;
const psSquareOffset = Math.log10(1 / metricPsKilowatts) / 2;

// Full housing widths from Steve's measured specimens, divided by the 250 mm
// graduated length. These change the glass envelope, never the mark offsets.
const plainPlastic = width => ({ cursorFrame: 'clear', cursorLineTone: 'neutral', cursorWidth: width });
const mark = (id, label, offset, scales) => ({ id, label, offset, scales, showLabel: false });
const caption = (id, offset, text, scale, edge = 'top', align = 'center') =>
    ({ id, offset, lines: [text], zone: 'row', scale, edge, align });

function aristoCursor(width) {
    return {
        front: {
            ...plainPlastic(width),
            cursorMarks: [
                mark('aristo-area', 'Circle area (π/4)', -circleOffset, ['A', 'B']),
                mark('aristo-diameter', 'Circle diameter (√(4/π))', circleOffset, ['C', 'D']),
                mark('aristo-ps', 'PS (metric horsepower)', psSquareOffset, ['A', 'B'])
            ],
            cursorCaptions: [
                caption('aristo-kw-caption', 0, 'kW', 'A', 'top', 'end'),
                caption('aristo-ps-caption', psSquareOffset, 'PS', 'A', 'top', 'start')
            ]
        },
        back: {
            ...plainPlastic(width),
            cursorMarks: [mark('aristo-36', '36', folded36Offset, ['DF', 'CF'])],
            cursorCaptions: [caption('aristo-36-caption', folded36Offset, '36', 'DF')]
        }
    };
}

/** Keys identify presets; values are side metadata merged by presets.js.
 * Explicit coverage does not assert every original hairline is reproduced.
 * 2/82N has a documented multi-line cursor, but insufficient readable evidence
 * here fixes its exact per-face geometry. Its auxiliary lines remain deferred.
 * Likewise 2/83N rear/horsepower marks and 0972's 2π pair are not guessed.
 */
export const faberAristoCursors = {
    faber282n: { front: plainPlastic(47 / 250), back: plainPlastic(47 / 250) },
    faber283n: {
        front: {
            ...plainPlastic(47 / 250),
            cursorMarks: [
                mark('faber283-area', 'q (circle area)', -circleOffset, ['A', 'B']),
                mark('faber283-360', '360', folded36Offset, ['DF', 'CF'])
            ],
            cursorCaptions: [
                caption('faber283-q-caption', -circleOffset, 'q', 'A'),
                caption('faber283-d-caption', 0, 'd', 'D', 'bottom', 'end'),
                caption('faber283-360-caption', folded36Offset, '360', 'DF')
            ]
        },
        back: plainPlastic(47 / 250)
    },
    aristo0971: aristoCursor(38 / 250),
    aristo0972: aristoCursor(60 / 250)
};
