# Testing

## Core checks

```sh
npm run verify
```

This runs repository checks, the Node unit and integration suite, and deterministic build verification. Tests use Node's built-in runner and `node:assert`; runtime and build require no downloaded npm packages. The suite reports its actual test count and failures on each run.

Coverage includes scale/reference consistency, independent mathematical identities, root and log-log relationships, nonlinear graduation coverage, manual marks, expression restrictions, resource limits, validation, snapshots, caches, storage recovery, safe markup, UK spelling, exports and the preview server. HTTP requests in the server tests are not browser-navigation tests. No percentage code-coverage claim is made.

`chemical.test.js` checks mixture fractions, unit conversion, reference symbols, saturation points and numerical integration of Cp/T. `flying-fish.test.js` checks scale inventories, exponential ranges, complementary angles, alignment and shared calibrations. `view.test.js` checks linked-face state and persistence, including programmes that omit the optional view setting.

`pickett-roots.test.js` checks the photographed root-bank order, one shared spine, independently positioned branch graduations, all three cube-root readouts, positive/fractional worked examples and custom-bank validation. It also ensures generic-root overrides do not change the dedicated Pickett components. `tests/browser/pickett_roots.py` adds native/DOM runner checks for spine/tick junctions, linked motion, export/import and visual geometry in both numbering modes. A duplicate-spine injection verifies that a purely stacked regression is detected.

### Motion and keyboard controls

`tests/unit/motion.test.js` checks all offered steps and modifiers, endpoint clamping, off-grid precision, key filtering and visible position descriptions. `tests/browser/motion_controls.py` is part of both browser runner modes: it presses actual keys and drags actual grips, rather than assuming that dispatching an input event proves keyboard usability. Checks cover Tab order, one update per key, selecting the last dragged part, S/C, Shift compatibility, six-decimal feedback, nudge buttons, viewport focus, editor isolation, repeated very-fine movement, exports and nine responsive widths. Forced-colour rendering and focus are also exercised. A synthetic event is used only where invoking an operating-system shortcut or composition would be unsafe or misleading.

The screenshots include the control strip and complete Faber, Pickett and Flying Fish views after keyboard movement. Keyboard increments are tested at more than one magnification. Browser test success is not a screen-reader or touch-device conformance claim.

### Catalogue snapshots and floating-point portability

The committed JSON catalogue is compared with the runtime catalogue using
`tests/unit/catalogue-comparison.js`. Text (including UK spelling), types, keys
and array order must match exactly. Finite, nonzero numeric leaves permit a
relative difference of at most `16 * Number.EPSILON` (about `3.6e-15`); pairs of
safe integers and signed zero still compare exactly. There is no absolute
error allowance that could hide a zero or a substantial relative error in a
tiny radiation coefficient.

This is necessary because JavaScript mathematical functions can produce
slightly different last bits between engines. The regression tests exercise
both roundings of the peak radiation coefficient and deliberately changed
coefficients, text, types and structure. Independent mathematical-reference
tests remain separate and unchanged. Catalogue snapshots are not required to
be bit-identical across runtimes; the standalone HTML build still is, because
it embeds source rather than evaluated catalogue values.

## Pages entry-point checks

`tests/unit/pages.test.js` checks that root, docs and dist contain the same complete
application and empty `.nojekyll` markers. It deliberately removes and changes
each generated file in isolated directories: read-only build verification must
reject the fault, and a normal build must restore all outputs. These tests do not
execute GitHub's hosting infrastructure.

```sh
npm run test:pages
# Or: python tests/browser/pages.py --output qa/pages-native
```

With the browser prerequisites below installed, this separate native test stages
the **committed** files (without rebuilding) for each of the three publishing
roots. It navigates Chromium over loopback HTTP to the origin home page, explicit
`index.html`, a project subpath and its explicit `index.html`: twelve cases in all.
It requires the served bytes to match, the emulator to start, linked faces and
cursor controls to work, and native storage to survive a reload. Results include
the actual browser version and any failure traceback. There is no DOM fallback.
This is local static-site verification, not a live GitHub Pages deployment.

## Native browser checks

```sh
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
npm run test:browser
npm run test:visual
```

On a Linux CI machine, browser system dependencies may also be needed: `python -m playwright install --with-deps chromium`. To use an installed Chromium, set `CHROMIUM_EXECUTABLE` or pass `--executable` to the browser runner.

Native mode is the default. The runner serves the built application on loopback and navigates Chromium to the actual URL. Configured exports are served as temporary files; downloads are read and imported into fresh documents. Native reloads exercise browser storage. A navigation failure is a test failure, not permission to silently substitute a different mode.

Functional checks cover controls, pointer and keyboard motion, imports, exports, persistence, linked faces and the instrument-first workspace. The visual matrix covers all presets and both numbering modes, individual and linked faces, multiple viewport widths, magnification and narrow-screen scrolling. It checks visible numeral bounds, split-label children, tick intersections, clipping, tiny text, empty rows and page overflow. A deliberately duplicated numeral verifies that the collision detector detects a fault.

The workspace checks include 13 widths from 390 to 3440 pixels, with widths on both sides of layout breakpoints. The editor must stay below the instrument and must not steal its horizontal space.

## Reports and visual review

```sh
python tests/browser/run.py --mode native --visual --output qa/local
python tools/gallery.py --qa qa/local
```

The runner writes its mode, Python/Playwright/browser versions, executable selection, results and screenshots to the selected output directory. A fatal error includes its traceback. A failed functional check also attempts a viewport screenshot before the browser closes; failure to capture that diagnostic never replaces the original error. The gallery tool assembles contact sheets and an HTML index. Open `qa/local/visual-gallery.html` and inspect the actual scale numbers, graduation density, margins and motion states. Generating a screenshot is not visual approval; record what was inspected and any remaining defects alongside the local report.

`qa/` is ignored by Git and excluded from release archives. CI preserves its own reports as workflow artefacts, including failures. Keep evidence outside the distributable source tree when longer retention is needed. Do not replace failed or unrun checks with assumed passes.

Supplementary high-DPI captures are available through `tests/browser/capture_dom_details.py`. This is explicitly a diagnostic DOM-mode helper, not a native-launch test.

## Restricted-environment diagnostics

```sh
python tests/browser/run.py --mode dom --visual --output qa/local
```

DOM mode is an explicit diagnostic option for environments that block native navigation. It loads the built HTML with `page.set_content`. A storage substitute is used for recovery and reinitialisation scenarios, and a separate case checks opaque-origin storage denial.

This mode exercises rendering and controls but **does not verify** local-file launch, HTTP browser navigation, native reload persistence or external-module loading. Reports retain the mode and limitations. A fresh document with substituted storage is not a native reload.

## Independent references and portability

`tests/fixtures/planck.json` contains numerical reference data. Its generator requires SciPy only when regenerating the fixture; ordinary tests use the supplied data. Optional Python dependencies are pinned in `requirements-dev.txt` and should be updated deliberately.

Test on the browsers, operating systems, fonts and input devices being supported. Chromium results do not establish Firefox, Safari, screen-reader, high-contrast or physical touch behaviour. Keyboard checks are not a complete accessibility review, and collision-free engraving does not by itself establish mathematical correctness or historical calibration.

## Release verification

CI uses Ubuntu 24.04, core checks on Node 22 and 24, and native Chromium checks with Node 24 and Python 3.13. The Node matrix does not cancel its other leg when one version fails. Each command has a descriptive workflow step and retains its output in a workflow artefact. Explicit Bash `pipefail` ensures piping output to `tee` cannot turn a failed command into a pass. Browser dependency installation, browser installation and schema and Pages entry-point checks have separate logs, so a setup failure is distinguishable from an application failure.

`tests/unit/workflows.test.js` enforces selected textual workflow contracts: full SHA pins, read-only verification, non-persisted checkout credentials, native browser mode, separate Node results, and the manual-only Pages deployment guard. These checks are not a YAML parser, a complete workflow linter or proof of GitHub-hosted execution.

Review actual workflow results; a workflow file alone is not evidence of execution. No repository secrets are required. A local diagnostic using another Playwright version or a system Chromium is not a successful test of the pinned toolchain. See [maintenance](MAINTENANCE.md) for the installed versions and update process.

Before distributing an archive, run the core suite and relevant browser checks, verify its complete SHA-256 manifest, extract it into a fresh directory and rerun `npm run verify`. All three rebuilt `index.html` copies and their `.nojekyll` markers must match byte for byte. Report the tests actually performed and any unavailable environments.


### Page themes and focus-preserving step selection

`tests/unit/interface.test.js` tests step shortcuts, button activation, focus preservation, listener cleanup, invalid preference handling, denied storage and palette contrast. `tests/browser/interface_features.py` exercises actual pointer clicks, Tab/Enter/Space, immediate arrows, all four steps, preference storage and standalone defaults, theme isolation, enlarged fonts and responsive layouts. It compares instrument screenshots across the three page themes and retains current-run screenshots outside release archives. The native Pages test also checks page-theme reload persistence. Explicit DOM mode uses its storage substitute and cannot establish native reload behaviour.

### Four-detent selector and pointer loupe

`tests/unit/loupe.test.js` tests screen-space alignment, square dimensions, preserved reading width, short-viewport sizing, viewport-edge placement and instrument-zoom composition without a browser. `tests/unit/interface.test.js` tests all four exact steps, detent boundaries, pointer cancellation, capture release and focus return.

`tests/browser/loupe_features.py` exercises real selector drags at all motion focus stops, live cursor and slide drags through the lens, keyboard updates with a stationary pointer, scoped M/Escape shortcuts, source-to-copy tick/cursor geometry, both faces, page themes, instrument zoom, horizontal scrolling, viewport resizing, exports and cleanup. Lens dimensions and all four rounded corners are checked, including short viewports. Lens geometry is compared with independently measured source tick rectangles, not merely with the transform produced by the implementation. The tests run in the selected native or explicit diagnostic DOM mode; mode limitations remain in the report.

For a shorter interface-focused run, use `python tests/browser/run.py --mode native --suite controls --visual`. It retains the core browser checks and exercises the motion, theme and loupe groups, but omits the specialist preset groups and the full engraving matrix. The default remains `--suite all`; CI does not use the shortened profile.

## Compact readings and editor ordering

`readout.test.js` checks grouped headings, escaping, complete paired/root values, units, off-scale reporting and full-size text. `scale-order.test.js` covers immutable ordering, duplicate occurrences, all catalogue presets, empty/full rails and invalid indices. The browser `editor_features.py` uses actual mouse presses and browser-emulated touch events to check previews, drop/cancel, focus, arrow buttons, keyboard order, edge scrolling, reduced motion, exports and application cleanup. It also checks every preset in both-face view at five viewport widths and three page themes for omitted readings, small text, clipping and page overflow. These focused layout checks use the live application's rendered readouts and complete production CSS in a static browser fixture, first checked against the live readout height. This avoids regenerating unchanged instrument graduations hundreds of times; full-application interaction, viewport and instrument-rendering checks remain separate.

Run that focused suite (with native navigation required) using:

```sh
python tests/browser/run.py --mode native --suite editor --visual --output qa/editor
```

`--mode dom` is an explicit diagnostic alternative in restricted environments, not evidence of native navigation or native persistence. The default `--suite all` includes the editor checks as well as the instrument and loupe tests.


## Header, compact controls, undo and loupe inactivity

`editor-history.test.js` tests all four cross-rail boundary directions, empty and full destinations, immutable bounded history, duplicate occurrences, restored face selection, and preservation of unrelated view/motion fields. `inactivity.test.js` uses a controlled clock for the exact four-second boundary, repeated input, key holds, switch-off and disposal.

`tests/browser/editor_polish.py` checks the Both sides shortcut and Side menu synchronisation, exports, cross-rail arrow activation, pointer-drag undo, repeated undo of each editor action, delayed restoration, preserved motion/theme/drafts, scope of Ctrl+Z, invalid/valid imports, preset replacement and fresh-export history. It measures attached editor controls and header wrapping at eleven widths in three page themes. Loupe checks inspect actual opacity and transitions after real waits, immediate key/pointer wake, held keys, reduced motion and explicit switch-off.

```sh
python tests/browser/run.py --mode native --suite polish --visual --output qa/polish
```

These checks are also included in the default full browser suite. The explicit `--mode dom` diagnostic mode does not establish native navigation, native persistence or cross-browser correctness.

## Pickett 14 and hover explanations

`python tests/browser/run.py --suite pickett14 --visual` checks both faces, shared angle ticks, short position domains, all page themes, tooltip text beneath cursor glass, clean exports and teardown. Native navigation remains the default. Explicit `--mode dom` is a separate restricted-environment check, not native persistence verification. Node tests include independent angle identities and context-specific gauge values.

## Programme integrity, retained rendering and the 2/82N

`tests/unit/reaudit.test.js` rejects inherited names as operators and validates
both reference marks and manual graduations, including wrong inverse branches
at very small magnitudes. It checks nonzero small-value labels and immutable
library sharing. `faber282n.test.js` verifies the manufacturer's N-model row
order and independent trigonometric/cube identities.

`tests/browser/reaudit.py` tests retained readout and graduation nodes, incremental
versus stateless readout values, lost-focus drag cancellation, deterministic
delayed-file-reader races, disposal, 2/82N loading/export and responsive geometry.
The fake reader controls completion order; ordinary file imports are also tested
in the main browser suite.

```sh
python tests/browser/run.py --mode native --suite reaudit --visual --output qa/reaudit
```

These checks also run in the default full suite. The explicit DOM diagnostic
mode does not test native navigation or native storage persistence. Numerical
round trips and geometry checks complement, rather than replace, independent
reference values and manual inspection.

## End-label scale help

`python tests/browser/run.py --suite scale-help --visual` checks every preset on
both faces in both numbering modes. It inspects the actual native-title target
and its ancestors at the left name, right legend, ordinary graduations and cursor.
Native tooltip bubbles belong to the browser, not the page DOM; these checks
verify their title attributes and hit regions rather than claiming to photograph
the browser bubble. Separate real hover tests verify the application-owned
constant and element popups, including under the cursor glass. The suite also
checks dragging, keyboard motion, configured exports, mobile scrolling and zoom.
The default is native navigation; `--mode dom` explicitly selects the restricted
DOM-loading test mode.

## Workspace presentation

`python tests/browser/run.py --suite workspace --visual` checks the promoted
preset chooser, explicit loading and About disclosure, focus-preserving compact
detents, equal-height controls in all three themes at 13 widths, 75% scaling and
exports, all presets on both faces at 75%, and the 480px square loupe at ordinary,
reduced and enlarged views. These are live DOM geometry and interaction checks;
screenshots support a separate visual review. Use `--mode dom` only explicitly
in a restricted environment; it does not test native navigation or persistence.

## Native-size loupe drawing

`python tests/browser/run.py --suite loupe --visual` compares the live source
with the final-size drawing across every preset, both faces and numbering modes,
and all five instrument magnifications. It checks independent box coordinates,
larger computed font sizes, preserved hidden labels and the absence of magnifying
transforms, duplicate IDs and focus targets. It deliberately inserts a scale
transform and verifies rejection, then exercises motion, scrolling, resizing,
exports and idle/wake. Additional cases cover high-DPI painting, font-run bounds,
forced colours and live appearance changes. The suite runs in native mode unless
`--mode dom` is explicitly specified; its mode is recorded in the output.

`tests/unit/loupe-rendering.test.js` tests pixel-length conversion without altering
percentages or colour components, renderer separation, disposal-related attributes
and the non-interactive final-size path. Geometry tests remain in `loupe.test.js`.
See [the rendering contract](LOUPE_RENDERING.md) before extending face markup.

The fifth-root/power extension has a targeted browser suite:
`python tests/browser/run.py --mode native --suite fifths --visual`. It checks
actual root-spine junctions, paired-tick geometry, numerical readouts, motion,
undo, export, end-only scale help and direct loupe rendering, with ordinary and
compact numbering. Use `--executable` only to select an explicitly recorded
browser binary. The default native mode does not substitute DOM loading.


## Whole-library adaptive graduations

`node --test tests/unit/adaptive-graduations.test.js` verifies documented W values,
shared long-scale root plans, effective power-scale pitch, all continuous library
entries, nonlinear coverage, exact mapping identities, saved metadata and explicit
reference/custom-grid boundaries. The ordinary `npm test` includes these tests.

`python tests/browser/adaptive_graduations.py --mode native --functional --zoom-matrix`
checks actual controls, zoom-triggered regeneration, stationary nodes during motion,
all presets at three widths and both numbering modes, plus a magnification/detail
matrix. `--presets faber283n pickettN3` selects a subset; `--presets` alone omits the
matrix. Reports are written incrementally so an interrupted run is not mistaken
for completed coverage. `--mode dom` explicitly selects diagnostic opaque-origin
execution with a storage substitute, not native navigation or persistence.

### Contextual graduation menus

`python tests/browser/graduation_controls.py --width 1600 --theme light`
checks that the mode selector stays visible, exactly one options menu occupies
the shared slot, both option values survive switching, and keyboard focus skips
the inactive field. It also checks control bounds and captures both modes.
Repeat with other widths and `--theme dark` or `--theme solarised`. Each invocation
uses an independent browser to keep the large instrument drawings isolated.
The test uses native HTTP navigation by default; `--mode dom` explicitly opts
into the restricted-environment test with a storage substitute.

## Shared C/D and W subdivisions

`node --test tests/unit/w-subdivisions.test.js` checks independent decimal
lattices, branch seams, primed/unprimed equality, fixed grids, effective-width
selection, cache isolation and Fully adaptive precedence. The nonhistorical W
variants are explicit display policies; only the standard W table is the cited
manufacturer pattern.

Run `python tests/browser/w_subdivisions.py` for native browser tests of the menu,
all four W rows, magnification, layout geometry, keyboard motion, loupe and exports.
The default requires HTTP navigation. Use `--mode dom` only when intentionally
checking an opaque-origin document with the storage substitute; it is not a native
persistence test. `--executable` selects an installed Chromium executable.

## UltraLog and Graphoplex presets

`node --test tests/unit/ultralog-graphoplex.test.js` checks the source-derived
row order, independent trigonometric/hyperbolic/log-log/root identities,
sexagesimal carrying and rejection of invalid notation metadata. The two
Graphoplex small-angle grids have explicit opening-interval coverage tests.

Run `python tests/browser/ultralog_graphoplex.py` for native tests of all three
presets, conventional/adaptive modes, both numbering styles, widths, themes
and magnifications. It checks actual numeral bounds, linked keyboard motion,
readouts, configured downloads and the loupe. `--mode dom` is a deliberate
opaque-origin test with a storage substitute, not evidence of native launch
or persistence. `--executable` selects an installed Chromium executable.
