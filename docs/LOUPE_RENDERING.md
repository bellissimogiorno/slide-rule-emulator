# Loupe rendering

The reading lens is 480 by 480 CSS pixels (uniformly reduced to fit a smaller
viewport) and shows a 2.5-fold enlargement of the displayed instrument. It uses a
separate **final-size DOM drawing**, not a screenshot or enlarged raster layer.
The native browser paints the font glyphs, strokes, backgrounds and cursor at the
output device resolution. Every display is ultimately made of pixels; the
important difference is that a small glyph's raster is not stretched to make the
large glyph.

## Responsibilities

- `ui/loupe.js` owns hover, hit testing, idle/wake, overlay placement and disposal.
- `ui/loupe-geometry.js` computes the square viewport and pointer-centred mapping.
- `ui/loupe-renderer.js` snapshots polished element boxes and text runs, creates
  the final-size drawing, and updates the movable slide and cursor containers.

The painter does not read or change the mathematical programme. It takes the
polished face so that label selection, split numbers, shared root/log-log strokes,
reference marks and clipping correspond to the instrument actually being used.
In particular, the lens does not invent new graduations or reveal labels that the
main renderer suppressed for lack of space.

## Coordinate and paint rules

For a client point `p`, a source coordinate `q` is drawn at `p + 2.5 * (q - p)`.
Source client boxes already include CSS instrument magnification, border rounding
and scrolling. The drawing is not subject to instrument CSS zoom: computed font
and other pixel lengths are multiplied by `sourceZoom * 2.5`, and measured client
boxes by `2.5`. No scaling transform is applied to the result. At 75% instrument
magnification a 12px engraving font is therefore painted at 22.5px in the lens,
not painted at 9px and then enlarged.

Graduation borders become filled rectangles. This avoids introducing a second
rounding of border widths or a new box-model offset. Other borders become inset
paint-only edges. Text nodes are positioned from source `Range` boxes with larger
fonts; compact split-label children keep independent positions. The cursor's
two rectangular pseudo-elements become real drawing nodes, with its source
pseudo-elements disabled to avoid a duplicate hairline.

The original face is not modified. IDs, focus hooks and native title attributes
are removed from the drawing; the overlay is inert, aria-hidden and pointer-
transparent. User-provided text is assigned through `textContent`. No external
font or image is loaded. Computed system colours are preserved explicitly when
forced-colour borders become fills.

## Lifetime and performance

Retain at most two face drawings so crossing between the visible faces does not
rebuild either one. Engraving, layout, font loading and forced-colour changes
invalidate both snapshots. Disabling the lens or disposing the application
releases them. Idle lenses schedule no drawing work.

The controller distinguishes pointer movement from instrument movement. Hover
and scrolling reposition the existing drawing without measuring its movers or
reading computed styles again. Application `refresh()` marks a new motion
revision; a cached face measures its slide, seam and cursor containers only when
it next needs that revision. `refresh({ structure: true })` invalidates drawings.
Keep those calls after the source instrument has been updated.

`measureMotion()` completes all source geometry reads, sharing parent rectangles,
before `place()` or the controller writes to any attached loupe DOM. `place()`
performs no source reads and skips unchanged properties. Overlay and drawing
translation move already full-size text without changing its scale. The small
overlay uses layout/paint containment; only its transform is a compositing hint.
Individual ticks and labels do not receive their own compositing layers.

During construction, each detached node receives its complete frozen style in
one CSS assignment. The painter still measures every source box and text run;
it keeps suppressed labels, clipping and wraparound copies exactly as authored.

Snapshot creation has a cost proportional to the number of face elements. This
trades one-off layout/style measurements for predictable output-size painting.
Do not rebuild the full drawing on every pointer event, or scale a cached raster
to reduce that cost. Deterministic operation counts show DOM work, not native
frame latency. Assess end-to-end frame times on target hardware before claiming
a measured responsiveness multiplier.

## Extending face markup

The painter supports the application's axis-aligned boxes, text, strokes, colour
bands and rectangular cursor decorations. Adding images, rotated graphics, new
pseudo-elements or wrapped text requires extending the painter and its tests.
Inherited CSS transforms, animations and browser-native title popups do not belong
in the drawing. Browser font hinting may change glyph metrics slightly at a new
size; the underlying mathematical tick positions must remain exact.

## Verification

The browser suite checks actual output font sizes as well as independently
measured positions. It rejects a deliberately introduced scale transform; geometry
alone would not distinguish the old scaled-layer strategy from final-size text.
Inspect the saved large glyphs and strokes visually too. High-DPI, fractional
instrument zoom, forced colours, cursor/slide motion, idle/wake, exports and
clearing the overlay are separate checks. Native launch and persistence require
native browser execution; explicit DOM mode is not equivalent.

Browser rendering background: [Chrome's discussion of scale transforms and
composited raster layers](https://developer.chrome.com/blog/re-rastering-composite/)
explains why a scaled layer can trade crispness for animation speed. The direct
drawing does not depend on a browser's choice to re-rasterise such a layer.
