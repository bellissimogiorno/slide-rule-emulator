# Pickett back-to-back square- and cube-root scales

## Select the instrument

Load **Pickett N3-T / N3-ES** or **Pickett N4-T / N4-ES** in **Scale layout**, then select **Front** or **Both sides**. The square-root bank is above the slide on the N3 and below it on the N4. The cube-root bank is below the slide on the N3 and above it on the N4.

The importable `examples/custom_root_banks.json` demonstrates independently named two- and three-branch banks.

The library exposes `PICKETT_SQRT` and `PICKETT_CBRT` as complete banks. They can be moved, removed or added to any rail just like other library entries. Both normal and compact numbering use the same back-to-back construction. The Eye-Saver and white themes retain black, increasing root branches; a later root branch is not a reciprocal scale.

Saved programmes preserve their chosen rows. Loading the current preset explicitly selects these banks; the application does not silently rewrite a customised or previously saved arrangement. Export important custom work before loading a preset.

## What the historical sources show

Pickett's Model 3 supplement to manual M-14, form M-22, describes a double-length square-root scale whose right-hand portion is placed beneath the left-hand portion, back-to-back (printed page 2). It places the square-root scale at the top and the triple-length cube-root scale at the bottom of the trigonometric face. The square-root instructions on printed page 3 and cube-root instructions on pages 5-6 give the reading rules and examples.

The N3 and N4 specimen photographs show the physical construction more clearly:

| Bank | Engraving arrangement |
| --- | --- |
| Square root | Upper and lower branches extend away from one common horizontal line. Their numerals sit on the corresponding sides of that line. |
| Cube root | The first branch is above, without a horizontal baseline. The middle and lower branches extend back-to-back from one common line beneath it. |

Thus a cube-root bank is **not** three ordinary ruled rows, nor three numerical readings forced onto every identical vertical stroke. The first branch has its own graduation band; only the other two meet on the shared line. The construction is the same on the inspected N3 and N4 specimens, although its position on the instrument is reversed.

The manual's cube-root discussion on printed page 5 refers generically to a scale at the top. Its own model overview on page 2, final illustration on page 8 and the N3 specimen photograph establish the bottom placement used here. The overview and photographs, rather than that inconsistent sentence, determine the preset order.

### Primary evidence

- [Pickett Model 3 supplement, form M-22](https://www.sliderulemuseum.com/Manuals/Pickett_HowToUse_Model3PowerLog.pdf): printed pages 2-6 for relationships and reading rules; page 8 for the instrument illustration. Page numbering matches the PDF's one-based page count.
- [N3-ES front specimen photograph](https://www.steves-sliderules.info/rule%20images/Pickett%20N3-ES%20New%20Front.jpg): square-root bank at the top, cube-root bank at the bottom.
- [N4-ES front specimen photograph](https://www.steves-sliderules.info/rule%20images/Pickett%20N4-ES%20Front.jpg): cube-root bank at the top, square-root bank at the bottom.
- [International Slide Rule Museum N3 specimen](https://www.sliderulemuseum.com/Pickett/Pickett_N3-ES_PowerLogExponential_DonatedByJohnLCrawley.jpg): an additional view of the back-to-back root construction.
- [International Slide Rule Museum N4 specimen](https://www.sliderulemuseum.com/Pickett/Pickett_N4-ES_VectorHyperbolic_RndBlkLogo_SquareBraces_FlatLens_BelongedToToshiFukushima.jpg): an additional N4 version with the same root-bank construction.

The manual and photographs are linked, not redistributed. The geometric interpretation above is based on visual inspection of those sources. The formulae and implementation checks below are mathematical derivations, not claims that the manual supplies software algorithms.

## Why different branches do not have identical numerical ticks

Let `p` be the normalised position on D, so its mantissa is `10^p`. Branch `b`, numbered from zero, of an order-`n` root reads:

```text
value(p) = 10^((p + b)/n)
position(value) = n * log10(value) - b
```

Square-root branches have ranges `1 .. sqrt(10)` and `sqrt(10) .. 10`. Cube-root branches have ranges `1 .. cbrt(10)`, `cbrt(10) .. cbrt(100)` and `cbrt(100) .. 10`.

For example, the exact value opposite 2 on the first square-root branch is `sqrt(40)`, approximately 6.324555, on the second. Its round-number graduation **6.32** is close, but not at exactly the same position. Moving it to align with 2 would introduce an error. The renderer retains both branches' exact positions: ticks meet their common line from opposite sides, and coincide vertically only when their numerical coordinates genuinely agree.

This differs from Pickett's combined log-log rows. There, every positive reading and its exact reciprocal are intentionally paired at one graduation. Root banks must not reuse that reciprocal tick generator.

## Reading roots and powers

For a positive number `N = m * 10^k` with `1 <= m < 10`:

1. Put the cursor at `m` on D.
2. Choose `b`, the nonnegative remainder of `k` divided by the root order `n`.
3. Read branch `b + 1` and multiply by `10^floor(k/n)`.

This works for negative exponents too. For positive integers the gutter reminders are equivalent: square-root branches serve odd/even digit counts; cube-root branches serve 1/4/7, 2/5/8 and 3/6/9 digit counts. The reminders are deliberately qualified as integer rules, rather than ambiguous rules about leading decimal zeros.

Examples from the Model 3 manual, independently checked against mathematical roots:

| Number | Cursor on D | Branch | Result |
| --- | --- | --- | --- |
| Square root of 7.3 | 7.3 | Square upper | Approximately 2.70185 |
| Square root of 73 | 7.3 | Square lower | Approximately 8.54400 |
| Square root of 841 | 8.41 | Square upper, multiply by 10 | 29 |
| Cube root of 6.4 | 6.4 | Cube upper | Approximately 1.85664 |
| Cube root of 64 | 6.4 | Cube middle | 4 |
| Cube root of 640 | 6.4 | Cube lower | Approximately 8.61774 |
| Cube root of 0.064 | 6.4 | Cube middle, divide by 10 | 0.4 |

For squares or cubes, reverse the operation: place the cursor at the value on the appropriate root branch and read the power on D, keeping track of its decimal exponent. The digital readout reports every branch at the same cursor; it does not select a decimal exponent for you. Zero and negative radicands are outside these logarithmic scales.

## Implementation and scope

The historical banks contain exactly two square-root or three cube-root children in increasing branch order. The `rootStack` layout also supports five fifth-root children for the separately labelled [mathematical extension](FIFTH_ROOTS.md); that is not part of the N3 or N4 reproduction. `PICKETT_R1`, `PICKETT_R2`, and `PICKETT_Q1` through `PICKETT_Q3` are dedicated component definitions. Keeping them distinct leaves existing custom overrides of generic `R1`/`R2`/`Q1`/`Q2`/`Q3` independent of the historical banks.

`ui/root-stack.js` owns the shared-spine markup; `styles/root-stacks.css` owns vertical placement. `ui/tick-markup.js` supplies the common escaped tick/number markup. Tick generation and root mappings remain in the mathematical core. One mover contains every branch and the shared line, so a bank placed on the slide cannot split apart during dragging. Each branch's labels are packed independently; all branches are included in the digital readout.

These banks reproduce the inspected **branch layout, direction and mathematical alignment**, not an entire engraved facsimile. Screen-width-dependent subdivisions, full decimal labels, finite endpoint precision and gutter typography are digital choices. Original end extensions, every gauge mark and abbreviated repeated digits are not transcribed. The Faber-Castell W scales, generic standalone roots, fifth roots and combined log-log geometry are not converted to this layout.

The unit tests check the manual examples, independent root identities, exact tick coordinates, one shared spine, complete readouts, moving-bank structure and validation. Browser tests check the actual spine/tick junctions, both number modes, both Pickett finishes, densities, magnification and linked faces. Automated geometry is supplemented by visual inspection; it is not a substitute for the source photographs.
