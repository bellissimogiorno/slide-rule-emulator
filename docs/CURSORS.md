# Instrument cursors

The cursor review covers all **25 presets and 50 faces**. Manufacturer
instructions establish the conversion geometry; specimen descriptions establish
line counts and materials. The [complete review matrix](data/cursor-review.json)
records each face and its remaining limitations. The Mathema additionally has
the supplied close-up and duplex specimen photograph as direct visual evidence.

## Current reproduction

| Instrument | Cursor treatment | Detailed evidence |
| --- | --- | --- |
| Faber-Castell 2/82N | Clear housing and main line; exact auxiliary positions remain unresolved | [Faber-Castell and Aristo](CURSORS_FABER_ARISTO.md) |
| Faber-Castell 2/83N | Front circle-area and folded 360 marks; additional original lines remain unresolved | [Faber-Castell and Aristo](CURSORS_FABER_ARISTO.md) |
| Faber-Castell 2/84N Mathema | Exponent banks, pi gauges, scoped strokes, caps and photographic lettering | [Mathema](MATHEMA.md) |
| Aristo 0971 and 0972 | Circle-area, metric power and folded 36 marks; additional 0972 interrupted marks remain unresolved | [Faber-Castell and Aristo](CURSORS_FABER_ARISTO.md) |
| Graphoplex 690A and 691A | Manufacturer-documented power lines, circle-area line and folded conversion line | [Other makers](CURSORS_OTHER_MAKERS.md) |
| Pickett N3, N4, N16, Model 14 and Model 17 | Documented single lines and clear housings | [Pickett and K&E](CURSORS_PICKETT_KE.md) |
| K&E 68-1100 Deci-Lon | Documented red single lines and metal-style housing | [Pickett and K&E](CURSORS_PICKETT_KE.md) |
| Thornton AA010 / P221 | Selected AA010 specimen's single lines and clear housing | [Other makers](CURSORS_OTHER_MAKERS.md) |
| Thornton F5100 | Front single line and clear housing; virtual cursor on the emulator's reference back | [Other makers](CURSORS_OTHER_MAKERS.md) |
| Hemmi 257 | Single lines and metal-style housing | [Other makers](CURSORS_OTHER_MAKERS.md) |
| Flying Fish 1017 | Single lines and clear housing | [Other makers](CURSORS_OTHER_MAKERS.md) |
| UltraLog | Plain virtual cursor; physical auxiliary design unverified | [Other makers](CURSORS_OTHER_MAKERS.md) |
| Seven mathematical laboratories | Plain digital cursors appropriate to their invented layouts | Complete review matrix above |

These choices do not imply that every production-year variant had the same
cursor. In particular, the Graphoplex implementation follows the manufacturer's
explicit working arrangement; specimen descriptions report differing line
counts. The 2/82N remains a partial cursor reproduction. A partly readable
manual for another model is insufficient to supply its missing line positions.

## Using the markings

Select an instrument and press **Load preset** to load its complete cursor profile.
The **Cursor appearance** menu beside **Scale layout** controls its displayed
shape and hairline colour on both faces. The small arrow in the **Cursor** position
box opens the same menu. Choose **Minimal** and **Red** for the
simple narrow cursor. Minimal shows only the main line and its readings;
selecting **Instrument** restores all authored marks and captions. These two
shape buttons sit above the named colour buttons. [Appearance settings](APPEARANCE.md#cursor-appearance)
are saved with the programme and retained when loading a layout preset.
Existing saved programmes retain their own geometry; save customised work
before replacing it with a catalogue preset. **Both sides** keeps both cursor
windows linked. Drag a main grip, marked auxiliary line or cap; all marks move
as one assembly.

When auxiliary marks are displayed, each auxiliary readout names its mark. Its value comes from that mark's actual
position on the selected row; it is not a second calculation applied to the
main-line readout. Off-scale positions remain off scale. Decimal powers must
still be supplied by the operator, as with ordinary slide-rule arithmetic.
The manufacturer guides linked above give independent worked examples and
identify which line is the input and which is the result.

Only the documented scale families receive short working marks. Moving or
duplicating those rows in the editor moves or duplicates their stroke segments.
Unrelated intervening rows split a short stroke; removing every applicable row
removes it. Long lines retain their ordinary full-height geometry. Changing
scale order can alter the original calculation workflow, even though the
individual readings remain mathematically correct.

## Visual and calibration limits

The scale-length fractions of functional marks are mathematical calibrations.
Frame bars, corners, opacity and lettering size are adapted for the screen.
Published cursor widths, where used, provide approximate proportions against
the stated scale length; they do not make the screen rendering a dimensional
replica. Lens refraction and hardware are not simulated.

The remote images requested during this cursor review were not available as
viewable pixels. The manufacturer text and specimen descriptions remain useful
evidence, but they do not verify fine stroke endings, unknown captions, pigment
or every production variant. Those unresolved details are identified in the
individual guides rather than filled in by analogy with another instrument.
No third-party photograph or scan is redistributed.

## Maintenance and verification

`src/catalog/cursors/` holds the researched profiles. `src/catalog/presets.js`
combines them with the scale layouts before the public catalogue is frozen.
The Mathema's detailed cursor remains alongside its dedicated scale layout.
Frame, line, width and caption metadata are part of each programme face and
are preserved by JSON export/import, configured HTML and layout editing.

Manufacturer suites check independent conversion identities and examples;
`cursor-review.test.js` checks complete review coverage and current examples.
The native `npm run test:cursors` runner checks actual rendered positions,
dragging, magnification, loupe geometry and exports when Chromium is available.
Consult the handover's current verification reports for which checks actually
ran; a test script alone is not an execution result.
