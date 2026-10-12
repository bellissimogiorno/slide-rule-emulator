# UltraLog

Select **UltraLog - Zvi Doron design**, press **Load preset**, and choose
**Both sides**. This implements the published forty-row proposal. It is not
presented as a factory-produced historical instrument or a photographic replica.

## Source arrangement

The primary basis is Zvi Doron's [Scale Design page](https://www.peterholland.de/ultralog/scaledesign.htm),
linked from the requested [Scale Development page](http://www.peterholland.de/ultralog/scaledev.htm).
The indexed design text specifies the following order. Brackets indicate the
moving slide; rows outside them are fixed.

```
Front: LL/0 LL/1 LL/2 LL/3 DF
       [ CF CIF SH1 SH2 CH TH Ln L CI C ]
       D LL3 LL2 LL1 LL0
Back:  Const R1 R2 K A
       [ B T1 T2 ST S P H1 H2 CI C ]
       D DI Q1 Q2 Q3
```

Each face has five upper-stator rows, ten slide rows and five lower-stator rows.
All rows are separate: the design explicitly rejects back-to-back grouping.
The white paper and restrained yellow grouping follow the design description;
exact shades, line spacing and manufacturer artwork are not reproduced.

## Numerical interpretation

These are the emulator's explicit mathematical conventions for the familiar
scale names, not a claim to have recovered an original engraving programme.
With the fixed D scale read as `d = 10^p`:

- LL0 to LL3 give `exp(d * 10^(n-3))`; LL/0 to LL/3 give the corresponding
  negative exponents. These are natural exponentials, not base-ten log-log.
- R1/R2 are the two branches of the double-length square-root scale. Q1/Q2/Q3
  are the three branches of the triple-length cube-root scale.
- SH1/SH2 give `asinh(d/10)` and `asinh(d)`. CH gives `acosh(d)`, and TH gives
  `atanh(d/10)`, with the latter ending before its infinite endpoint.
- H1/H2 give `sqrt(1+(d/10)^2)` and `sqrt(1+d^2)`. P gives `sqrt(1-(d/10)^2)`.
- Ln and L are linear readings `ln(d)` and `log10(d)`. The two scales on the
  moving slide use its local coordinate, not the fixed cursor coordinate.

Folded and inverse readings use the existing decimal-normalised convention.
Restore decimal powers when interpreting a reciprocal or folded product.
The existing small-angle ST approximation and its stated domain are retained.

All rows are available independently as `UL_...` definitions in the library.
Their identities are separate from legacy definitions, so changing a generic
custom definition does not silently alter this preset. The mathematical
implementations are shared, not copied into another runtime.

## The Const row: an explicit addition, not an inferred transcription

The retrieved primary design text names **Const** but does not establish its
inventory. Direct retrieval of the original page and its original development
images failed in this environment; the indexed page text was available.
Supplementary images in [M. Murakami's UltraLog repository](https://github.com/mmurak/SlideRule-UltraLog)
were inspected only as references, not copied into this package.

Rather than misrepresenting a guessed original inventory, `UL_CONST` explicitly
identifies its eight marks as **emulator-supplied mathematical references**:
`sqrt(4/pi)`, `sqrt(2)`, `sqrt(3)`, `ln(10)`, `e`, `pi`, `sqrt(10)`, and `2*pi`.
Their tooltips state both the value and meaning. It is a discrete reference row:
the readout names the nearest mark and does not invent intermediate constants.
Delete or replace it through the usual editor to supply another selection.

## Scope and attribution

The arrangement is credited to **Zvi Doron**. The original project describes a
proposal and a working cardboard model; this documentation makes no claim about
its later production status. The programme and artwork in the external
Murakami emulator are not reused. Its [acknowledgement](https://github.com/mmurak/SlideRule-UltraLog/blob/master/Acknowledgement_E.html)
records permission obtained for that separate project, and its README has an
additional rights statement. No such third-party permission is asserted by
this package. See [licensing notes](../LICENSING.md).

Conventional and fully adaptive graduations both work. This is an independent
mathematical implementation of the main intervals: it does not claim identical
mark-by-mark graduation, every original reference mark, end extension or cursor.
