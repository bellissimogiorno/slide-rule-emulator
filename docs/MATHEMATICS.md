# Mathematical conventions and checks

Let `p` be a local normalised scale coordinate and `d = 10^p` the corresponding unshifted D reading. Slide offset is measured in complete scale lengths. A fixed cursor at `p` reads the slide at `p - slideOffset`. Printed numerals are intentionally rounded engraving; digital readouts use the underlying mapping.

## Fundamental identities

| Scale/family | Reading at local `p` |
| --- | --- |
| C, D | `d` |
| A, B; K | `d^2`; `d^3` |
| CI, DI | `10/d` |
| Expanded root of order n, branch b | `(d * 10^b)^(1/n)` |
| P / Thornton Ps | `sqrt(1 - (d/10)^2)` |
| S; T1 | `asin(d/10)`; `atan(d/10)`, in degrees |
| Sh1; Sh2 | `asinh(d/10)`; `asinh(d)` |
| Th | `atanh(d/10)`, truncated at the declared argument limit |
| H1; H2 | `sqrt(1 + (d/10)^2)`; `sqrt(1 + d^2)` |
| Ch | `acosh(d)` |

Natural log-log scales evaluate `exp(sign * 10^(p + decade))`; the base-10 family uses `10^(sign * 10^(p + decade))`. Pickett N3 shared rows use natural exponentials; N4 shared rows use base 10. Their black/red readings are exact reciprocals from one graduation position. The exponent offset belongs to the definition, not to the printed LL index alone.

Folded arithmetic wraps a logarithmic coordinate. It is not globally one-to-one at the seam. Tests compare positions modulo one where appropriate. Its fold arithmetic is performed in logarithms to avoid overflow/underflow during normalisation.

H1/H2/P and hyperbolic functions become highly nonlinear near their ends. Their ticks are selected from bands of round decimal **values**, then passed through the mapping. Increasing tick density does not change the scale or invent equal pixel spacing. Pixel thinning occurs only after mathematical positions are known.

## Blackbody relationships

The dimensionless Planck parameter is `u = h*c/(k*T*lambda)`, with wavelength converted to metres. The code uses SI defining values for `h`, `c`, `k`, and elementary charge. Radiation displays use the explicitly labelled centimetre-area and micrometre-wavelength conventions; a missing power-of-ten conversion would not be excused as ordinary slide-rule decimal placement.

Normalised wavelength spectra are proportional to `u^5 / expm1(u)` for energy and `u^4 / expm1(u)` for photon count. The peak parameters are approximately 4.965114231744276 and 3.920690394872886 respectively. Wavenumber is a reciprocal wavelength reference; these rows are not a separate claim that a wavelength-density spectrum and a wavenumber-density spectrum have identical units or peak positions.

Integrated energy fractions use `integral(u^3/(exp(u)-1))`, total `pi^4/15`. Photon fractions use order 2, total `2*zeta(3)`. The short-wavelength fraction is the upper u tail; the long-wavelength fraction is the lower u tail. `core/physics.js` evaluates the small lower fraction directly rather than subtracting it from one, and uses logarithmic spectral evaluation to preserve representable far tails. IEEE-754 underflow can still round sufficiently tiny results to zero.

For Model 17's normalised spectral rows, the tested temperature alignment puts the slide's centre reference under the fixed temperature: `slideOffset = temperature.pos(T) - 0.5`. A fixed wavelength position then reads the corresponding shifted Planck ratio when the local coordinate remains on the slide. Tests cover both energy and photon wavelength branches. This does not validate every operation in the historical manual.

## What the independent checks establish

The unit suite checks elementary identities at 501 positions, expanded-root arithmetic with positive and negative decimal exponents, all shared LL base/reciprocal relationships, physical constants, temperature conversions, Johnson-noise normalisation and Model 17 temperature/wavelength alignment. Each catalogue definition also receives inverse and tick-placement checks; inverse agreement alone is insufficient because two wrong functions can agree with each other.

`tests/fixtures/planck.json` contains 26 independently integrated points (two orders, thirteen u values), with both lower and upper fractions. The fixture generator uses SciPy's QUADPACK integration and does not call the application physics. Routine tests read the committed fixture and do not require SciPy. The default relative tolerance for these integral comparisons is 4e-8, with separate absolute tolerances for ordinary and tiny lower tails; inspect the tests for the exact per-assertion contract.

The tests are evidence, not a proof for every floating-point input or arbitrary user expression. Finite expression sampling and finite browser matrices cannot justify such a proof. Specialist historical calibration limitations are recorded separately in HISTORICAL_FIDELITY.md.

Primary reference links: [NIST SI constants](https://physics.nist.gov/cuu/Constants/index.html), [NIST Stefan-Boltzmann constant](https://physics.nist.gov/cgi-bin/cuu/Value?sigma=), [NIST inverse hyperbolic functions](https://dlmf.nist.gov/4.37). Source equations and independently generated fixtures are kept separate from rendering tests.
