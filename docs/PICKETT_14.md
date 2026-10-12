# Pickett Model 14

Select **Pickett 14 U.S. Military / Artillery** in Scale layout and press
**Load preset**. **Both sides** shows its two faces together. A previous saved
programme is not silently replaced when the application is updated.

This preset reconstructs the historical instrument's mathematical scales for
collection, demonstration and general calculation. It is not a ballistic or
fire-control calculator and contains no projectile model, firing tables or
weapon-specific corrections.

## Sources and arrangement

The Smithsonian's collection record identifies the two faces and their stock /
slide placement. Steve Seale's specimen photographs show the scale lettering,
paired black/red readings and the shorter opposite-angle rows. The face names
in this application follow Seale's general-front / special-back convention;
the Smithsonian describes the special face as the front.

| Face | Upper stator | Slide, in order | Lower stator |
| --- | --- | --- | --- |
| General | LL1, LL2, A | B, T, ST, S, K, C | D, LL3, LL4 |
| Degrees / mils | Opposite angle: degrees, mils | Apex angle: mils, degrees; TAN, SIN-TAN, SIN, Base C | Distance D, A |

The four LL rows use the existing shared-tick base-10 Pickett ranges. Their
positive and reciprocal values share each graduation. The angular pairs are
**not reciprocals**: the black and red values are complementary or supplementary
angles and likewise share one graduation, rather than separate scales.

Sources:

- [Smithsonian collection record, Pickett 14 Military Duplex Slide Rule](https://americanhistory.si.edu/collections/nmah_1214520).
- [Steve Seale's Model 14 specimen and scale inventory](https://www.steves-sliderules.info/rule%20code/Pickett%20Model%2014.html), with [general face](https://www.steves-sliderules.info/rule%20images/Pickett%20Model%2014%20Front.jpg) and [degree/mil face](https://www.steves-sliderules.info/rule%20images/Pickett%20Model%2014%20Back.jpg).
- [Tom Bullock's collection](https://www.tbullock.com/sliderule.html) and its [detail photograph](https://www.tbullock.com/images/SR/sr-us-f.jpg).
- Pickett & Eckel, [How to Use Log Log Slide Rules](https://www.sliderulemuseum.com/Manuals/M76_Pickett_HowToUseLogLogSR_1953.pdf), printed pp. 38-43: shared sine/cosine graduations, complementary tangent readings, ST approximation and minute/second reference marks. This is a general Pickett manual, not a Model 14-specific instruction sheet.

Photographs and manufacturer texts are referenced, not redistributed as part
of the MIT-licensed application.

## Mathematical conventions

There are **6400 mils in one turn**. A right angle is 1600 mils; these are not
milliradians. Angles in the formulae below are evaluated in radians after
conversion from the printed unit: degrees times pi/180, mils times pi/3200.
Here `p` is a fraction of the main C/D scale length, not a measured angle.

| Printed scale | Position relation | Main displayed interval |
| --- | --- | --- |
| Opposite degrees / mils | `p = log10(2 sin(angle))` | 30-90 degrees / 533.333...-1600 mils |
| Red supplementary reading | Same tick, `180 - angle` or `3200 - angle` | 150-90 degrees / 2666.666...-1600 mils |
| Apex degrees / mils | `p = log10(20 sin(angle))` | asin(0.05) to 30 degrees, or equivalent mils |
| T / TAN | `p = log10(10 tan(angle))` | atan(0.1) to 45 degrees, or equivalent mils |
| S / SIN | `p = log10(10 sin(angle))` | asin(0.1) to 90 degrees, or equivalent mils |
| Red T/S readings | Same tick, `90 - angle` or `1600 - angle` | Complementary angle |
| ST / SIN-TAN | `p = log10(100 angle_in_radians)` | 0.01 to 0.1 radians |
| Base C | `value = 100 times 10^p` | 100-1000 |
| Distance D | `value = 1000 times 10^p` | 1000-10000 |

The opposite-angle scales occupy only `log10(2)`, approximately 30.103%, of a
main decade. Their common baseline ends there; it is **not stretched** to fill
the row. A cursor beyond it reads **off scale**, not an extrapolated angle.

ST and SIN-TAN are the small-angle radian approximation, not an exact sine or
tangent. Their approximation becomes less accurate towards the large-angle
end. The existing generic ST definition is unchanged.

The 16 `P14_` definitions are independently selectable in the library. Angular
pairs use the general `pairedSum` presentation property. The scalar map still
returns the primary angle; the second displayed angle is `pairedSum - value`.
A pair cannot be nested in a generic two-layer row, which would otherwise lose
its second reading. Definitions and implementation live in
`src/catalog/scales/pickett14.js` and `src/core/paired-angles.js`.

## Fidelity boundaries

This is an **index-to-index mathematical reconstruction**, not a dimensional
facsimile or a transcription of every printed mark. The photographs include
end extensions beyond the principal arithmetic indices; those extensions are
not reproduced. The main opposite-angle origin is sin(30 degrees) = 0.5 and the
apex origin is sin(angle) = 0.05. Do not confuse an end-extension angle with a
new zero for the main decade.

Numerical positions use full mathematical precision. The renderer selects
round-number subdivisions and a collision-free subset of labels for the current
screen width. It does not copy every original minor tick or the original
side-by-side numeral typography. Paired numbers are printed above and below a
single tick set, with increasing values in black and decreasing values in red.
The compact number-packing option remains available.

No claim is made that every serial-number variant had identical gauge placement.
Gauge meanings and the distinction between a constant and its decimal-scaled
mark are documented in [CONSTANT_MARKS.md](CONSTANT_MARKS.md).
