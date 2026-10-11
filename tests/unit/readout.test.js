import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderReadout } from '#ui/readout.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { DEFAULT_STATE } from '#catalog/defaults.js';
const state = (topStator, slide = [], bottomStator = []) => ({ ...structuredClone(DEFAULT_STATE), activeSide: 'front', viewMode: 'single', cursor: .5, slideOffset: 0, sides: { front: { topStator, slide, bottomStator } } });

test('readings share exactly one heading per populated rail, preserving scale order', () => {
    const html = renderReadout(state(['A', 'K'], ['C'], ['D', 'DI']), BUILTIN_SCALES);
    assert.equal((html.match(/class="rail-name"/g) || []).length, 3);
    assert.equal((html.match(/class="scale-id"/g) || []).length, 5);
    assert.deepEqual([...html.matchAll(/data-readout-scale="([^"]+)"/g)].map(m => m[1]), ['A', 'K', 'C', 'D', 'DI']);
    assert.match(html, />3.16228</);
});
test('compact readings retain all three cube-root branches and both log-log values', () => {
    const html = renderReadout(state(['PICKETT_CBRT', 'PN3LL0']), BUILTIN_SCALES);
    assert.equal((html.match(/class="value multi"/g) || []).length, 2);
    assert.match(html, /1.4678/); assert.match(html, /3.16228/); assert.match(html, /6.81292/);
    assert.match(html, /\+: 1.00317/); assert.match(html, /\u2212: 0.996843/);
});
test('empty or unresolved rails do not create empty heading bands', () => {
    const html = renderReadout(state(['no-such-scale']), BUILTIN_SCALES);
    assert.match(html, /No scales on this side/); assert.doesNotMatch(html, /readout-rail/);
});
test('all visible custom face names and scale names are escaped', () => {
    const data = state(['X']); data.viewMode = 'both'; data.sides.front.name = '<img>';
    const html = renderReadout(data, { X: { ...BUILTIN_SCALES.D, label: '<script>' } });
    assert.match(html, /&lt;img&gt;/); assert.match(html, /&lt;script&gt;/); assert.doesNotMatch(html, /<img>|<script>/);
});
test('units, reference-only readings and off-scale states remain explicit', () => {
    const data = state(['BB_H_TOTAL', 'CHEM_CH_AM'], ['C']); data.slideOffset = .9;
    const html = renderReadout(data, BUILTIN_SCALES);
    assert.match(html, /W cm/); assert.match(html, /Nearest:/); assert.match(html, /off scale/);
    assert.equal((html.match(/off scale/g) || []).length, 1);
});
test('reading styles keep full-size values and do not truncate or clamp text', () => {
    const css = readFileSync(new URL('../../src/styles/readout.css', import.meta.url), 'utf8');
    assert.match(css, /\.value \{[^}]*font-size: 16px/);
    assert.doesNotMatch(css, /text-overflow\s*:|line-clamp\s*:|overflow\s*:\s*hidden/);
});

test('readout metadata cannot be mistaken for an instrument graduation row', () => {
    const html = renderReadout(state(['D']), BUILTIN_SCALES);
    assert.match(html, /data-readout-scale="D"/);
    assert.doesNotMatch(html, / data-scale=| data-side=| data-rail=/);
});
