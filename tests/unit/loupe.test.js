import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loupeGeometry, LOUPE_FACTOR, LOUPE_SIZE } from '#ui/loupe-geometry.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
for (const zoom of [0.75, 1, 1.25, 1.5, 2]) {
    test(`loupe is exactly 2.5x relative to the displayed rule at ${zoom}x instrument zoom`, () => {
        const size = { width: 1000.25, height: 340.5 };
        const source = { left: -135, top: 320, width: size.width * zoom, height: size.height * zoom };
        const point = { x: 504, y: 457 };
        const g = loupeGeometry(point, source, size, { left: 0, top: 0, width: 1600, height: 1000 });
        assert.equal(LOUPE_FACTOR, 2.5);
        // Independent source-to-client conversion; the pointer's location is fixed.
        const localX = (point.x - source.left) / zoom, localY = (point.y - source.top) / zoom;
        close(g.left + g.x + localX * g.scaleX, point.x);
        close(g.top + g.y + localY * g.scaleY, point.y);
        close(g.scaleX / zoom, 2.5); close(g.scaleY / zoom, 2.5);
        // A second graduation moves away from that point by exactly 2.5x.
        close(g.left + g.x + (localX + 12.4) * g.scaleX - point.x, 12.4 * zoom * 2.5);
    });
}
for (const [width, height] of [[320,600], [390,800], [1600,1000]]) {
    test(`loupe stays inside ${width}x${height} viewport without moving its sampled point`, () => {
        for (const point of [{x:1,y:1}, {x:width-1,y:height-1}, {x:width/2,y:height/2}]) {
            const src = {left:0,top:0,width:1000,height:500};
            const g = loupeGeometry(point, src, {width:1000,height:500}, {left:0,top:0,width,height});
            assert.ok(g.left >= 8 && g.top >= 8);
            assert.ok(g.left + g.width <= width - 8 && g.top + g.height <= height - 8);
            close(g.left + g.x + point.x * g.scaleX, point.x);
            close(g.top + g.y + point.y * g.scaleY, point.y);
        }
    });
}
for (const [viewportWidth, expected] of [[320, 304], [390, 374], [496, 480], [1600, 480]]) {
    test(`loupe is square and fits its reading area in a ${viewportWidth}px viewport`, () => {
        const source = { left: 0, top: 0, width: 1000, height: 500 };
        const g = loupeGeometry({ x: viewportWidth / 2, y: 400 }, source, source,
            { left: 0, top: 0, width: viewportWidth, height: 800 });
        assert.equal(g.width, expected);
        assert.equal(g.height, expected);
        assert.equal(g.scaleX, 2.5);
        assert.equal(g.scaleY, 2.5);
    });
}
test('short and offset visual viewports reduce the square uniformly, not its magnification', () => {
    for (const viewport of [
        { left: 0, top: 0, width: 760, height: 280 },
        { left: 100.125, top: 230.375, width: 500, height: 250 }
    ]) {
        for (const [dx, dy] of [[1, 1], [viewport.width - 1, viewport.height - 1]]) {
            const point = { x: viewport.left + dx, y: viewport.top + dy };
            const source = { left: -100, top: 200, width: 1000, height: 500 };
            const g = loupeGeometry(point, source, source, viewport);
            assert.equal(g.width, viewport.height - 16);
            assert.equal(g.height, g.width);
            assert.ok(g.left >= viewport.left + 8 && g.top >= viewport.top + 8);
            assert.ok(g.left + g.width <= viewport.left + viewport.width - 8);
            assert.ok(g.top + g.height <= viewport.top + viewport.height - 8);
            close(g.left + g.x + (point.x - source.left) * g.scaleX, point.x);
            close(g.top + g.y + (point.y - source.top) * g.scaleY, point.y);
            assert.equal(g.scaleX, 2.5);
            assert.equal(g.scaleY, 2.5);
        }
    }
});
test('loupe honours the offset visual viewport and fractional scroll coordinates', () => {
    const v = {left:100.125,top:230.375,width:500,height:340};
    const g = loupeGeometry({x:105.2,y:236.8},{left:-330.5,top:233.75,width:1600,height:850},{width:800,height:425},v);
    close(g.left, v.left+8); close(g.top,v.top+8);
    close(g.left + g.x + (105.2 + 330.5) / 2 * g.scaleX, 105.2);
});
test('loupe is non-interactive, absent from configured exports and tied to application lifetime', async () => {
    const read = path => readFile(new URL('../../'+path, import.meta.url), 'utf8');
    const [source, css, files, app, html] = await Promise.all([
        read('src/ui/loupe.js'),read('src/styles/loupe.css'),read('src/ui/files.js'),
        read('src/ui/application.js'), read('src/index.html')]);
    assert.match(source, /setAttribute\('aria-hidden', 'true'\)/);
    assert.match(source, /setAttribute\('inert', ''\)/);
    assert.match(css, /\.rule-loupe \* \{ pointer-events: none !important; \}/);
    assert.match(css, /border-radius: 12px;/);
    assert.match(source, /elementFromPoint/);
    assert.match(await read('src/ui/loupe-renderer.js'), /cloneNode\(true\)/);
    assert.match(files, /querySelectorAll\('\[data-runtime-only\]'\)/);
    assert.match(app, /loupe.destroy\(\)/);
    assert.match(html, /id="loupeButton"[^>]+aria-pressed="false"[^>]+aria-describedby="loupeHelp"/);
});

test('loupe area is 480px square at ordinary desktop sizes, without increasing magnification', () => {
    assert.equal(LOUPE_SIZE, 480);
    const g = loupeGeometry({x:800,y:500}, {left:0,top:0,width:1200,height:700},
        {width:1200,height:700}, {left:0,top:0,width:1600,height:1000});
    assert.equal(g.width, 320 * 1.5);
    assert.equal(g.height, 320 * 1.5);
    assert.equal(g.scaleX, 2.5);
    assert.equal(g.scaleY, 2.5);
});
