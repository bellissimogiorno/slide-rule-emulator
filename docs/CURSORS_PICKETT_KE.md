# Pickett and K&E cursor evidence

The six presets below use one central hairline on each face. No auxiliary
hairlines or constant captions have been added. The specimen records explicitly
describe the line count; the K&E manufacturer manual additionally specifies red
hairlines. This is a cursor review, not a new verification of the specialist
scale mappings.

## Preset decisions

| Preset | Evidence and scope | Implemented cursor |
| --- | --- | --- |
| Pickett N3-T / N3-ES | Steve Seale's [N3-T specimen](https://www.steves-sliderules.info/rule%20code/Pickett%20N3-T.html), Cursor field, describes a plastic duplex cursor with one line on each face. David Riches's [N3-ES specimen](https://sliderules.nl/mysliderules/detail/pickett-eckel-n3-es-log-log), Cursor type field, independently records one hairline. | Single neutral hairline, transparent housing, both faces. |
| Pickett N4-T / N4-ES | Seale's [N4-ES](https://www.steves-sliderules.info/rule%20code/Pickett%20N4-ES.html) and [N-4-T](https://www.steves-sliderules.info/rule%20code/Pickett%20N-4-T.html), Cursor fields, both specify one line on each face. The older N-4-T has a different scale arrangement; it is evidence for the cursor type, not an exact match to the preset's scale set. | Single neutral hairline, transparent housing, both faces. |
| Pickett N16-ES | Seale's [N-16-ES specimen](https://www.steves-sliderules.info/rule%20code/Pickett%20N-16-ES.html), Cursor field, specifies one line on each face in an adjustable plastic cursor. | Single neutral hairline, transparent housing, both faces. The electronics face remains a layout study. |
| Pickett Model 14 | Seale's [Model 14 specimen](https://www.steves-sliderules.info/rule%20code/Pickett%20Model%2014.html), Cursor field, specifies one line per face. [Smithsonian object nmah_1214520](https://www.si.edu/object/pickett-14-military-duplex-slide-rule%3Anmah_1214520) describes a flat nylon indicator on its specimen. | Single neutral hairline, transparent housing, both faces. |
| Pickett Model 17 | Seale's [Model 17 specimen](https://www.steves-sliderules.info/rule%20code/Pickett%20Model%2017.html), Cursor field, specifies one line per face in an adjustable plastic cursor. The red T reference belongs to the moving scale, not to an extra cursor hairline. | Single neutral hairline, transparent housing, both faces. |
| K&E 68-1100 Deci-Lon | Seale's [serial 028803 specimen](https://www.steves-sliderules.info/rule%20code/K%26E%20Decilon%20028803.html), Cursor field, specifies one hairline per face and a metal frame. The [K&E instruction manual](https://www.mccoys-kecatalogs.com/KEManuals/DeciLon/DeciLon_Manual.pdf), introductory section 3, “Convenience and speed”, expressly identifies red hairlines. | Single red hairline with a metal-style frame, both faces. |

## What the evidence does and does not establish

The Pickett records describe slightly magnifying lenses on several specimens.
The screen cursor remains transparent and uses the emulator's existing loupe;
it does not simulate lens curvature, refraction, or the optical magnification
of a particular physical cursor. Neutral Pickett hairline colour and the clear
housing are conservative interface choices, not verified pigment or nylon-bar
colour matches. No inscription is invented to fill the frame.

Pickett manufactured flat and curved lenses and several bar and brace designs.
The [ISRM Pickett collection](https://sliderulemuseum.org/Pickett.shtml) records
these differences explicitly for N3 and N4 specimens. The combined T/ES preset
names therefore denote the listed mathematical layout and the supported
single-line cursor, not one universal physical assembly for every production
year. K&E also changed its cursor frame during production, as documented in
the [Deci-Lon collection notes](https://www.mccoys-kecatalogs.com/KEModels/ke68-1100family.htm).
The metal-style screen frame reproduces the material distinction; its width,
corner shape and fittings are not a measured facsimile.

The housing width is approximately 11.5% of the displayed track for Pickett
and 14% for K&E. These rounded proportions use Seale's recorded 29 mm Pickett
and 35 mm Deci-Lon cursor widths on nominal 25 cm / ten-inch instruments.
They are visual estimates, not calibrated offsets: the main hairline remains
at the same mathematical position. The selected Pickett proportions follow
the N3-T, N4-ES, N16-ES, Model 14 and Model 17 records above; the older N-4-T
record has a narrower 24 mm cursor and is not the width reference. Nominal
“ten-inch” wording should not be read as a metrological guarantee: a separate
[N4-ES specimen measurement](https://www.encoreconsulting.com.au/sr/linear.html)
gives a 250 mm D scale. On small screens the accessible minimum cursor width
may be greater than the nominal proportion.

The specimen pages' “Gauge Marks” fields list marks printed on the rule's
scales. They must not be treated as a list of cursor engravings. In particular,
no π, 785, R, or electrical constant has been turned into an auxiliary cursor
line merely because it appears in those fields.

## Image references and inspection limits

The following primary specimen image links were resolved during the review:

- [N3-ES, John L. Crawley collection](https://sliderulemuseum.org/Pickett/Pickett_N3-ES_PowerLogExponential_DonatedByJohnLCrawley.jpg).
- [N4-ES, Stan Nolte collection](https://sliderulemuseum.org/Pickett/Pickett_N4-ES_1964_ISRM_RefStanNolte.jpg).
- [Model 14, ISRM S227](https://sliderulemuseum.org/Pickett/S227_Pickett_Model_14_USMilitary.jpg).
- [Model 17, Rod Lovett collection](https://sliderulemuseum.org/Archive/Pickett_17_Radiation_RodLovettCollection.jpg).
- [N16-ES front](https://steves-sliderules.info/rule%20images/Pickett%20N-16-ES%20Front.jpg) and [back](https://steves-sliderules.info/rule%20images/Pickett%20N-16-ES%20Back.jpg).
- [Deci-Lon front](https://www.mccoys-kecatalogs.com/KECollection/68-1100/ke68-1100_2a.jpg) and [back](https://www.mccoys-kecatalogs.com/KECollection/68-1100/ke68-1100_2c.jpg), Clark McCoy collection.

The retrieval service returned image placeholders rather than usable pixels,
and direct image downloads were refused. These images are recorded for a
future visual comparison; they were not used to infer extra strokes, pigment,
labels, exact dimensions, or screw positions. The changes above rely on the
accessible primary specimen descriptions and the manufacturer's manual text.
No scans or source photographs are redistributed with this handover.

## Verification

`tests/unit/cursors-pickett-ke.test.js` checks every face of all six presets:
no auxiliary reading or caption is generated, the explicit line tone survives
rendering, and programme validation and JSON export/import retain the cursor
metadata. It also checks that front/back records are independently editable.
