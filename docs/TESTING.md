# Testing

## Core checks

```sh
npm run verify
```

This runs repository checks, the Node unit and integration suite, and deterministic build verification. Tests use Node's built-in runner and `node:assert`; runtime and build require no downloaded npm packages. The suite reports its actual test count and failures on each run.

Coverage includes scale/reference consistency, independent mathematical identities, root and log-log relationships, nonlinear graduation coverage, manual marks, expression restrictions, resource limits, validation, snapshots, caches, storage recovery, safe markup, UK spelling, exports and the preview server. HTTP requests in the server tests are not browser-navigation tests. No percentage code-coverage claim is made.

`chemical.test.js` checks mixture fractions, unit conversion, reference symbols, saturation points and numerical integration of Cp/T. `flying-fish.test.js` checks scale inventories, exponential ranges, complementary angles, alignment and shared calibrations. `view.test.js` checks linked-face state and persistence, including programmes that omit the optional view setting.

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

The runner writes its mode, browser version, results and screenshots to the selected output directory. The gallery tool assembles contact sheets and an HTML index. Open `qa/local/visual-gallery.html` and inspect the actual scale numbers, graduation density, margins and motion states. Generating a screenshot is not visual approval; record what was inspected and any remaining defects alongside the local report.

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

CI is configured for Node 22 and 24 and native Chromium on Linux. Review actual workflow results; a workflow file alone is not evidence of execution. No repository secrets are required.

Before distributing an archive, run the core suite and relevant browser checks, verify its complete SHA-256 manifest, extract it into a fresh directory and rerun `npm run verify`. The rebuilt `dist/index.html` must match byte for byte. Report the tests actually performed and any unavailable environments.
