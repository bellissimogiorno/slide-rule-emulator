# Contributing

By submitting a contribution, you agree that it may be distributed under the project's [MIT licence](LICENSE). You retain copyright in your contributions; no copyright assignment or separate contributor licence agreement is required. Only submit material that you have the right to contribute under these terms.

Keep mathematical mappings, candidate graduations, pixel thinning and label packing separate. Never make ticks look evenly spaced by changing the mapping. Prefer data definitions over copied implementations, and explicit error messages over a fallback to a different scale. Put explanatory comments at mathematical/architectural boundaries rather than narrating every statement.

Use four spaces in JavaScript, Python and CSS, and two in JSON/YAML. Keep native modules acyclic and the pure core free of DOM/storage dependencies. New source modules use the existing `#...` import convention. No third-party runtime/build package should be introduced without explaining why a small dependency-free implementation is insufficient.

For a bug fix, add a failing regression or a documented visual reproduction first. Run `npm run verify`; run the native browser matrix for rendering/UI changes. Include preset, face, viewport, magnification, compact mode and a minimal JSON programme in rendering reports. Check correct positioning **and** adequate graduation coverage. A screenshot with no overlaps can still be wrong.

Update relevant documentation and run `npm run build` after source changes. Commit the generated `index.html`, `docs/index.html`, `dist/index.html` and their `.nojekyll` markers together. Do not commit virtual environments, fonts, copied historical scans, secrets or local user programmes. Generate and review screenshots for UI changes, and attach relevant evidence to the pull request. Local QA output is ignored and is not bundled with releases.

## Language

Use UK English in interface text, scale descriptions, comments, documentation
and test descriptions: for example, colour, centre, normalised, organisation,
behaviour and licence (noun). Prefer -ise/-isation forms consistently. The
application uses programme for a saved scale/layout configuration; program is
also valid UK English when referring to executable computer code.

Do not respell standard CSS/DOM/API names, existing public identifiers, JSON
keys, schema or file paths, third-party action names, reference URLs or quoted
source titles. These are compatibility or attribution details, not prose.
Generate reports and screenshots from the source under review and retain the
execution mode and limitations with the evidence. Run `npm test`
to check the focused UI/catalogue language regressions after changing text.
