/** Castell-Duplex 2/82N: the manufacturer's 1962 N-model arrangement.
 * The red angular captions are complementary angles, NOT reciprocals.
 * Source and scope: docs/FABER_282N.md. Existing catalogue objects are unchanged. */
import { rootsScales } from '#catalog/scales/roots.js';
import { trigonometricScales } from '#catalog/scales/trigonometric.js';

const family = 'Faber-Castell 2/82N';
const angle = (id, label, base, description) => ({ ...base, id, label, family,
    pairedSum: 90, tone: 'neutral', description });
export const faber282nScales = {
    FC282_T1: angle('FC282_T1', 'T\u2081', trigonometricScales.T1,
        'Lower tangent/cotangent range. Black and red angles sum to 90 degrees on shared ticks.'),
    FC282_T2: angle('FC282_T2', 'T\u2082', trigonometricScales.T2,
        'Upper tangent/cotangent range. Black tangent angles increase; red cotangent angles decrease.'),
    FC282_S: angle('FC282_S', 'S', trigonometricScales.S,
        'Fixed sine/cosine scale. Read black angles for sine and complementary red angles for cosine.'),
    FC282_SP: angle('FC282_SP', 'S\u2032', trigonometricScales.S,
        'Movable sine/cosine scale, used with fixed S to multiply or divide trigonometric values directly.'),
    FC282_KP: { ...rootsScales.K, id: 'FC282_KP', label: 'K\u2032', family,
        description: 'Movable three-decade cube scale, aligned with fixed K for calculations involving cubes.' },
    FC282_P: { ...trigonometricScales.P, id: 'FC282_P', label: 'P', tone: 'red', family,
        description: 'Reverse-running Pythagorean scale; with D read as 0.1 to 1, P gives sqrt(1-D^2).' }
};
