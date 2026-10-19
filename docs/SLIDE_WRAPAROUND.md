# Slide wraparound

## Use

Open **Scale layout** and select **Wraparound slide**, immediately underneath
**Extended decimal precision**. It is off by default. The option takes effect
immediately and leaves the cursor and slide where they are.

Moving the slide right exposes a copy of its right end on the left. Moving it
left exposes a copy of its left end on the right. The copies repeat at the
width between the instrument's left and right indices. Stators and scale-name
and legend gutters remain fixed.

A yellow highlight with a dark amber edge marks the join between copies. It
moves with the slide and appears in the loupe. One overlay at **50% opacity**
sits above all the graduations in each row, including both layers of a composite
scale such as **Hλ/Hλm**. Ticks and labels remain visible through it. When the slide is aligned,
the join is at the left index.

Hover over the yellow line for an explanation, using the same tooltip as the
constants. It also reminds you to tick or untick **Wraparound slide** in
**Scale layout**, below **Extended decimal precision**, to switch the option
on or off. The tooltip dismisses during dragging.

The Slide grip, dragging, nudge buttons and keyboard shortcuts work as usual.
The motion limits remain −0.9 and +0.9 graduated lengths. Turning wraparound off
restores the ordinary finite slide at its current displacement.

## Reading the repeated scale

A slide readout follows the engraving beneath its hairline. For example, put a
C scale on the slide, set the slide offset to 0.4 and the main cursor to 0.2.
The unwrapped slide coordinate is −0.2. With wraparound enabled, the repeated
scale supplies position 0.8, so its C reading is approximately **6.31** with the
default precision. With wraparound disabled, that slide reading is off scale.
The stator reading is unaffected.

The original left and right indices retain their own endpoint values: an aligned
C scale still reads 1 at its left index and 10 at its right index. Wrapping selects
a repeated copy only beyond those endpoints.

The main hairline and each auxiliary hairline are resolved separately, so they
can read different copies when a seam falls between them. Auxiliary hairlines
outside the visible graduated window remain off scale. A short scale still has
its own blank portions; repeating its track does not fill those with extrapolated
values. Paired scales, composite rows and root banks retain their existing
branches and units. Ordinary logarithmic arithmetic still requires keeping track
of the decimal exponent.

The same setting applies to both instrument faces and to the loupe. Switching
faces, displaying both faces, changing magnification or resetting positions
does not change it.

## Saving and presets

The programme field is `slideWraparound`, a boolean. Browser storage, exported
JSON and configured standalone HTML preserve it. Loading a layout preset through
either selector retains the selected setting. Loading a programme uses that
programme's value; missing values default to false, so existing programmes keep
the ordinary finite slide.

## Maintenance checks

Keep rendering and readout coordinates consistent. Repeat the graduated track,
including its ticks and inscriptions, at one track width. Keep fixed rail content
and gutters outside that repetition. Main and auxiliary hairlines need separate
copy selection, and scale-domain bounds must still apply after selection.
Retained and freshly rendered readouts must agree throughout movement.
The seam belongs to the shared graduation pane, not to individual moving layers:
painting it more than once would compound its opacity and obscure layers unequally.
The loupe must update this overlay's position alongside the moving slide.
The shared mark-tooltip controller hit-tests the seam without intercepting drag
events. Inside the yellow bar, its explanation takes priority over any constant
underneath; adjacent constants keep their own tooltips.
The native regression fixture includes the actual `BB_H_SPEC` (Hλ/Hλm) and
`F5100_I` radiation rows, alongside ordinary and other composite scales.

After building, the focused native browser runner is:

```sh
npm run test:slide-wraparound -- --output qa/slide-wraparound
```

Check the default and checkbox placement, movement in both directions, repeat
spacing and clipping, fixed stators/gutters, conventional and adaptive engraving,
paired rows and root banks, both faces, zoom, main/auxiliary readings, short
scale domains and the loupe. Check JSON, reload and configured HTML as well as
retention across preset loads and position resets. Browser prerequisites and
execution limitations are described in [testing](TESTING.md); the handover's
verification records state which checks actually ran.
