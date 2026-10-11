# Page appearance and motion controls

## Page themes

The header offers **Light**, **Dark** and **Solarised** on the right of its action row where space permits. Controls wrap on narrower screens rather than shrinking their text. The adjacent Flip side and Both sides buttons remain together. They style the page background, panels, form controls, keyboard-step selector, motion-control rails, digital readouts, editor and help. The physical instrument keeps its own colours, typography, bands and cursor. Changing a page theme does not rebuild graduations or change calculations, positions, magnification or the selected instrument.

Light uses cool neutral paper and blue accents. Dark uses a charcoal background with light text and blue accents. Solarised uses warm paper and teal, based on [Ethan Schoonover's Solarized palette](https://ethanschoonover.com/solarized/). This adaptation uses darker neutrals for small text and adjusts some status/focus colours for contrast; it is not a verbatim editor colour scheme. No external stylesheet, font or network request is required.

The preference is independent of Programme JSON. A valid saved browser preference takes precedence over a standalone file's initial `data-page-theme`. On a fresh browser, an exported standalone copy opens with the theme it was saved with. When browser storage is denied, changing theme still works and a notice explains that the preference is session-only. Preset changes and programme imports do not reset it.

## Four-position step slider and focus

| Slider stop | Rule/grip shortcut | Step in graduated lengths |
| --- | --- | --- |
| Faster | 1 | 0.005 |
| Normal | 2 | 0.001 |
| Fine | 3 | 0.0005 |
| Very fine | 4 | 0.0001 |

The selector uses a continuous recessed rail and a shared ridged grip, matching the Slide and Cursor controls. Four equal-width detents remain four native buttons: there are no intermediate values. Dragging the grip snaps to those detents; clicking either a label or its track position selects it directly. A cancelled pointer gesture restores the starting step.

Primary-pointer clicks and drags preserve the currently focused grip or rule focus stop. When reached by Tab, Enter/Space activates a step and returns to the last motion focus stop. A user who has not yet selected a motion control is taken to the rule, with the cursor selected. Choosing a step never moves anything by itself. The next arrow moves the selected component immediately. This focus policy is deliberate: the button completes a setting operation and resumes instrument control. Native button semantics and `aria-pressed` expose the selection; the [WAI button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) describes the underlying activation and focus conventions.

Shortcuts 1-4 are scoped to the instrument and its position controls. They do not intercept typing in JSON, other inputs or menus. Alt divides a step by ten; Page Up/Down multiplies it by ten. Bounds still clamp movement, including Faster. The selected step remains session-only; loading another instrument within the same page preserves it.

## Pointer loupe

The **2.5× loupe** button enables a reading window that follows a mouse or hovering pen over either instrument face, including the cursor glass. It is not a whole-page zoom and does not change the keyboard step. At 200% instrument magnification the lens provides another 2.5-fold enlargement of that displayed image. Click the button again, or press Escape while controlling the instrument, to switch it off. M is a local motion-control shortcut for toggling the same setting.

The lens copies the rendered face, preserving its numerals, shared graduation construction and actual hairline. A copy is rebuilt after engraving/layout changes; ordinary movement updates only the slide transforms and cursor positions. The window is constrained to the browser viewport, while the source point remains under the pointer even at the edge. It never captures mouse events or keyboard focus and is hidden from accessibility APIs to avoid reading the same scales twice. Leaving the rule hides it; re-entering shows it if it is still enabled.

After four seconds without pointer movement or a keypress, the enabled loupe fades out over 180 ms. A new movement or keypress restores full opacity immediately, even mid-fade. Holding a key suspends the countdown until it is released. Scrolling, resizing and programme repainting do not wake an idle lens. Reduced-motion preferences remove the fade transition but retain the inactivity behaviour.

The loupe starts off on a fresh page. It is session-only, not a programme field; configured exports omit the temporary lens DOM. Devices without pointer hover should use the existing whole-instrument Magnification selector. All themes and both-face mode retain the same mathematical coordinates.

## Sizing

The paired motion controls have a maximum combined width of 1,020 CSS pixels (excluding the step panel) and yield on narrower screens. At small widths they stack. They never create a sidebar or reduce the instrument's horizontal allocation. Small interface labels and help use 12-14 pixels rather than 10-13; ordinary digital readings use 16 pixels and the JSON editor 13. Instrument engraving sizes and graduation geometry are unchanged.

Forced-colour mode retains visible controls, focus and a selected-button border. Tests cover keyboard and pointer behaviour, real element sizes and configured-copy defaults; assistive technologies and additional browser engines need their own testing.
