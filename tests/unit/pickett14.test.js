import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_SCALES as scales } from '#catalog/scales.js';
import { PRESETS } from '#catalog/presets.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { renderScaleRow } from '#ui/scale-markup.js';
import { renderReadout } from '#ui/readout.js';
import { validateProgram } from '#model/validation.js';
import { close, programme } from './helpers.js';
const DEG = Math.PI / 180, MIL = Math.PI / 3200;
const ids = Object.keys(scales).filter(id => id.startsWith('P14_'));
const html = id => renderScaleRow(id, true, 'slide', 0, 1, { library: scales, width: 1600, minGap: 1.65 });

test('Pickett 14 specimen order: twelve general rows and ten degree/mil rows', () => {
    assert.deepEqual(PRESETS.pickett14.sides.front, {
        name: 'Front - general log-log', topStator: ['PLL1', 'PLL2', 'P14_A'],
        slide: ['P14_B', 'P14_T', 'P14_ST', 'P14_S', 'K', 'P14_C'], bottomStator: ['P14_D', 'PLL3', 'PLL4']
    });
    assert.deepEqual(PRESETS.pickett14.sides.back.topStator, ['P14_OPP_DEG', 'P14_OPP_MIL']);
    assert.deepEqual(PRESETS.pickett14.sides.back.slide, ['P14_APEX_MIL', 'P14_APEX_DEG', 'P14_T_MIL', 'P14_ST_MIL', 'P14_S_MIL', 'P14_BASE']);
    assert.deepEqual(PRESETS.pickett14.sides.back.bottomStator, ['P14_DISTANCE', 'P14_A']);
    validateProgram({ ...PRESETS.pickett14, customScales: [] });
});

test('all sixteen Pickett 14 definitions remain individually programmable', () => {
    assert.equal(ids.length, 16);
    for (const id of ids) validateProgram(programme({ ...scales[id] }));
});

const relations = [
    ['P14_T', DEG, Math.tan, 10], ['P14_S', DEG, Math.sin, 10],
    ['P14_ST', DEG, x => x, 100], ['P14_OPP_DEG', DEG, Math.sin, 2],
    ['P14_OPP_MIL', MIL, Math.sin, 2], ['P14_APEX_DEG', DEG, Math.sin, 20],
    ['P14_APEX_MIL', MIL, Math.sin, 20], ['P14_T_MIL', MIL, Math.tan, 10],
    ['P14_S_MIL', MIL, Math.sin, 10], ['P14_ST_MIL', MIL, x => x, 100]
];
for (const [id, unit, fn, factor] of relations) {
    test(`${id}: 501 independent angle identities and round trips`, () => {
        const def = scales[id], rt = makeRuntimeScale(def);
        for (let i = 0; i <= 500; i++) {
            const p = rt.pMin + (rt.pMax - rt.pMin) * i / 500;
            const angle = rt.value(p);
            close(factor * fn(angle * unit), 10 ** p);
            close(rt.pos(angle), p);
            if (def.pairedSum) {
                const other = def.pairedSum - angle;
                close(angle + other, def.pairedSum);
                if (fn === Math.sin) close(Math.sin(angle * unit), def.pairedSum * unit > 2 ? Math.sin(other * unit) : Math.cos(other * unit));
                if (fn === Math.tan) close(Math.tan(angle * unit) * Math.tan(other * unit), 1);
            }
        }
    });
}

test('6400 mils/turn: a right angle is 1600 mils, not 1000*pi/2', () => {
    const deg = makeRuntimeScale(scales.P14_APEX_DEG), mil = makeRuntimeScale(scales.P14_APEX_MIL);
    for (const angle of [3, 5, 10, 20, 30]) {
        close(deg.pos(angle), mil.pos(angle * 6400 / 360));
        close(mil.value(deg.pos(angle)), angle * 6400 / 360);
    }
    close(makeRuntimeScale(scales.P14_S_MIL).value(1), 1600);
    assert.ok(Math.abs(makeRuntimeScale(scales.P14_S_MIL).value(1) - 500 * Math.PI) > 20);
});

test('opposite angle main interval is log10(2) of a decade, not stretched full width', () => {
    for (const id of ['P14_OPP_DEG', 'P14_OPP_MIL']) {
        const rt = makeRuntimeScale(scales[id]);
        close(rt.pMin, 0); close(rt.pMax, Math.log10(2));
        const markup = html(id);
        assert.equal((markup.match(/class="syncro-baseline"/g) || []).length, 1);
        const width = Number(markup.match(/width:([.\d]+)%/)[1]);
        close(width, 100 * Math.log10(2));
        const output = renderReadout({ ...PRESETS.pickett14, activeSide: 'back', viewMode: 'single', cursor: .7, slideOffset: 0 }, scales);
        assert.match(output, new RegExp(`data-readout-scale="${id}"[\\s\\S]*?off scale`));
    }
});

test('paired angle rows have one tick set with sum-minus-angle readings, not reciprocals', () => {
    for (const id of ids.filter(id => scales[id].pairedSum)) {
        const def = scales[id], rt = makeRuntimeScale(def), ticks = generateTicks(def, rt, 1600);
        const markup = html(id);
        assert.equal((markup.match(/class="syncro-tick /g) || []).length, ticks.length);
        assert.equal((markup.match(/class="baseline"/g) || []).length, 0);
        for (const tick of ticks.filter(t => t.label)) {
            close(Number(tick.negativeLabel), def.pairedSum - tick.value, 6e-5, 1e-7);
            assert.equal(tick.positiveLabel, tick.label);
        }
    }
});

for (const width of [600, 1000, 1600, 2400]) test(`Pickett 14 round-number graduation coverage at ${width}px`, () => {
    for (const id of ids) {
        const rt = makeRuntimeScale(scales[id]), ticks = generateTicks(scales[id], rt, width);
        assert.ok(ticks.length > 30, id);
        const gaps = ticks.slice(1).map((tick, i) => (tick.pos - ticks[i].pos) * width);
        assert.ok(Math.max(...gaps) < (scales[id].type === 'log' ? Math.max(12, width * .006) : 12), `${id}: maximum gap ${Math.max(...gaps)}`);
    }
});

test('scale-labelled arithmetic decades retain decimal placement', () => {
    for (const [id, factor] of [['P14_BASE', 100], ['P14_DISTANCE', 1000]]) {
        const rt = makeRuntimeScale(scales[id]);
        for (let i = 0; i <= 100; i++) close(rt.value(i / 100), factor * 10 ** (i / 100));
    }
});

test('paired angles reject unsupported, negative and contradictory configurations', () => {
    for (const changes of [{ pairedSum: 0 }, { pairedSum: 30 }, { pairedSum: '180' }, { type: 'log' }, { min: -1 }])
        assert.throws(() => validateProgram(programme({ ...scales.P14_T, ...changes })));
    assert.throws(() => validateProgram(programme({ id: 'PAIR', type: 'composite', layers: ['P14_T', 'D'] })));
});
