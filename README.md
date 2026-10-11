# Programmable slide-rule emulator

This package was vibe-coded by Murdoch J. Gabbay. I hope you find it useful and do not hesitate to submit patches if you find mistakes.

**Licence: [MIT](LICENSE). Copyright (c) 2026 Murdoch J. Gabbay.**

**Warranty and liability disclaimer**

To the fullest extent permitted by applicable law, this software and its documentation are supplied "as is" and "as available", without any warranty or guarantee, whether express, implied or statutory. This includes, without limitation, any warranty of accuracy, reliability, satisfactory quality, merchantability, fitness for a particular purpose or non-infringement. There is no guarantee that the software is free of errors or will operate without interruption.

Use this software at your own risk. To the fullest extent permitted by applicable law, Murdoch J. Gabbay, the contributors and the copyright holders accept no liability for any claim, loss, damage or other liability arising from the software, its use or an inability to use it, whether in contract, tort (including negligence) or otherwise. This includes incorrect results, loss or corruption of data, computer crashes, damage to hardware or software, lost profits and business interruption, even if advised of the possibility of such consequences.

Nothing in this disclaimer excludes or limits liability that cannot lawfully be excluded or limited. This is an explanatory notice, not an additional licence condition; the [MIT licence](LICENSE) contains the licence terms, including its warranty and liability provisions.

---

**Version 3.2.3**

An offline, two-sided scientific slide rule with configurable scales, classic instrument layouts and compact, readable engraving. Arrange the scales on either face, move the slide and cursor, and save your own instrument as a single HTML file. There is no account, backend, telemetry or runtime package dependency.

## Try it

Open **[`dist/index.html`](dist/index.html)** in a modern browser. The complete application is in that file. Export a JSON programme or a configured standalone copy to keep a portable backup of your settings; local browser storage is not a backup.

For a local preview, use Node.js 22 or later:

```sh
npm run build
npm start
# Open the loopback address printed by the preview server.
```

No `npm install` is required. `npm run dev` rebuilds on each preview request: edit a source file and reload. `src/index.html` is a build template, not a directly runnable page.

## Explore the instruments

**Sixteen presets** cover Faber-Castell 2/83N, British Thornton AA010, Pickett N3/N4/N16, K&E Deci-Lon, Pickett Model 17, Thornton F5100, Hemmi 257 and Flying Fish 1017, alongside scientific, classic, root, log-log, trigonometric and hyperbolic layouts.

The scale library contains **193 definitions**, including aliases and composite rows. Arithmetic, reciprocal and folded scales sit alongside square/cube/fifth powers and roots, circular and hyperbolic functions, paired log-log ranges, and specialist chemical and radiation relationships. The Pickett N3/N4 paired log-log rows share graduations with reciprocal readings in black and red.

Choose **Both sides** to display linked front and back faces. Either face controls the same slide and cursor; **Edit face** selects the layout being edited. The instrument gets the full available width, with the scale editor below it. Compact numbering places numerals alongside or around major ticks. Magnification runs from 100% to 200%; narrow screens scroll the instrument instead of squeezing the graduations.

Drag the slide or cursor, use the position controls, or focus the rule and use the arrow keys. Hold Shift with an arrow to move the slide. The digital cursor readout shows the corresponding scale values. UK English is used throughout the interface and documentation.

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
| `dist/` | Ready-to-use standalone application |

The source uses native JavaScript modules. The deterministic build embeds them unchanged into the standalone HTML; it does not transpile or minify them. Edit the source rather than the generated file.

## Build and test

```sh
npm test                 # Unit and integration tests
npm run check            # Syntax, module boundaries, catalogue and schema checks
npm run build -- --check # Check that dist matches the source byte for byte
npm run verify           # All three checks
```

Optional browser tests require Python and the development dependencies:

```sh
python -m venv .venv
# Activate .venv using the command for your shell.
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
npm run test:browser
npm run test:visual
```

See [testing](docs/TESTING.md) for prerequisites, native and diagnostic modes, and visual review. Test reports are generated locally, not included in the release archive.

## Publish and contribute

The repository includes verification workflows for pushes and pull requests, and a manual GitHub Pages deployment workflow. See [publishing and releases](docs/RELEASING.md). To build a distributable archive:

```sh
npm run release
# Writes a ZIP, complete internal manifest and SHA-256 checksum in releases/.
```

Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing changes and [SECURITY.md](SECURITY.md) for data handling and reporting guidance.

## Scope and licence

These are mathematical reconstructions, not manufacturer-endorsed facsimiles. N16 electronics, Thornton correction rows and the F5100 operational layout are qualified studies; chemical presets use explicitly documented modern calibrations. Radiation relationships are educational, not certified metrology. Read [instrument fidelity and limitations](docs/HISTORICAL_FIDELITY.md), and independently check consequential calculations.

**Licence: [MIT](LICENSE).** The copyright and permission notice must accompany copies or substantial portions of the software. The standalone HTML, including configured copies, embeds the full licence text. Package metadata declares `MIT`; `private: true` only prevents accidental npm publication. See [LICENSING.md](LICENSING.md) for scope and third-party notices. No third-party scans or font files are bundled.
