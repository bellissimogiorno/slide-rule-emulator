import test from 'node:test';
import assert from 'node:assert/strict';
import { renderScaleRow, scaleTone } from '#ui/scale-markup.js';
import { renderReadout } from '#ui/readout.js';
import { buildLibrary, deepClone } from '#model/program.js';
import { DEFAULT_STATE } from '#catalog/defaults.js';
test('scale markup escapes labels and honours explicit neutral and layer tones', () => {
    const state = deepClone(DEFAULT_STATE);
    state.customScales.push({ id: 'X', type: 'log', min: 1, max: 10, label: '<img src=x onerror=alert(1)>', tone: 'neutral' });
    state.customScales.push({ id: 'Y', type: 'composite', layers: [{ scale: 'X', tone: 'blue' }, { scale: 'D', tone: 'green' }] });
    const library = buildLibrary(state), context = { library, width: 1000, minGap: 1.65 };
    const markup = renderScaleRow('X', false, 'topStator', 0, 1, context);
    assert.ok(markup.includes('&lt;img'));
    assert.ok(!markup.includes('<img'));
    assert.equal(scaleTone('CI', { tone: 'neutral' }), 'neutral');
    const combined = renderScaleRow('Y', false, 'topStator', 0, 1, context);
    assert.ok(combined.includes('ink-blue'));
    assert.ok(combined.includes('ink-green'));
});
test('readouts respect the moving slide and report out-of-domain readings', () => {
    const state = deepClone(DEFAULT_STATE);
    state.sides = { front: { topStator: [], slide: ['C'], bottomStator: ['D'] } };
    state.activeSide = 'front';
    state.cursor = .1;
    state.slideOffset = .5;
    const html = renderReadout(state, buildLibrary(state));
    assert.match(html, /off scale/);
    assert.equal((html.match(/off scale/g) || []).length, 1);
});
