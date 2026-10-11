# Programmable slide-rule emulator

This package was vibe-coded by Murdoch J. Gabbay. I hope you find it useful and do not hesitate to submit patches if you find mistakes.

**Licence: [MIT](LICENSE). Copyright (c) 2026 Murdoch J. Gabbay.**

**Warranty and liability disclaimer**

To the fullest extent permitted by applicable law, this software and its documentation are supplied "as is" and "as available", without any warranty or guarantee, whether express, implied or statutory. This includes, without limitation, any warranty of accuracy, reliability, satisfactory quality, merchantability, fitness for a particular purpose or non-infringement. There is no guarantee that the software is free of errors or will operate without interruption.

Use this software at your own risk. To the fullest extent permitted by applicable law, Murdoch J. Gabbay, the contributors and the copyright holders accept no liability for any claim, loss, damage or other liability arising from the software, its use or an inability to use it, whether in contract, tort (including negligence) or otherwise. This includes incorrect results, loss or corruption of data, computer crashes, damage to hardware or software, lost profits and business interruption, even if advised of the possibility of such consequences.

Nothing in this disclaimer excludes or limits liability that cannot lawfully be excluded or limited. This is an explanatory notice, not an additional licence condition; the [MIT licence](LICENSE) contains the licence terms, including its warranty and liability provisions.

---

**Version 3.2.12**

An offline, two-sided scientific slide rule with configurable scales, classic instrument layouts and compact, readable engraving. Arrange the scales on either face, move the slide and cursor, and save your own instrument as a single HTML file. There is no account, backend, telemetry or runtime package dependency.

## Try it

Open **[`index.html`](index.html)** in a modern browser. The complete application is in that file; identical generated copies are provided in `docs/` and `dist/` for different publishing setups. Export a JSON programme or a configured standalone copy to keep a portable backup of your settings; local browser storage is not a backup.

For a local preview, use Node.js 22 or later:

```sh
npm run build
npm start
# Open the loopback address printed by the preview server.
```

No `npm install` is required. `npm run dev` rebuilds on each preview request: edit a source file and reload. `src/index.html` is a build template, not a directly runnable page.

## Publish the emulator on GitHub Pages

Upload the **contents** of `slide-rule-emulator/` into the repository root, including
`index.html` and `.nojekyll`. In **Settings → Pages → Build and deployment**, choose
**Deploy from a branch**, select the branch containing these files (usually `main`),
select **/ (root)**, and save. After that branch is published, **Visit site** opens
the emulator. GitHub's repository **Code** page still displays this README.

Publishing from **/docs** also works: that folder contains the same complete
application and its own `.nojekyll`. Neither branch-based option needs a custom
build workflow. No username, repository name or URL prefix needs editing.

For the separate **GitHub Actions** publishing option, run the included
**Pages (check; manual deploy)** workflow from the default branch. It publishes
`dist/` and remains manual; pull requests only check the package. Choose one
publishing method, not competing workflows. See [Pages setup and troubleshooting](docs/RELEASING.md#github-pages-site).

## Explore the instruments

**Sixteen presets** cover Faber-Castell 2/83N, British Thornton AA010, Pickett N3/N4/N16, K&E Deci-Lon, Pickett Model 17, Thornton F5100, Hemmi 257 and Flying Fish 1017, alongside scientific, classic, root, log-log, trigonometric and hyperbolic layouts.

The scale library contains **200 definitions**, including aliases and composite rows. Arithmetic, reciprocal and folded scales sit alongside square/cube/fifth powers and roots, circular and hyperbolic functions, paired log-log ranges, and specialist chemical and radiation relationships. The Pickett N3/N4 paired log-log rows share graduations with reciprocal readings in black and red. Their square- and cube-root banks reproduce the back-to-back construction, with branch graduations meeting a common line; see [Pickett root scales](docs/PICKETT_ROOTS.md).

Use **Both sides**, next to **Flip side**, to toggle linked front and back faces. The Side menu offers the same choice; the button stays highlighted while both faces are visible. Either face controls the same slide and cursor; **Edit face** selects the layout being edited. The instrument gets the full available width, with the scale editor below it. Compact numbering places numerals alongside or around major ticks. Magnification runs from 100% to 200%; narrow screens scroll the instrument instead of squeezing the graduations.

The neighbouring **Slide** and **Cursor** controls use a ridged slide grip and a glass-style hairline grip. Tab to either grip and use the arrow keys. The four-position **Keyboard step** slider retains motion focus: click a stop or drag the shared grip to Faster (0.005), Normal (0.001), Fine (0.0005) or Very fine (0.0001), then continue with the arrows immediately. Keys **1-4** select those same steps while a grip or the rule is focused; Alt gives a tenfold finer step. On the rule, **S** selects the slide and **C** selects the cursor for arrow-key movement. The part last dragged is selected automatically; Shift plus an arrow on the rule also moves the slide. The digital cursor readout shows the corresponding scale values. UK English is used throughout the interface and documentation.

Enable **2.5× loupe** above the rule for a live magnified view beneath the pointer in a rounded-square lens. It enlarges the actual graduations and cursor together without changing their positions, and mouse dragging still works through the lens. After four seconds without pointer movement or a keypress, the loupe fades away without switching off; moving the pointer or pressing a key brings it back immediately. **M** toggles it when the rule or a motion control is focused; **Escape** switches it off.

The controls can expand to a combined width of 1,020 CSS pixels when space permits, without reducing instrument width. **Light**, **Dark** and **Solarised** page themes colour the surrounding controls, readouts and editor independently of the instrument. The page-theme controls sit on the right of the header action row when space permits and wrap on smaller screens. Engraving geometry is unchanged. See [page appearance](docs/APPEARANCE.md).

Readings below the instrument use compact, inline name/value fields, grouped once by rail and face. Every value, unit, reciprocal and root branch remains visible at full size. Scale layout rows have a dotted drag grip joined to the left of the scale selector, with stacked bold up/down arrows and a remove cross joined to its right. Drag between positions or rails; a clear insertion line previews the destination and a short animation shows the committed move. Both the buttons and the grip's up/down keys cross into the adjacent rail at its boundary. Left/right transfers between rails, Home/End goes to an end, and Escape cancels a drag. **Undo**, beside each Add scale button, reverses the most recent scale edit across all rails and faces, including removals, additions, replacements and moves. The last 100 edits remain available for the session; no short countdown removes the opportunity to undo. Loading a preset or applying/importing a programme starts a new history. Reduced-motion preferences are respected.


See the [user guide](docs/USER_GUIDE.md), [scale catalogue](docs/CATALOGUE.md), [Hemmi chemical guide](docs/CHEMICAL_SCALES.md) and [Flying Fish guide](docs/FLYING_FISH_1017.md).

## Configure and extend

Reorder, add or remove scales in **Scale layout**, or edit **Programme JSON**. Custom mathematical expressions use a restricted parser rather than arbitrary JavaScript. Export a JSON programme for an inspectable backup, or save a standalone HTML copy containing the application and your configuration.

The [examples](examples/) contain minimal arithmetic, custom-expression, Pickett and linked chemical instruments. Start with [adding scales](docs/EXTENDING_SCALES.md) and [architecture](docs/ARCHITECTURE.md) for development.

| Directory | Purpose |
| --- | --- |
| `src/core/` | Mathematical mappings, physics, expressions and graduations |
| `src/catalog/` | Scale definitions, presets and appearance data |
| `src/model/` | Validated programme state, snapshots and storage |
| `src/ui/`, `src/styles/` | Interaction, rendering, label packing and responsive layout |
| `tests/` | Numerical, integration and browser tests, with independent reference fixtures |
| `tools/` | Build, preview, checking, catalogue and release utilities |
| `docs/`, `examples/`, `schema/` | Guides, reference data and programme format |
| `index.html`, `docs/index.html`, `dist/index.html` | Identical generated applications for branch-root, branch-docs and workflow publication |

The source uses native JavaScript modules. The deterministic build embeds them unchanged into the standalone HTML; it does not transpile or minify them. Edit the source rather than any generated copy; `npm run build` refreshes all three together.

## Build and test

```sh
npm test                 # Unit and integration tests
npm run check            # Syntax, module boundaries, catalogue and schema checks
npm run build -- --check # Check all three applications and .nojekyll markers
npm run verify           # All three checks
```

Optional browser tests require Python and the development dependencies:

```sh
python -m venv .venv
# Activate .venv using the command for your shell.
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
npm run test:pages       # Native homepage, project-subpath and reload checks
npm run test:browser
npm run test:visual
```

See [testing](docs/TESTING.md) for prerequisites, native and diagnostic modes, and visual review. Test reports are generated locally, not included in the release archive.

## Publish and contribute

The repository includes verification workflows for pushes and pull requests, plus a Pages workflow that checks packaging on pull requests and deploys only on manual dispatch from the default branch. Dependencies receive monthly, reviewable update proposals; there is no automatic merging. See [publishing and releases](docs/RELEASING.md) and [dependency maintenance](docs/MAINTENANCE.md). To build a distributable archive:

```sh
npm run release
# Writes a ZIP, complete internal manifest and SHA-256 checksum in releases/.
```

Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing changes and [SECURITY.md](SECURITY.md) for data handling and reporting guidance.

## Scope and licence

These are mathematical reconstructions, not manufacturer-endorsed facsimiles. N16 electronics, Thornton correction rows and the F5100 operational layout are qualified studies; chemical presets use explicitly documented modern calibrations. Radiation relationships are educational, not certified metrology. Read [instrument fidelity and limitations](docs/HISTORICAL_FIDELITY.md), and independently check consequential calculations.

**Licence: [MIT](LICENSE).** The copyright and permission notice must accompany copies or substantial portions of the software. The standalone HTML, including configured copies, embeds the full licence text. Package metadata declares `MIT`; `private: true` only prevents accidental npm publication. See [LICENSING.md](LICENSING.md) for scope and third-party notices. No third-party scans or font files are bundled.
