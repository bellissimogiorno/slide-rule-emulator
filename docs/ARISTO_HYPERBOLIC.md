# Aristo 0971 HyperboLog and 0972 HyperLog

Choose either model in **Layout preset**, then press **Load preset**. Both
models are in **Classic instruments**, together under Aristo. **Both sides**
shows the two faces with a shared slide and cursor. Importable examples are
`examples/aristo0971-both.json` and `examples/aristo0972-both.json`.

## Sources and scale order

The manufacturer's
[HyperboLog / HyperLog instructions](https://www.sliderulemuseum.com/Manuals/Aristo_971Hyperbolog_972Hyperlog%20Instructions.pdf)
describe the instruments and their scale families. The contents locate the
arrangements on printed pages 7 and 9, P and H on pages 19–20, and the hyperbolic
functions on pages 37–39. A
[second copy of the manual](https://rekeninstrumenten.nl/Sliderule-Simulator-or-Emulator/react_resources/Aristo/Hyperbolog%20%26%20Hyperlog%20Instructions.pdf)
is available at Rekeninstrumenten. No source scans are included in this package.

Row order was cross-checked against the
[International Slide Rule Museum's specimen catalogue](https://sliderulemuseum.com/Aristo.shtml),
[C. Hamann's 0971 specimen record](https://public.bht-berlin.de/hamann/sliderules/arihyp1.html)
and [Rod Lovett's 0972 specimen record](https://sliderules.lovett.com/aristohyperlog0972/details.htm).
These records put **ST above S**. The
[sliderules.info 0972 text list](https://www.sliderules.info/collection/10inch/100/1109-aristo-0972.htm)
puts S above ST; that inconsistent transcription is not used. Collectors differ
in which face they call front. Here the hyperbolic/trigonometric face is front
and the folded/log-log face is back.

Each list runs from top to bottom. Bracketed rows in source descriptions are
on the movable slide; the table makes those boundaries explicit.

| Model and face | Upper stator | Slide | Lower stator |
| --- | --- | --- | --- |
| 0971 front | Th, K, A | B, T, ST, S, C | D, DI, Sh2, Sh1 |
| 0971 back | LL01, LL02, LL03, DF | CF, CIF, L, CI, C | D, LL3, LL2, LL1 |
| 0972 front | H2, Sh2, Th, K, A | B, T, ST, S, P, C | D, DI, Ch, Sh1, H1 |
| 0972 back | LL00, LL01, LL02, LL03, DF | CF, CIF, L, CI, C | D, LL3, LL2, LL1, LL0 |

There are **25 physical rows** on the 0971 (12 front, 13 back) and **31** on the
0972 (16 front, 15 back). T, ST and S each print two angle readings against shared
ticks. Counting those readings separately yields a different total; it does
not indicate missing physical rows.

## Mathematical calibration

Let `p` run from zero at the left index to one at the right index, and let
`d = 10^p` be the displayed mantissa on fixed D. Hyperbolic arguments are
dimensionless; they are not angles in degrees. The following relationships
hold with the slide aligned; the hyperbolic rows themselves are all fixed.

| Scale | Reading at position `p` | Equivalent operating relationship |
| --- | --- | --- |
| Sh1 | `asinh(d/10)` | Set argument `u` on Sh1; D/10 gives `sinh(u)` |
| Sh2 | `asinh(d)` | Set `u` on Sh2; D gives `sinh(u)` |
| Th | `atanh(d/10)` | Set `u` on Th; D/10 gives `tanh(u)` |
| Ch | `acosh(d)` | Set `u` on Ch; D gives `cosh(u)` |
| H1 | `sqrt(1 + (d/10)^2)` | Set `x = d/10` on D; read the hypotenuse on H1 |
| H2 | `sqrt(1 + d^2)` | Set `x = d` on D; read the hypotenuse on H2 |

H1 and H2 display the result of the square-root expression. They do not display
the argument of sinh. Their main intervals are `sqrt(1.01)` to `sqrt(2)` and
`sqrt(2)` to `sqrt(101)`, so their branch endpoints agree exactly. Ch starts at
zero when D is one. Sh1 ends where Sh2 begins, at `asinh(1)`.

Th ends at argument **3**. Its last position is
`log10(10*tanh(3))`, approximately `0.997847`, where D/10 is approximately
`0.995055`. It does not extend to the right D index: reaching a hyperbolic
tangent of one would require an infinite argument. The digital readout says
**off scale** in the remaining gap, and no tick is generated outside this
finite domain.

On T, ST and S, the black angle and red angle add to 90 degrees. On T and S,
black is the tangent/sine argument; red is the cotangent/cosine argument.
The manufacturer's section 15 (printed page 22) specifies ST in radian measure.
For a black reading `theta` in degrees, `C/100 = theta*pi/180`; sine and tangent
are approximated by this radian value. The principal interval is therefore
`180/(100*pi)` to `180/(10*pi)` degrees, approximately 0.572958 to 5.729578.
The red complements supply the corresponding cosine/cotangent approximation.
Original end extensions beyond that interval are omitted.

On the 0972, P is
on the **slide**, so its complementary-square relationship follows C if the
slide is moved. When aligned, D interpreted as 0.8 gives P = 0.6.

The back uses natural exponential log-log ranges. LL0 through LL3 read
`exp(k*d)` for `k = 0.001, 0.01, 0.1, 1`; LL00 through LL03 read their
reciprocals `exp(-k*d)`. The 0971 has the three ranges starting with `k = 0.01`;
the 0972 also includes the two ranges closest to one. CF/DF fold at pi, and
CIF is the reciprocal folded scale.

## Independent worked checks

These are mathematical checks of the emulator, not transcriptions of rounded
manual answers.

| Setting | Reading |
| --- | --- |
| Sh1 = 0.5 | D/10 = 0.5210953055… |
| Sh2 = 2 | D = 3.6268604078… |
| Ch = 2 | D = 3.7621956911… |
| Th = 1 | D/10 = 0.7615941560… |
| ST = 3 degrees | C/100 = pi/60 = 0.05235987756… radians |
| D = 7.5, interpreted as `x = 0.75` | H1 = 1.25 |
| D = 2.4 | H2 = 2.6 |
| C = 8 | P = 0.6, regardless of slide offset |

## Scope and verification

The presets implement the documented physical row arrangement and main
index-to-index mathematical relationships, using the emulator's neutral
appearance. They do not reproduce the complete original end extensions,
casing, reference tables, yellow bands or full gauge inventory. The documented
circle, metric-PS and folded 36 cursor marks are included. The 0972 interrupted
2π marks and finer physical details remain unresolved; see
[the cursor guide](CURSORS_FABER_ARISTO.md). Generated graduations are mathematically positioned; they are not
a photographic transcription of every engraved stroke.

The ten `ARISTO_` scale IDs provide model-specific labels, help, paired angular
readings and red P ink without changing the generic definitions. The numerical
mappings are shared with the core and tested independently in
`tests/unit/aristo-hyperbolic.test.js`: exponential definitions of all four
hyperbolic functions, both hypotenuse identities and branch boundaries, the
finite Th endpoint and off-scale readout, paired-angle identities, the radian
calibration and complementary angles of ST, moving P,
log-log reciprocals, generated ticks, exact row order and example imports.
