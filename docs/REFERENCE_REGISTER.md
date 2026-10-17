# Reference register

Sources for instrument layouts, mathematical relationships and implementation details. References do not establish complete historical calibration or confer rights to redistribute scans. The instrument guides state the specific relationships and limitations implemented here. External links may change; check the source before extending a calibration claim. No scans or font files are bundled.

## Faber-Castell 2/83N

- Faber-Castell, *Instructions: Precision Slide Rule No. 2/83N, 62/83N* — https://www.sliderules.info/pdf/fc-283n-eng.pdf
- International Slide Rule Museum manual copy — https://sliderulemuseum.org/Manuals/Faber-Castell_2-83N_Manual_English.pdf

## Pickett N3 and N4

- Pickett N3-ES model notes and scale photographs — https://www.sliderules.info/collection/10inch/030/1037-pickett-n3-es.htm
- Pickett N4-T model notes and scale photographs — https://www.sliderules.info/collection/10inch/070/1070-pickett-n4.htm
- Smithsonian, *Pickett Manual for Dual Base Log Log Slide Rules* — https://www.si.edu/object/pickett-manual-dual-base-log-log-slide-rules%3Anmah_904697
- Pickett 1968 catalogue scan — https://sliderulemuseum.com/Manuals/Pickett_1968_SlideRuleCatalog_ScanDonatedByStevenDecker.pdf

The exact back-to-back root construction, manual page pointers and primary specimen photographs are documented in [PICKETT_ROOTS.md](PICKETT_ROOTS.md). The root branches retain independent numerical tick coordinates, unlike reciprocal log-log pairs.

## Thornton AA010

- AA010/P221 instruction scan — https://www.rekeninstrumenten.nl/Sliderule-Simulator-or-Emulator/react_resources/PIC_Thornton/AA010_full.pdf
- Model details and scale order — https://www.steves-sliderules.info/rule%20code/Thornton%20AA010.html

## K&E Deci-Lon 68-1100

- K&E collection scale set — https://www.mccoys-kecatalogs.com/KECollection/68-1100/ke68-1100familyrules.htm
- Deci-Lon model notes — https://www.sliderules.info/collection/10inch/020/1025-decilon.htm

## Pickett N16-ES

- International Slide Rule Museum N16 manual — https://www.sliderulemuseum.com/Manuals/M114_Pickett_HowToUseModel_N16-ES_ElectronicSlideRule.pdf
- Special N16 instructions — https://sliderulemuseum.org/Manuals/ISRM_M379_Pickett_N16-ES_ElectronicDuplex_Instructions_GiftOfPollyHattemer.pdf

## Blackbody radiation rules

- Pickett Model 17 manual — https://archive.org/details/BlackbodyRadiationSlideruleManualOfInstructionAndInformation
- Thornton F5100 manual — https://archive.org/details/InstructionsForTheUseOfASlideRuleForRadiationCalculations

## Versalog compact engraving

- International Slide Rule Museum Post Versalog manual — https://www.sliderulemuseum.com/Manuals/M34_Post_Versalog_1951.pdf
- Smithsonian Post Versalog manual record — https://www.si.edu/object/post-instruction-manual-versalog-slide-rule%3Anmah_904765

These references support historical layout study. They do not confer permission to redistribute scans or trademarks. External manuals and photographs are referenced by link rather than bundled in the repository.

## Physical constants and additional Pickett references

Primary physical reference values used for the radiation checks:

- NIST, Stefan-Boltzmann constant: https://physics.nist.gov/cgi-bin/cuu/Value?sigma=
- NIST, Wien wavelength displacement constant: https://physics.nist.gov/cgi-bin/cuu/Value?eqbwien=
- NIST, SI defining constants (h, c, k, e): https://physics.nist.gov/cuu/Constants/index.html

Additional primary Pickett manual sources consulted for the distinction between model families:

- Pickett Model 3 Power Log manual: https://www.sliderulemuseum.com/Manuals/Pickett_HowToUse_Model3PowerLog.pdf
- Pickett Model 3 instructions: https://www.sliderulemuseum.com/Manuals/Pickett_Model_3_Instructions_Jeff_Fose.pdf

Browser implementation reference (not a historical-instrument reference):

- MDN CSS zoom: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/zoom

Use independent numerical checks and the documented instrument limitations when assessing an operational claim.

## Implementation references

- Node.js subpath imports: https://nodejs.org/api/packages.html#subpath-imports
- Node.js test runner: https://nodejs.org/api/test.html
- Browser native import maps: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap
- GitHub Pages custom workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Official checkout releases: https://github.com/actions/checkout/releases
- Official setup-node releases: https://github.com/actions/setup-node/releases
- Playwright Python CI: https://playwright.dev/python/docs/ci

Review upstream releases when maintaining workflow dependencies. Successful workflow execution is established by its actual result, not by these links.

## Chemical-instrument sources

The manufacturer manual, original-specimen photos, CIAAW values and IAPWS/NIST calibration references are individually recorded with page/range pointers in [CHEMICAL_SCALES.md](CHEMICAL_SCALES.md). These references document the explicitly modern calibrations; no scans or font files are bundled.

## Flying Fish 1017

Primary specimen photographs and the discrepancies between photographs and
catalogue captions are recorded individually in [FLYING_FISH_1017.md](FLYING_FISH_1017.md).
The actual scientific and chemical faces were inspected. No manufacturer 1017
manual was obtained; the modern chemical equations remain those documented in
CHEMICAL_SCALES.md, rather than an unsupported historical-calibration claim.

## Keyboard interaction references

- W3C WAI-ARIA Authoring Practices, [Slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/): arrow keys, endpoints, optional larger page-key steps and accessible value descriptions. Native range inputs are retained in this project; this reference does not constitute a conformance certification.
- W3C, [Understanding character key shortcuts](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html): S/C are enabled only while the instrument has focus, not while editing or dictating elsewhere on the page.

## Pickett Model 14 and reference marks

[Pickett 14](PICKETT_14.md) records the primary specimen sources, mathematical conventions and omitted end extensions. [Constant marks](CONSTANT_MARKS.md) records manufacturer page pointers and independently checked values.

## Faber-Castell 2/82N

- Manufacturer, *Anleitung zu den doppelseitigen Rechenstaeben Castell-Duplex*,
  models 2/82N and 62/82N, 1962: https://www.rechenschieber.org/wordpress/wp-content/uploads/2018/08/FC_2_82_N__62_82_N.pdf
- Printed pages 3-4: exact front/back row order, including S' and K'.
- Printed pages 15-16: reverse P in red; sine/cosine and tangent/cotangent ink.
- Printed page 17: movable S' sine-product example.

The [preset guide](FABER_282N.md) separates the manufacturer's statements from
independent numerical checks and identifies omitted physical details.

## Faber-Castell Mathema 2/84N and Aristo hyperbolic instruments

The [Mathema guide](MATHEMA.md) records its gradian and function-scale conventions, source links and mathematical scope. The [Aristo guide](ARISTO_HYPERBOLIC.md) records the manufacturer manual, specimen scale order and the distinctions between the 0971 HyperboLog and 0972 HyperLog.
