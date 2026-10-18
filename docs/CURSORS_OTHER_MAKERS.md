# Thornton, Graphoplex, Hemmi, Flying Fish and UltraLog cursors

The cursor selections below distinguish documented working lines from physical
details that could not be established. Clear and metal frames are screen
representations of the recorded materials. Verified specimen widths are used
where available; the frames are not complete dimensional reproductions.
The AA010's dark line follows the black cursor line described in Thornton's
instructions. Neutral dark hairlines are retained for the other models where
their original ink colour was not verified. Unverified cap lettering is omitted.

## Reviewed selections

| Preset | Working cursor | Evidence and limits |
| --- | --- | --- |
| Thornton AA010 / P221 | One dark line per face; clear plastic frame | The [owner's AA010 catalogue](https://www.steves-sliderules.info/rule%20code/Thornton%20AA010.html), **Cursor** entry, explicitly records one line on each face and an all-plastic cursor. The manufacturer's [instruction manual scan](https://www.scribd.com/document/691638177/BRITISH-THORNTON-SLIDE-RULE-AA010-COMPREHENSIVE-MANUAL-2), **Care and attention — Double sided cursor**, identifies a black line. This selects that specimen configuration; it does not certify every P221 manufacturing variant. |
| Thornton F5100 | One line and clear frame on the front | The [owner's F5100 catalogue](https://www.steves-sliderules.info/rule%20code/Thornton%20F5100.html), **Cursor** entry, records an adjustable plastic cursor on the front only. The programme's plain linked back cursor is a digital aid for its reconstructed reference face, not a second physical window. |
| Hemmi 257 | One line per face; metal frame | The [owner's Hemmi 257 catalogue](https://www.steves-sliderules.info/rule%20code/Hemmi%20257.html), **Cursor** entry, records single hairlines, a metal-framed glass window and plastic runners. Frame proportions, adjustment screws and optical effects are not reproduced. |
| Flying Fish 1017 | One line per face; clear plastic frame | The [owner's 1017 catalogue](https://www.steves-sliderules.info/rule%20code/F-F%201017.html), **Cursor** entry, records a plastic window/runners and single hairlines. [David's specimen catalogue](https://sliderules.nl/mysliderules/detail/flying-fish-1017-ver-2-chemical), **Cursor type**, independently confirms one line on both faces. |
| Graphoplex 690A and 691A | Central line, two long power-conversion lines and one face-specific short line | Uses the manufacturer-documented 690/691 arrangement described below. This is a functional reconstruction; surviving specimen line counts vary. Clear framing follows the [Graphoplex specimen catalogue](https://www.rekeninstrumenten.nl/Publicaties/BOOKS_DVD/1997%20-%20H%20v%20Herwijnen%20-%20Graphoplex%20Blue%20Book.pdf), printed p. 9, **Other** entries. |
| UltraLog | Plain virtual line per face | [Doron’s published proposal](https://www.peterholland.de/ultralog/ultralog.htm) remains the layout attribution. Its exact physical cursor design was not established, so no auxiliary gauges, material-specific frame or cap lettering are asserted. See [UltraLog](ULTRALOG.md). |

## Graphoplex operation and calibration

The primary calibration is the manufacturer's
[690/691 instruction leaflet](https://www.sphere.bc.ca/oldsite/test/graphoplex/690-daniel%20fournier.pdf),
**CURSEUR — Face I / Face II**. The manufacturer's Face I is the emulator's
folded/log-log **Back**; Face II is its square/trigonometric **Front**.

The long left/right lines convert kW to metric horsepower using the leaflet's
printed rounded factor **0.736**. This is a manual-based numerical approximation;
the manufactured line spacing has not been measured. Put the left line on 6 kW on D and read
8.15217 at the right. On A/B, the central/right pair gives the same conversion.
The upper-left short line reads circle area on A/B when the main line gives
diameter on C/D. The back's lower-left short line provides the 3.6 factor between
D and DF. For the leaflet's 3 × 360 example, set that short line on D=3;
the central DF reading is 1.08, restored to 1080 by the decimal convention.

With offset measured from the central line in C/D scale lengths, the independent
mathematical derivation is:

| Line | Offset | Arithmetic check |
| --- | --- | --- |
| Left long | `−log10(1/0.736)/2` | `D(left)/D(right) = 0.736` |
| Right long | `+log10(1/0.736)/2` | `A(main)/A(right) = 0.736` |
| Front short | `log10(π/4)/2` | `A(short) = π D(main)² / 4` |
| Back short | `log10(π/3.6)` | `DF(main) = 3.6 D(short)`, modulo a decimal power |

Short strokes cover the adjacent A/B rows or D alone; these are deliberately scoped
working strokes rather than claims to recover their exact engraved endpoints.
No unverified printed caption is placed on the glass. The descriptive names
appear in auxiliary readouts and tooltips.

## Housing widths

The same owner entries give horizontal cursor widths of 30 mm for Hemmi 257,
38 mm for Flying Fish 1017 and 39 mm for Graphoplex 690A. The
[chemical specimen gallery](https://osgalleries.org/chemical/completegallery.cgi)
records 25 cm scales for the Hemmi; David's 1017 entry explicitly identifies
its 25 cm scale length. The
[690A collection entry](https://www.sliderules.info/collection/10inch/030/1030-graphoplex-690a.htm)
records a 25 cm scale length. Accordingly their housing widths are 0.12, 0.152
and 0.156 of the engraved track. Thornton's AA010 owner records a 39 mm cursor;
the manufacturer's [instruction manual scan](https://www.scribd.com/document/691638177/BRITISH-THORNTON-SLIDE-RULE-AA010-COMPREHENSIVE-MANUAL-2),
**Introduction**, specifies its 25 cm range. This likewise gives a width of 0.156.
The renderer expands a housing if required to
contain calibrated lines and its screen edge allowance. Heights, screw positions
and corner radii remain adapted to the screen. Widths for the other three
models were not established and are not inferred from overall body length.

## Evidence boundaries and verification

The [690A owner catalogue](https://www.steves-sliderules.info/rule%20code/Graphoplex%20690a.html)
reports five lines on one face and three on the other. Another
[690A owner catalogue](https://sliderules.nl/mysliderules/detail/graphoplex-690-a-neperlog-log-log)
reports three principal lines with three peripheral marks. These counts are not
silently equated with the manufacturer's documented working arrangement.
The [W. K. Robinson specimen inventory](https://www.oughtred.org/jos/robinson-hyperbolics-dec06.html),
entry **37b**, describes an extra right-side circle-diameter line on a 691A.
It calls the rear commercial mark right-sided, contrary to the manufacturer's
worked example, which fixes the left-sided offset implemented here. The two
emulator presets use the same explicit manual-based subset; the extra specimen
line is not silently inferred for both instruments.

For this review, catalogue text and indexed manufacturer text were readable.
Remote photograph and PDF screenshot requests returned no viewable image data;
therefore this review does **not** claim fresh visual confirmation of the source
photographs. No source artwork is redistributed. Exact ink colours, screws,
corner profiles, unestablished dimensions and extra specimen-specific marks remain outside
the verified reproduction.

`tests/unit/cursors-other-makers.test.js` checks the selected single-line models,
historical power conversion, circle areas, the manufacturer's folded-scale
example, the proper short-stroke row scopes and independent configuration
objects. Shared cursor tests cover dragging, clipping, persistence and row edits.
