# Constant and reference-mark tooltips

Hover over a named reference tick or its label to see its value and meaning.
The explanation also works when the cursor glass lies over the mark. It does
not change focus or move the slide. **Escape** dismisses it; moving elsewhere
hides it. The explanation uses the page theme, not the instrument's ink colours.

A printed letter is not sufficient to identify a physical constant. The same
letter can be a scale name, an element symbol or a special alignment index.
Descriptions are attached to the actual calibrated mark rather than inferred
from letters anywhere on the page.

| Mark | Meaning and value |
| --- | --- |
| pi | Circle circumference divided by diameter, approximately 3.141592653589793 |
| e | Euler's number, the base of natural logarithms, approximately 2.718281828459045 |
| c on the arithmetic scales | `sqrt(4/pi)`, approximately 1.128379167095513; diameter = c times square root of circle area, using compatible units. **Not the speed of light.** |
| 10/pi on inverse folded scales | Approximately 3.183098861837907; the decimal-normalised reciprocal of pi |
| 1/M on Pickett folded scales | `ln(10)`, approximately 2.302585092994046, with `M = log10(e)` approximately 0.434294481903252 |
| R on the Model 14 arithmetic scales | `180/pi`, approximately 57.29577951308232 degrees/radian; its C/D mark is at 5.729577951308232 |
| .785 on Model 14 B | `pi/4`, approximately 0.7853981633974483, the factor in circle area = (pi/4) times diameter squared. Its B-scale position represents 78.53981633974483 |
| Prime / double-prime on Model 14 ST | Minute / second conversion indices. One arcminute is pi/10800 radians; one arcsecond is pi/648000 radians. They lie near 1.97 and 1.18 degrees on ST, **not** at angles of one minute or second |
| T alignment mark on the radiation scales | A movable alignment reference at mid-scale; the multiplier is sqrt(10), approximately 3.162277660168379. It is not a universal constant or a fixed temperature |

The full values above and the rounded tooltip values are numerical
approximations unless an exact expression is given. The geometry continues to
use full floating-point values, not the shortened explanatory text.

## Verification of meanings

The circle relation follows directly from `area = pi times diameter^2 / 4`.
The Compass maker's [instruction manual](https://www.sliderulemuseum.com/Manuals/M192_CompassBambooSlideRulesGeneral.pdf), printed p. 20, identifies c near 1.128,
rho near 5.72958 and pi, and describes their area and angular-conversion uses.
Printed p. 17 describes e and conversion between natural and common logarithms.

Pickett's [general log-log manual](https://www.sliderulemuseum.com/Manuals/M76_Pickett_HowToUseLogLogSR_1953.pdf), printed p. 43, explicitly places the
minute mark near 1.97 degrees and the second mark near 1.18 degrees. For the
linear-radian ST calibration, writing R = 180/pi, their precise host-scale
angles are `60 R^2 / 100000` and `3600 R^2 / 10000000`. Their position's ordinary
C-scale mantissas are those of `60 R` and `3600 R`, respectively. These are
conversion aids, not new fundamental constants.

Tests verify the algebra, the distinction between constant and scale value,
folded-index meanings, preserved chemical data, rendering escapes and custom
labels. A custom fold labelled pi but calibrated to a different factor does
not inherit the circle explanation.

## Custom marks and implementation

Use a `title` of up to 240 characters on a manual tick or gauge, for example:

```json
{"value": 2.5, "label": "k", "title": "k = 2.5. My dimensionless conversion factor."}
```

An optional `anchorTitle` provides the same explanation for an alignment index.
Unexplained custom marks display their scale value and are explicitly labelled
user-defined; the application does not invent their meaning. Chemical mark
information is preserved.

`src/core/mark-descriptions.js` contains the context-specific helpers.
`src/ui/mark-tooltips.js` presents escaped text without intercepting pointer
operations. The original title attribute is a fallback; the custom popup
suppresses a duplicate native tooltip while active. Runtime tooltip nodes are
excluded from saved standalone copies. The component's listeners, observer and
animation frame are cleaned up when the application is destroyed.

Scale-wide explanations are separate: native titles are attached only to the
left scale-name panel and right legend panel, not their containing row or rail.
Named-mark tooltips remain on deliberately annotated graduations in the scale
body. Segmented scales preserve those annotations without inventing a popup
for every ordinary numerical tick.
