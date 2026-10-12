# Pickett-style fifth roots and powers

## Select the layout or individual scales

Choose **Pickett-style fifth roots and powers** in **Layout preset**, then press
**Load preset**. Choose **Both sides** to compare fixed and movable scales.
Previously saved layouts are retained until you explicitly load a preset.
Export an important customised programme before replacing its layout.

This is a mathematical extension of the back-to-back layout used by the
existing Pickett root banks, **not a claimed historical Pickett instrument**.
The historical N3 and N4 presets are unchanged.

The complete bank and the power pair are separate library choices:

| Library ID | Purpose |
| --- | --- |
| `PICKETT_FIFTH_ROOT` | All five fifth-root branches in one movable bank |
| `PICKETT_5R1` through `PICKETT_5R5` | The five component branches, independently selectable |
| `F5_PAIR` | Shared-tick fifth powers and their true reciprocals |

Each complete bank or pair is a single scale-editor item. Drag it, use the
arrows to move it between rails, remove it or undo an edit as with any other
scale. The front of the preset keeps both on the stator, aligned with D. The
back puts both on the slide, aligned with C, and supplies the existing square-
and cube-root banks for comparison. The slide position is shared between faces.

`examples/pickett_style_fifths.json` is an importable both-sides programme, with
the cursor set to D = 3.2. All ordinary/compact numbering, page themes,
magnification settings, keyboard controls and the directly rendered loupe apply.
Scale explanations are confined to the labelled end panels.

## What shares a line

There are five increasing, black fifth-root branches. The first occupies an
unruled upper band. Branches 2 and 3 face away from one shared horizontal line;
branches 4 and 5 face away from a second shared line. This arrangement preserves
the increasing order and all five readings without drawing five separate ruled
rows or shrinking the numerals. It extends the existing three-branch layout by
one more back-to-back pair.

Sharing a horizontal line does **not** make round numbers on different root
branches share a horizontal position. Each branch retains its own mathematically
placed graduations. The two readings on the fifth-power pair, by contrast, are
exact reciprocals at the same position and genuinely share each tick.

## Fifth-root calculation

For normalised position `p` from 0 to 1, the local C/D value is `x = 10^p`.
The five branches, numbered 1 to 5, read

```text
branch j + 1: r_j = (10^j x)^(1/5), for j = 0, 1, 2, 3, 4
position:    p   = 5 log10(r_j) - j
```

To find the fifth root of a positive number, write `N = m times 10^k`, with
`1 <= m < 10`. Choose the branch `j + 1`, where `j` is the **non-negative**
remainder of `k` divided by 5. Put the cursor at `m` on the aligned C/D scale,
read that branch, and multiply the result by `10^floor(k/5)`.

This works for negative exponents as well. In JavaScript, use
`((k % 5) + 5) % 5`, not just `k % 5`, to obtain the non-negative remainder.
The right-hand digit reminders apply to positive integers; the exponent rule
is the general rule, including decimals below one.

| Radicand N | m | k | Branch | Branch reading | Fifth root of N |
| --- | ---: | ---: | ---: | ---: | ---: |
| 32 | 3.2 | 1 | 2 | 2 | 2 |
| 243 | 2.43 | 2 | 3 | 3 | 3 |
| 1024 | 1.024 | 3 | 4 | 4 | 4 |
| 100000 | 1 | 5 | 1 | 1 | 10 |
| 0.00032 | 3.2 | -4 | 2 | 2 | 0.2 |

For a negative radicand, take the fifth root of its positive magnitude and
restore the minus sign. The logarithmic scales themselves display positive
values only and do not include zero. Decimal exponents and signs are not
inferred from the cursor's mantissa reading.

## Fifth powers and reciprocal fifth powers

The paired row uses

```text
black: x^5    = 10^(5p),  increasing from 1 to 100000
red:   x^(-5) = 10^(-5p), decreasing from 1 to 0.00001
black times red = 1
```

Thus at C/D = 2 the row reads **32** in black and **0.03125** in red. The
endpoint pairs are **1 / 1** at the left and **100000 / 0.00001** at the right.
The full-precision numerical value determines the reciprocal; a rounded printed
caption is never used as input to that calculation. Displayed values still
have finite printing/readout precision.

For `N = m times 10^k` outside the displayed decade, multiply the black result
by `10^(5k)` to obtain `N^5`, and the red result by `10^(-5k)` to obtain `N^(-5)`.
For negative N, both these odd powers have a negative sign.

**Legacy numbering:** `F5I` is kept unchanged for saved-programme compatibility.
It is the reversed five-decade 1-to-100000 scale, so it reads `100000/x^5` at the
same position, not `1/x^5` with a fully resolved decimal point. The new
`F5_PAIR` prints and reports the true reciprocal directly. No saved `F5`, `F5I`
or independent `5R1`-`5R5` calibration is silently replaced.

## Programming and implementation

A `rootStack` accepts exactly two order-2, three order-3 or five order-5 children,
consecutive from branch zero and spanning the full position range. The same
band-partition function generates the graduation body and the two end gutters.
The dedicated fifth-root components are separate from the legacy `5R` entries,
so overriding those cannot silently alter the complete bank.

A positive `log` or `inverseLog` definition may specify `pairedProduct`. Its
secondary reading is `pairedProduct / primary`; **1** requests true reciprocals.
`positiveCaption` and `negativeCaption` name the two readings in the gutters
and digital readout. This is a presentation property, not a different mapping.
The tick-generation and readout paths use the same product rule.

For example:

```json
{
  "id": "MY_FIFTH_POWERS",
  "label": "Fifth powers / reciprocals",
  "type": "log",
  "min": 1,
  "max": 100000,
  "tickMode": "log",
  "tone": "neutral",
  "pairedProduct": 1,
  "positiveCaption": "x^5",
  "negativeCaption": "x^(-5)"
}
```

The runtime validator rejects non-positive products or domains, unrepresentable
secondary endpoints, incompatible mappings, nested multiline pairs and combining
`pairedProduct` with `pairedSum` or `referenceOnly`. Normal layout limits apply.
The JSON Schema additionally enforces the supported root-bank cardinalities;
mathematical branch checks remain the runtime validator's responsibility.

The targeted checks are `tests/unit/fifths.test.js` and
`tests/browser/fifths.py`. Run the latter through the normal browser runner:

```sh
python tests/browser/run.py --mode native --suite fifths --visual
```

Native mode fails if navigation is unavailable; `--mode dom` is an explicitly
restricted alternative, not verification of native loading or persistence.
