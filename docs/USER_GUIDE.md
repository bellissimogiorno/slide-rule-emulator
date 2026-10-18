# User guide

Use the prominent **Layout preset** bar above the motion controls: choose an instrument, then press **Load preset**. The **About** button reveals its description without changing the current layout. Selecting a name in this bar alone does not load it.

For immediate loading, open the small arrow beside **Slide** in its position box. It matches the arrow beside Cursor and opens a popup containing the same complete, grouped menu of 25 presets. Choosing a preset applies it immediately and updates the main Layout preset selector. The popup shows the currently applied layout, even when a different choice is waiting in the main selector. A custom layout is shown as a disabled status item; choose any listed preset to replace it. Selection closes the popup and returns focus to its arrow. Escape, a click outside or moving keyboard focus outside also closes it.

Loading through either route replaces both faces and resets the slide and cursor positions. Display precision, slide wraparound, cursor appearance and custom scale definitions are retained. Use the face selector or Flip side to see the reverse, or the neighbouring Both sides button to show both faces together. Drag the slide to move the middle rails and drag the cursor hairline to read aligned values. The neighbouring position grips and nudge buttons provide another input method, with keyboard operation described below. Reset centres the cursor and aligns the slide; it does not erase the programme.

The digital readout shows underlying scale values at the hairline, with paired readings where applicable. With wraparound off, off-scale slide coordinates are not clamped into a misleading endpoint value. With wraparound on, slide readings use the visible repeated scale under each hairline. Ordinary slide-rule arithmetic still requires tracking the decimal exponent yourself unless a scale is explicitly absolute.

Historical presets carry their own cursor markings where the sources establish
them. Auxiliary readings are labelled separately from the main hairline and
appear only for the scales served by that mark. The [cursor guide](CURSORS.md)
explains the model-specific conversions and the evidence for each reproduction.
Cursor caps and marked lines move together when dragged. To adopt a preset's
current cursor in an existing saved session, select the instrument and press
**Load preset** after exporting any customised layout you want to keep.

Use Focus rule to hide editing controls, Magnification to reduce the whole instrument to **75%** or enlarge it up to **200%**, and the instrument's horizontal scrollbar on a narrow screen. Scale density changes vertical spacing. Compact numbering packs labels alongside or around major graduations; it does not move graduations or reduce individual numerals to avoid collisions. At small widths some secondary numerals are omitted, not squeezed into unreadability.

Each face has upper fixed, slide and lower fixed rails. Add/remove/reorder scale IDs in the layout editor. Some IDs represent two layers or a shared paired scale on one physical row. The current list of definitions is in the scale library and `docs/CATALOGUE.md`.

## Compact readings

Readings are grouped by **Top stator**, **Slide** and **Bottom stator**, with a single heading per group. On wide screens several groups can share a line; narrow screens reflow their fields. Both sides retains a separate heading for each face. Each field places the scale name beside its value rather than reserving two lines. Ordinary values and paired/branch readings use 16 px text; all readings remain available. Long values and units wrap when necessary.

## Decimal precision

Numbers normally show **four useful significant digits**, with unnecessary trailing decimal zeros omitted. For example, the Faber-Castell 2/83N P endpoint reads **0.995**, an ordinary reading of 3.162277… reads **3.162**, and LL01's 0.990049833… reads **0.99**. This applies to numerical scale labels, both stator readouts, slide readouts, main and auxiliary cursor readings, position displays and chemical reference-mass readings.

For log-log values **between one and two**, the changing part matters more than the common leading 1. These scales use four significant digits of the excess above one to choose the decimal rounding place. Thus exp(0.001) = 1.001000500… becomes **1.001001**, and exp(0.01) = 1.010050167… becomes **1.01005**. The same rule covers the H₁/H₂ hypotenuse values, including Mathema's expression scales. **Values below one use ordinary four-significant-digit rounding**, including reciprocal LL values; leading 9s count as significant digits. Trailing zeros are omitted, so 0.9900 displays as 0.99.

Labels and paired readings are rounded independently from their underlying unrounded values, avoiding a second rounding of an already shortened caption. Sexagesimal readings retain degrees/minutes/seconds notation after decimal degrees are rounded to four significant digits.

Select **Extended decimal precision**, immediately below **Compact scale numbering**, to restore the detailed display. The choice survives a reload, JSON export/import and configured standalone HTML, and remains selected when loading another preset. Existing programmes without this option use the four-useful-digit default. Calculations, graduation positions and saved cursor/slide positions retain their original precision. Formulae, symbolic labels and exact configuration data are unaffected. See [display precision](DISPLAY_PRECISION.md) for the full policy and examples.

## Slide wraparound

Select **Wraparound slide**, directly below **Extended decimal precision** in **Scale layout**, to fill the exposed part of the slide with a copy of the engraving that has moved past the opposite end. The option is off by default. Slide right to reveal the repeated right end on the left; slide left to reveal the repeated left end on the right. Fixed scales and the name/legend gutters stay in place.

Dragging, keyboard movement, nudge buttons and the Slide grip keep the same operation and limits. Switching wraparound on or off leaves the slide and cursor positions unchanged. Readouts use the copy beneath each main or auxiliary hairline, including paired scales and root banks. An auxiliary mark outside the visible graduated window remains off scale; so does a blank part of a scale with a shorter domain.

The setting applies to both faces and the loupe. It survives reload, JSON export/import and configured HTML, and remains selected after a preset load, position reset, magnification change or face/view change. Old programmes without the option open with wraparound off. Repeated engraving does not remove the need to track decimal exponents in ordinary slide-rule arithmetic. See [slide wraparound](SLIDE_WRAPAROUND.md) for examples and the implementation contract.

## Arranging scales

Each Scale layout row has a **dotted grip** on the left, its scale selector, two stacked **bold arrow buttons**, and a remove cross. These are joined into one compact control, keeping more width for the scale name. Drag the grip to a new position in the same rail, or into another rail of the face being edited. The insertion line shows where the scale will be placed. Keep the pointer near the upper or lower edge of the window to scroll a long list. Drop to apply the change; Escape, a cancelled pointer gesture, or a drop outside the rail areas leaves the programme unchanged.

The editor animates the final move briefly, so you can follow the row. This animation is disabled when your system requests reduced motion. Touch dragging is enabled on the grip without disabling ordinary page scrolling elsewhere.

For keyboard control, Tab to the grip: **up/down** moves one place, crossing into the adjacent rail at its boundary, **left/right** transfers to the preceding/next rail, and **Home/End** moves to the first/last position. The arrow buttons perform the same move: down from the last upper-stator row enters the start of the slide; up from the first slide row enters the end of the upper stator. The lower boundary works likewise, including empty rails. A full target rail is protected against overflow. Focus follows the moved row. Moving a scale between a stator and the slide changes whether its reading depends on the slide displacement. Root banks and paired scales move as whole rows; duplicate scale IDs are supported. The other face and any unapplied Programme JSON draft are left alone.

### Undo scale edits

Each **Add scale** button has an adjacent **Undo** button with a curved back arrow. They share one history: any of them reverses the latest scale-list edit on either face. Undo covers removals, additions, replacements and moves (grip, arrow or keyboard), in reverse order. It restores the precise row occurrence, even when scale IDs repeat. A removal focuses Undo so Enter can immediately restore it.

The last **100 edits** remain available until the page is reloaded or a preset/programme is successfully loaded; there is no timed expiry. An invalid import does not erase history. Ctrl+Z, or Command+Z on macOS, also undoes when a grip or button in the scale lists is focused. Programme JSON, text fields and native select menus retain their own shortcuts. Undo history is not exported or saved in browser storage.

Undo returns the editor to the affected face when necessary. It does **not** rewind the cursor, slide, view mode, page theme or an unapplied JSON draft. It is not an undo mechanism for loading presets, applying JSON or changing appearance.

## Page appearance

Use **Light**, **Dark** or **Solarised** at the top of the page. These controls share the header action row, aligned right when there is room, and wrap without squeezing controls on smaller screens. This changes the page, controls, editor and digital readouts, not the slide rule. Instrument style remains independent under Scale layout. Page theme is a browser preference, retained where storage permits and copied into saved standalone HTML as its initial theme; it is not added to Programme JSON. See [appearance and keyboard focus](APPEARANCE.md).

## Position controls and keyboard precision

The **Slide** grip is a ridged rectangular tab; the **Cursor** grip is a glass-style frame with a red hairline. Both travel on horizontal rails, inside their labelled boxes between the left and right arrow buttons. Their controls stay together above the instrument, side by side on wider screens and immediately above/below one another on a small screen. They never take width away from the rule.

Click or Tab to either grip. Its focus outline identifies the control being adjusted. Dragging a grip gives it keyboard focus, so a coarse mouse placement can be followed immediately by fine keyboard nudges. The small left/right buttons offer the same step without dragging.

| Key or control | Action |
| --- | --- |
| Left / Right arrow | Move the focused grip one selected step left / right |
| Down / Up arrow | Decrease / increase its position by the same step |
| Alt + arrow | Move by one tenth of the selected step |
| Page Down / Page Up | Move by ten selected steps (Alt also divides this by ten) |
| Home / End | Move to that control's minimum / maximum position |
| Keyboard step: Faster | 0.005 scale lengths per arrow press |
| Keyboard step: Normal | 0.001 scale lengths per arrow press |
| Keyboard step: Fine | 0.0005 scale lengths per arrow press |
| Keyboard step: Very fine | 0.0001 scale lengths per arrow press |
| 1 / 2 / 3 / 4 (rule or grip focused) | Select Faster / Normal / Fine / Very fine without changing focus |
| M (rule or grip focused) | Toggle the 2.5× pointer loupe |
| Escape (rule or grip focused) | Switch the loupe off |

The compact step panel is the same height as the Slide and Cursor panels. Its four numbers sit above the shared rail; the heading shows the selected shortcut number and setting name. Full names and shortcut numbers remain available in the hover hints and accessible button labels.

**For fine control without a modifier key:** click the Fine or Very fine stop, or drag the step grip to that detent, and keep using the arrows. The four stops preserve the exact focused grip or rule focus stop; there is no need to click back. Tab to a step button and activate it with Enter/Space to return to your last motion control. Keys 1-4 also change the step without leaving the rule or grip. This also works when a browser or operating system reserves an Alt combination. The same selected step applies to the nudge buttons; Alt while clicking a button reduces it tenfold. Holding an arrow uses normal keyboard repeat.

Positions are fractions of the graduated scale length, not numerical scale readings or screen pixels. Slide offset zero aligns the indices and its limits are -0.9 and +0.9. Cursor position runs from 0 at the left index to 1 at the right index. The default displays use four significant digits, so a very fine nudge may leave the displayed number unchanged. **Extended decimal precision** restores six decimal places and shows every offered nudge, including Very fine plus Alt (0.00001). At a 1,000-pixel graduated length, a Fine step represents 0.5 pixel and a Very fine step represents 0.1 pixel. Very small movements may accumulate before the displayed hairline crosses a physical pixel; the internal coordinate and readout still update.

**On the instrument itself:** clicking or dragging a part selects it for keyboard movement. Press **S** to select the slide or **C** to select the cursor, then use the same arrows and precision setting. Both the rule canvas and its surrounding scrollable viewport accept these shortcuts when focused. **Focus rule** also transfers keyboard focus to the instrument, ready for arrow-key control. The indicator beside the motion instructions names the selected part. Shift plus an arrow on the rule temporarily moves the slide, retaining the earlier shortcut. On a focused position grip, Shift does not switch to the other part.

The shortcuts do not act while typing in Programme JSON or navigating the Side, Magnification or other menus. S/C are instrument-focus shortcuts and 1-4 work only in motion controls or on the instrument; none is a page-wide typing command. Standard Ctrl/Command combinations and text-composition events are not intercepted. Tab leaves the controls normally.

Both faces share every movement. Magnification does not change a step's fraction of the scale length. Grabbing the cursor glass away from its centre preserves the original hairline position rather than snapping it to the mouse; clicking a fixed scale deliberately places the hairline there.

The selected keyboard step and selected part are session controls, not additions to the programme schema. Loading a new page starts at Normal with the cursor selected; changing a preset within that page retains the keyboard step. The separate decimal-precision and slide-wraparound preferences are saved with the programme. Exact slide and cursor positions are saved in programmes and configured standalone copies without rounding to either display format.

## Pointer magnification

Enable **2.5× loupe** in the view controls, next to Magnification. Hover over a face or the cursor to inspect the actual engraving at 2.5 times its displayed size. The lens uses larger text and newly painted strokes, not enlarged screen pixels; it keeps the same mathematical graduations. The magnified cursor remains aligned with the magnified ticks, including during mouse dragging and keyboard nudges. The lens does not consume pointer events: use the underlying slide and cursor normally through it.

The lens is a **square with rounded corners**, normally **480 CSS pixels wide and tall**. Its generous area shows more scales at once, while the optical enlargement remains 2.5 times the displayed instrument. On a viewport too narrow or short to fit it, both dimensions shrink together to keep the square inside the screen. Magnification remains 2.5 times the displayed instrument size.

The lens starts fading after **four seconds** without pointer movement or a keypress. It reappears immediately on either input; holding a key keeps it visible. This does not switch the loupe off. Scrolling, resizing or background rendering alone do not reset the idle timer. Reduced-motion preferences suppress the fade animation. The lens also hides when the pointer leaves the instrument. Disable it with the same button or Escape while the rule or a motion control has focus. **M** toggles it without leaving your motion control. The lens is additional to whole-instrument magnification, does not change calculation coordinates and starts off on each new page. Mouse and hovering-pen use are supported; use the ordinary Magnification menu on a touchscreen without hover.

## Preserve your programme

Export JSON for a portable, inspectable backup. Save standalone HTML for a single-file configured copy. The copy contains the mathematical implementation as well as your settings; opening a second export should show the second configuration, not the first one. Saved copies use separate storage namespaces derived from their embedded configuration, but a downloaded JSON file remains the most explicit backup.

Local browser storage may be unavailable or deleted by the browser/user. A visible warning does not prevent using the instrument. If saved data is rejected, the recovery control downloads the original data for repair; a default instrument is loaded rather than pretending the invalid programme worked.

Unapplied JSON is a draft. Apply it to make it live; Refresh JSON deliberately replaces it with the current programme. Validation errors leave the live instrument unchanged. See EXTENDING_SCALES.md for examples and custom mathematical expressions.

Specialist historical warnings are part of the instrument, not optional precision claims. See HISTORICAL_FIDELITY.md for the scope of the N16, Thornton and radiation reconstructions.

## Linked faces and chemical work

The **Both sides** button beside **Flip side** toggles the simultaneous view. Its highlighted state follows the Side menu, which includes the same **Both sides** option. Clicking the highlighted button returns to the currently selected editing face. Faces appear one above the other, upright and at the same scale length; either slide/cursor can be dragged. The **Edit face** selector affects only which rail lists you are editing. Selecting a single face again restores Flip side. Magnification and horizontal scrolling apply to the whole linked instrument. JSON and standalone exports retain the view.

Load **Hemmi 257 - Chemical engineering** for the Hemmi chemical face, and expand **Chemical scales (Hemmi 257)** in the application for operating instructions. The [chemical guide](CHEMICAL_SCALES.md) gives the actual units, working examples and modern-calibration limitations. Import `examples/hemmi257-both-sides.json` to open the preset directly in the linked view.

Choose **Flying Fish 1017 - Chemical engineering** for its distinct chemical/scientific arrangement. The [Flying Fish guide](FLYING_FISH_1017.md) explains the paired mass/fraction rows, log-log ranges and calibration limits. Import `examples/flying-fish-1017-both.json` to open both faces directly.

## Pickett square and cube roots

Load **Pickett N3-T / N3-ES** or **Pickett N4-T / N4-ES**, then select Front or Both sides. The two square-root branches meet one common line; the cube-root bank has an unruled upper branch and a back-to-back middle/lower pair. Both ordinary and compact numbering retain this arrangement. The readout lists every branch. The independent generic roots and Faber-Castell W scales retain their own layouts.

For example, set D to 6.4: the cube-root bank reads approximately 1.86, 4 and 8.62, for radicands 6.4, 64 and 640 respectively. Extended precision gives 1.85664, 4 and 8.61774. Decimal exponents still need to be tracked. See the [root guide](PICKETT_ROOTS.md) for fractional radicands and branch-selection rules.

Previously saved layouts are not overwritten during an application update. Export custom work first, then use **Load preset** to adopt the current Pickett layout. The library also offers **PICKETT_SQRT** and **PICKETT_CBRT** to add to a custom layout.

## Pickett 14 and constant marks

Load **Pickett 14 U.S. Military / Artillery** for its general and degree/mil faces. Both sides works as for the other presets. Black/red angle readings are complementary or supplementary, not reciprocals. Original end extensions are omitted; see the [Model 14 guide](PICKETT_14.md).

Hover over a constant tick or label for its value and explanation, even beneath the cursor. The c gauge means the circle-diameter factor, not the speed of light. Alignment indices and decimal-scaled constants are described explicitly. See [constant marks](CONSTANT_MARKS.md).

## Scale help without interrupting calculation

Hover over a scale's **left-hand name** or **right-hand legend/formula** to read
its explanation. The same rule applies to both stators and the movable slide.
Scale explanations do not appear over the graduation area or cursor glass;
the working surfaces have no inherited row-wide or drag-instruction titles.
The specialised branch hints on Pickett root end labels remain available.

Individual annotated marks, such as pi, e, the circle-diameter factor and chemical
elements, still have their own tooltips when you hover over that particular mark.
Ordinary numeric graduations do not gain popups merely because they belong to a
segmented scale. No setting or programme change is needed.

## Pickett-style fifth roots and powers

Select **Pickett-style fifth roots and powers**, then **Load preset**. The front
provides a fixed five-branch root bank and a true reciprocal fifth-power pair;
the back demonstrates the same groups on the slide. In the editor, choose
`PICKETT_FIFTH_ROOT` or `F5_PAIR` to add a complete group to any layout. At D=3.2,
branch 2 gives the fifth root of 32, which is 2. At D=2 the power pair reads 32
and 0.03125. Keep track of decimal exponents; see the [worked guide](FIFTH_ROOTS.md).
These are mathematical extensions, not historical Pickett presets.

## Choosing the cursor

Open **Cursor appearance** beside **Scale layout**, or the small arrow beside
**Cursor** in its position box, for two shape buttons and named, coloured
hairline buttons.
**Minimal** with **Red** gives the simple narrow cursor. **Instrument** restores
the selected instrument’s markings. Minimal displays
only the main hairline and its readings. Both choices apply to both faces, are
saved with the programme, and remain selected when loading another preset.
See [Appearance](APPEARANCE.md#cursor-appearance) for saving and import behaviour.
