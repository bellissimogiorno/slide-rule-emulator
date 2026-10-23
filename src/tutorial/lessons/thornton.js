/** Thornton vector functions and explicitly limited correction-model studies.
 * Primary source: original PIC 221/271 instructions, PDF pages 15–17 and 22:
 * https://www.sliderulemuseum.com/Manuals/Thornton_PIC_221-271_Instructions.pdf
 * The historical Pt row labels its input t; this emulator's H1/H2 constituents
 * label the result instead. Its four correction rows are endpoint-normalised
 * metric studies, not the calibrated slide-divisor scales in the manual.
 */
import { log, position, move, exercise, sectionLessons } from '#tutorial/lesson-data.js';

const vectorNote = 'Check alignment, then interpret the ratio, decimal place and physical units yourself.';
const ptNote = 'H₁/H₂ are exact Pt function models with result labels; their layout differs from the historical Pt input scale.';
const studyNote = 'Normalised model study only. These rows cannot reproduce the historical calibrated correction procedure; use S/T₁ for the actual function or angle.';
const radians = angle => angle * Math.PI / 180;
const degrees = angle => angle * 180 / Math.PI;
const complement = value => Math.sqrt(1 - value * value);
const hypotenuse = value => Math.sqrt(1 + value * value);

// These are the actual normalised metric coordinates, not historical divisor
// coordinates. Keeping the domains explicit also makes the model limitation
// visible to a future lesson author.
const studyMetrics = {
    SD: angle => radians(angle) / Math.sin(radians(angle)),
    TD: angle => radians(angle) / Math.tan(radians(angle)),
    ISD: value => Math.asin(value) / value,
    ITD: value => Math.atan(value) / value
};
const studyDomains = { SD: [1, 90], TD: [1, 84], ISD: [.1, .999], ITD: [.1, 10] };
function studyPosition(id, value) {
    const metric = studyMetrics[id], [minimum, maximum] = studyDomains[id];
    return position(0, (metric(value) - metric(minimum)) / (metric(maximum) - metric(minimum)));
}

export const THORNTON_LESSONS = sectionLessons('thornton', [
    {
        id: 'thornton-ps-complement', title: 'Ps: complementary components', layout: 'thornton-ps',
        summary: 'Use Ps and D to pass between the two dimensionless components of a unit right triangle.',
        problem: 'c = √(1 − s²); s = 0.3, 0.6 and 0.8. s and c are nonnegative dimensionless components with s² + c² = 1. Find c for each s.',
        start: position(),
        steps: [
            move('Read the complement of 0.3', 'Put the hairline at 0.3 on Ps. D reads about 9.539; divide D by ten to get c ≈ 0.9539. Ps gives a square-root complement, not an angle in degrees.',
                position(0, log(10 * complement(.3))), 'cursor', ['PS', 'D']),
            move('Read the complement of 0.6', 'Move to Ps 0.6. D reads 8, so the other component is 0.8. This is the familiar 0.6–0.8–1 right triangle.',
                position(0, log(8)), 'cursor', ['PS', 'D']),
            move('Exchange the known component', 'Move to Ps 0.8. D now reads 6, giving 0.6. The same identity exchanges the two components; both are ratios rather than lengths.',
                position(0, log(6)), 'cursor', ['PS', 'D'])
        ],
        practice: {
            problem: 'c = √(1 − s²); s = 0.5. s and c are nonnegative dimensionless components. Find c, then use that component on Ps to recover s.',
            intro: 'Find the complement of 0.5, then reverse the reading to recover the original component.',
            note: vectorNote, start: position(),
            steps: [
                exercise('Find the complement', 'Move to Ps 0.5 and divide the D reading by ten.',
                    position(0, log(10 * complement(.5))), ['cursor'], 'D reads about 8.660, so the complementary component is approximately 0.8660.'),
                exercise('Reverse the comparison', 'Now move to that component, about 0.8660, on Ps. Read D divided by ten.',
                    position(0, log(5)), ['cursor'], 'Correct: D reads 5, recovering the original component 0.5.')
            ]
        }
    },
    {
        id: 'thornton-ps-triangle', title: 'Ps: find a missing side', layout: 'thornton-ps',
        summary: 'Divide to form a side ratio, use Ps for its complement, then restore the length.',
        problem: 'b = h√(1 − (a/h)²); h = 5 cm and a = 3 cm. h is a right triangle’s hypotenuse; a and b are its perpendicular legs. Find b in cm.',
        start: position(),
        steps: [
            move('Mark the known leg', 'Put the hairline at D 3 for the known leg. We first calculate the dimensionless ratio a/h = 3/5.',
                position(0, log(3)), 'cursor', ['D']),
            move('Divide by the hypotenuse', 'Bring C 5 to D 3 under the stationary hairline.',
                position(log(.6), log(3)), 'slide'),
            move('Read the side ratio', 'Move to C 10. D reads 6; since 3/5 is below one, the ratio is 0.6.',
                position(log(.6), log(6)), 'cursor'),
            move('Use Ps for the other component', 'Move to Ps 0.6. D reads 8, representing the complementary ratio b/h = 0.8. No subtraction of squared lengths is needed on C/D.',
                position(log(.6), log(8)), 'cursor', ['PS', 'D']),
            move('Restore the length scale', 'Bring C 10 to D 8. This right-index setting will multiply the ratio 0.8 by the hypotenuse of 5 cm.',
                position(log(.8), log(8)), 'slide'),
            move('Read the missing leg', 'Move to C 5. D reads 4, so the missing perpendicular leg is 4 cm. Ps supplied a ratio; the multiplication restored the units.',
                position(log(.8), log(4)), 'cursor')
        ],
        practice: {
            problem: 'b = h√(1 − (a/h)²); h = 5 cm and a = 4 cm. h is hypotenuse; a and b are perpendicular legs of a right triangle. Find b in cm.',
            intro: 'Keep the 5 cm hypotenuse, but use a known leg of 4 cm. Calculate the ratio, complement it and restore the length.',
            note: vectorNote, start: position(),
            steps: [
                exercise('Mark the known leg', 'Move to D 4.', position(0, log(4)), ['cursor'], 'Now divide by the hypotenuse.'),
                exercise('Set the ratio', 'Bring C 5 to D 4 under the hairline.', position(log(.8), log(4)), ['slideOffset', 'cursor'], 'The division is set.', 'slide'),
                exercise('Read the ratio', 'Move to C 10 and interpret D for 4/5.', position(log(.8), log(8)), ['slideOffset', 'cursor'], 'D 8 represents the ratio 0.8.'),
                exercise('Read its complement', 'Move to Ps 0.8 and read D divided by ten.', position(log(.8), log(6)), ['cursor'], 'The complementary ratio is 0.6.'),
                exercise('Set multiplication by length', 'Bring C 10 to D 6 to restore the length using the hypotenuse.', position(log(.6), log(6)), ['slideOffset', 'cursor'], 'Now multiply by 5 cm.', 'slide'),
                exercise('Read the missing leg', 'Move to C 5 and read the missing leg in cm.', position(log(.6), log(3)), ['slideOffset', 'cursor'], 'Correct: the missing leg is approximately 3 cm.')
            ]
        }
    },
    {
        id: 'thornton-pt-low', title: 'Pt model: a ratio below one', layout: 'thornton-pt',
        summary: 'Use the H₁ constituent of the emulator’s Pt model to find a hypotenuse.',
        problem: 'h = b√(1 + t²), t = a/b; a = 3 cm and b = 4 cm. a and b are perpendicular legs, h is hypotenuse, and t is dimensionless. Find h. Model layout: H₁ labels the result; D/10 supplies t.',
        start: position(),
        steps: [
            move('Start the ratio', 'For this Pt mathematical model, first put the hairline at D 3. We will divide by the other leg, 4 cm.', position(0, log(3)), 'cursor', ['D']),
            move('Set division', 'Bring C 4 to D 3 under the hairline. The length units cancel in a/b.', position(log(.75), log(3)), 'slide'),
            move('Read the low-range Pt factor', 'At C 10, D reads 7.5, so t = 0.75. The H₁ model at this same hairline reads √(1 + 0.75²) = 1.25. Historical Pt labelled the input instead; this model labels the result.', position(log(.75), log(7.5)), 'cursor', ['C', 'D', 'H1']),
            move('Transfer the factor to D', 'Remember the H₁ result 1.25 and move the hairline to D 1.25. This explicit transfer prepares ordinary multiplication.', position(log(.75), log(1.25)), 'cursor', ['D']),
            move('Set multiplication by the other leg', 'Align C’s left-hand 1 with D 1.25.', position(log(1.25), log(1.25)), 'slide'),
            move('Read the hypotenuse', 'Move to C 4. D reads 5, so the hypotenuse is 5 cm. The exact model function is the same square-root-of-a-sum relation used by Pt.', position(log(1.25), log(5)), 'cursor')
        ],
        practice: {
            problem: 'h = b√(1 + t²), t = a/b; a = 2 cm and b = 3 cm. a and b are perpendicular legs; h is hypotenuse in cm. Find h using the H₁ result model, where t = D/10.',
            intro: 'Find the hypotenuse for legs 2 cm and 3 cm. Use the low-range H₁ result model after forming the ratio.', note: ptNote, start: position(),
            steps: [
                exercise('Mark the first leg', 'Move to D 2.', position(0, log(2)), ['cursor'], 'Now divide by 3 cm.'),
                exercise('Set the division', 'Bring C 3 to D 2.', position(log(2 / 3), log(2)), ['slideOffset', 'cursor'], 'Read at C 10 next.', 'slide'),
                exercise('Read the model factor', 'Move to C 10. Interpret t = D/10, then read √(1 + t²) on H₁.', position(log(2 / 3), log(20 / 3)), ['slideOffset', 'cursor'], 'The ratio is about 0.6667 and the H₁ factor about 1.202.'),
                exercise('Transfer the factor', 'Move to D 1.202, retaining the approximate H₁ result.', position(log(2 / 3), log(hypotenuse(2 / 3))), ['cursor'], 'The model factor is now on D.'),
                exercise('Set multiplication', 'Align C’s left-hand 1 with the factor under the hairline.', position(log(hypotenuse(2 / 3)), log(hypotenuse(2 / 3))), ['slideOffset', 'cursor'], 'Now multiply by the other leg, 3 cm.', 'slide'),
                exercise('Read the hypotenuse', 'Move to C 3 and read the hypotenuse in cm.', position(log(hypotenuse(2 / 3)), log(Math.sqrt(13))), ['slideOffset', 'cursor'], 'Correct: the hypotenuse is approximately 3.606 cm.')
            ]
        }
    },
    {
        id: 'thornton-pt-high', title: 'Pt model: a ratio above one', layout: 'thornton-pt',
        summary: 'Choose H₂ when the ratio of perpendicular components exceeds one.',
        problem: 'h = b√(1 + t²), t = a/b; a = 4 cm and b = 3 cm. a and b are perpendicular legs; h is hypotenuse in cm. Find h. Model layout: H₂ labels the result; D supplies t directly.',
        start: position(),
        steps: [
            move('Mark the numerator leg', 'Put the hairline at D 4. The Pt model ratio a/b will exceed one, so its H₂ constituent will be the appropriate range.', position(0, log(4)), 'cursor', ['D']),
            move('Divide by the other leg', 'Bring C 3 to D 4 under the hairline.', position(log(4 / 3), log(4)), 'slide'),
            move('Read the upper-range factor', 'At C 1, D gives t = 4/3 ≈ 1.333. H₂ reads √(1 + t²) ≈ 1.667. H₁ would use D/10 and solve a different ratio; do not interchange the two model ranges.', position(log(4 / 3), log(4 / 3)), 'cursor', ['C', 'D', 'H2']),
            move('Transfer the result', 'Move to D 1.667, retaining the approximate H₂ factor.', position(log(4 / 3), log(5 / 3)), 'cursor', ['D']),
            move('Set multiplication', 'Align C’s left-hand 1 with the factor under the hairline.', position(log(5 / 3), log(5 / 3)), 'slide'),
            move('Read the physical hypotenuse', 'Move to C 3. D reads 5 cm, the hypotenuse. This Pt result model gives an exact function, with a different graduation direction from the original instrument.', position(log(5 / 3), log(5)), 'cursor')
        ],
        practice: {
            problem: 'h = b√(1 + t²), t = a/b; a = 5 cm and b = 2 cm. a and b are perpendicular legs; h is hypotenuse in cm. Find h using the H₂ result model, where t = D.',
            intro: 'Find the hypotenuse for legs 5 cm and 2 cm. Use the model range for t greater than one.', note: ptNote, start: position(),
            steps: [
                exercise('Mark the first leg', 'Move to D 5.', position(0, log(5)), ['cursor'], 'Now divide by the other leg.'),
                exercise('Set the ratio', 'Bring C 2 to D 5.', position(log(2.5), log(5)), ['slideOffset', 'cursor'], 'The ratio will exceed one.', 'slide'),
                exercise('Read the H₂ factor', 'Move to C 1. Read t directly on D and √(1 + t²) on H₂.', position(log(2.5), log(2.5)), ['slideOffset', 'cursor'], 'The ratio is 2.5 and the H₂ factor is about 2.693.'),
                exercise('Transfer the factor', 'Move to D 2.693, retaining the approximate H₂ result.', position(log(2.5), log(hypotenuse(2.5))), ['cursor'], 'The factor is now on D.'),
                exercise('Set multiplication', 'Align C’s left-hand 1 with the factor.', position(log(hypotenuse(2.5)), log(hypotenuse(2.5))), ['slideOffset', 'cursor'], 'Now multiply by 2 cm.', 'slide'),
                exercise('Read the hypotenuse', 'Move to C 2 and read the hypotenuse in cm.', position(log(hypotenuse(2.5)), log(Math.sqrt(29))), ['slideOffset', 'cursor'], 'Correct: the hypotenuse is approximately 5.385 cm.')
            ]
        }
    },
    {
        id: 'thornton-direct-study', title: 'Sd/Td: normalised model study', layout: 'thornton-direct',
        summary: 'Explore direct correction labels, then find the actual functions separately on calibrated S and T₁.',
        problem: 'Normalised model study: θ = 30°. Locate θ on Sd and Td, then find sin θ and tan θ on calibrated S/T₁. θ is in degrees and the function values are dimensionless. Sd/Td here are not historical calibrated divisors.',
        start: position(),
        steps: [
            move('Sd model: locate 30°', 'In this normalised model, locate 30° on Sd with the slide aligned. Its internal metric is u/sin u, with u in radians, stretched between the model endpoints. The readout is the angle 30°; the opposite D number is not a correction factor.', studyPosition('SD', 30), 'cursor', ['SD']),
            move('Use calibrated S for the sine', 'Leave the normalised Sd study and move to 30° on the calibrated S row. D reads 5, so sin 30° = 0.5. This separate standard lookup does not perform the historical Sd slide-divisor operation.', position(0, log(5)), 'cursor', ['S', 'D']),
            move('Td model: locate 30°', 'Now locate 30° on the normalised Td model. Its endpoint-stretched metric is u/tan u, with u in radians. This label is an angle; no calibrated historical divisor can be read from D at this position.', studyPosition('TD', 30), 'cursor', ['TD']),
            move('Use calibrated T₁ for the tangent', 'Leave the normalised Td study and move to 30° on calibrated T₁. D reads about 5.774, so tan 30° ≈ 0.5774. Historically Sd/Td supplied divisors for direct sine/tangent calculations, but their calibration is absent from these models.', position(0, log(10 / Math.sqrt(3))), 'cursor', ['T1', 'D'])
        ],
        practice: {
            problem: 'Normalised model study: θs = 45° and θt = 20°. Locate θs on Sd and θt on Td, then find sin θs and tan θt on calibrated S/T₁. Angles are in degrees. The model rows do not supply historical correction divisors.',
            intro: 'Inspect the two normalised model labels, comparing each with an actual function lookup on S or T₁. Keep the model slide aligned at zero.', note: studyNote, start: position(),
            steps: [
                exercise('Locate Sd model 45°', 'With the slide aligned, move to 45° on the normalised Sd model. Read the angle label only.', studyPosition('SD', 45), ['slideOffset', 'cursor'], 'The Sd model readout is 45°. Its opposite D reading is not a correction factor.'),
                exercise('Find the actual sine', 'Leave the model study and move to 45° on calibrated S. Divide D by ten.', position(0, log(5 * Math.SQRT2)), ['cursor'], 'The calibrated lookup gives sin 45° ≈ 0.7071.'),
                exercise('Locate Td model 20°', 'Keep the slide aligned and move to 20° on the normalised Td model.', studyPosition('TD', 20), ['slideOffset', 'cursor'], 'The Td model readout is 20°, not a divisor or a tangent value.'),
                exercise('Find the actual tangent', 'Leave the model study and move to 20° on calibrated T₁. Divide D by ten.', position(0, log(10 * Math.tan(radians(20)))), ['cursor'], 'Correct: the calibrated lookup gives tan 20° ≈ 0.3640. No historical correction calibration was used.')
            ]
        }
    },
    {
        id: 'thornton-inverse-study', title: 'ISd/ITd: normalised model study', layout: 'thornton-inverse',
        summary: 'Distinguish inverse-model input labels from angles, then obtain the angles on calibrated trigonometric scales.',
        problem: 'Normalised model study: xs = 0.6 and xt = 0.75. Inspect xs on ISd and xt on ITd; find α = asin xs and β = atan xt on calibrated S/T₁. Inputs are dimensionless; α and β are in degrees. The models are not historical calibrated inverse divisors.',
        start: position(),
        steps: [
            move('ISd model: locate input 0.6', 'With the slide aligned, move to 0.6 on the normalised ISd model. This is the input, not its arcsine. The metric is asin(x) in radians divided by x, stretched between endpoints; the historical inverse divisor instead used x divided by its angle in degrees.', studyPosition('ISD', .6), 'cursor', ['ISD']),
            move('Find the actual arcsine on S', 'Leave the normalised model and put the hairline at D 6, representing sine 0.6. Calibrated S reads approximately 36.87°. This is asin 0.6; it was not obtained from an ISd-to-D correction factor.', position(0, log(6)), 'cursor', ['S', 'D']),
            move('ITd model: locate input 0.75', 'Now move to 0.75 on the normalised ITd model. Its metric is atan(x) in radians divided by x, stretched between endpoints. Its readout is the input 0.75, not an angle or a calibrated historical divisor.', studyPosition('ITD', .75), 'cursor', ['ITD']),
            move('Find the actual arctangent on T₁', 'Leave the normalised model and move to D 7.5, representing tangent 0.75. Calibrated T₁ reads approximately 36.87°. Historically ISd/ITd supplied divisors for inverse functions, but these models do not reproduce that operation.', position(0, log(7.5)), 'cursor', ['T1', 'D'])
        ],
        practice: {
            problem: 'Normalised model study: xs = 0.8 and xt = 0.5. Inspect xs on ISd and xt on ITd; find α = asin xs and β = atan xt on calibrated S/T₁. Inputs are dimensionless; α and β are in degrees. The model labels are not correction divisors.',
            intro: 'Inspect the normalised inverse-model inputs, then find the corresponding angles using calibrated S and T₁. Keep the model slide aligned.', note: studyNote, start: position(),
            steps: [
                exercise('Locate ISd input 0.8', 'With the slide aligned, move to input 0.8 on the normalised ISd model.', studyPosition('ISD', .8), ['slideOffset', 'cursor'], 'The model readout is the dimensionless input 0.8, not its angle.'),
                exercise('Find the arcsine', 'Leave the model study and move to D 8. Read the actual angle on calibrated S.', position(0, log(8)), ['cursor'], `The calibrated angle is approximately ${degrees(Math.asin(.8)).toFixed(2)}°.`),
                exercise('Locate ITd input 0.5', 'Keep the slide aligned and move to input 0.5 on the normalised ITd model.', studyPosition('ITD', .5), ['slideOffset', 'cursor'], 'The model readout is the dimensionless input 0.5, not a divisor or angle.'),
                exercise('Find the arctangent', 'Leave the model study and move to D 5. Read the actual angle on calibrated T₁.', position(0, log(5)), ['cursor'], `Correct: the calibrated angle is approximately ${degrees(Math.atan(.5)).toFixed(2)}°. No historical correction workflow was implied.`)
            ]
        }
    }
]);
