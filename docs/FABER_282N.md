# Faber-Castell 2/82N

Choose **Faber-Castell 2/82N** in the Layout preset bar above the rule and press **Load preset**. The
Both sides button displays both faces with a shared slide and cursor. Export an
important customised programme before replacing its layout.

## Source and model identity

This preset follows the manufacturer's 1962 German instructions for the
**2/82N and 62/82N**, not the later 24-row 2/82 arrangement. The scanned
[manufacturer manual](https://www.rechenschieber.org/wordpress/wp-content/uploads/2018/08/FC_2_82_N__62_82_N.pdf)
lists the front and back on printed pages 3 and 4 (PDF page 2). The cover
identifies the N models. Printed pages 15-17 explain P and the angular scales.
No scans are redistributed in this repository.

## Scale order

The table runs from the top edge to the bottom edge of each face. A prime marks a
scale on the movable slide; the front sine and reverse cube scales are important
distinctions of this arrangement.

| Face | Upper stator | Slide | Lower stator |
| --- | --- | --- | --- |
| Front | T1, T2, L, A | B, BI, CI, S', C | D, S, ST, P |
| Back | LL03, LL02, LL01, K, DF | CF, K', CIF, CI, C | D, LL1, LL2, LL3 |

There are **13 front and 14 back physical rows**. S, S', T1 and T2 print
complementary angles in black and red around shared ticks: the readings sum to
90 degrees. Black is the sine/tangent argument, red the cosine/cotangent
argument. T2 is the high-tangent range; it is not an inverse scale simply
because the generic library's T2 uses red ink. The P scale decreases from left
to right and is red, as specified on printed page 15.

The library IDs `FC282_S`, `FC282_SP`, `FC282_T1`, `FC282_T2`, `FC282_KP`
and `FC282_P` provide independently selectable rows. They reuse established
mathematical mappings rather than introducing duplicate numerical code.

## Worked checks

The manual's example on printed page 17 is sin(41 degrees) multiplied by
sin(23 degrees), approximately **0.2562**. Align the right index of C with 41
on the fixed S scale, then move the cursor to 23 on the sliding S' scale. Read
2.563... on D and supply the decimal place to obtain approximately 0.2563
(the independently evaluated value is about 0.256342684753...). The printed answer
is approximate; the emulator does not force its calculation to the printed
rounding.

An independent cube-scale example: on the back align K' = 1 with K = 8.
Put the cursor at K' = 27 and read K = 216 and D = 6. This illustrates the
paired cube scales; decimal placement remains the user's responsibility.

An independent complementary-square check: at D = 8, interpreted as 0.8,
P reads 0.6, because the squares of 0.8 and 0.6 sum to 1.

## Reconstruction limits

The preset reproduces the documented row order, main index-to-index mathematical
relationships, complementary angular numbering and reverse P ink. It is not a
photographic facsimile. Original end extensions, the full set of special gauge
marks, physical reference tables and auxiliary cursor hairlines have not all
been reproduced. Its measured-width clear cursor housing retains the main
hairline; the original multiline geometry is unresolved, as documented in
[the cursor guide](CURSORS_FABER_ARISTO.md). The instrument uses the emulator's standard Faber-style finish
and adaptive, mathematically positioned graduations.

Tests in `tests/unit/faber282n.test.js` verify the order, independent sine/tangent
identities at 501 positions, complements, cube products and the manual's sine
example. `tests/browser/reaudit.py` checks both faces, paired geometry, exports,
retained readout nodes and responsive presentation.
