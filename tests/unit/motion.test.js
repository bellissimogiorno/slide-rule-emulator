import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { MOTION_STEPS, motionStep, motionKeyCommand, movedPosition, positionText, positionDescription } from '../../src/ui/motion.js';

for (const [key, direction] of Object.entries({ ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -10, PageUp: 10 })) {
    test(`motion ${key}: each precision, direction and fine modifier`, () => {
        for (const step of MOTION_STEPS) {
            assert.deepEqual(motionKeyCommand({ key }, step), { delta: direction * step });
            assert.deepEqual(motionKeyCommand({ key, altKey: true }, step), { delta: direction * (step / 10) });
        }
    });
}

test('motion Home and End select the true limits, independently of precision', () => {
    for (const [field, min, max] of [['cursor', 0, 1], ['slideOffset', -.9, .9]]) {
        for (const step of MOTION_STEPS) {
            assert.equal(movedPosition(.5, field, motionKeyCommand({ key: 'Home' }, step)), min);
            assert.equal(movedPosition(.5, field, motionKeyCommand({ key: 'End', altKey: true }, step)), max);
            assert.equal(movedPosition(max, field, { delta: .01 }), max);
            assert.equal(movedPosition(min, field, { delta: -.01 }), min);
        }
    }
});

test('motion rejects browser, composition and already consumed keys', () => {
    for (const key of ['ArrowLeft', 'ArrowUp', 'PageDown', 'Home', 'End']) {
        for (const flag of ['ctrlKey', 'metaKey', 'isComposing', 'defaultPrevented'])
            assert.equal(motionKeyCommand({ key, [flag]: true }, .001), null);
    }
    for (const key of ['Tab', 'Enter', 'Escape', 'a', 'F5', 'toString', '__proto__'])
        assert.equal(motionKeyCommand({ key }, .001), null);
});

test('motion uses a bounded precision menu, not arbitrary injected step values', () => {
    assert.equal(motionStep('0.00001'), .00001);
    for (const value of ['', 0, -1, NaN, Infinity, 'bad', .01])
        assert.equal(motionStep(value), .001);
    assert.ok(Math.abs(motionStep('0.00001', true) - .000001) < 1e-20);
});

test('motion preserves an off-grid coordinate and does not quantise subpixel nudges', () => {
    const original = Math.log10(3);
    let value = original;
    for (let i = 0; i < 1000; i++) value = movedPosition(value, 'cursor', { delta: .000001 });
    assert.ok(Math.abs(value - (original + .001)) < 1e-12);
    for (let i = 0; i < 1000; i++) value = movedPosition(value, 'cursor', { delta: -.000001 });
    assert.ok(Math.abs(value - original) < 1e-12);
    assert.equal(movedPosition(original, 'slideOffset', { delta: 0 }), original);
    assert.equal(movedPosition(.75, 'cursor', { position: original }), original);
    assert.throws(() => movedPosition(0, 'unknown', { delta: 1 }), /Unknown motion target/);
});

test('motion readouts reveal every offered step including Alt plus Very fine', () => {
    for (const field of ['cursor', 'slideOffset']) {
        for (const step of MOTION_STEPS) {
            assert.notEqual(positionText(.5, field), positionText(.5 + step, field));
            assert.notEqual(positionText(.5, field), positionText(.5 + step / 10, field));
        }
    }
    assert.equal(positionText(0, 'slideOffset'), '+0.000000');
    assert.equal(positionText(-.125, 'slideOffset'), '-0.125000');
    assert.equal(positionText(-1e-9, 'cursor'), '0.000000');
    assert.match(positionDescription(0, 'slideOffset'), /aligned/);
    assert.match(positionDescription(-.1, 'slideOffset'), /0.100000.*left/);
    assert.match(positionDescription(.1, 'slideOffset'), /0.100000.*right/);
    assert.match(positionDescription(.5, 'cursor'), /0.500000.*left index/);
});

test('motion controls retain labelled native ranges, shared help and nudge buttons', async () => {
    const html = await readFile(new URL('../../src/index.html', import.meta.url), 'utf8');
    for (const id of ['slideRange', 'cursorRange']) {
        assert.match(html, new RegExp(`<label for="${id}">`));
        const input = html.match(new RegExp(`<input id="${id}"[^>]+>`))[0];
        assert.match(input, /type="range"/);
        assert.match(input, /step="any"/);
        assert.match(input, /aria-describedby="motionHelp"/);
    }
    assert.equal((html.match(/data-nudge=/g) || []).length, 4);
    assert.match(html, /id="ruleViewport"[^>]+aria-describedby="motionHelp"/);
    assert.match(html, /id="ruleCanvas"[^>]+aria-describedby="motionHelp"/);
});
