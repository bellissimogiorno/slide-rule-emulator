# Faber-Castell and Aristo cursors

These reconstructions add the auxiliary hairlines whose calibration and row
scope can be established from readable manufacturer instructions. They remain
partial reproductions. Transparent plastic frames and neutral hairlines are
screen treatments; exact pigments, fittings, vertical dimensions and typography have
not been established by direct photographic inspection in this review.

## Implemented coverage

| Preset | Emulator front | Emulator back | Deliberately deferred |
| --- | --- | --- | --- |
| Faber-Castell 2/82N | Main hairline; clear plastic treatment | Main hairline; clear plastic treatment | Original auxiliary cursor geometry is not yet established |
| Faber-Castell 2/83N | Area q on A/B; 360 on DF/CF | Main hairline; clear plastic treatment | Rear q/d and CI volume lines; horsepower pair; supplementary edge lines and variant ST mark |
| Aristo 0971 | Circle-area A/B and diameter C/D marks; metric PS conversion on A/B | 36 on DF/CF | Fine graphic details and English-HP replacement-cursor variant |
| Aristo 0972 | Circle-area A/B and diameter C/D marks; metric PS conversion on A/B | 36 on DF/CF | Additional interrupted 2π pair; fine graphic details and English-HP variant |

The 2/82N **does have a multi-line original cursor**. Retaining only the main
line here records an evidence gap, not a historical claim that its cursor had
one line. The Mathema cursor is unchanged.

The housing's horizontal width follows measured specimen dimensions, scaled
against the 250 mm graduated track: **47 mm** for each Faber, **38 mm** for the
0971, and **60 mm** for the 0972. These proportions do not alter calibration.
Clear plastic edge bars, touch targets and minimum screen sizes are adapted
for the emulator; this is not a model of every moulded part or cursor variant.

## Calibration

Let `p` be the main-hairline position as a fraction of the index-to-index
track. The emulator's fundamental readings are `D(p) = 10^p`,
`A(p) = 10^(2p)`, and `DF(p) = π × 10^p`, with the folded scale reduced
to its displayed decade. Decimal placement is the user's responsibility.

| Mark | Offset from the main line | Rows | Calculation |
| --- | --- | --- | --- |
| Circle area, left | `log10(π/4)/2` | A, B | Set diameter d on C/D at the main line; auxiliary A/B reads `πd²/4` |
| Circle diameter, right (Aristo) | `log10(4/π)/2` | C, D | Set area q on A/B at the main line; auxiliary C/D reads `√(4q/π)` |
| PS, upper right (Aristo) | `log10(1/0.73549875)/2` | A, B | Set kilowatts at the main line; auxiliary A/B gives metric horsepower |
| 360 (Faber) / 36 (Aristo) | `log10(3.6/π)` | DF, CF | Read `3.6 ×` the main C/D value, allowing powers of ten |

The `/2` is essential for the A/B marks: those rows cover two decades across
one track. Applying a C/D conversion offset to A/B would square the intended
factor. Metric horsepower is `75 × 9.80665 W = 735.49875 W`; it is labelled
**PS**, not the different English mechanical horsepower. The Aristo manual's
rounded checks are 20 kW → 27.2 PS and 7 PS → 5.15 kW.

Short lines are bound to named rows, not arbitrary pixel heights. The
2/83N's A and B rows are separated by DF/CF, so its q mark is interrupted.
The corresponding Aristo pairs are adjacent and form continuous short
strokes. None of these auxiliary lines extends through the log-log or
hyperbolic banks. Captions add no readings and no additional hairlines.

For the speed example, put 150 on DF under the 360 or 36 mark and read
41.666… on D under the main line: **150 km/h = 41.666… m/s**. A transcription
of the Faber manual incorrectly renders the output unit as inches/second;
the conversion factor and dimensional check determine the correct unit.

## Evidence and remaining gaps

1. [Faber-Castell 2/83N manufacturer instructions, “The Cursor”](https://udel.edu/~mm/sliderule/manuals/2-83N/manual/)
   establish the front q and 360 operations. They also describe a rear
   diameter line on W1/W2 and an area line on C/D, a CI line for cylinder
   calculations, and a lower horsepower pair. The rear area pair's separation
   is `log10(4/π)`; that relationship alone does not fix either line's position
   against the central line. The unreadable illustration cannot justify
   arbitrarily centring the pair. The horsepower pair is also deferred.
2. [Aristo 0971 manufacturer instructions](https://www.rechenschieber.org/wordpress/wp-content/uploads/2021/05/Aristo-0971-Hyperbolog-Anleitung-von-Johann-Kaeser.pdf),
   printed pages 25–26 (PDF pages 25–26), sections 15.1–15.3, specify the
   36 mark, the two circle marks, their scales, and the kW/PS conversion.
   The instructions identify a distinct English-unit replacement cursor.
   The manual calls the folded/log-log face “front”; the emulator retains its
   established front/back labels, with the hyperbolic face first.
3. [Aristo 0971/0972 manufacturer instructions](https://www.rekeninstrumenten.nl/Sliderule-Simulator-or-Emulator/react_resources/Aristo/Hyperbolog%20%26%20Hyperlog%20Instructions.pdf),
   printed pages 53–55, sections 24.1–24.4, describe the common cursor
   operations and the 0972's additional interrupted 2π lines. Retrieved text
   contains contradictory left/right wording in the 2π instructions. A clear
   view of figure 93 is required to fix both lines' positions before adding
   them. Figure 94 and the metric examples support the common front marks;
   PS specimens are also recorded by the museum below.
4. [ISRM Aristo specimen records](https://www.sliderulemuseum.com/Aristo.shtml)
   identify PS/kW cursors on both numbered models. [Rod Lovett's 0972 record](https://sliderules.lovett.com/aristohyperlog0972/details.htm)
   independently records a plastic cursor and four lines on each face.
   Counts from different records need not count interrupted strokes alike.
5. [The 1962 Faber 2/82N/62/82N manufacturer manual](https://www.rechenschieber.org/wordpress/wp-content/uploads/2018/08/FC_2_82_N__62_82_N.pdf)
   remains the preset's scale-layout source. Its cursor illustration was not
   available for direct inspection during this review. The [ISRM specimen](https://www.sliderulemuseum.com/Faber.shtml)
   lists 360, d, A, kW and PS cursor marks but does not establish each mark's
   geometry. The English PDF often linked with `2-82N` in its filename
   describes a different scale arrangement; its filename is not evidence
   that its cursor matches this N-model.
6. Steve's primary specimen descriptions give full cursor dimensions for
   [2/82N](https://www.steves-sliderules.info/rule%20code/F-C%202-82N.html),
   [2/83N](https://www.steves-sliderules.info/rule%20code/F-C%202-83N.html),
   [0971](https://steves-sliderules.info/rule%20code/Aristo%200971.html), and
   [0972](https://www.steves-sliderules.info/rule%20code/Aristo%200972.html).
   The first dimension runs along the scales; the second exceeds the body
   width because the cursor surrounds it. The documented 250 mm graduation
   lengths, rather than the longer overall body lengths, set the proportions.
   These are representative specimen measurements. In particular, the 0971
   description has an HP variant, while the emulator uses documented PS
   calibration; identical mould dimensions across every variant are not
   asserted.

Reference photographs and scans are not redistributed. The tests in
`tests/unit/cursors-faber-aristo.test.js` check the actual scale mappings,
manual examples, reciprocal conversions, folded-decade crossings, and
interrupted-versus-continuous row geometry.
