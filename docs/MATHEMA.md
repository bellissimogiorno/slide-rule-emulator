# Faber-Castell 2/84N Mathema

Choose **Faber-Castell 2/84N Mathema** in **Classic instruments**, or load
`examples/faber284n-both.json`. The duplex layout has 12 rows on each face.
The front includes the two five-mark exponent cursor banks, labelled ivory end
caps and the π conversion hairlines. The reverse has the three ordinary hairlines.

The principal **y** and **Y** scales retain their decimal points and extend from
**0.065 to 1.5**. The central calculation decade is **0.1 to 1**. All circular
angles and hyperbolic arguments use **gon**: 100 gon = 90 degrees = π/2 radians.
The superscript **g** identifies that unit; it is not a power of the variable.

## Reconstruction and evidence

The supplied photograph of the Philip Rodley specimen establishes the visible
scale extensions and cursor alignment. The supplied close-up `1400_cur_vis.jpg`
clarifies the front cursor lettering, colour and extent of each hairline.
Richard Smith Hughes's article, **Faber-Castell
2/84 and 2/84N Mathemas** (Journal of the Oughtred Society 15.2, pages 58–63), supplies
additional photographs and a description of the cursor system. The manufacturer's
instructions establish its operation. Formulae and worked examples are recomputed
independently; printed rounded examples are not treated as exact values.

This is a mathematical and functional reconstruction, with scale-specific end
extensions. Tick spacing and label selection remain the emulator's screen-display
policies; the typeface, glass fittings and every engraved stroke are not a
facsimile. The display frame allows room around the recorded scales. It is not a
claim about the instrument's measured overall length. Source photographs and
manual pages are not redistributed.

## Scale arrangement and calibration

Let `d = log10(10Y)` denote distance in principal decades. The index **Y = 0.1**
is at `d = 0`, and **Y = 1** at `d = 1`. The display uses the same affine
coordinate for every Mathema row:

`q = (d − a)/(b − a)`, where `a = log10(0.625)` and `b = log10(16.5)`.

Thus the display frame corresponds to Y from 0.0625 to 1.65. Each engraved row
has its own smaller valid interval; its unused ends remain blank. Extending or
shortening a row must never rescale that row independently. Cursor offsets and
slide displacement use this same shared coordinate.

An engraved number is the argument or inverse-function value specified below.
In particular, the numbers on `√X` are **Y²**: its left caption states
`Y = sqrt(X)`.

| Face / rail | Rows, from top to bottom | Reading at the main hairline |
|---|---|---|
| Front, upper stock | `(eˣᵍ)`, `tan Xᵍ`, `√(X²−1)`, `√X` | `200 ln(1000Y)/π − 280`; `200 atan(Y)/π`; `√(1+Y²)`; `Y²` |
| Front, slide | `√x`, `1/√x`, `1/y`, `y` | `y²`; `1/y²`; `1/y`; `y` |
| Front, lower stock | `Y`, `√(1−X²)`, `sin Xᵍ`, `(eˣ)` | `Y`; `√(1−Y²)`; `200 asin(Y)/π`; `ln(1000Y) − 4.4` |
| Back, upper stock | `10ln X`, `ln X`, `0.1ln X`, `Y` | `exp(0.1Y)`; `exp(Y)`; `exp(10Y)`; `Y` |
| Back, slide | `y`, `0.1 cosh xᵍ`, `0.1 sinh xᵍ`, `sinh xᵍ` | `y`; `200 acosh(10y)/π`; `200 asinh(10y)/π`; `200 asinh(y)/π` |
| Back, lower stock | `tanh Xᵍ`, `−0.1ln X`, `−ln X`, `−10ln X` | `200 atanh(Y)/π`; `exp(−10Y)`; `exp(−Y)`; `exp(−0.1Y)` |

Uppercase letters denote fixed rows, lowercase movable rows. The fixed
`tanh Xᵍ` row uses **Y**. A lowercase y in a historical inverse caption does not
make that row part of the slide.

The photograph confirms **0–2.9** on the lower exponential row and **0–185 gon**
on the upper one. It shows **4.2–62 gon** on tangent, **4.2–100 gon** on sine,
**0–220 gon** on hyperbolic cosine, **40–220 gon** on upper hyperbolic sine and
**4–80 gon** on lower hyperbolic sine. The final finite hyperbolic-tangent mark
is **200 gon**; its limiting infinity mark belongs at Y = 1. The separate printed infinity symbol is not a finite graduation; the digital
row and its readout stop at the finite 200-gon mark. The photographed tangent tail has ten 0.2-gon
intervals after 60, ending at 62; published approximate range descriptions do
not override this specimen evidence.

The supported logarithmic-row ranges are listed explicitly below. The supplied
image does not resolve every small end graduation on these rows. The LL1/LL3
positive endpoints are legible; LL2 and the negative rows use conservative
readable boundaries rather than invented terminal ticks. Higher-resolution
photographs would be needed for a complete engraving trace.

| Row | Supported engraved values |
|---|---:|
| 10ln X | 1.0065–1.162 |
| ln X | 1.07–4.5 |
| 0.1ln X | 1.9–4,000,000 |
| −10ln X | 0.86–0.993 |
| −ln X | 0.22–0.935 |
| −0.1ln X | 0.000001–0.5 |

## Exponent cursor banks

The **middle** mark of each five-mark bank coincides with the main hairline.
The upper bank carries 280 / 10³ there; the lower bank carries 4.4 / 10³.
This observation fixes the otherwise arbitrary displacement of the exponential
rows. At **Y = 0.15**, the main hairline consequently reads **0.610635294…**
on the lower row and **38.986950034… gon** on the upper.

| Mark index j | Lower additive constant K | Upper additive constant Kᵍ | Result multiplier |
|---|---:|---:|---:|
| 0, leftmost | 0 (engraved X) | 0 (engraved Xᵍ) | 10 |
| 1 | 2.2 | 140 | 10² |
| 2, main | 4.4 | 280 | 10³ |
| 3 | 6.6 | 420 | 10⁴ |
| 4, rightmost | 8.8 | 560 | 10⁵ |

For **exp(x)**, choose a lower mark, subtract its K from x, and position that
mark over the residual on `(eˣ)`. Read **Y at the main hairline** and multiply
by the mark's power of ten. For **exp(πxᵍ/200)**, use the upper bank and subtract
Kᵍ. Auxiliary readouts identify the argument under each mark; the principal
readout remains the main-hairline reading. The marks move as one cursor.

The exact offsets from the main hairline, in principal-decade units, are
`(j−2)(1−2.2/ln(10))` below and
`(j−2)(1−140π/(200 ln(10)))` above. Divide by `b−a` for display-coordinate
offsets. The two banks are close but **not exactly equally spaced**.

Examples with the slide closed:

* **exp(7):** put the lower **6.6; ×10⁴** mark over **0.4**. Main Y reads
  **0.1096633158…**; the result is **1096.633158…**.
* **exp(11):** put **8.8; ×10⁵** over **2.2**. Main Y reads **0.5987414172…**;
  the result is **59874.141715…**.
* **exp(π/2):** put the upper **Xᵍ; ×10** mark over **100**. Main Y reads
  **0.4810477381…**, giving **4.810477381…**.
* **exp(3π):** put the upper **560; ×10⁵** mark over **40**. Main Y reads
  **0.1239164781…**, giving **12391.647808…**.

For a negative exponential, use the same positive-argument setting, read **1/y
at the main hairline** with the slide closed, and multiply by the reciprocal
power of ten. Outside a row's engraved interval, its readout is unavailable.

## π conversion hairlines

The two ordinary outer hairlines stand at
`±0.5 log10(π/2)` principal decades from the main hairline. On the front they cover the ten
rows from tangent through sine, stopping
short of the two exponential rows. The main hairline spans all twelve rows.
The reverse retains its three ordinary hairlines and ivory end caps, as visible
in the supplied duplex specimen photograph. The readout names “Left” and “Right”
are digital aids; they are not printed on the glass. On the quadratic rows **√X / √x**, the right hairline reads **π/2**
times the main-hairline value. The extra short **π/4** line stands at
`0.5 log10(π/4)` and applies only to those quadratic rows.

On the principal **Y / y** rows, compare the **left** ordinary line (labelled
1) with the **right** ordinary line (labelled π/2): the right reading is π/2
times the left reading. The factor is not π/2 between the main and right
hairlines on a principal row. This distinction is essential.

At main **Y = 0.2**, the quadratic main value is **0.04**; π/4 reads
**0.03141592654…**, and the right line reads **0.06283185307…**.
The ordinary left and right Y readings are **0.1595769122…** and
**0.2506628275…**, with ratio π/2.

## Cursor appearance and reading the close-up

The front cursor has thin reddish-brown hairlines and red inscriptions. Its
upper ivory cap shows the powers of ten above X, 140, 280, 420 and 560; the
lower cap shows X, 2.2, 4.4, 6.6 and 8.8 above the powers of ten. Between the
first two marks, the upper cap has **y over +**, and the lower **+ over y**.
These are printed annotations, not additional hairlines. Both first cap
inscriptions are **X**. The digital readings still identify the upper row's
gon unit and write the multiplier explicitly for clarity.

The short π/4 hairline crosses only the two quadratic rows. Its single fraction
caption sits above those rows, alongside the main-line **1** and right-line
**π/2** captions. Near the principal Y row, **1** labels the left ordinary
line and **π/2** the right. These captions distinguish the two different factor
comparisons described above. Display captions follow their named rows when a
programme is edited; they do not alter the calculated position of any mark.

The broad white rectangle in the close-up is interpreted as demonstration
backing used to expose the cursor engravings. The emulator's glass remains
transparent; only the external caps are opaque. Cap height, fittings and
lettering are adapted to the screen rather than claimed as measured dimensions.
The reverse caps remain unlettered in the screen rendering; the specimen
photograph also shows fittings and a small maker inscription that are not reproduced.

This photograph shows the middle of the **front** face. It confirms the cursor
arrangement and supports the existing calibration, but does not show the far
ends of the logarithmic rows on the reverse. Their conservative boundaries and
unresolved tiny terminal graduations therefore remain as documented above.

## Other working checks

* At **Y = 0.8**, `√(1−X²)` reads **0.6**, and `sin Xᵍ` reads approximately
  **59.033447 gon**: the sine, cosine and angle of a 3–4–5 triangle.
* At **Y = 0.75**, `√(X²−1)` reads **1.25**.
* For **0.6 × 0.5**, align **y = 1** with **Y = 0.6**, then put the main
  hairline on **y = 0.5**. Fixed Y reads **0.3**.
* On the back at **Y = 0.5**, `ln X` reads **1.648721271…** and `−ln X`
  reads **0.606530660…**; their product is 1.
* **100 gon** on `0.1 cosh xᵍ` aligns with **y = 0.250917848…**.
  Multiplying by 10 gives cosh(π/2).

## Sources and verification

* User-supplied cursor close-up: `1400_cur_vis.jpg`, carrying the
  reglasdecalculo.com watermark.
* User-supplied Philip Rodley specimen photograph:
  `Faber-Castell_Mathema_2-84N_UniversalSlideRule_GiftOfPhilipRodleyNZ.jpg`.
* [Journal of the Oughtred Society 15.2, pages 58–63, supplied as V15.2P58.pdf](https://osgalleries.org/journal/pdf_files/15.2/V15.2P58.pdf).
* [Eugen Moeller, manufacturer instructions for Mathema 2/84N, English scan](https://sliderulemuseum.com/Manuals/Faber-Castell_2-84N_Mathema_UniversalSlideRuleInstructions_English.pdf).
* [Álvaro González's Spanish transcription/translation of the manufacturer instructions](https://sliderulemuseum.com/Manuals/Faber-Castell_2-84_2-84N_Mathema_Instructions_Spanish_%20v1.0_AlvaroGonzales.pdf).
* [International Slide Rule Museum specimen inventory](https://sliderulemuseum.com/Faber.shtml),
  entry **ISRM 17.07.27.01.X**, 2/84N, 24 scales.
* [User-specified Mathema specimen](https://www.sliderules.info/collection/10inch/070/1078-mathema.htm).

The Mathema unit tests and the handover's independent numerical audit verify
rail order, exact calibration, extended domains, reciprocal and function
identities, cursor offsets, worked exponent examples and graduations. Cursor
metadata is retained when the programme is edited, exported, imported or undone.
The current verification report distinguishes executed checks from unavailable
browser or schema checks.
