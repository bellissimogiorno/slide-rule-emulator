# Course coverage and mathematical problems

This inventory records the actual course questions and teaching layouts. Each
demonstration and practice problem is stated separately in the emulator. Practice
checks physical alignment; reading the requested row, interpreting its decade and
giving the numerical answer remain the learner’s responsibility.

## Main scale families

| Scales | Technique |
| --- | --- |
| C, D | Multiplication, division, ratios, conversion and chained calculations |
| CI, DI | Sliding and fixed reciprocal scales, inverse arithmetic and chains |
| CF, DF, CIF, DIF | π-folded arithmetic, interior indexes and folded reciprocals |
| A, B, K | Squares, cubes, roots, fixed/sliding square relationships |
| R1, R2; Q1, Q2, Q3 | Dedicated square/cube-root branches and decade grouping |
| L, LN (linear ln) | Common/natural logarithms, characteristics, extended antilogs and change of base |
| CF/M, DF/M (CFM, DFM) | ln(10)-folded conversion and arithmetic; useful when working with natural/common logarithms |
| W₁, W₂, W₁′, W₂′ | Faber-Castell 2/83N double-length arithmetic, indexes, branch changes and geometric mean |
| Ps; H₁/H₂ Pt model; Sd/Td/ISd/ITd studies | Thornton vector relationships and explicitly normalised correction illustrations |
| LL0–LL4; LL00–LL04 | Exponentials, natural logarithms, powers, roots, negative exponents, growth and exponent equations |
| S, T1, T2, ST | Degree trigonometry and a calibrated small-angle approximation |
| P, H1, H2 | Pythagorean complements and hypotenuse normalisations |
| SH1, SH2, CH, TH | Dimensionless hyperbolic functions, inverses, catenary and identity |

The root row labels √₁/√₂ correspond to R1/R2, and ∛₁/∛₂/∛₃ to Q1/Q2/Q3.
W₁/W₂ on Faber-Castell layouts implement the same square-root branch principle;
the new W section also teaches arithmetic with their moving prime partners.
Manufacturer aliases, specialist chemical/radiation scales and every historical
LL naming convention are outside this course’s coverage claim.

## LL numbering used here

The generic emulator rows use the following factors. A displayed LL value is the
actual number, including its decimal place. The row supplies the exponent factor.

| Positive row | Negative row | Exponent magnitude x when D reads m |
| --- | --- | --- |
| LL0 | LL00 | x = m/1000 |
| LL1 | LL01 | x = m/100 |
| LL2 | LL02 | x = m/10 |
| LL3 | LL03 | x = m |
| LL4 | LL04 | x = 10m |

Positive rows read eˣ; negative rows read e⁻ˣ. Other instruments may number
their LL rows differently. A C/D index change can require a different LL row; it
does not justify moving the decimal point of an LL answer.

## Dedicated root branches

Write the positive radicand as x = m × 10ⁿ with 1 ≤ m < 10. For a square root,
write n = 2k + j with j = 0 or 1; select R(j+1) opposite D = m and multiply
its reading by 10ᵏ. For a cube root use n = 3k + j with j = 0, 1 or 2 and
select Q(j+1). This grouping also works for negative n.

For example, √250 uses R1 opposite D 2.5 and an external factor 10; √0.25
uses R2 opposite D 2.5 and factor 0.1. The shared cursor coordinate does not
make their requested roots equal.

## Folded-scale boundary

The CF/DF unit join lies at p = 1 − log₁₀π in the unshifted graduated length.
Away from the exact 10|1 join, folded reciprocal mantissas satisfy DF × DIF = 10.
At the exact join this emulator normalises both values to 1. Read the printed
index from the side used in the calculation, with decimal interpretation stated
in the lesson. Folded scales are not ordinary C/D scales with unchanged end indexes.

## Additional scale conventions

W₁ reads 10^(p/2) and W₂ reads 10^((p+1)/2), where p is the fixed position
along the graduated length. Their prime partners use the local slide position.
Each half-decade occupies a full length. The same-branch ratio is
10^(slideOffset/2); crossing branches introduces a factor √10. The lessons
identify the branch/index explicitly, including the √10 dividing index.

The linear ln row is LN, with ln(D) = ln(10) × p. UltraLog’s Ln alias has the
same mapping. The Flying Fish Ln/LnI rows are exponential banks and use a
different convention. For x = m × 10ⁿ, L gives the fractional log₁₀(m), while
ln requires adding n ln(10). Negative logarithms/antilogs retain the stated sign
and external decade.

CF/M and DF/M fold at 1/M = ln(10), with M = log₁₀(e). Their interior unit join
is p = 1 − log₁₀(ln(10)). At a common hairline, D and DF/M provide significant
figures of a value and that value times ln(10), respectively. The lessons supply
the decimal estimate. This conversion is convenient for natural/common logs;
π-folded CF/DF are convenient for circle constants. Neither fold is universally
better, and their physical ends are not unit indexes.

Thornton Ps uses t = D/10 and gives √(1 − t²). The Pt studies use H₁ (t = D/10)
and H₂ (t = D) as result scales for √(1 + t²). They deliberately identify this
as the emulator’s mathematical model: the historical Pt instead labels the
input t and gives the result on D. The emulator’s Sd/Td/ISd/ITd drawings are
endpoint-normalised layout studies, not calibrated historical divisor scales.
Their correction metrics use radians in θ/sin θ, θ/tan θ, asin(x)/x and
atan(x)/x. Their labels are angles or function inputs; D is not a calibrated
correction-factor reading. The lessons pair these illustrations with separate
calibrated S/T₁ lookups and state the limitation in each problem and practice.

Neat tricks use explicit identities. Addition, subtraction, doubling and
percentage conversion are mental operations; the rule supplies the stated
products, quotients, squares, roots and function values.

## 1. The basics

Read the scales, multiply, divide and choose the correct end of C.

| Lesson | Demonstration problem | Practice problem | Scales |
| --- | --- | --- | --- |
| Read the hairline | Locate 2 and 3 on D. | Locate 4 on D. | C, D |
| Multiply 2 × 3 | Solve x = 2 × 3. | Solve x = 2 × 3. | C, D |
| Divide 6 ÷ 2 | Solve x = 6 ÷ 2. | Solve x = 6 ÷ 2. | C, D |
| Multiply beyond the end | Solve x = 4 × 3. | Solve x = 4 × 3. | C, D |

## 2. Arithmetic fluency

Place decimal points, work below one and reuse an alignment.

| Lesson | Demonstration problem | Practice problem | Scales |
| --- | --- | --- | --- |
| Multiply decimal numbers | Solve x = 2.4 × 3. | Solve x = 1.6 × 4. | C, D |
| Multiply numbers below one | Solve x = 0.6 × 0.4. | Solve x = 0.7 × 0.4. | C, D |
| Divide to get less than one | Solve x = 2 ÷ 5. | Solve x = 3 ÷ 4. | C, D |
| Reuse a multiplication setting | Find x = 2.5 × 2 and y = 2.5 × 3. | Find x = 1.5 × 4 and y = 1.5 × 6. | C, D |

## 3. Ratios and chains

Keep a constant ratio, convert units and carry an intermediate result.

| Lesson | Demonstration problem | Practice problem | Scales |
| --- | --- | --- | --- |
| Solve a proportion | 3 items need 5 units. Find the units needed by 4 and 5 items, assuming direct proportion. | 4 items need 6 units. Find the units needed by 6 items, assuming direct proportion. | C, D |
| Convert inches to centimetres | Convert 2 in and 3 in to centimetres (1 in = 2.54 cm). | Convert 3.5 in to centimetres (1 in = 2.54 cm). | C, D |
| Chain multiplication and division | Solve x = (2 × 3) ÷ 4. | Solve x = (3 × 2) ÷ 5. | C, D |

## 4. Inverse and folded scales

Distinguish CI from DI; use CF/DF and their reciprocal partners with their real indexes.

| Lesson | Demonstration problem | Practice problem | Scales |
| --- | --- | --- | --- |
| Read reciprocals on CI | Find x = 1 ÷ 2 and y = 1 ÷ 4. | Solve x = 1 ÷ 5. | CI, C, D |
| Compare DI and CI | 1 ÷ 4 | 1 ÷ 8 | DI, CI, C, D |
| Divide and multiply with CI | 6 ÷ 2 | 8 ÷ 2 | DI, CI, C, D |
| Chain a product with CI | 2 × 3 × 4 | 3 × 2 × 5 | DI, CI, C, D |
| Multiply by π across the scales | 2 × π; 3 × π; 4 × π | 5 × π | DF, CF, C, D |
| Keep a product on the folded scales | 4 × 3 | 6 × 2.5 | DF, CF, C, D |
| Divide on CF and DF | 8 ÷ 2 | 9 ÷ 2 | DF, CF, C, D |
| Read folded reciprocals | 1 ÷ 4; 1 ÷ 8; 1 ÷ 2 | 1 ÷ 5 | DF, DIF, CIF, D |

## 5. Powers and root scales

Use A/B/K, then choose the correct dedicated square-root or cube-root branch and decade.

| Lesson | Demonstration problem | Practice problem | Scales |
| --- | --- | --- | --- |
| Read squares on A | Find x = 2², y = 3² and z = 4². | Find x = 5² and y = 1.5². | A, C, D |
| Read square roots from A | Find x = √25 and y = √2.5. | Find x = √36 and y = √3.6. | A, C, D |
| Read cubes on K | Find x = 2³ and y = 3³. | Find x = 4³ and y = 1.5³. | K, C, D |
| Read cube roots from K | Find x = ∛125, y = ∛12.5 and z = ∛1.25. | Find x = ∛64 and y = ∛6.4. | K, C, D |
| Read the dedicated square-root branches | √2.5 = ? | √3.6 = ? | R1, R2, C, D |
| Choose the odd square-root decade | √25 = ? | √36 = ? | R1, R2, C, D |
| Scale square roots above and below one | √250 = ? | √0.25 = ? | R1, R2, C, D |
| Choose among three cube-root branches | ∛4 = ?; ∛40 = ?; ∛400 = ? | ∛3.2 = ?; ∛32 = ?; ∛320 = ? | Q1, Q2, Q3, C, D |
| Reduce cube-root decades | ∛4000 = ? | ∛0.4 = ? | Q1, Q2, Q3, C, D |
| Reverse a branch and take a root ratio | 6² = ?; √(9 ÷ 4) = ? | 8² = ?; √(8 ÷ 2) = ? | R1, R2, C, D |
| Keep moving B distinct from fixed A | At C = 2, B = ? | At C = 3, B = ? | A, B, C, D |
| Multiply on A and B | 4 × 9 = ? | 16 × 4 = ? | A, B, C, D |

## 6. Faber-Castell W scales

Use both halves of the 2/83N’s extended arithmetic scales, choose indexes and find a geometric mean.

| Lesson | Demonstration problem | Practice problem | Scales |
| --- | --- | --- | --- |
| Read the two halves of a long W scale | √4 = ?; √40 = ?; √25 = ?; 3² = ? | √6.25 = ?; √62.5 = ?; 7² = ? | W2, W2P, W1P, W1, D |
| Multiply with the W₁′ unit index | 1.5 × 4 = ? | 1.6 × 4.5 = ? | W2, W2P, W1P, W1, D |
| Change W index and cross to the other row | 1.8 × 7.5 = ? | 1.9 × 8 = ? | W2, W2P, W1P, W1, D |
| Divide on adjacent W rows | 6 ÷ 4 = ? | 7.5 ÷ 3.5 = ? | W2, W2P, W1P, W1, D |
| Divide across the two W ranges | 13.5 ÷ 7.5 = ? | 17.6 ÷ 8 = ? | W2, W2P, W1P, W1, D |
| Find a geometric mean with W | √(2 × 4.5) = ? | √(1.6 × 4) = ? | W2, W2P, W1P, W1, D |

## 7. L, ln and logarithm conversions

Extend linear logarithms beyond one decade and use CF/M–DF/M for natural/common conversions and folded arithmetic.

| Lesson | Demonstration problem | Practice problem | Scales |
| --- | --- | --- | --- |
| Common logarithms and antilogarithms | Find x = log₁₀(2), y = log₁₀(5) and z = 10^0.6. | Find x = log₁₀(4) and y = 10^0.8. | L, C, D |
| Give a common logarithm its characteristic | Find x = log₁₀(250) and y = log₁₀(0.04). | Find x = log₁₀(600) and y = log₁₀(0.008). | L, C, D |
| Extend an antilogarithm beyond one decade | Find x = 10^2.4 and y = 10^(−1.3). | Find x = 10^3.2 and y = 10^(−2.4). | L, C, D |
| Use the linear ln scale | Find x = ln(2), y = ln(7) and z = ln(50). | Find x = ln(3) and y = ln(0.4). | L, LN, C, D |
| Find powers of e on linear ln | Find x = e^1.5, y = e⁴ and z = e^(−0.4). | Find x = e^0.8 and y = e^(−1.2). | L, LN, C, D |
| Change the base of a logarithm | Find x = log₂(6). | Find x = log₃(7). | L, LN, C, D |
| Convert between common and natural logarithms | Given log₁₀(a) = 0.2, log₁₀(b) = 0.6 and ln(c) = 1.2, find ln(a), ln(b) and log₁₀(c). | Given log₁₀(a) = 0.4 and ln(b) = 0.8, find ln(a) and log₁₀(b). | DFM, CFM, C, D |
| Calculate with the CF/M and DF/M pair | Find x = ln(100)/3. | Find x = ln(1000)/4. | DFM, CFM, C, D |

## 8. LL scales and exponentials

Select LL ranges, read natural logarithms, and compute exponentials, powers, roots and unknown exponents.

| Lesson | Demonstration problem | Practice problem | Scales |
| --- | --- | --- | --- |
| Choose the positive LL range | Find a = e^0.02, b = e^0.3, c = e⁴, d = e²⁰ and f = e^0.005. | Find x = e^0.06 and y = e³⁰. | LL0, LL1, LL2, LL3, LL4, C, D |
| Evaluate e to a power | Find x = e^0.4 and y = e². | Find x = e^0.7. | LL1, LL2, LL3, C, D |
| Read natural logarithms | Find x = ln(2) and y = ln(10). | Find x = ln(3). | LL1, LL2, LL3, C, D |
| Raise a positive number to a power | Find x = 3^2.5. | Find x = 4^1.5. | LL1, LL2, LL3, C, D |
| Find roots by dividing a logarithm | Find x = √16. | Find x = ∛27. | LL1, LL2, LL3, C, D |
| Use negative exponents and inverse LL ranges | Find a = e^(−0.02), b = e^(−0.3), c = e⁻⁴, d = e⁻²⁰, f = e^(−0.005) and g = 2⁻³. | Find x = 3⁻². | LL00, LL01, LL02, LL03, LL04, C, D |
| Keep precision for values near one | Find x = (1 + 0.002)⁴ and y = (1 + 0.002)⁸. | Find x = (1 + 0.003)⁵. | LL0, LL1, LL2, C, D |
| Solve for an unknown exponent | Solve 4ˣ = 20 for x. | Solve 3ˣ = 15 for x. | LL1, LL2, LL3, C, D |

## 9. Angles and triangles

Use sine, cosine, both tangent ranges, small angles and P/H relationships.

| Lesson | Demonstration problem | Practice problem | Scales |
| --- | --- | --- | --- |
| Read a sine | Find x = sin 30° and y = sin 60°. | Find x = sin 45°. | S, C, D |
| Read a cosine | Find x = cos 30° and y = cos 60°. | Find x = cos 45°. | S, C, D |
| Read a tangent | Find x = tan 30° and y = tan 45°. | Find x = tan 20°. | T1, C, D |
| Find a triangle’s height | A 15-unit ramp makes a 30° angle with the horizontal. Find its height h = 15 × sin 30°. | A 12-unit ramp makes a 30° angle with the horizontal. Find its height h = 12 × sin 30°. | S, C, D |
| Use the upper tangent scale T2 | tan 60° = ? | tan 70° = ? | T2, C, D |
| Use ST for small angles | sin 1° ≈ ?; tan 1° ≈ ? | sin 2.5° ≈ ?; tan 2.5° ≈ ? | ST, C, D |
| Read the Pythagorean complement P | √(1 − 0.6²) = ? | √(1 − 0.8²) = ? | P, C, D |
| Use both hypotenuse ranges H1 and H2 | √(3² + 4²) = ? | √(5² + 12²) = ? | H1, H2, C, D |

## 10. Geometry and measurement

Calculate circumferences, areas and volumes while keeping dimensions and units explicit.

| Lesson | Demonstration problem | Practice problem | Scales |
| --- | --- | --- | --- |
| Circle circumference from diameter | C = πd; d = 2 cm. C is circumference in cm; d is diameter. π is the circle constant. Find C. | C = πd; d = 3 cm. C is circumference in cm; d is diameter. π is the circle constant. Find C. | C, D |
| Disc area from radius | A = πr²; r = 1.5 cm. A is disc area in cm²; r is radius, half the diameter. π is the circle constant. Find A. | A = πr²; r = 1.2 cm. A is disc area in cm²; r is radius. π is the circle constant. Find A. | A, C, D |
| Disc area from diameter | A = πd²/4; d = 4 cm. A is disc area in cm²; d is diameter, twice the radius. π is the circle constant. Find A. | A = πd²/4; d = 3 cm. A is disc area in cm²; d is diameter. π is the circle constant. Find A. | A, C, D |
| Disc diameter from area | d = 2√(A/π); A = 18 cm². A is disc area; d is diameter in cm. The square root gives radius. π is the circle constant. Find d. | d = 2√(A/π); A = 25 cm². A is disc area; d is diameter in cm. The square root gives radius. π is the circle constant. Find d. | A, C, D |
| Rectangle area | A = ab; a = 2.4 cm and b = 3 cm. a and b are the rectangle’s perpendicular side lengths; A is area in cm². Find A. | A = ab; a = 1.6 cm and b = 4 cm. a and b are perpendicular rectangle side lengths; A is area in cm². Find A. | C, D |
| Triangle area | A = bh/2; b = 4 cm and h = 3 cm. b is triangle base; h is its perpendicular height; A is area in cm². Find A. | A = bh/2; b = 5 cm and h = 3 cm. b is triangle base; h is its perpendicular height; A is area in cm². Find A. | C, D |
| Ellipse area from semi-axes | A = πab; a = 2 cm and b = 1.2 cm. a and b are ellipse semi-axes, each half a full axis; A is area in cm². π is the circle constant. Find A. | A = πab; a = 1.5 cm and b = 1.2 cm. a and b are ellipse semi-axes, not full axis lengths; A is area in cm². π is the circle constant. Find A. | C, D |
| Circular sector area | A = (θ/360)πr²; θ = 90° and r = 3 cm. θ is the numerical central angle in degrees; r is radius; A is sector area in cm². π is the circle constant. Find A. | A = (θ/360)πr²; θ = 60° and r = 2 cm. θ is the numerical central angle in degrees; r is radius; A is sector area in cm². π is the circle constant. Find A. | A, C, D |
| Cylinder volume | V = πr²h; r = 1.5 cm and h = 2 cm. r is cylinder radius; h is perpendicular height; V is volume in cm³. π is the circle constant. Find V. | V = πr²h; r = 1.2 cm and h = 2 cm. r is cylinder radius; h is perpendicular height; V is volume in cm³. π is the circle constant. Find V. | A, C, D |
| Sphere volume | V = (4/3)πr³; r = 1.2 cm. r is sphere radius, half its diameter; V is volume in cm³. π is the circle constant. Find V. | V = (4/3)πr³; r = 1.3 cm. r is sphere radius, not diameter; V is volume in cm³. π is the circle constant. Find V. | K, C, D |

## 11. Hyperbolic functions

Read sinh, cosh and tanh and their inverses; use them in a catenary and a mathematical identity.

| Lesson | Demonstration problem | Practice problem | Scales |
| --- | --- | --- | --- |
| Read sinh in two ranges | Find x = sinh(0.5) and y = sinh(1.5). The arguments 0.5 and 1.5 are dimensionless. | Find x = sinh(0.4) and y = sinh(1.2), with dimensionless arguments. | SH1, SH2, C, D |
| Read cosh on Ch | Find x = cosh(0.5), y = cosh(1.5) and z = cosh(0). Arguments are dimensionless. | Find x = cosh(1) and y = cosh(2), with dimensionless arguments. | CH, C, D |
| Read tanh and its upper limit | Find x = tanh(0.5), y = tanh(2) and z = tanh(3). Arguments are dimensionless. | Find x = tanh(1) and y = tanh(1.5), with dimensionless arguments. | TH, C, D |
| Read inverse hyperbolic functions | Solve sinh u = 2, cosh v = 3 and tanh w = 0.5 for nonnegative u, v, w. | Solve sinh u = 3, cosh v = 2 and tanh w = 0.6 for nonnegative u, v, w. | SH1, SH2, CH, TH, C, D |
| Catenary height and slope | y = a cosh(x/a), a = 2 m, x = 3 m. Find y in metres and the dimensionless slope dy/dx = sinh(x/a). | y = a cosh(x/a), a = 2 m, x = 2.4 m. Find y and dy/dx = sinh(x/a). | CH, SH2, C, D |
| Check a hyperbolic identity | Find q = cosh² u − sinh² u for u = 1. Square the readings on A and subtract mentally. | Find q = cosh²(1.2) − sinh²(1.2), using Ch, Sh₂ and A, then mental subtraction. | CH, SH2, A, C, D |

## 12. Thornton AA010 studies

Explore Ps, the Pt relationship and normalised correction studies, with their historical calibration limits stated.

| Lesson | Demonstration problem | Practice problem | Scales |
| --- | --- | --- | --- |
| Ps: complementary components | c = √(1 − s²); s = 0.3, 0.6 and 0.8. s and c are nonnegative dimensionless components with s² + c² = 1. Find c for each s. | c = √(1 − s²); s = 0.5. s and c are nonnegative dimensionless components. Find c, then use that component on Ps to recover s. | PS, C, D |
| Ps: find a missing side | b = h√(1 − (a/h)²); h = 5 cm and a = 3 cm. h is a right triangle’s hypotenuse; a and b are its perpendicular legs. Find b in cm. | b = h√(1 − (a/h)²); h = 5 cm and a = 4 cm. h is hypotenuse; a and b are perpendicular legs of a right triangle. Find b in cm. | PS, C, D |
| Pt model: a ratio below one | h = b√(1 + t²), t = a/b; a = 3 cm and b = 4 cm. a and b are perpendicular legs, h is hypotenuse, and t is dimensionless. Find h. Model layout: H₁ labels the result; D/10 supplies t. | h = b√(1 + t²), t = a/b; a = 2 cm and b = 3 cm. a and b are perpendicular legs; h is hypotenuse in cm. Find h using the H₁ result model, where t = D/10. | H1, H2, C, D |
| Pt model: a ratio above one | h = b√(1 + t²), t = a/b; a = 4 cm and b = 3 cm. a and b are perpendicular legs; h is hypotenuse in cm. Find h. Model layout: H₂ labels the result; D supplies t directly. | h = b√(1 + t²), t = a/b; a = 5 cm and b = 2 cm. a and b are perpendicular legs; h is hypotenuse in cm. Find h using the H₂ result model, where t = D. | H1, H2, C, D |
| Sd/Td: normalised model study | Normalised model study: θ = 30°. Locate θ on Sd and Td, then find sin θ and tan θ on calibrated S/T₁. θ is in degrees and the function values are dimensionless. Sd/Td here are not historical calibrated divisors. | Normalised model study: θs = 45° and θt = 20°. Locate θs on Sd and θt on Td, then find sin θs and tan θt on calibrated S/T₁. Angles are in degrees. The model rows do not supply historical correction divisors. | S, T1, SD, TD, C, D |
| ISd/ITd: normalised model study | Normalised model study: xs = 0.6 and xt = 0.75. Inspect xs on ISd and xt on ITd; find α = asin xs and β = atan xt on calibrated S/T₁. Inputs are dimensionless; α and β are in degrees. The models are not historical calibrated inverse divisors. | Normalised model study: xs = 0.8 and xt = 0.5. Inspect xs on ISd and xt on ITd; find α = asin xs and β = atan xt on calibrated S/T₁. Inputs are dimensionless; α and β are in degrees. The model labels are not correction divisors. | S, T1, ISD, ITD, C, D |

## 13. Neat tricks

Share a total, combine resistances, discover the golden ratio and triples, and exploit useful identities.

| Lesson | Demonstration problem | Practice problem | Scales |
| --- | --- | --- | --- |
| Split a total into a ratio | Split 84 into shares x:y = 2:5. Find x and y. | Split 96 into shares x:y = 3:5. Find x and y. | C, D |
| Find a parallel resistance with CI | Two ideal resistances, 6 Ω and 3 Ω, are in parallel. Find R = (6 × 3)/(6 + 3). | Two ideal resistances, 4 Ω and 2 Ω, are in parallel. Find R = (4 × 2)/(4 + 2). | CI, C, D |
| Find the golden ratio from a hypotenuse | Solve x² − x = 1 for the positive value of x. | Solve x² − x = 4 for the positive value of x. | H1, H2, C, D |
| Generate an integer right triangle | For m = 5 and n = 2, find a = m² − n², b = 2mn and c = m² + n². | For m = 4 and n = 3, find a = m² − n², b = 2mn and c = m² + n². | A, C, D |
| Double an angle from its tangent | An acute angle θ has tan θ = 0.5. Find tan(2θ). | An acute angle θ has tan θ = 0.6. Find tan(2θ). | A, C, D |
| Track an equal percentage rise and fall | A quantity rises 20%, then falls 20%. Find m = 1.2 × 0.8 and Δ = 100(m − 1)%. | A quantity rises 30%, then falls 30%. Find m = 1.3 × 0.7 and Δ = 100(m − 1)%. | A, C, D |

## Mathematical references and verification

The numerical tests calculate expected answers from ordinary arithmetic,
geometry, exponentials and trigonometric definitions, independently of authored
cursor coordinates. They also check the real profile rows, domains and formatted
readouts. See the [base worked-answer oracle](../tests/unit/tutorial-course-math.test.js)
and the subject files `tutorial-inverse-folded`, `tutorial-advanced-scales`,
`tutorial-logarithms`, `tutorial-geometry`, `tutorial-hyperbolic`, `tutorial-faber-w`,
`tutorial-log-conversions`, `tutorial-thornton` and `tutorial-neat-tricks` under
`tests/unit/`. Formula captions have their own integration/rendering regression.
Source inventory and finite tests are not a proof for every possible input.

References used to cross-check the mathematical definitions and standard methods:

- [NIST DLMF §4.28](https://dlmf.nist.gov/4.28): exponential definitions of the hyperbolic functions.
- [NIST DLMF §4.34](https://dlmf.nist.gov/4.34): derivatives used for the stated catenary model.
- [NIST DLMF §4.35](https://dlmf.nist.gov/4.35): hyperbolic identities.
- [The Versalog Slide Rule, Frederick Post Company](https://sliderulemuseum.org/Manuals/M34_Post_Versalog_1951.pdf): manufacturer instructions for inverse, π-folded and log-log techniques. The emulator’s own scale definitions determine the specific row labels taught here.

The [reference register](REFERENCE_REGISTER.md) records manufacturer manuals and
page pointers for the W, L/ln, CF/M–DF/M and Thornton lessons. Those sources
distinguish supported mathematical methods from historical engraving limitations.

References are linked, not redistributed. The emulator and its tests run offline.
No native browser, historical-engraving or physical-instrument precision claim
follows from these numerical checks.
