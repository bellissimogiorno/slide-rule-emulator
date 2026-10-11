# User guide

Select a preset in Scale layout and load it. Use the face selector or Flip to see the reverse. Drag the slide to move the middle rails and drag the cursor hairline to read aligned values. The neighbouring position grips and nudge buttons provide another input method, with keyboard operation described below. Reset centres the cursor and aligns the slide; it does not erase the programme.

The digital readout shows underlying scale values at the hairline, with paired readings where applicable. Off-scale slide coordinates are not clamped into a misleading endpoint value. Ordinary slide-rule arithmetic still requires tracking the decimal exponent yourself unless a scale is explicitly absolute.

Use Focus rule to hide editing controls, magnification to enlarge the whole instrument, and the instrument's horizontal scrollbar on a narrow screen. Scale density changes vertical spacing. Compact numbering packs labels alongside or around major graduations; it does not move graduations or reduce individual numerals to avoid collisions. At small widths some secondary numerals are omitted, not squeezed into unreadability.

Each face has upper fixed, slide and lower fixed rails. Add/remove/reorder scale IDs in the layout editor. Some IDs represent two layers or a shared paired scale on one physical row. The current list of definitions is in the scale library and `docs/CATALOGUE.md`.

## Position controls and keyboard precision

The **Slide** grip is a ridged rectangular tab; the **Cursor** grip is a glass-style frame with a red hairline. Both travel on horizontal rails. Their controls stay together above the instrument, side by side on wider screens and immediately above/below one another on a small screen. They never take width away from the rule.

Click or Tab to either grip. Its focus outline identifies the control being adjusted. Dragging a grip gives it keyboard focus, so a coarse mouse placement can be followed immediately by fine keyboard nudges. The small left/right buttons offer the same step without dragging.

| Key or control | Action |
| --- | --- |
| Left / Right arrow | Move the focused grip one selected step left / right |
| Down / Up arrow | Decrease / increase its position by the same step |
| Alt + arrow | Move by one tenth of the selected step |
| Page Down / Page Up | Move by ten selected steps (Alt also divides this by ten) |
| Home / End | Move to that control's minimum / maximum position |
| Keyboard step: Normal | 0.001 scale lengths per arrow press |
| Keyboard step: Fine | 0.0001 scale lengths per arrow press |
| Keyboard step: Very fine | 0.00001 scale lengths per arrow press |

**For fine control without a modifier key:** select Fine or Very fine, then Tab or click back to the desired grip and use the arrows. This also works when a browser or operating system reserves an Alt combination. The same selected step applies to the nudge buttons; Alt while clicking a button reduces it tenfold. Holding an arrow uses normal keyboard repeat.

Positions are fractions of the graduated scale length, not numerical scale readings or screen pixels. Slide offset zero aligns the indices and its limits are -0.9 and +0.9. Cursor position runs from 0 at the left index to 1 at the right index. The six-decimal displays show every offered nudge, including Very fine plus Alt (0.000001). At a 1,000-pixel graduated length, a Fine step represents 0.1 pixel. Very small movements may accumulate before the displayed hairline crosses a physical pixel; the internal coordinate and readout still update.

**On the instrument itself:** clicking or dragging a part selects it for keyboard movement. Press **S** to select the slide or **C** to select the cursor, then use the same arrows and precision setting. Both the rule canvas and its surrounding scrollable viewport accept these shortcuts when focused. **Focus rule** also transfers keyboard focus to the instrument, ready for arrow-key control. The indicator beside Keyboard step names the selected part. Shift plus an arrow on the rule temporarily moves the slide, retaining the earlier shortcut. On a focused position grip, Shift does not switch to the other part.

The shortcuts do not act while typing in Programme JSON or navigating the Side, Magnification or other menus. S/C are instrument-focus shortcuts, not page-wide single-letter commands. Standard Ctrl/Command combinations and text-composition events are not intercepted. Tab leaves the controls normally.

Both faces share every movement. Magnification does not change a step's fraction of the scale length. Grabbing the cursor glass away from its centre preserves the original hairline position rather than snapping it to the mouse; clicking a fixed scale deliberately places the hairline there.

The selected keyboard step and selected part are session controls, not additions to the programme schema. Loading a new page starts at Normal with the cursor selected; changing a preset within that page retains the precision setting. The exact slide and cursor positions themselves are saved in programmes and configured standalone copies, without rounding to the six-decimal display.

## Preserve your programme

Export JSON for a portable, inspectable backup. Save standalone HTML for a single-file configured copy. The copy contains the mathematical implementation as well as your settings; opening a second export should show the second configuration, not the first one. Saved copies use separate storage namespaces derived from their embedded configuration, but a downloaded JSON file remains the most explicit backup.

Local browser storage may be unavailable or deleted by the browser/user. A visible warning does not prevent using the instrument. If saved data is rejected, the recovery control downloads the original data for repair; a default instrument is loaded rather than pretending the invalid programme worked.

Unapplied JSON is a draft. Apply it to make it live; Refresh JSON deliberately replaces it with the current programme. Validation errors leave the live instrument unchanged. See EXTENDING_SCALES.md for examples and custom mathematical expressions.

Specialist historical warnings are part of the instrument, not optional precision claims. See HISTORICAL_FIDELITY.md for the scope of the N16, Thornton and radiation reconstructions.

## Linked faces and chemical work

The Side menu includes **Both sides**. Faces appear one above the other, upright and at the same scale length; either slide/cursor can be dragged. The **Edit face** selector affects only which rail lists you are editing. Selecting a single face again restores Flip side. Magnification and horizontal scrolling apply to the whole linked instrument. JSON and standalone exports retain the view.

Load **Hemmi 257 - Chemical engineering** for the Hemmi chemical face, and expand **Chemical scales (Hemmi 257)** in the application for operating instructions. The [chemical guide](CHEMICAL_SCALES.md) gives the actual units, working examples and modern-calibration limitations. Import `examples/hemmi257-both-sides.json` to open the preset directly in the linked view.

Choose **Flying Fish 1017 - Chemical engineering** for its distinct chemical/scientific arrangement. The [Flying Fish guide](FLYING_FISH_1017.md) explains the paired mass/fraction rows, log-log ranges and calibration limits. Import `examples/flying-fish-1017-both.json` to open both faces directly.

## Pickett square and cube roots

Load **Pickett N3-T / N3-ES** or **Pickett N4-T / N4-ES**, then select Front or Both sides. The two square-root branches meet one common line; the cube-root bank has an unruled upper branch and a back-to-back middle/lower pair. Both ordinary and compact numbering retain this arrangement. The readout lists every branch. The independent generic roots and Faber-Castell W scales retain their own layouts.

For example, set D to 6.4: the cube-root bank reads approximately 1.85664, 4 and 8.61774, for radicands 6.4, 64 and 640 respectively. Decimal exponents still need to be tracked. See the [root guide](PICKETT_ROOTS.md) for fractional radicands and branch-selection rules.

Previously saved layouts are not overwritten during an application update. Export custom work first, then use **Load preset** to adopt the current Pickett layout. The library also offers **PICKETT_SQRT** and **PICKETT_CBRT** to add to a custom layout.
