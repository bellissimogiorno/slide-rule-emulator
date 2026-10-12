# Graphoplex 690A and 691A

Select **Graphoplex 690A Neperlog** or **Graphoplex 691A Neperlog Hyperbolic**,
then **Load preset**. **Both sides** shows the two faces with linked slide and
cursor positions. These are distinct, independently editable presets.

## Source photographs take precedence

The primary layout references are the photographs supplied with the request:
[690A](https://www.sliderulemuseum.com/Graphoplex/Graphoplex_690A_Neperlog.jpg) and
[691A, Rod Lovette collection](https://www.sliderulemuseum.com/Graphoplex/Graphoplex_691A_Neperlog_RodLovetteCollection.jpg).
The upper photographed face is called Front in the emulator. Some catalogues
call the log-log face Front instead; this does not reverse any scale coordinate.

```
690A front: LL00 L T>45 A [ B T<45 S&T S C ] D P DI LL0
691A front: L P Ch A      [ B T<45 S&T S C ] D Th Sh2 Sh1
Both backs: LL01 LL02 LL03 DF [ CF CIF K CI C ] D LL3 LL2 LL1
```

Each face has thirteen physical rows (4 upper + 5 slide + 4 lower).
The supplied 691A photograph includes **Ch**, and places **Sh2 before Sh1**.
The museum's text summary omits Ch and reverses Sh1/Sh2: it is not used to
silently override the actual specimen. The separate [catalogue transcription](https://www.rekeninstrumenten.nl/pages%20and%20pictures/GRAPHOPLEX.htm)
agrees with the photographed arrangement.

## Degrees/minutes versus decimal degrees

The [Graphoplex manufacturer instructions](https://www.sliderulemuseum.com/Manuals/M166_refS458_Graphoplex_690A_Neperlog1964.pdf)
were inspected as page images, especially the trigonometry section. The later
[690/691/692 instructions](https://www.carnets-tsf.fr/docs/Notice_emploi-Graphoplex-69x.pdf)
were available as indexed text, including the explicit distinction between
sexagesimal 690 angles and decimal-degree 691 angles. Direct retrieval of that
later PDF failed; the older 1964 manual is not passed off as the later manual.

The 690A uses a degree/minute lattice in Conventional mode and displays
sexagesimal captions and readouts: `0 degrees 40 minutes` means 2/3 degree,
not 0.40 degree. Seconds are displayed where needed, rounded to 0.01 second
with correct carrying. That display precision is not an accuracy claim.

The 691A uses round decimal-degree graduations and decimal-degree readouts.
Both instruments' black and red angular readings **sum to 90 degrees**. They
share ticks but are not reciprocal numbers. Their numerical sine/cosine or
tangent/cotangent values are read against the number scale.

These conventional candidates follow degree/minute and decimal conventions;
they are not a photographic tracing of every stroke. Fully adaptive mode
chooses round *decimal-degree* positions even on the 690A, with those positions
still captioned in unambiguous degrees/minutes/seconds. Switch to Conventional
to retain the sexagesimal lattice. All stored mathematical values and custom
angle inputs are decimal degrees, regardless of caption notation.

## Relationships and worked checks

For the main graduated interval, with `d = 10^p` on D:

| Row | Value at coordinate p |
| --- | --- |
| S | asin(d/10), in degrees; the red angle is its complement |
| T<45 | atan(d/10), in degrees |
| T>45 (690A only) | atan(d), in degrees |
| S&T | (180/pi) * d/100 degrees, the small-angle radian approximation |
| P | sqrt(1-(d/10)^2) |
| Ch | acosh(d) |
| Sh1 | asinh(d/10) |
| Sh2 | asinh(d) |
| Th | atanh(d/10), stopping at argument 3 before the singularity |

For example, S at 35 degrees corresponds to 0.573576... on the 0.1-1 number
reading. T<45 at 27 degrees corresponds to 0.509525..., and T>45 at 80 degrees
30 minutes corresponds to 5.975764.... These agree with the manual's rounded
examples without treating minutes as hundredths of a degree.

The 690A includes all eight natural log-log ranges LL00...LL03 and LL0...LL3.
The 691A substitutes its hyperbolic rows and retains the six ranges on the
reverse. Positive and corresponding negative exponential values multiply to
one. The four hyperbolic identities and log-log values have independent tests.

C carries the arc-conversion dividers rho-prime, rho-double-prime and rho-cc.
Their tooltips distinguish the full constants from their decimal-scaled C
positions: 3437.74677 arcminutes, 206264.80625 arcseconds and 636619.77237
centesimal seconds per radian. Centesimal seconds are 1/10000 gon, not
sexagesimal arcseconds. These constants are also described in the manual.

## Scope and implementation

All new rows have `GP_`, `GP690_` or `GP691_` IDs. Formulae and short explanations
appear at the ends, not as row-wide popups over the working graduations.
The joined angular rows use the existing paired-angle renderer. Opt-in
`angleNotation: "sexagesimal"` formatting is shared between ticks and readouts;
validation requires a paired angular scale with degree units.

Only the main index-to-index intervals are reconstructed. The original rules'
end extensions, all special gauges, accessory tables, exact typography and
multiple auxiliary cursor lines are not reproduced. There are no copied
manufacturer images or fonts. White paper and grey braces are a visual
approximation. No change is made to the emulator's calibration of other presets.
