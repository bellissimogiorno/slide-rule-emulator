/** A progressive course grouped by technique and mathematical scale family. */
import { deepFreeze } from '#core/objects.js';
import { BASIC_LESSONS } from '#tutorial/lessons/basics.js';
import { ARITHMETIC_LESSONS } from '#tutorial/lessons/arithmetic.js';
import { RATIO_LESSONS } from '#tutorial/lessons/ratios.js';
import { POWER_LESSONS } from '#tutorial/lessons/powers.js';
import { TRIGONOMETRY_LESSONS } from '#tutorial/lessons/trigonometry.js';
import { INVERSE_FOLDED_LESSONS } from '#tutorial/lessons/inverse-folded.js';
import { ADVANCED_POWER_LESSONS, ADVANCED_TRIG_LESSONS } from '#tutorial/lessons/advanced-scales.js';
import { LOGARITHM_LESSONS } from '#tutorial/lessons/logarithms.js';
import { GEOMETRY_LESSONS } from '#tutorial/lessons/geometry.js';
import { HYPERBOLIC_LESSONS } from '#tutorial/lessons/hyperbolic.js';
import { FABER_W_LESSONS } from '#tutorial/lessons/faber-w.js';
import { LOG_CONVERSION_LESSONS } from '#tutorial/lessons/log-conversions.js';
import { THORNTON_LESSONS } from '#tutorial/lessons/thornton.js';
import { NEAT_TRICK_LESSONS } from '#tutorial/lessons/neat-tricks.js';

const section = (id, title, summary, lessons) => ({ id, title, summary,
    lessons: lessons.map(lesson => ({ ...lesson, sectionId: id })) });

export const TUTORIAL_SECTIONS = deepFreeze([
    section('basics', 'The basics',
        'Read the scales, multiply, divide and choose the correct end of C.', BASIC_LESSONS),
    section('arithmetic', 'Arithmetic fluency',
        'Place decimal points, work below one and reuse an alignment.', ARITHMETIC_LESSONS),
    section('ratios', 'Ratios and chains',
        'Keep a constant ratio, convert units and carry an intermediate result.',
        RATIO_LESSONS.filter(lesson => lesson.id !== 'reciprocals')),
    section('inverse-folded', 'Inverse and folded scales',
        'Distinguish CI from DI; use CF/DF and their reciprocal partners with their real indexes.',
        [...RATIO_LESSONS.filter(lesson => lesson.id === 'reciprocals'), ...INVERSE_FOLDED_LESSONS]),
    section('powers', 'Powers and root scales',
        'Use A/B/K, then choose the correct dedicated square-root or cube-root branch and decade.',
        [...POWER_LESSONS, ...ADVANCED_POWER_LESSONS]),
    section('faber-w', 'Faber-Castell W scales',
        'Use both halves of the 2/83N’s extended arithmetic scales, choose indexes and find a geometric mean.', FABER_W_LESSONS),
    section('log-conversions', 'L, ln and logarithm conversions',
        'Extend linear logarithms beyond one decade and use CF/M–DF/M for natural/common conversions and folded arithmetic.',
        [...LOGARITHM_LESSONS.filter(lesson => lesson.id === 'common-log'), ...LOG_CONVERSION_LESSONS]),
    section('logarithms', 'LL scales and exponentials',
        'Select LL ranges, read natural logarithms, and compute exponentials, powers, roots and unknown exponents.',
        LOGARITHM_LESSONS.filter(lesson => lesson.id !== 'common-log')),
    section('trigonometry', 'Angles and triangles',
        'Use sine, cosine, both tangent ranges, small angles and P/H relationships.',
        [...TRIGONOMETRY_LESSONS, ...ADVANCED_TRIG_LESSONS]),
    section('geometry', 'Geometry and measurement',
        'Calculate circumferences, areas and volumes while keeping dimensions and units explicit.', GEOMETRY_LESSONS),
    section('hyperbolic', 'Hyperbolic functions',
        'Read sinh, cosh and tanh and their inverses; use them in a catenary and a mathematical identity.', HYPERBOLIC_LESSONS),
    section('thornton', 'Thornton AA010 studies',
        'Explore Ps, the Pt relationship and normalised correction studies, with their historical calibration limits stated.', THORNTON_LESSONS),
    section('neat-tricks', 'Neat tricks',
        'Share a total, combine resistances, discover the golden ratio and triples, and exploit useful identities.', NEAT_TRICK_LESSONS)
]);

/** Explicit teaching scope, not a claim to cover every manufacturer variant. */
export const TUTORIAL_PRIMARY_SCALE_IDS = deepFreeze([
    'C', 'D', 'A', 'B', 'K', 'CI', 'DI', 'CF', 'DF', 'CIF', 'DIF',
    'R1', 'R2', 'Q1', 'Q2', 'Q3', 'L',
    'LL0', 'LL1', 'LL2', 'LL3', 'LL4', 'LL00', 'LL01', 'LL02', 'LL03', 'LL04',
    'S', 'T1', 'T2', 'ST', 'P', 'H1', 'H2', 'SH1', 'SH2', 'CH', 'TH',
    'LN', 'CFM', 'DFM', 'W1', 'W2', 'W1P', 'W2P', 'PS', 'SD', 'TD', 'ISD', 'ITD'
]);
