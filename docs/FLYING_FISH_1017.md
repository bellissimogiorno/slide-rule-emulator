# Flying Fish 1017 chemical-engineering study

Choose **Flying Fish 1017 - Chemical engineering** in the Layout
preset selector and press **Load preset**. **Side -> Both sides** displays its
chemical front and scientific back with a common cursor and slide displacement.
The Hemmi 257 remains a separate, unchanged preset.

This is a photographed-layout study with working mathematical scales. It is not
an exact engraving facsimile or a transcription of the manufacturer's complete
calibration. The original-specimen photographs below were inspected directly;
a manufacturer 1017 manual was not obtained for this release.

## Different from the Hemmi

The 1017 has eight natural-exponential log-log ranges, with the two near-unity
ranges on the chemical face. Its scientific slide has a linear **lg**, tangent
with complementary red cotangent angles, sine/cosine, CI and C. Unlike the Hemmi
preset, it does not have the folded DF/CF/CIF arrangement, a separate Kelvin
conversion row or a vacuum/psi-gauge row. It is not just a relabelled Hemmi.

The photographs establish this physical order (brackets enclose the slide):

```text
Chemical:
LnI-2, Ch A-M, Ch N-Z, Mz/Xz
[ M/X, TF, TC, F(t) ]
P kgf/cm2, P mmHg/atm, tw, Ln-2

Scientific:
LnI-1, LnI0, LnI1, A1
[ lg, T/cot, S/cos, CI, C ]
D, Ln1, Ln0, Ln-1
```

The International Slide Rule Museum calls the chemical face the front; another
specimen catalogue uses the opposite front/back convention. The emulator uses
**chemical front**, and its explicit face titles remove that ambiguity. Some
catalogue text omits CI or calls the outer chemical reciprocal row LnI-1; the
photographs show **CI** and **LnI-2**. The implementation follows the photographs,
not those inconsistent captions.

## Scale names and mappings

For normalised horizontal coordinate `p` and `D = 10^p`:

```text
Ln_k  = exp( D * 10^(k-1))
LnI_k = exp(-D * 10^(k-1)),  k = -2, -1, 0, 1
lg    = p
A1    = 10^(2p)
T     = atan(10^(p-1)) in degrees
cot   = 90 - T, in degrees
```

The `Ln` names are **exponential log-log scales**, not the separate linear
natural-logarithm scale in the general library. At D=2, for example, Ln1 reads
`exp(2)`, approximately 7.38906, and LnI1 reads its reciprocal. On the T/cot row,
a black angle of 30 degrees shares its position with a red angle of 60 degrees;
it is not a second increasing tangent decade. Black/red sine/cosine readings
likewise share complementary angles.

Eighteen `FF_*` definitions include the eight exponential ranges, the
instrument-labelled arithmetic and mixture aliases, the cotangent mapping and
three compact row assemblies. They are selectable independently in the library.
Aliases and assembled rows are definitions, not independent physics models.

## Chemical procedures and units

The underlying chemistry is shared with the documented modern Hemmi
reconstruction; see [chemical scales](CHEMICAL_SCALES.md) for complete equations,
sources, domains and limitations. Reuse is deliberate: two presets should not
silently use different atomic masses or steam models.

- **Ch A-M / Ch N-Z** use the same 70 representative reference marks and
  decade indicators as the Hemmi study. This is a useful documented repertoire,
  not a claim to transcribe every symbol on a particular 1017 specimen.
- **Mz/Xz** is fixed; **M/X** is on the slide. Align the solvent setting on M
  under the solute setting on Mz (both divided by the same power of ten). Read
  mass fraction on Xz and mole fraction on X. These are fractions, not percentages.
- **TF/TC** convert using absolute temperature between 100 and 1000 K, with the
  modern 273.15 Celsius offset. Both move together. Kelvin can be obtained from
  `100 x C` on the other face at the same slide coordinate; the 1017 preset does
  not invent a separate engraved TK row.
- **P kgf/cm2** and the combined **mmHg/atm** row are absolute pressures. They
  share the existing six-decade pressure calibration. The pressure abbreviation
  is made explicit in the scale name to distinguish force from mass.
- **tw** gives ice/steam equilibrium temperature using the existing IAPWS
  relationships, not air wet-bulb temperature. Its domain ends at water's
  critical point.
- **F(t)** uses the existing modern ideal-gas entropy relationships, air on the
  left and CO2 on the right. It is not a real-gas or reaction-equilibrium solver.

For an independently checkable mixture, use 132.1 and 18.0 for ammonium sulphate
and water. Align M=1.8 under Mz=13.21 and place the cursor on Xz=0.2. X reads
approximately 0.0329429 (3.29429 mole percent). This example comes from the Hemmi
manual and the binary-mixture equation, not a claimed example from an unread
1017 manual.

## Reproduction limits

The chosen white/cream body, black end braces and red inverse scales are an
interpretation of photographed specimens. The normalised 0-1 mathematical
length omits historical end extensions. Individual special gauge constants,
all chemical symbols, exact typefaces, historic thermometer endpoints and the
original gas correlations have not been transcribed. No manufacturer logo,
photograph, manual scan or font is redistributed in this repository.

## Evidence inspected for this release

1. International Slide Rule Museum, actual V2 specimen photograph from the
   Leroy Hausler collection:
   https://www.sliderulemuseum.com/China/Flying_Fish_1017_ChemicalEngineering_GiftOfLeroyHauslerCollection.jpg
2. International Slide Rule Museum, V1 specimen with black braces:
   https://www.sliderulemuseum.com/China/Flying_Fish_1017_Chemical_V1_BlkBraces_GiftOfFangSun.jpg
3. Rod Lovett / Richard Davis chemical-rule gallery, scientific face:
   https://osgalleries.org/chemical/photos/17_a.jpg
4. The same specimen, chemical face:
   https://osgalleries.org/chemical/photos/17_b.jpg
5. Catalogue context (front/back convention differs):
   https://osgalleries.org/chemical/showdetails.cgi?match=17
6. Museum inventory (some captions omit/misidentify rows, as noted above):
   https://www.sliderulemuseum.com/China.shtml

These are source links, not permissions to redistribute the photographs.
