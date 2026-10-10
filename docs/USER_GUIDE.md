# User guide

Select a preset in Scale layout and load it. Use the face selector or Flip to see the reverse. Drag the slide to move the middle rails and drag the cursor hairline to read aligned values. The position sliders provide another input method. With the rule focused, arrow keys move the cursor; Shift plus an arrow moves the slide. Reset centres the cursor and aligns the slide; it does not erase the programme.

The digital readout shows underlying scale values at the hairline, with paired readings where applicable. Off-scale slide coordinates are not clamped into a misleading endpoint value. Ordinary slide-rule arithmetic still requires tracking the decimal exponent yourself unless a scale is explicitly absolute.

Use Focus rule to hide editing controls, magnification to enlarge the whole instrument, and the instrument's horizontal scrollbar on a narrow screen. Scale density changes vertical spacing. Compact numbering packs labels alongside or around major graduations; it does not move graduations or reduce individual numerals to avoid collisions. At small widths some secondary numerals are omitted, not squeezed into unreadability.

Each face has upper fixed, slide and lower fixed rails. Add/remove/reorder scale IDs in the layout editor. Some IDs represent two layers or a shared paired scale on one physical row. The current list of definitions is in the scale library and `docs/CATALOGUE.md`.

## Preserve your programme

Export JSON for a portable, inspectable backup. Save standalone HTML for a single-file configured copy. The copy contains the mathematical implementation as well as your settings; opening a second export should show the second configuration, not the first one. Saved copies use separate storage namespaces derived from their embedded configuration, but a downloaded JSON file remains the most explicit backup.

Local browser storage may be unavailable or deleted by the browser/user. A visible warning does not prevent using the instrument. If saved data is rejected, the recovery control downloads the original data for repair; a default instrument is loaded rather than pretending the invalid programme worked.

Unapplied JSON is a draft. Apply it to make it live; Refresh JSON deliberately replaces it with the current programme. Validation errors leave the live instrument unchanged. See EXTENDING_SCALES.md for examples and custom mathematical expressions.

Specialist historical warnings are part of the instrument, not optional precision claims. See HISTORICAL_FIDELITY.md for the scope of the N16, Thornton and radiation reconstructions.

## Linked faces and chemical work

The Side menu includes **Both sides**. Faces appear one above the other, upright and at the same scale length; either slide/cursor can be dragged. The **Edit face** selector affects only which rail lists you are editing. Selecting a single face again restores Flip side. Magnification and horizontal scrolling apply to the whole linked instrument. JSON and standalone exports retain the view.

Load **Hemmi 257 - Chemical engineering** for the Hemmi chemical face, and expand **Chemical scales (Hemmi 257)** in the application for operating instructions. The [chemical guide](CHEMICAL_SCALES.md) gives the actual units, working examples and modern-calibration limitations. Import `examples/hemmi257-both-sides.json` to open the preset directly in the linked view.

Choose **Flying Fish 1017 - Chemical engineering** for its distinct chemical/scientific arrangement. The [Flying Fish guide](FLYING_FISH_1017.md) explains the paired mass/fraction rows, log-log ranges and calibration limits. Import `examples/flying-fish-1017-both.json` to open both faces directly.
