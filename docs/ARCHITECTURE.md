# Architecture and maintenance map

## Design constraints

A single offline HTML remains the user-facing deliverable, but it is not the maintainable source. The maintainable source consists of native ES modules and focused stylesheets. There is no framework, service worker, fetch-based module loader, dynamic JavaScript compiler or runtime package dependency.

Dependencies point inward:

```text
main -> ui -> model -> catalog -> core
          \---------------------> core
```

`core` does not import the catalogue, DOM or storage. `catalog` imports only data factories and core utilities. `model` never imports UI. `tools/check.mjs` checks these boundaries and rejects module cycles. This makes numerical code directly importable into Node tests.

## Contracts

A **scale definition** is immutable declarative data: its identity, mapping type, numeric parameters and engraving metadata. `makeRuntimeScale(definition)` in `core/mappings.js` returns `pos(value)`, `value(position)` and visible bounds `pMin`/`pMax`. Position is the scale's own normalised coordinate, normally 0 to 1. A folded scale may wrap at the end; a Planck spectral curve has two inverse branches and is tested accordingly. Invalid mapping types do not fall back to a plausible-looking logarithm.

`generateTicks(definition, runtime, width, minimumGap)` returns positioned numerical graduations. Mapping, numeric tick selection and pixel thinning are separate steps. The tick strategy must be compatible with the mapping; `core/scale-types.js` is their shared registry. Tick candidates have a value, position, kind and optional label. Paired log-log ticks also carry reciprocal values and positive/negative captions. Tick thinning must not move a mark to a convenient pixel.

A **programme** holds sides and their three rails (`topStator`, `slide`, `bottomStator`), custom scales, appearance and motion. The model owns validation, cloning, normalisation and exports. `exportableState` returns a deep snapshot and preserves floating-point cursor/slide positions without gratuitous rounding. `buildLibrary` shares already-frozen built-in definitions and clones caller-owned custom data before freezing the resulting library. The controller reuses this library until the custom-scale array is replaced. Only immutable definitions are eligible for runtime caching.

The single controller is `createApplication(document)` in `ui/application.js`. It owns the applied programme, orchestration and lifecycle; focused helpers own draft editing, readout reconciliation and individual interactions. Rendering helpers receive their inputs rather than finding global application state. `getProgram()` exposes a snapshot; `destroy()` removes listeners, observers, frames and timers. Helpers do not own competing copies of the applied programme. The controller accepts a validated programme through one transactional apply callback.

## Data flow

1. Startup reads the optional `embedded-program` block and tries storage through `model/storage.js`.
2. `parseProgramText` / `validateProgram` check decoded JSON, structure, limits, references, domains, tick compatibility and sampled mathematical behaviour before data can become live state.
3. The controller builds an immutable library and renders the current face.
4. `scale-markup.js` produces escaped markup. `labels.js` measures actual text and packs labels; it never changes the value/position mapping.
5. Cursor/slide motion changes CSS positions and value text, not the graduation tree or the readout cards. Layout or scale changes regenerate graduations.
6. Storage writes are debounced; failure is reported. Rejected original data remains recoverable. Downloaded JSON and configured HTML are explicit portable backups.

Unapplied editor text is a separate draft. Normal UI updates do not overwrite it. Import validation is transactional: a rejected programme cannot partially change the live instrument or persisted state.

## Native-module single-file build

Source imports use `#core/...`, `#model/...` and similar specifiers. Node resolves them through `package.json`'s `imports` map. `tools/build.mjs` resolves the same identifiers in the browser by embedding each source module exactly once as a base64 data URL in a native import map. Module code is not transpiled or minified. A sourceURL comment gives DevTools recognisable filenames.

CSS is assembled in explicit dependency order: page-themes, base, scales, paired, compact, root-stacks, cursor, themes, controls, readout, reorder, motion, loupe, layout, graduations. `src/index.html` provides three build markers (licence, styles and modules). The generated `index.html`, `docs/index.html` and `dist/index.html` are byte-identical: no timestamp, machine path, network result or dependency resolution enters the build. Each publishing root also has an empty `.nojekyll` marker. The build test verifies module bytes; `--check` rejects missing or stale applications and markers. The root and docs copies support branch-based Pages publication without redirects; the workflow publishes only `dist/`. Source modules remain the single editable implementation.

This trades a somewhat larger HTML file for zero build dependencies and real module boundaries. It requires browsers with import-map support and permits data-URL JavaScript. A host's restrictive Content Security Policy can block it; do not weaken an existing security policy blindly. For such a host, a future external-module build is preferable. No external-module deployment is presently shipped or claimed tested.

## Where to change things

| Change | Primary location | Associated test |
| --- | --- | --- |
| Existing family definition | `catalog/scales/<family>.js` | catalogue test + independent identity |
| New mapping | `core/mappings.js`, `core/scale-types.js` | mathematics + domain validation |
| Graduation density | `core/ticks/` | coverage + numerical placement + visual matrix |
| Historical scale order | `catalog/presets/historical.js` | preset references + both-face screenshots |
| Pickett back-to-back roots | `ui/root-stack.js`, `styles/root-stacks.css` | root-bank structure + branch coordinates + browser geometry |
| Compact numbering | `ui/labels.js`, `styles/compact.css` | overlap/tick-crossing negative controls |
| Import/storage/export | `model/`, `ui/programme-editor.js`, `ui/files.js` | invalid atomicity, recovery, repeated export |
| UI controls | `ui/application.js`, `src/index.html` | keyboard and pointer integration |

The generated catalogue in `docs/CATALOGUE.md` is a navigation aid, not a second source of truth. Regenerate it with `node tools/catalogue.mjs` after changing definitions.

## Linked view and chemical modules

`model/view.js` selects the visible faces. `activeSide` remains the edited face; `viewMode` is independently `single` or `both`. The controller renders one `.rule-face-body` per visible face. Each owns a cursor, while the programme owns just one numeric cursor and slide displacement. Pointer geometry is measured on the face where the drag began. Updating motion changes transforms/readings without regenerating the graduation tree. There are no duplicate DOM IDs.

`core/chemistry.js` contains only SI-unit calibrations and inverses. `catalog/chemical-data.js` contains representative reference masses. `catalog/scales/chemical.js` defines the reusable scales and `catalog/presets/chemical.js` defines the separate Hemmi and Flying Fish row orders. The science and sources are documented in CHEMICAL_SCALES.md.

Horizontal `segmented` rows reuse their children's true position domains; vertical `composite` rows still use the existing stacked renderer. Semantic validation checks that segments do not overlap and that each resolves to an ordinary single-line child. Readout and shared-baseline rendering deliberately treat segmented rows as layouts, not functions with a fictitious common numeric domain.

## Instrument-first workspace and Flying Fish data

`styles/layout.css` owns page geometry. It deliberately keeps the workbench and
editor in one column at every screen width. The editor's two internal columns
collapse on small screens, without affecting rule width. The 1500px breakpoint
only wraps the header. Keep page geometry out of the other stylesheets to avoid
accidental sidebar regressions. Native in-page links provide editor/rule jumps;
Focus rule hides the editor and its jump target. No separate persistent setting is
needed for this responsive behaviour.

`catalog/scales/flying-fish.js` reuses established arithmetic, log-log and chemical
mappings, adding the 1017's named ranges and compact T/cot and mass/fraction rows.
It does not duplicate the chemical physics. Sources and intentionally unmodelled
historical details are in FLYING_FISH_1017.md.

## Root-bank presentation

`rootStack` is a layout, not a scalar mapping. Two square-root or three cube-root children must cover consecutive branches, in order, at full scale length. They retain ordinary `root` mappings and independent tick sets. The last two branches meet one shared spine; a cube bank also has an unruled upper branch. `ui/root-stack.js` renders this structure using the ordinary escaped markup from `ui/tick-markup.js`. One `.root-stack-track` moves all branches together on the slide. `labels.js` processes each `.root-branch` independently, so labels in different vertical bands do not incorrectly suppress each other. The readout includes all children, not just the first two.

Do not implement a root bank using `syncroLogLog`: root-branch round numbers do not in general coincide. See [source evidence and mathematics](PICKETT_ROOTS.md).

## Motion controls and focus

`ui/motion.js` is a DOM-independent policy module for step sizes, key commands, bounds and six-decimal position descriptions. Coordinates are always normalised scale lengths, not viewport pixels. Ordinary arithmetic is retained when nudging an off-grid imported position; display formatting never rounds the live state.

`ui/application.js` delegates one keyboard listener from the workbench. It accepts keys only from the position cards or the rule viewport, leaving editors and unrelated native controls alone. Focused range inputs select their own target. On the instrument, the last selected/dragged part receives arrows; S/C change that session selection. Shift on the instrument retains the slide shortcut. Recognised motion keys prevent the native range default so there is no duplicate step. All listeners use the application's existing abortable lifetime.

The range inputs retain native range semantics and visible labels. Their legacy UI values (slide times 100; cursor times 1000) are converted only at the DOM boundary, and `aria-valuetext` supplies actual scale-length descriptions. `step="any"` avoids snapping arbitrary saved coordinates to a browser-imposed grid. Explicit keyboard handling and nudge buttons define all offered increments. `styles/motion.css` owns the two neighbouring grip cards and separate Chromium/WebKit and Firefox pseudo-elements, with a forced-colour fallback. Do not add a new pointer implementation for these native inputs.

Precision and selected part are transient controls, not programme fields. This preserves the programme schema and prevents a layout import from changing how a user is currently nudging. Cursor-glass drags retain the initial mouse-to-hairline offset; stator clicks still set an absolute hairline coordinate. Motion updates transforms and readouts without rebuilding graduations.


## Page preferences and precision buttons

`ui/step-controls.js` owns the precision buttons and their pressed states. Primary pointer-down cancels only the button's default focus transfer. Click activation selects a whitelisted step and returns to the last motion focus stop (without refocusing an already focused stop). Native buttons remain in the Tab sequence; Enter/Space returns to motion. `motionStepShortcut` in `ui/motion.js` provides scoped 1-4 keys; it excludes system modifiers, composition and already consumed events. Selecting a step never calls a position update or rounds a saved coordinate.

`ui/page-theme.js` owns a separate browser preference under `slide-rule-page-theme-v1`. It validates both stored values and the HTML fallback, handles unavailable storage, and never changes the instrument programme. A configured copy carries the `data-page-theme` HTML attribute. A valid local preference wins over that embedded default. All theme and precision listeners share the application's abort signal.

`styles/page-themes.css` defines only `--ui-*` tokens. Instrument paper, ink and geometry remain in their own styles, with an explicit light colour scheme on the physical rule. UI code does not filter, invert or recolour the instrument. New page themes should preserve this boundary and pass theme-isolation, contrast and responsive tests.

## Precision selector and pointer loupe

`ui/step-controls.js` owns the four-detent selector, whose values are declared once in `ui/motion.js`. The shared grip is decorative; four native buttons expose the discrete choices. Pointer capture allows dragging across detents without a focus transfer. Enter/Space activation returns to the most recent motion focus stop. Selector changes never mutate the mathematical programme.

`ui/loupe-geometry.js` is pure, independently tested screen-space geometry. `ui/loupe.js` owns a single transient, inert overlay attached to the document body. It copies only the hovered face, removes IDs and focus/label references, and marks the result `aria-hidden`. The overlay and all its descendants use `pointer-events: none`; real-page hit testing therefore works during pointer capture as well as ordinary hovering.

The application registers its motion handler before the loupe handler so a frame applies source movement before measuring the moving containers. Full rendering and the label-polishing pass invalidate the drawing; position changes merely refresh it. `ui/loupe-renderer.js` snapshots the polished face's element boxes and text runs in client pixels, then constructs a separate inert drawing with actual larger fonts, filled graduation strokes and positioned boxes. Neither the root nor its descendants use a magnifying transform or CSS zoom. Cursor pseudo-elements are materialised once, at the larger size. Forced-colour styles are resolved from the source and preserved during border-to-fill conversion. Font loading, viewport resizing and forced-colour changes invalidate the snapshot. The mapping is `screen point + 2.5 * (source client coordinate - screen point)`, independently of page scrolling and instrument zoom. Text and strokes are painted by the browser at the output device resolution; no screenshot, image enlargement or smoothing filter is involved. Label selection and mathematical graduations are unchanged. Snapshotting has a one-off cost when the face changes; pointer and keyboard movement reuse the drawing and update only its position and the moving containers. See [loupe rendering](LOUPE_RENDERING.md) for the painter contract and tests. Cleanup cancels animation frames, releases the copied nodes, removes the overlay and aborts listeners. Configured export strips elements marked `data-runtime-only` and resets the loupe button.

## Reading layout and scale ordering

`ui/readout.js` formats readings through the core mappings, then groups compact name/value fields by face and rail. `styles/readout.css` uses content-sized wrapping groups rather than a grid of equally large cards. No value is hidden or truncated, and the layout is independent of instrument magnification. A composite still reports every branch; a segmented row reports only its in-domain segment.

`model/scale-order.js` applies an immutable, occurrence-based move. The destination index is measured after removing the source row. It checks rail bounds and the 40-row limit; using indices rather than IDs preserves distinct occurrences of the same scale.

`ui/rail-editor.js` owns markup and accessible position labels. `ui/rail-reorder.js` handles grip gestures, filled-arrow activation, keyboard moves, scrolling and focus. A drag creates an inert, runtime-only visual copy and insertion marker; it does not reorder the DOM rows or touch the programme until drop. This keeps empty-rail targets stable and makes cancellation genuinely non-mutating. Committed moves keep the same editor nodes, animate their changed positions for 180 ms and refresh all indices, accessible names and endpoint buttons. Reduced-motion preferences suppress the animation. All listeners, pointer capture, visual copies and animation frames are removed on cancellation or destruction. Unapplied JSON drafts are never overwritten by these edits.


## Header state, scale undo and inactivity

The Both sides shortcut uses the existing `viewMode` and `activeSide` fields; it introduces no parallel view state or programme-schema changes. `renderSideSelect` refreshes the button's pressed/disabled state alongside the menus. The header's flex layout puts page themes beside the actions when their intrinsic widths fit and lets them wrap otherwise.

`model/scale-order.js:adjacentScalePosition` supplies the same boundary-crossing destination to arrow buttons and grip up/down keys. It enters an adjacent empty rail rather than skipping it; `moveScale` still enforces the row limit. `rail-editor.js` uses that same destination logic to label/disable boundary buttons.

`model/scale-history.js` owns a bounded, session-only undo stack. A successful scale-list edit records the previous face and preset attribution, its action description and occurrence-based focus position. Undo restores only that face and attribution, selecting the affected face but retaining current cursor, slide, view and appearance. Snapshot data is copied, not shared. No-op or rejected moves do not record an entry. Successful preset/JSON replacement clears history; failed JSON validation does not. The three Undo buttons expose one stack, and the Ctrl/Command+Z listener is scoped to editor grips/buttons, not text fields or native select menus. No undo state is exported.

`ui/inactivity.js` is a small injectable-clock timer, tested at the exact 4,000 ms boundary. `ui/loupe.js` feeds it pointer movement, keydown/keyup and visibility/lifetime changes. The timer only changes an opacity class; it does not change whether the loupe is enabled. Holding a key suspends the countdown. No new paint work is scheduled while idle; an input wakes it immediately and a dirty copy is refreshed. Timers, held-key state, overlay and listeners are released on destruction. `styles/loupe.css` fades only the idle transition; the return transition is deliberately instantaneous.

## Draft editing and readout reconciliation

`ui/programme-editor.js` owns unapplied JSON text, a monotonic draft revision, the
synchronisation timer and file-reader lifecycle. It receives `getProgramme` and
`applyProgramme` callbacks rather than direct access to the live state. Imports
validate through the same `parseProgramText` function used for saved programmes.
A delayed reader may apply its result only while its request, editor revision,
editor contents and starting programme still match. A newer import aborts the
older reader; destroying the application invalidates callbacks and clears timers.

`ui/readout-values.js` computes readings without the DOM. Both the stateless HTML
renderer in `readout.js` and the retained-DOM view in `readout-view.js` use it. The
view rebuilds cards only when visible faces, their names or rails, or the library
change. Otherwise it updates value text and off-scale classes in place. A
segmented row may gain or lose value spans at a domain boundary without replacing
its card. Tests compare incremental output with independently generated full
markup for many motion states and assert DOM identity is retained.

The instrument drag has one completion path for pointer release, capture loss,
window focus loss, page hiding, rerendering and disposal. It releases capture,
removes drag styling and preserves the last applied coordinate.

## Graduation dispatch and validation

`core/ticks/index.js` uses a static strategy table; mapping-specific generation,
optional refinement, reference-mark attachment and pixel thinning remain separate.
The expression parser's operator table has no prototype, so inherited object
property names cannot become arithmetic operators. Both manually specified ticks
and named reference gauges undergo the same position/domain/inverse-branch
checks. These finite numerical samples catch errors, but are not a proof of
correctness for an arbitrary user-supplied formula.

## Back-to-back fifth-root and power extensions

`catalog/scales/fifths.js` defines the five independent root components, their
complete bank and the power pair. `ui/root-stack.js` partitions both ticks and
gutters into an optional single branch followed by pairs; CSS positions each
pair on its own spine. It uses the same code for two, three and five branches.
`core/paired-products.js` supplies secondary tick captions for the validated
`pairedProduct` property; `ui/readout-values.js` applies the corresponding
product rule to full-precision readings. The existing shared-tick markup and
label-packing code then handle the pair. No new scalar mapping is required.


Graduation policy is separate from mathematical mappings. `core/ticks/adaptive.js`
owns continuous decimal-cell planning and the independent label-spacing pass;
`core/ticks/expanded-roots.js` owns fixed W engraving and long-scale branch cuts.
`core/ticks/index.js` selects a policy before adding protected named gauges and
paired values. Both ordinary and composite/root-stack rendering pass the same
policy and displayed magnification. Moving the slide/cursor never regenerates
these plans. A magnification change does regenerate them even if CSS layout width
has not changed.
