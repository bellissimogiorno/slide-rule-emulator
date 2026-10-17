# Faber-Castell 2/84N Mathema

Choose **Faber-Castell 2/84N Mathema** in **Classic instruments**, or load
`examples/faber284n-both.json`. The duplex layout contains 12 rows on each face.

The principal **y** and **Y** scales read **0.1 to 1**, including their decimal
points. All circular angles and hyperbolic arguments are in **gon**:
100 gon = 90 degrees = π/2 radians. The superscript **g** on a historical
caption identifies that unit; it is not an exponent on the variable.

## Scope

This is a mathematical emulation of the principal decade. End extensions,
auxiliary cursor marks and stroke-for-stroke historical engraving are omitted.
The physical Mathema's two linear exponential rows use an auxiliary cursor
system. The emulator's **starred** `(eˣ)*` and `(eˣᵍ)*` rows are deliberately
normalised for its single main hairline. Their use is explained below; they are
not a reproduction of the original cursor offsets. This qualification also
appears in the on-screen instrument note and each row's help text.

The circular and hyperbolic scales have decimal gon graduations. The fixed
hyperbolic tangent uses an emulator cutoff of 200 gon, just before its
infinite-argument limit at Y = 1; this is not a claim about the last engraved
mark on a particular specimen. It must not be stretched to fill the remaining
space.

## Scale arrangement and exact calibration

Let `p` denote distance along the main decade, from 0 at the left to 1 at the
right. With the slide closed, `Y = y = 10^(p−1)`. An engraved number is the
argument or inverse-function value specified below, not necessarily the value
of the function in the left caption. This is particularly important for `√X`:
its numbers are **Y²**, just as an A scale's numbers are squares.

The following equations define the implementation; the calibration follows by
substituting `Y = 10^(p−1)` and solving each stated function relation.

| Face / rail | Rows, from top to bottom | Reading under the hairline |
|---|---|---|
| Front, upper stock | `(eˣᵍ)*`, `tan Xᵍ`, `√(X²−1)`, `√X` | `200 ln(10Y)/π`; `200 atan(Y)/π`; `√(1+Y²)`; `Y²` |
| Front, slide | `√x`, `1/√x`, `1/y`, `y` | `y²`; `1/y²`; `1/y`; `y` |
| Front, lower stock | `Y`, `√(1−X²)`, `sin Xᵍ`, `(eˣ)*` | `Y`; `√(1−Y²)`; `200 asin(Y)/π`; `ln(10Y)` |
| Back, upper stock | `10ln X`, `ln X`, `0.1ln X`, `Y` | `exp(0.1Y)`; `exp(Y)`; `exp(10Y)`; `Y` |
| Back, slide | `y`, `0.1 cosh xᵍ`, `0.1 sinh xᵍ`, `sinh xᵍ` | `y`; `200 acosh(10y)/π`; `200 asinh(10y)/π`; `200 asinh(y)/π` |
| Back, lower stock | `tanh Xᵍ`, `−0.1ln X`, `−ln X`, `−10ln X` | `200 atanh(Y)/π`; `exp(−10Y)`; `exp(−Y)`; `exp(−0.1Y)` |

Uppercase letters denote fixed rows, lowercase movable rows. The model uses
the fixed `tanh Xᵍ` interpretation with **Y** as its principal value. The inverse
caption `ᵍtanh y` found in inventories should not be taken to imply that this
row moves with the slide.

## Working examples

Keep the slide closed for the following checks unless stated otherwise.

* At **Y = 0.8**, `√(1−X²)` reads **0.6** and `sin Xᵍ` reads approximately
  **59.033447 gon**. These give the sine, cosine and angle of a 3–4–5 triangle.
* At **Y = 0.75**, `√(X²−1)` reads **1.25**. This is `√(1+0.75²)`.
* At **Y = 0.5**, `√X` reads **0.25**, `1/√x` reads **4**, and `1/y` reads **2**.
* For **0.6 × 0.5**, align **y = 1** with **Y = 0.6**, then place the cursor on
  **y = 0.5**. The fixed **Y** reading is **0.3**.
* On the back, set **Y = 0.5**. `ln X` reads **1.648721271…** and `−ln X`
  reads **0.606530660…**, whose product is 1.
* A reading of **100 gon** on `0.1 cosh xᵍ` corresponds to
  **y = 0.250917848…**. Multiplying by 10 gives `cosh(π/2)`.

For the starred linear exponential rows, set the argument on the row and
multiply the **Y** reading by 10. Thus **0.5** on `(eˣ)*` gives
**Y = 0.164872127…**, so `exp(0.5) = 1.648721271…`. On `(eˣᵍ)*`, **100 gon**
gives `exp(π/2) = 4.810477381…` after the same factor of 10. To read the natural
logarithm of a number `a` between 1 and 10, set **Y = a/10** and read `(eˣ)*`.
For other decades, add the appropriate integer multiple of `ln(10)` yourself;
the physical cursor's 2.2/140-gon offset procedure is not implemented.

## Sources and verification

The manufacturer's manual establishes the principal decade, the function
notation, the gon unit and the auxiliary-cursor treatment. The museum's
specimen inventory establishes the duplex row placement. No photographs or
manual pages are redistributed in the app.

* [Eugen Moeller, manufacturer instructions for Mathema 2/84N, English scan](https://sliderulemuseum.com/Manuals/Faber-Castell_2-84N_Mathema_UniversalSlideRuleInstructions_English.pdf).
* [Álvaro González's Spanish transcription/translation of the manufacturer instructions](https://sliderulemuseum.com/Manuals/Faber-Castell_2-84_2-84N_Mathema_Instructions_Spanish_%20v1.0_AlvaroGonzales.pdf), especially printed pages 2–3 and 16–19. The searchable transcription was useful for checking the formulas; examples are recomputed rather than trusting rounded or mistranscribed numbers.
* [International Slide Rule Museum: Faber-Castell specimen inventory](https://sliderulemuseum.com/Faber.shtml), entry **ISRM 17.07.27.01.X**, 2/84N, 24 scales.
* [User-specified Mathema specimen](https://www.sliderules.info/collection/10inch/070/1078-mathema.htm). Its stated lower y bound of 0.65 conflicts with the principal decade in the manual; this emulator uses the documented central 0.1–1 interval.

`tests/unit/mathema.test.js` checks every row's supported domain and inverse,
the two faces and rail assignments, independent trigonometric and hyperbolic
identities, reciprocal log-log pairs, a slide multiplication/division, the
single-hairline exponential convention, and finite graduations in both
conventional and adaptive modes.
