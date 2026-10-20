# Page appearance and motion controls

## Cursor appearance

Open **Cursor appearance** beside **Scale layout**, or use the small arrow beside
**Cursor** in the position box. Both buttons open the same menu, with the current
shape and colour selected. It floats over the page without enlarging the position
box or moving the instrument. Press Escape, click outside, or tab away to close it.

- **Cursor shape:** the **Instrument** and **Minimal** buttons choose the face's
  documented cursor or the narrow, transparent cursor with one main hairline.
- **Hairline colour:** **Instrument** uses the face's own line colour. The named
  **Red**, **Black**, **Blue** and **Green** buttons show their corresponding ink
  colours and override the main and auxiliary hairlines on both faces. Printed
  inscriptions retain their authored colours. Selected buttons are marked
  independently of their colour.

Choose **Minimal** and **Red** for the original simple red-hairline appearance.
Minimal hides auxiliary lines, their inscriptions and their digital readings.
Their calibration remains saved, and selecting Instrument restores them. Frames,
corners and proportions are adapted for the screen.

The choices apply to both sides and survive **Load preset**, **Reset positions**,
reloads when storage is available, Programme JSON export/import, and saved
standalone copies. Loading a programme uses that programme's choices; if it
omits these optional fields, both choices default to Instrument. Changing cursor
appearance preserves the current positions and scale layout. The loupe shows
the selected appearance. Operating-system forced-colour mode may substitute
its own high-contrast colours.

## Page themes

The header offers **Light**, **Dark** and **Solarised** on the right of its action row where space permits. Controls wrap on narrower screens rather than shrinking their text. The adjacent Flip side and Both sides buttons remain together. They style the page background, panels, form controls, keyboard-step selector, motion-control rails, digital readouts, editor and help. The physical instrument keeps its own colours, typography, bands and cursor. Changing a page theme does not rebuild graduations or change calculations, positions, magnification or the selected instrument.

Light uses cool neutral paper and restrained teal accents. Dark uses a charcoal background with light text and pale teal accents. Solarised uses warm paper and teal, based on [Ethan Schoonover's Solarized palette](https://ethanschoonover.com/solarized/). This adaptation uses darker neutrals for small text and adjusts some status/focus colours for contrast; it is not a verbatim editor colour scheme. No external stylesheet, font or network request is required.

The preference is independent of Programme JSON. A valid saved browser preference takes precedence over a standalone file's initial `data-page-theme`. On a fresh browser, an exported standalone copy opens with the theme it was saved with. When browser storage is denied, changing theme still works and a notice explains that the preference is session-only. Preset changes and programme imports do not reset it.

## Layout preset

The accented **Layout preset** bar is at the top of the workbench, above the motion controls, and remains available in Focus rule mode. The full-width selector and primary Load preset button use the existing page palette. About preset expands the selected preset's description in place; changing the selection or opening About preset does not replace either face. Loading a preset still requires pressing Load preset. A link in the editor returns to this chooser.

## Four-position step slider and focus

| Slider stop | Rule/grip shortcut | Step in graduated lengths |
| --- | --- | --- |
| Faster | 1 | 0.005 |
| Normal | 2 | 0.001 |
| Fine | 3 | 0.0005 |
| Very fine | 4 | 0.0001 |

The selector uses a continuous recessed rail and a shared ridged grip, matching the Slide and Cursor controls. The numeric values sit above the rail, and the heading displays the selected shortcut and name. Full names and shortcuts remain in accessible labels and hover hints. The panel has the same height as each position control with readable 14px numeric labels, and every detent retains a 40px-high hit area. Four equal-width detents remain four native buttons: there are no intermediate values. Dragging the grip snaps to those detents; clicking either a label or its track position selects it directly. A cancelled pointer gesture restores the starting step.

Primary-pointer clicks and drags preserve the currently focused grip or rule focus stop. When reached by Tab, Enter/Space activates a step and returns to the last motion focus stop. A user who has not yet selected a motion control is taken to the rule, with the cursor selected. Choosing a step never moves anything by itself. The next arrow moves the selected component immediately. This focus policy is deliberate: the button completes a setting operation and resumes instrument control. Native button semantics and `aria-pressed` expose the selection; the [WAI button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) describes the underlying activation and focus conventions.

Shortcuts 1-4 are scoped to the instrument and its position controls. They do not intercept typing in JSON, other inputs or menus. Alt divides a step by ten; Page Up/Down multiplies it by ten. Bounds still clamp movement, including Faster. The selected step remains session-only; loading another instrument within the same page preserves it.

## Whole-instrument magnification

Magnification offers **75%, 100%, 125%, 150% and 200%**. The 75% setting reduces the displayed instrument, not the surrounding controls or readouts. Both faces use the same magnification. Mathematical coordinates and movement increments remain unchanged; the chosen level is preserved in Programme JSON, browser storage and saved standalone copies.

## Pointer loupe

The **2.5× loupe** button enables a reading window that follows a mouse or hovering pen over either instrument face, including the cursor glass. It is not a whole-page zoom and does not change the keyboard step. At 200% instrument magnification the lens provides another 2.5-fold enlargement of that displayed image. Click the button again, or press Escape while controlling the instrument, to switch it off. M is a local motion-control shortcut for toggling the same setting.

The rounded square lens is normally **480 by 480 CSS pixels**, reducing both dimensions together only when needed to fit the viewport. Its 2.5x optical enlargement is independent of that box size. The lens draws the face at the final larger size, with larger font glyphs and freshly painted graduation strokes, rather than stretching a small image or composited layer. It preserves the chosen numerals, shared graduation construction and actual hairline. It does not invent extra graduations or change numerical precision. Drawings for the two visible faces are retained until engraving/layout, font or forced-colour changes; crossing between faces reuses them. Ordinary hover translates the drawing, while actual slide/cursor movement updates only moving containers. The window is constrained to the browser viewport, while the source point remains under the pointer even at the edge. It never captures mouse events or keyboard focus and is hidden from accessibility APIs to avoid reading the same scales twice. Leaving the rule hides it; re-entering shows it if it is still enabled.

After four seconds without pointer movement or a keypress, the enabled loupe fades out over 180 ms. A new movement or keypress restores full opacity immediately, even mid-fade. Holding a key suspends the countdown until it is released. Scrolling, resizing and programme repainting do not wake an idle lens. Reduced-motion preferences remove the fade transition but retain the inactivity behaviour.

The loupe starts off on a fresh page. It is session-only, not a programme field; configured exports omit the temporary lens DOM. Devices without pointer hover should use the existing whole-instrument Magnification selector. All themes and both-face mode retain the same mathematical coordinates.

## Sizing

The paired motion controls have a maximum combined width of 1,020 CSS pixels (excluding the step panel) and yield on narrower screens. At small widths they stack. They never create a sidebar or reduce the instrument's horizontal allocation. Ordinary interface text and help use a consistent 14 pixels; ordinary digital readings use 16 pixels and the JSON editor 13. Instrument engraving sizes and graduation geometry are unchanged.

Forced-colour mode retains visible controls, focus and a selected-button border. Tests cover keyboard and pointer behaviour, real element sizes and configured-copy defaults; assistive technologies and additional browser engines need their own testing.

## Presentation boundaries

Page-only type, spacing and radii use shared `--ui-*` tokens. Text metrics are
scoped to the surrounding controls, panels, help and readouts; they are not put
on `body`, `:root` or the whole workbench, where they would alter the instrument's
inherited metrics. The Light/Dark palettes and motion grips use the same page
tokens. Solarised retains its warm palette. Physical paper, ink, engraving,
cursor and loupe CSS remain separate.

The page title and section headings provide hierarchy; ordinary controls use
14px text, digital values remain 16px and code remains 13px. Help and digital
readings wrap without ellipses or line clamps. Panel shadows and corner radii
are restrained, and selected controls retain visible marks in addition to colour.

Ordinary buttons and selectors align at 38px; the compact motion and joined
scale-row controls retain their existing dimensions. Readout label columns use
8.5em, with stacked headings at phone widths. The programme editor changes to
one column at 1040px and below, and appearance fields stack at 480px and below.
The instrument remains full width. Narrow-screen theme controls align left;
Focus rule shows its selected state using the same treatment as Both sides.

Help headings retain their native disclosure markers and initial open states.
Each summary has a padded target, a hover surface and an expanded divider;
paragraphs keep a readable line length without clipping. Long validation
messages wrap, including unbroken identifiers from a custom programme.

**Reset positions** restores zero slide offset and centres the cursor. It does
not change magnification or layout. **Use current programme** replaces the JSON
editor text with a snapshot of the current programme, confirming an unapplied
draft before replacement. **About preset** displays the selected description
without loading it. These are clearer labels for the existing actions.
