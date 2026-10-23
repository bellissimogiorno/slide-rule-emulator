import test from 'node:test';
import assert from 'node:assert/strict';
import { createTutorialAnimation } from '#tutorial/animation.js';

const from = { slideOffset: 0, cursor: .1 };
const target = { slideOffset: Math.log10(2), cursor: Math.log10(6) };
function harness(callbacks = {}) {
    let time = 0, next = 0, completions = 0;
    const frames = new Map(), positions = [], cancelled = [];
    const clock = {
        performance: { now: () => time },
        requestAnimationFrame(fn) { const id = next++; frames.set(id, fn); return id; },
        cancelAnimationFrame(id) { cancelled.push(frames.get(id)); frames.delete(id); }
    };
    const runner = createTutorialAnimation({ clock,
        onPosition: value => { positions.push(value); callbacks.position?.(value); },
        onComplete: () => { completions++; callbacks.complete?.(); } });
    return { runner, clock, frames, positions, cancelled,
        get completions() { return completions; },
        setTime(value) { time = value; },
        tick(value) {
            time = value;
            const pending = [...frames.values()]; frames.clear();
            for (const fn of pending) fn(time);
        }
    };
}

test('a demonstration visibly moves through intermediate positions and ends exactly on target', () => {
    const ui = harness(); ui.runner.play(from, target, 1000);
    assert.deepEqual(ui.positions, [from]);
    assert.equal(ui.frames.size, 1);
    assert.equal(ui.runner.playing, true);
    ui.tick(250);
    const early = ui.positions.at(-1);
    assert.ok(early.slideOffset > from.slideOffset && early.slideOffset < target.slideOffset / 2);
    assert.ok(early.cursor > from.cursor && early.cursor < target.cursor);
    ui.tick(750);
    assert.ok(ui.positions.at(-1).slideOffset > target.slideOffset / 2);
    ui.tick(1000);
    assert.deepEqual(ui.positions.at(-1), target);
    assert.equal(ui.completions, 1);
    assert.equal(ui.frames.size, 0);
    assert.equal(ui.runner.playing, false);
    assert.equal(ui.runner.paused, false);
    ui.tick(2000); ui.runner.finish();
    assert.equal(ui.completions, 1);
});

test('a late frame reaches the exact endpoint without overshooting either limit', () => {
    const ui = harness();
    ui.runner.play({ slideOffset: -.9, cursor: 1 }, { slideOffset: .9, cursor: 0 }, 500);
    for (const t of [100, 300, 9000]) ui.tick(t);
    assert.deepEqual(ui.positions.at(-1), { slideOffset: .9, cursor: 0 });
    assert.ok(ui.positions.every(p => p.slideOffset >= -.9 && p.slideOffset <= .9 && p.cursor >= 0 && p.cursor <= 1));
    assert.equal(ui.completions, 1);
});

test('pause freezes the displayed position and resume uses only the remaining movement time', () => {
    const ui = harness(); ui.runner.play(from, target, 1000); ui.tick(400);
    const frozen = { ...ui.positions.at(-1) }, count = ui.positions.length;
    ui.setTime(450); ui.runner.pause();
    assert.equal(ui.runner.paused, true);
    assert.equal(ui.runner.playing, false);
    assert.equal(ui.frames.size, 0);
    ui.tick(5000);
    assert.equal(ui.positions.length, count);
    assert.deepEqual(ui.positions.at(-1), frozen);
    ui.runner.resume();
    assert.deepEqual(ui.positions.at(-1), frozen);
    ui.tick(5000);
    assert.deepEqual(ui.positions.at(-1), frozen);
    ui.tick(5599); assert.equal(ui.completions, 0);
    ui.tick(5600); assert.deepEqual(ui.positions.at(-1), target);
    assert.equal(ui.completions, 1);
});

test('pause and resume are idempotent and never create duplicate frame loops', () => {
    const ui = harness();
    ui.runner.pause(); ui.runner.resume(); assert.equal(ui.frames.size, 0);
    ui.runner.play(from, target, 1000);
    ui.runner.pause(); ui.runner.pause(); ui.runner.resume(); ui.runner.resume();
    assert.equal(ui.frames.size, 1);
    ui.tick(1000); assert.equal(ui.completions, 1);
});

test('replay replaces the movement and ignores an already captured old callback', () => {
    const ui = harness(); ui.runner.play(from, target, 1000);
    const old = [...ui.frames.values()][0];
    ui.setTime(100);
    const other = { slideOffset: -.3, cursor: .2 };
    ui.runner.play(target, other, 500);
    const count = ui.positions.length;
    old(10000);
    assert.equal(ui.positions.length, count);
    assert.equal(ui.completions, 0);
    assert.equal(ui.frames.size, 1);
    ui.tick(600);
    assert.deepEqual(ui.positions.at(-1), other);
    assert.equal(ui.completions, 1);
});

test('cancel drops queued work without completing, including stale scheduler callbacks', () => {
    const ui = harness(); ui.runner.play(from, target, 1000);
    const old = [...ui.frames.values()][0], count = ui.positions.length;
    ui.runner.cancel(); old(10000); ui.runner.cancel();
    assert.equal(ui.positions.length, count);
    assert.equal(ui.completions, 0);
    assert.equal(ui.frames.size, 0);
    assert.equal(ui.runner.playing, false);
    assert.equal(ui.runner.paused, false);
});

test('finish works from paused or playing state and completes exactly once', () => {
    for (const paused of [false, true]) {
        const ui = harness(); ui.runner.play(from, target, 1000);
        const old = [...ui.frames.values()][0];
        if (paused) ui.runner.pause();
        ui.runner.finish(); old(10000); ui.runner.finish();
        assert.deepEqual(ui.positions.at(-1), target);
        assert.equal(ui.completions, 1);
        assert.equal(ui.frames.size, 0);
        assert.equal(ui.runner.playing, false);
        assert.equal(ui.runner.paused, false);
    }
});

test('zero duration snaps once and completes synchronously for an explicit reduced-motion step', () => {
    const ui = harness(); ui.runner.play(from, target, 0);
    assert.deepEqual(ui.positions, [target]);
    assert.equal(ui.completions, 1);
    assert.equal(ui.frames.size, 0);
    assert.equal(ui.runner.playing, false);
});

test('positions are isolated from caller and callback mutation', () => {
    const a = { ...from }, b = { ...target };
    const ui = harness({ position: value => { value.cursor = .99; } });
    ui.runner.play(a, b, 1000);
    a.slideOffset = .8; b.slideOffset = -.8;
    ui.tick(1000);
    assert.equal(ui.positions.at(-1).slideOffset, target.slideOffset);
    assert.equal(from.cursor, .1);
    assert.equal(target.cursor, Math.log10(6));
});

test('destroy removes queued work, rejects new playback and makes old callbacks harmless', () => {
    const ui = harness(); ui.runner.play(from, target, 1000);
    const old = [...ui.frames.values()][0], count = ui.positions.length;
    ui.runner.destroy(); old(10000); ui.runner.destroy();
    ui.runner.pause(); ui.runner.resume(); ui.runner.finish(); ui.runner.cancel();
    assert.equal(ui.positions.length, count);
    assert.equal(ui.completions, 0);
    assert.equal(ui.frames.size, 0);
    assert.throws(() => ui.runner.play(from, target, 1000), /destroyed/);
});

test('invalid coordinates or durations are rejected before cancelling a valid movement', () => {
    const ui = harness(); ui.runner.play(from, target, 1000);
    const invalid = [
        [null, target, 1000], [from, {}, 1000],
        [{ slideOffset: NaN, cursor: .5 }, target, 1000],
        [from, { slideOffset: Infinity, cursor: .5 }, 1000],
        [from, { slideOffset: 0, cursor: -Infinity }, 1000],
        [{ slideOffset: -.90001, cursor: .5 }, target, 1000],
        [{ slideOffset: .90001, cursor: .5 }, target, 1000],
        [from, { slideOffset: 0, cursor: -.00001 }, 1000],
        [from, { slideOffset: 0, cursor: 1.00001 }, 1000],
        [from, { slideOffset: '0', cursor: .5 }, 1000],
        [from, target, NaN], [from, target, Infinity], [from, target, -1], [from, target, '1000']
    ];
    for (const args of invalid) assert.throws(() => ui.runner.play(...args), RangeError);
    assert.equal(ui.frames.size, 1);
    assert.equal(ui.runner.playing, true);
    ui.tick(1000); assert.deepEqual(ui.positions.at(-1), target);
    assert.equal(ui.completions, 1);
});

test('a nonfinite clock is rejected without replacing the current movement', () => {
    const ui = harness(); ui.runner.play(from, target, 1000);
    ui.setTime(Infinity);
    assert.throws(() => ui.runner.play(from, target, 500), /clock must be finite/);
    assert.equal(ui.frames.size, 1);
    ui.tick(1000); assert.equal(ui.completions, 1);
});

test('callbacks can cancel or replace playback without reviving the old movement', () => {
    let ui;
    ui = harness({ position: () => { if (ui?.positions.length === 2) ui.runner.cancel(); } });
    ui.runner.play(from, target, 1000); ui.tick(500);
    assert.equal(ui.frames.size, 0); assert.equal(ui.completions, 0);
    ui = harness({ complete: () => { if (ui.completions === 1) ui.runner.play(target, from, 1000); } });
    ui.runner.play(from, target, 1000); ui.tick(1000);
    assert.equal(ui.frames.size, 1); assert.equal(ui.runner.playing, true);
    ui.tick(2000); assert.equal(ui.completions, 2); assert.deepEqual(ui.positions.at(-1), from);
});

test('callback failure cancels playback instead of leaving an active movement without a frame', () => {
    const ui = harness({ position: () => { throw new Error('paint failed'); } });
    assert.throws(() => ui.runner.play(from, target, 1000), /paint failed/);
    assert.equal(ui.frames.size, 0); assert.equal(ui.runner.playing, false);
    assert.equal(ui.completions, 0);
});

test('invalid callback or clock interfaces fail at construction', () => {
    assert.throws(() => createTutorialAnimation({ onPosition() {} }), TypeError);
    const ui = harness();
    assert.throws(() => createTutorialAnimation({ clock: ui.clock, onPosition: null }), TypeError);
    assert.throws(() => createTutorialAnimation({ clock: ui.clock, onPosition() {}, onComplete: 1 }), TypeError);
});
