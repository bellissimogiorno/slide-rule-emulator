# Display precision

The default display keeps **four useful significant digits**. **Extended decimal
precision**, underneath **Compact scale numbering** in Scale layout, restores the
detailed formatting. These two display preferences are independent.

## What makes a digit useful

Ordinary values use four significant digits. Leading zeros do not count, and
trailing decimal zeros are omitted. For instance, 0.994987… on P becomes 0.995,
3.162277… becomes 3.162, and 0.01234567 becomes 0.01235. Large and very small values
may use scientific notation. This policy applies to ordinary logarithmic, root,
power, linear, temperature, trigonometric, chemical and radiation values.

Log-log values **above one and below two** use four significant digits of their
excess above one to choose the decimal rounding place. This preserves the changing
part without counting the common leading 1 against its precision budget. Exactly
one is displayed as 1; values at or above two use ordinary precision.

**All values below one use ordinary four-significant-digit rounding**, including
reciprocal log-log scales. Their leading 9s count as significant digits. In
particular, the LL01 endpoint is exp(−0.01) = 0.9900498337…; rounding the value to
four significant digits gives 0.9900, displayed as **0.99** after removing trailing
zeros. Applying the excess-above-one rule to its deficit instead would retain
unwanted digits and does not implement this policy.

| Value and context | Default display | Reason |
| --- | --- | --- |
| P: 0.994987… | 0.995 | Ordinary four significant digits; trailing zero omitted |
| D: 3.162277… | 3.162 | Ordinary four significant digits |
| LL0: exp(0.001) = 1.001000500… | 1.001001 | Four digits in the excess above one |
| LL1: exp(0.01) = 1.010050167… | 1.01005 | Four digits in the excess above one; trailing zero omitted |
| LL2: exp(0.1) = 1.105170918… | 1.1052 | Four digits in the excess above one |
| LL00: exp(−0.001) = 0.999000499… | 0.999 | Ordinary four significant digits; trailing zero omitted |
| LL01: exp(−0.01) = 0.990049833… | 0.99 | Ordinary four significant digits; trailing zeros omitted |
| LL02: exp(−0.1) = 0.904837418… | 0.9048 | Ordinary four significant digits |
| LL: 2.7182818… | 2.718 | Ordinary precision away from one |
| H₁: √1.01 = 1.004987562… | 1.004988 | Four digits in the excess above one |
| Cursor position: 0.123456789 | 0.1235 | Position display only; the stored fraction is unchanged |
| Copper reference mass: 63.546 | 63.55 | Reference symbol and calibration remain unchanged |

The excess-above-one rule covers natural, base-10 and paired/Syncro log-log
scales, including the Mathema expression log-log scales identified by their
decade metadata. It also covers `hypotenuseLow` and `hypotenuseHigh`, and the
Mathema expression hypotenuse scales, whose `precisionOrigin: 1` metadata
selects the same presentation policy. These H₁/H₂ √(1+x²) value scales are
equivalent to cosh values when x = sinh u. Hyperbolic argument scales still use
ordinary precision. P deliberately uses ordinary rounding; being close to one alone does
not select the log-log policy.

Round from the underlying numerical value, not an already rounded detailed
caption. For example, a Pickett paired mil reading of 1498.478344… rounds directly
to 1498; first shortening it to 1498.5 and then rounding to four significant digits
would incorrectly give 1499. LL01 likewise uses exp(−0.01) itself to obtain 0.9900,
displayed as 0.99. Reciprocal and complementary partners are formatted independently
from their unrounded values, never calculated from the rounded displayed partner.
Authored captions that intentionally represent a different quantity retain that
meaning.

For sexagesimal angles, decimal degrees are rounded to four significant digits
first, then converted using the existing carry-safe degrees/minutes/seconds
formatter. For example, 12.34567° becomes 12°21′. Extended precision restores the
detailed sexagesimal formatting.

## Scope and preservation

The preference applies to numerical graduation captions and endpoints, all
three rails' digital readouts, paired and root branches, main and auxiliary
cursor readings, slide/cursor position displays and chemical reference masses.
The loupe enlarges the displayed labels with the same precision selection.

Formulae, authored symbolic captions such as π and 10/π, chemical symbols,
instrument inscriptions and authored explanatory text retain their meaning.
Exact configuration data, mathematical constants, source calibration and all
calculations remain unchanged. Formatting does not move or delete graduations,
round saved positions or change the selected keyboard step. Very fine movement
can therefore leave a rounded position display unchanged; extended precision
reveals the six-decimal position feedback.

Extended precision restores the established detailed formats: ordinary digital
values generally use six significant digits, decimal-degree readouts use five,
and position displays use six decimal places. If six significant digits would
hide a near-one change visible in the default mode, that readout gains extra
decimal places to retain the detail. Scale labels retain their family-specific
detailed formatting unless it would be less accurate than the reduced display; those captions gain enough digits to
keep the extra detail. The option is called **Extended**, rather
than **Full**, because it does not promise every binary floating-point digit or
additional physical accuracy.

## Saved preference

The optional programme property is `"fullPrecision": false` by default. `true`
selects extended formatting. JSON export/import, browser storage and configured
standalone HTML preserve the choice. Loading a layout preset retains it. Legacy
programmes without the field acquire the reduced default; other programme data
is preserved. Non-boolean values are rejected at the import boundary.

## Cursor position control

The Cursor position selector belongs inside its labelled control box, between
the two nudge arrows. Its input-specific styling is separate from the instrument
cursor glass, preventing the instrument's absolute positioning from moving the
selector across the top of the page. The glass, drag behaviour and numerical
coordinates remain independent of this layout correction.
