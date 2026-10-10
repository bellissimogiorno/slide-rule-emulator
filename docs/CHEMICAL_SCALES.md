# Chemical slide rule: Hemmi 257 study

The **Hemmi 257** and [Flying Fish 1017](FLYING_FISH_1017.md) are distinct chemical-instrument presets. This guide describes the Hemmi and the explicitly modern chemical mappings shared by both; their physical row orders and available conversion rows differ. The Hemmi's documented row order is retained, but this is a mathematically calibrated educational reconstruction, not a dimensional facsimile. Modern constants and correlations are explicitly distinguished from the original engraving.

## Open the instrument

Choose **Hemmi 257 - Chemical engineering** in Layout preset, press **Load preset**, then choose **Both sides** in the Side menu. Both upright faces share the same scale length, slide displacement and cursor position. Dragging either face changes both. The separately labelled **Edit face** control selects only the layout being edited. This view is saved in JSON and standalone copies.

The front has `L, A, DF [ CF, CIF, CI, C ] D, LL3, LL2, LL1`. The back has `Ch A-M, Ch N-Z, M1/Xw [ M2/X, TF, TC, TK, F(t) ] P kgf/cm2, P mmHg/atm, P vacuum/psi, tw`. Brackets denote the moving slide. Reference [H1] gives the physical row order; [H2] explains the working relationships.

## Chemical reference marks: Ch A-M and Ch N-Z

These are reference marks at specific logarithmic positions, **not continuous scales of atomic weight**. The chosen repertoire comprises 52 element symbols and 18 group/reference symbols. Modern representative relative weights are in `src/catalog/chemical-data.js`; group values are sums of those element weights. The atomic values follow the CIAAW 2024 abridged table [C1], without claiming sample-specific precision.

A mark for relative mass `m` is at `p = log10(m / 10^k)`, where `k = floor(log10(m))`. Underlining denotes `D x 1`, no line `D x 10`, and overlining `D x 100`. For example, C at D = 1.2011 means 12.011; Au at D = 1.9697 means 196.97. The front D scale is fixed, like the Ch rows, so this correspondence does not depend on slide position.

Hover a visible symbol for its value. The digital reading explicitly says **Nearest**, including when the cursor is between marks. Crowding may hide a printed symbol but does not remove it from the reference data/readout. `Ra[226]` is a mass-number convention, not a standard atomic weight; `Air` is a conventional dry-air mean, not an element. Natural isotopic variability and precision limits must not be inferred from the number of displayed digits.

## M1/Xw and M2/X: mixture conversion

Each physical row has two independent horizontal segments. The left quarter reads a mass/density setting from 1 to 100. The remaining part reads a dimensionless fraction from 0.001 to 0.999. The blank transition is intentional; **100 on M and 0.001 on X are different quantities**, not adjacent values of a continuous function.

For component molar masses `M1, M2`, mole fraction `x` of component 1 and mass fraction `w` of component 1:

```text
w / (1 - w) = (M1 / M2) x / (1 - x)
M position      = log10(M) / 8
fraction position = (log10(x / (1 - x)) + 5) / 8
slide offset    = log10(M1 / M2) / 8
```

Thus the two kinds of graduations have the **same logarithmic pitch**, even though they occupy different parts of a row. The renderer must not stretch a segment to fill the entire row.

Using the original manual's example [H2, printed pp. 37-38], convert 20 mass percent ammonium sulphate in water. The manual uses 132.1 and 18.0. Divide **both** by ten, then align M2 = 1.8 on the slide under M1 = 13.21 on the stator. Put the cursor at Xw = 0.2. X reads approximately 0.0329429, or **3.29429 mole percent**. The manual rounds this to 3.3%. Modern reference masses produce a slightly different last digit. Do not divide just one mass by ten.

The same odds relationship supports the manual's ideal binary Raoult-law example by using pure-component vapour pressures in place of masses. Substituting densities instead gives weight/volume fractions **only when volumes are additive**; actual mixing contraction is not modelled. These are algebraic conversions, not a general phase-equilibrium or solution-chemistry solver.

## Temperature conversion

TF, TC and TK share the coordinate `p = log10(T_kelvin / 100)` over 100-1000 K. Celsius uses exactly `T_kelvin = T_celsius + 273.15`; Fahrenheit uses `(T_fahrenheit + 459.67)/1.8`.

For example, 120 C, 248 F and 393.15 K align. All three are on the slide, so their mutual alignment survives any slide displacement. Front C has the same moving coordinate; D agrees when the slide is reset to zero. The chemical conversion scales are not the Model 17's separate 100-10000 K temperature system.

## Pressure conversion

All pressure rows use one absolute-pressure coordinate:

```text
p = (log10(P_pascal / 98066.5) + 3) / 6
```

The complete range is 0.001-1000 kgf/cm2 absolute. The pressure conventions and conversion factors are documented in NIST SP 811 [U1]. The second row uses mmHg absolute below one standard atmosphere and atmospheres above it. The third uses inches of mercury vacuum below one standard atmosphere and psi **gauge** above it. The vacuum segment is red because it decreases as absolute pressure increases; the positive-gauge segment is black.

Gauge zero is **101325 Pa**, not the ambient atmospheric pressure at the user's location. Conversion factors in the core are 98066.5 Pa per kgf/cm2, 6894.757293168 Pa per psi, and 133.322387415 Pa per conventional mmHg. A conventional mmHg is not mathematically identical to a Torr, so the atmospheric boundary is approximately, not exactly, 760 mmHg. This distinction is far below the printed instrument precision.

Zero gauge/vacuum values are calculated with `expm1`, avoiding cancellation from subtracting nearly equal absolute pressures. Both sides of a segment boundary describe the same absolute pressure, even when the displayed units change. In particular, atmospheric pressure can legitimately read about 760 mmHg / 1 atm and 0 vacuum / 0 gauge at the shared index.

## tw: ice and steam equilibrium temperature

The fixed tw row aligns directly with the fixed pressure rows. It uses the IAPWS supplementary saturation-pressure equation [W1] above the triple point, and the IAPWS ice-Ih sublimation equation [W2] below it. The displayed domain runs from -20 C to the critical point, 373.946 C. Below the triple point this is **ice/vapour**, not supercooled-liquid/vapour equilibrium.

Examples of the modern calculation are approximately 101417.99 Pa at 100 C and 476158.72 Pa at 150 C. There is no saturated liquid/vapour temperature above the critical-pressure endpoint; the readout correctly reports off scale. The printed 1960s relation is not claimed to have identical last-digit calibration.

## F(t): reversible ideal-gas adiabatic calculation

The left segment is a fixed mixture of 79 mol% nitrogen and 21 mol% oxygen (200-1000 K); the right is ideal CO2 (298.15-900 K). These use NIST Shomate heat capacities [N1-N3], **not an inferred or invented transcription of Hemmi's original fit**. The underlying pure-gas fits are integrated over their respective published temperature intervals and joined continuously at their fit boundaries.

```text
Delta s = integral from T1 to T2 of Cp(T) / T dT
ln(P2 / P1) = Delta s / R
F position change = Delta s / (6 R ln(10))
```

For `t = T/1000`, Shomate `Cp = A + B*t + C*t^2 + D*t^3 + E/t^2`. An entropy primitive is `A*ln(t) + B*t + C*t^2/2 + D*t^3/3 - E/(2*t^2)`. Additive entropy constants cancel. Splitting the integral at the 500 K nitrogen and 700 K oxygen fit boundaries avoids jumps caused by separately rounded entropy constants.

Align the initial F(t) temperature with the initial absolute pressure on P. Move the cursor to the final pressure and read the final temperature on **the same gas segment**. As a cross-check, 35 C air compressed reversibly from 1 to 7.8 atm gives about **276.155 C** in this model; the original manual gives 276 C [H2, printed p. 41]. The test suite separately checks the integral by numerical quadrature rather than relying only on a forward/inverse round trip.

No heat transfer, composition change, real-gas compressibility, phase change or compressor inefficiency is modelled. A pressure row spanning many decades is not a statement that the ideal-gas approximation remains accurate at all those pressures. These scales are not equipment-design tools. Out-of-domain temperatures are not extrapolated.

## Programme/library contract

All 22 `CHEM_*` definitions can be selected independently, moved to either face, or used in custom programmes. Reusing a child alone **retains its partial-row domain**; it does not stretch or silently recalibrate it. Larger magnification is appropriate for close reading. The stock compact and ordinary-numbering modes remain available.

`segmented` is a horizontal layout type, distinct from the vertically stacked `composite` type. It accepts one or two non-overlapping child domains, prohibits nesting, draws one baseline and deduplicates a shared endpoint. Child captions and ink overrides are supported. The digital reading includes only children whose domain contains the current position. All children are still ordinary reusable numerical/reference scales.

`waterVapor` and `gasEntropy` are the specialist chemical runtime types. Pressure, fraction, temperature and mass settings reuse the restricted expression mapper; the chemical symbols reuse ordinary logarithmic coordinates with manual marks. `refineTicks: true` explicitly permits round-value gap filling, including between supplied manual marks. Without that flag, a manual tick list is used exactly as supplied. Tick `title`, `mass` and `decade` metadata are validated before use; titles and symbols are HTML-escaped.

The `referenceOnly` flag requires labelled manual marks with positive masses and cannot be combined with composite/segmented/shared-LL rows. It asks the digital reader to identify the nearest reference, not invent an interpolated mass.

## Sources and reproduction boundaries

Sources were inspected on 2026-10-10. No manual scans, photographs, logos or font files are redistributed. This project is not endorsed by the historical manufacturers, CIAAW, NIST or IAPWS.

- **[H1]** Firsthand specimen photographs and row inventory: [Steve's Slide Rules, Hemmi 257](https://www.steves-sliderules.info/rule%20code/Hemmi%20257.html).
- **[H2]** Manufacturer instructions: [Hemmi 257 manual, scan by Greg Scott](https://www.sliderulemuseum.com/Manuals/Hemmi_257_ScanByGregScott.pdf). Printed pp. 32-41 (PDF pages 34-43, one-based) cover chemical marks, temperature/pressure, mixtures and F(t). The programme uses documented relationships, not reproductions of the manual text or pictures.
- **[U1]** [NIST SP 811, Appendix B.9, pressure conversion factors](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9), and [the exact standard atmosphere](https://physics.nist.gov/cgi-bin/cuu/Value?stdatm=).
- **[C1]** [CIAAW, Abridged Standard Atomic Weights 2024](https://ciaaw.org/abridged-atomic-weights.htm). Representative values have finite precision and natural-composition limitations; Ra has no standard atomic weight.
- **[W1]** [IAPWS SR1-86(1992), supplementary saturation properties](https://iapws.org/technical-guidance/release/Supp-sat.download), Eq. 1 and reference constants, printed p. 3.
- **[W2]** [IAPWS R14-08(2011), melting and sublimation pressures](https://iapws.org/public/documents/MdUFK/MeltSub2011.pdf), Eq. 6 and its coefficients, printed p. 5.
- **[N1]** [NIST Chemistry WebBook: CO2 Shomate gas heat capacity](https://webbook.nist.gov/cgi/cbook.cgi?ID=C124389&Mask=1&Units=SI).
- **[N2]** [NIST Chemistry WebBook: N2 Shomate gas heat capacity](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7727379&Mask=1&Plot=on&Type=JANAFG).
- **[N3]** [NIST Chemistry WebBook: O2 Shomate gas heat capacity](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7782447&Mask=261&Plot=on&Type=JANAFG).

The original Hemmi heat-capacity coefficients and exact dimensions of every engraving were not established. They are therefore not represented as historically certified calibrations. The existing qualifications for the other specialist presets remain in [HISTORICAL_FIDELITY.md](HISTORICAL_FIDELITY.md).
