# Graduation design

Graduations are engraving, not the mathematical definition of a scale. Changing
their density never changes a position mapping, a digital reading, cursor/slide
coordinates, or an imported scale's units. Scale explanations remain at the ends;
working over the graduations does not open scale-wide help.

## Choose a mode

In **Scale layout**, set **Graduations** to **Conventional** or **Fully adaptive**.
The choice is saved in Programme JSON and standalone copies, and survives preset
changes. Existing programmes that omit the choice use Conventional.

The mode selector stays visible. Beside it, one shared options slot shows
**C/D + W** in Conventional mode or **Adaptive detail** in Fully adaptive
mode. The inactive menu is hidden, including its label, and skipped by keyboard
navigation. Both settings are retained when switching modes, changing presets,
or saving and reopening a programme.

**Conventional** retains each family's established generator, with a documented
Faber W reference pattern and coherent long-scale planning for expanded roots.
**C/D + W** controls complete ordinary and folded log decades as
well as W1/W2 and their primed counterparts. The C/D intervals are:

| C/D choice | 1–2 | 2–4 | 4–10 |
|---|---:|---:|---:|
| 5-inch pattern | 0.02 | 0.05 | 0.1 |
| 10-inch pattern | 0.01 | 0.02 | 0.05 |
| 20-inch pattern | 0.005 | 0.01 | 0.02 |

The C/D Adaptive choice selects one complete pattern per region at a three-CSS-
pixel target. It has a pocket-pattern floor; fixed patterns preserve their strokes
at all display sizes. These names specify patterns, not measured screen inches.
They are not universal specifications for every make or every kind of scale.

**Fully adaptive** applies a common screen-spacing policy to all automatically
graduated continuous scales: ordinary and inverse logs, folded logs, A/B, K,
fifth powers, expanded roots, S/T/ST/P, hyperbolic, log-log, linear, temperature,
pressure, correction and radiation scales. Composites and divided rows pass the
same settings to their children. Pickett reciprocal labels still share their
single graduation; root branches still meet their existing shared spines.

**Adaptive detail** sets a preferred minimum separation between regular marks:

| Detail | Target in CSS pixels | Use |
|---|---:|---|
| Clear | 4.5 | More open engraving; a smaller display or tired eyes |
| Balanced | 3 | General use |
| Fine | 2 | More detail on a display that resolves it comfortably |

These targets are design choices, not manufacturer dimensions or guarantees about
vision. CSS pixels are used rather than raw device pixels, so a high-DPI display
does not automatically become twice as crowded. Essential endpoints, fold breaks, named gauges and discrete reference
marks may be closer. There is no promise of uniform spacing or a particular
number of significant figures. Both a real slide rule and this emulator require
interpolation between graduations.

## What is documented about the Faber W scales

The manufacturer calls W1/W1-prime/W2/W2-prime 20-inch graduations. Printed page 5
specifies:

| Numerical region on the long W scale | Smallest increment |
|---|---:|
| 1–2 | 0.005 |
| 2–5 | 0.01 |
| 5–10 | 0.02 |

Tenths are secondary marks. In 1–2 the hundredths and their half-hundredths have
different stroke heights. In 2–5, labels are at the integers and halves; the
remaining tenths are unnumbered. The pattern is generated across 1–10 and then
cut at the square-root branch boundary, not restarted there. W and W-prime have
the same marks. The main index-to-index intervals are reproduced; the historical
extensions below/above the main indices are not added.

In Conventional mode, choose **10-inch pattern** to keep this documented W
engraving at every display width. The lengths in the shared menu refer to the
C/D pattern; W's two rows provide twice that effective length. Its 1-2/2-5/5-10
breakpoints are preserved for every choice, rather than replaced by the C/D
breakpoint at 4.

| Shared menu choice | W effective length | W 1-2 step | W 2-5 step | W 5-10 step |
|---|---|---:|---:|---:|
| 5-inch pattern | 10-inch equivalent | 0.01 | 0.02 | 0.05 |
| 10-inch pattern | 20-inch equivalent | 0.005 | 0.01 | 0.02 |
| 20-inch pattern | 40-inch equivalent | 0.0025 | 0.005 | 0.01 |

Only the middle row is the manufacturer's documented W specification. The
coarser and finer variants are modern display choices, not historical claims.
The finer choice halves each documented W interval; hundredths and intervening
half/quarter-hundredths have distinct stroke heights. Caption placement and
mathematical positions do not change. The inch names are equivalents, not a
measurement of the user's screen.

**Adaptive (screen)** chooses among these three complete W patterns independently
for each numerical region. The spacing test uses the full long-scale length,
**2 x displayed row width**, including magnification, with the same three-CSS-pixel
target as C/D. W and W-prime share the plan. The coarsest pattern is the floor;
essential branch endpoints can be closer than the target. No isolated regular
stroke is deleted, and no pattern restarts at a branch seam. Existing programmes
with the Adaptive choice now adapt W too; select 10-inch to recover the fixed
historical W pattern.

**Fully adaptive** is unchanged: it fits decimal cells to the displayed length
and takes precedence over the remembered C/D-and-W choice. The hidden choice
does not affect automatic W scales in this mode. Other expanded-root families
retain their existing effective-length plans; they do not use the W table.

Primary source: [Faber-Castell 2/83N instructions, printed pages 4–5](https://www.edition-greis.de/wp-content/uploads/2025/01/Faber-Castell-Instructions-Precision-Slide-Rule-No.-2-83-N.pdf).
Printed pages 14–15 also illustrate P's reversed geometry and explicitly describe
the angular scales as decimal graduations. The adaptive algorithm below is our
software design, not a specification attributed to that manual.

## Effective length, not row length

For row length L, branch j of an n-th root has position

    position(r) = n log10(r) - j

so its effective length per logarithmic decade is nL. Conversely, a power scale
showing n decades on one row has L/n per decade.

| Family | Effective length per decade |
|---|---:|
| C/D | L |
| W and other expanded square roots | 2L |
| Expanded cube roots | 3L |
| Expanded fifth roots | 5L |
| A/B | L/2 |
| K | L/3 |
| Single-row fifth powers, including the reciprocal pair | L/5 |

All expanded root banks use one long, continuous plan and cut it into branches
only after choosing graduations. This applies to the independent root scales as
well as the back-to-back banks. Generic cube/fifth-root subdivisions are design
choices, not claims that historical Pickett rules carried fifth-root scales.

## The fully adaptive algorithm

1. Work in numerical values. Partition signed decimal decades into meaningful
   1–2, 2–5 and 5–10 bands; refine complete round-number cells using 1/2/2.5/5 decimal
   steps. Steps such as 0.025 allow a half-division of a 0.05 cell, for example,
   without jumping straight from 0.05 to an unreadably fine 0.01. Never put ticks at equally spaced pixels and label the inverse samples.
2. Evaluate candidate gaps through the actual scale mapping, at the displayed
   width including whole-rule magnification. Reversed and partial scales use the
   same distance test. The screen policy therefore sees the longer root scales
   and the compressed power scales without pretending they have equal pitch.
3. Refine where there is room; keep a coarser complete cell where the mapping
   compresses. A smaller child pattern is accepted as a whole. This retains the
   meaning of successive subdivisions rather than removing isolated strokes.
4. On P, the near-one log-log ranges, hypotenuse scales and radiation ratios,
   graduate round differences from one where appropriate. In a spectral curve,
   graduate each monotonic side of the physical maximum separately, with one
   shared maximum mark. This avoids missing the expanded near-one region or
   treating a two-branched curve as single-valued.
5. Give numbers a quieter density than strokes. Preserve primary labels and
   endpoints first, then secondary captions where space allows. Font size and
   row height are not reduced. The existing glyph-based placement handles final
   collisions and the optional compact right/split numbering.

A label may be omitted without deleting its graduation. A short cell may be
coarser than its neighbour, but changes happen at numerical boundaries, not at
the pointer or a moving window edge. Plans depend on width, magnification and
chosen detail, not cursor position, slide displacement or scrolling. Resizing or
changing magnification can select another pattern; ordinary movement cannot.

The direct-rendering loupe intentionally copies the selected tick set and paints
it larger. It does not introduce a different grid only beneath the pointer.
Increase whole-rule magnification or choose Fine to request more graduations.

## Discrete or explicitly authored scales

A chemical symbol denotes a particular substance: there is no meaningful
interpolated element to add between two references. `referenceOnly` rows therefore
keep their reference marks. Explicit custom `ticks` arrays retain their authored
values and descriptions by default. Built-in specialist numeric lists (such as
chemical temperatures/fractions and the Model 14 angular rows) describe their
conventional engraving; these continuous mappings explicitly opt into adaptive
subdivision when Fully adaptive is selected. Their conventional lists are not
changed. Label placement still responds to space.

A continuous custom scale can opt into replacing its explicit numeric tick grid
with `"adaptiveTicks": true`; place named reference annotations in `gauges` so they
remain independent. `"adaptiveTicks": false` keeps a scale's conventional generator
under Fully adaptive. For a W-profile opt-out this includes the remembered
C/D-and-W choice; automatic W scales ignore that hidden choice. `referenceOnly` always takes precedence. An order-two custom
root can opt into the same W family and shared menu with `"graduationProfile": "faber-w"`.
Choose `"logGraduations": "standard"` in Conventional mode for the documented pattern.
All new fields are validated; unknown modes are not silently accepted on import.

Programme settings:

```json
{
  "graduationMode": "adaptive",
  "adaptiveSpacing": "balanced",
  "logGraduations": "adaptive"
}
```

The last field is remembered but only active in Conventional mode. The example
`examples/fully_adaptive_scales.json` supplies a complete importable programme.

## Numerical and implementation limits

Endpoints at irrational bounds may be very close to a regular tick. Named
constants can likewise be close to a regular mark. They are not moved to a nearby
round value just to meet the preferred spacing. Stroke density does not establish
measurement accuracy or certified historical fidelity.

The generator bounds recursion, nodes and candidates. At extreme artificial
widths it raises the spacing floor to limit a continuous plan to roughly 4,000
regular intervals. The normal interface does not need arbitrarily deep decimal
expansion. Decimal exponent planning is bounded at -300 and 307; underflowed or
flat floating-point tails cannot honestly supply unlimited distinct graduations.

Adaptive results cache only immutable definitions with the same runtime object;
cached arrays are copied before use. Each cache keeps at most six width/detail
plans. Expanded root plans have a separate 32-entry cache. No cache includes
cursor or slide movement. See the mathematical and browser tests for fixed W
lattices, root seams, power compression, nonlinear coverage, paired values,
metadata round trips, fonts, exact glyph bounds and loupe behaviour.

Conventional is not a certified facsimile mode: existing specialist calibration
qualifications still apply. Fully adaptive is explicitly a modern display mode.
