import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { multiplyPixels } from '#ui/loupe-renderer.js';

for (const [value, factor, expected] of [
    ['11px', 2.5, '27.5px'],
    ['10.5px', 1.875, '19.6875px'],
    ['1px 2px 0px 4px', 2.5, '2.5px 5px 0px 10px'],
    ['inset -1.5px .2px 0 0 rgba(0, 0, 0, 0.5)', 2.5, 'inset -3.75px 0.5px 0 0 rgba(0, 0, 0, 0.5)'],
    ['100% 50%', 2.5, '100% 50%'],
    ['color(srgb 0.2 0.3 0.4 / 0.7)', 2.5, 'color(srgb 0.2 0.3 0.4 / 0.7)'],
    ['normal', 2.5, 'normal'],
    ['none', 2.5, 'none']
]) test(`paint-sized CSS: ${value} at ${factor}`, () => assert.equal(multiplyPixels(value, factor), expected));

const read = name => readFile(new URL('../../src/' + name, import.meta.url), 'utf8');
test('loupe has a separate native-size painter, not a bitmap or CSS-scale path', async () => {
    const [controller, renderer] = await Promise.all([read('ui/loupe.js'), read('ui/loupe-renderer.js')]);
    assert.match(controller, /createLoupeDrawing\(face\)/);
    assert.match(controller, /drawing\.place\(g\.x, g\.y\)/);
    assert.doesNotMatch(controller, /scale\(|style\.zoom|cloneNode/);
    assert.doesNotMatch(renderer, /drawImage|toDataURL|createImageBitmap|scale\(/);
    assert.match(renderer, /transform: 'none', zoom: '1'/);
    assert.match(renderer, /'will-change': 'auto'/);
    assert.match(renderer, /getBoundingClientRect/);
    assert.match(renderer, /textContent = child\.textContent/);
    assert.doesNotMatch(renderer, /innerHTML/);
});
test('paint-only cursor replaces generated content without doubling its hairline', async () => {
    const [renderer, css] = await Promise.all([read('ui/loupe-renderer.js'), read('styles/loupe.css')]);
    assert.match(renderer, /dataset\.loupeDecoration/);
    assert.match(css, /\.loupe-copy \.cursor::before, \.loupe-copy \.cursor::after \{ content: none !important; \}/);
});
test('native-size text cannot make hidden, collision-suppressed numbers visible again', async () => {
    const source = await read('ui/loupe-renderer.js');
    assert.match(source, /visibility: 'inherit'/);
    assert.match(source, /style\.visibility === 'hidden'/);
});
test('copy removes focus and native popup hooks, and updates only motion containers', async () => {
    const source = await read('ui/loupe-renderer.js');
    assert.match(source, /\['id', 'tabindex', 'title', 'aria-describedby', 'aria-labelledby'\]/);
    assert.match(source, /original\.matches\('\.slide-mover, \.cursor'\)/);
    assert.match(source, /const positions = movers\.map/);
});

test('forced colours and delayed font loading invalidate native-size paint', async () => {
    const [source, painter] = await Promise.all([read('ui/loupe.js'), read('ui/loupe-renderer.js')]);
    assert.match(source, /matchMedia\('\(forced-colors: active\)'\), 'change'/);
    assert.match(source, /listen\(document.fonts, 'loadingdone'/);
    assert.match(painter, /'forced-color-adjust': 'none'/);
});
