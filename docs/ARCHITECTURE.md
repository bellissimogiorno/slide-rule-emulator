# Architecture and maintenance map

## Design constraints

A single offline HTML remains the user-facing deliverable, but it is not the maintainable source. The maintainable source consists of forty-eight native ES modules and ten focused stylesheets. There is no framework, service worker, fetch-based module loader, dynamic JavaScript compiler or runtime package dependency.

Dependencies point inward:

```text
main -> ui -> model -> catalog -> core
          \---------------------> core
```

`core` does not import the catalogue, DOM or storage. `catalog` imports only data factories and core utilities. `model` never imports UI. `tools/check.mjs` checks these boundaries and rejects module cycles. This makes numerical code directly importable into Node tests.

## Contracts

A **scale definition** is immutable declarative data: its identity, mapping type, numeric parameters and engraving metadata. `makeRuntimeScale(definition)` in `core/mappings.js` returns `pos(value)`, `value(position)` and visible bounds `pMin`/`pMax`. Position is the scale's own normalised coordinate, normally 0 to 1. A folded scale may wrap at the end; a Planck spectral curve has two inverse branches and is tested accordingly. Invalid mapping types do not fall back to a plausible-looking logarithm.

`generateTicks(definition, runtime, width, minimumGap)` returns positioned numerical graduations. Mapping, numeric tick selection and pixel thinning are separate steps. The tick strategy must be compatible with the mapping; `core/scale-types.js` is their shared registry. Tick candidates have a value, position, kind and optional label. Paired log-log ticks also carry reciprocal values and positive/negative captions. Tick thinning must not move a mark to a convenient pixel.

A **programme** holds sides and their three rails (`topStator`, `slide`, `bottomStator`), custom scales, appearance and motion. The model owns validation, cloning, normalisation and exports. `exportableState` returns a deep snapshot and preserves floating-point cursor/slide positions without gratuitous rounding. `buildLibrary` clones caller-owned data before freezing the resulting library. Only immutable definitions are eligible for runtime caching.

The single controller is `createApplication(document)` in `ui/application.js`. It owns live state, DOM references, event handlers, scheduling and lifecycle. Rendering helpers receive their inputs rather than finding global application state. `getProgram()` exposes a snapshot; `destroy()` removes listeners, observers, frames and timers. The controller is intentionally not split into many state-owning components: one owner keeps a small application understandable.

## Data flow

1. Startup reads the optional `embedded-program` block and tries storage through `model/storage.js`.
2. `parseProgramText` / `validateProgram` check decoded JSON, structure, limits, references, domains, tick compatibility and sampled mathematical behaviour before data can become live state.
3. The controller builds an immutable library and renders the current face.
4. `scale-markup.js` produces escaped markup. `labels.js` measures actual text and packs labels; it never changes the value/position mapping.
5. Cursor/slide motion changes CSS positions and readouts, not the full graduation DOM tree. Layout or scale changes regenerate graduations.
6. Storage writes are debounced; failure is reported. Rejected original data remains recoverable. Downloaded JSON and configured HTML are explicit portable backups.

Unapplied editor text is a separate draft. Normal UI updates do not overwrite it. Import validation is transactional: a rejected programme cannot partially change the live instrument or persisted state.

## Native-module single-file build

Source imports use `#core/...`, `#model/...` and similar specifiers. Node resolves them through `package.json`'s `imports` map. `tools/build.mjs` resolves the same identifiers in the browser by embedding each source module exactly once as a base64 data URL in a native import map. Module code is not transpiled or minified. A sourceURL comment gives DevTools recognisable filenames.

CSS is assembled in explicit dependency order: base, scales, paired, compact, root-stacks, cursor, themes, controls, layout, graduations. `src/index.html` provides three build markers (licence, styles and modules). The generated `index.html`, `docs/index.html` and `dist/index.html` are byte-identical: no timestamp, machine path, network result or dependency resolution enters the build. Each publishing root also has an empty `.nojekyll` marker. The build test verifies module bytes; `--check` rejects missing or stale applications and markers. The root and docs copies support branch-based Pages publication without redirects; the workflow publishes only `dist/`. Source modules remain the single editable implementation.

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
| Import/storage/export | `model/`, `ui/files.js` | invalid atomicity, recovery, repeated export |
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
