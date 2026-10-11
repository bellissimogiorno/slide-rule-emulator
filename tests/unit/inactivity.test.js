import test from 'node:test';
import assert from 'node:assert/strict';
import { createInactivityTimer } from '#ui/inactivity.js';
function setup() {
    let now = 0, id = 0;
    const tasks = new Map(), events = [];
    const clock = { setTimeout(fn, delay) { const key = ++id; tasks.set(key, { fn, at: now + delay }); return key; },
        clearTimeout(key) { tasks.delete(key); } };
    const timer = createInactivityTimer({ clock, onChange: idle => events.push([now, idle]) });
    function advance(delta) {
        const end = now + delta;
        while (true) {
            const due = [...tasks].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
            if (!due) break;
            now = due[1].at; tasks.delete(due[0]); due[1].fn();
        }
        now = end;
    }
    return { timer, events, tasks, advance };
}
test('loupe inactivity begins at exactly four seconds, not before', () => {
    const { timer, events, advance } = setup();
    timer.setActive(true); advance(3999); assert.equal(timer.idle, false);
    advance(1); assert.deepEqual(events, [[4000, true]]);
});
test('pointer or key activity resets the deadline and wakes synchronously', () => {
    const { timer, events, advance, tasks } = setup();
    timer.setActive(true); advance(3000); timer.activity();
    advance(3999); assert.equal(timer.idle, false); advance(1); assert.equal(timer.idle, true);
    timer.activity(); assert.equal(timer.idle, false);
    assert.deepEqual(events, [[7000, true], [7000, false]]); assert.equal(tasks.size, 1);
    advance(4000); assert.equal(timer.idle, true);
});
test('holding a key suspends the idle clock until release', () => {
    const { timer, advance, tasks } = setup();
    timer.setActive(true); advance(2000); timer.setHeld(true); advance(10000);
    assert.equal(timer.idle, false); assert.equal(tasks.size, 0);
    timer.setHeld(false); advance(3999); assert.equal(timer.idle, false);
    advance(1); assert.equal(timer.idle, true);
});
test('a key held before activation also prevents fading', () => {
    const { timer, advance } = setup(); timer.setHeld(true); timer.setActive(true);
    advance(6000); assert.equal(timer.idle, false);
    timer.setHeld(false); advance(4000); assert.equal(timer.idle, true);
});
test('switching off cancels the timer and switching back on resets idle state', () => {
    const { timer, advance, tasks } = setup();
    timer.setActive(true); advance(4000); timer.setActive(false);
    assert.equal(timer.idle, false); timer.activity(); assert.equal(tasks.size, 0);
    timer.setActive(true); advance(3999); assert.equal(timer.idle, false);
    advance(1); assert.equal(timer.idle, true);
});
test('destroy removes pending callbacks and makes later calls inert', () => {
    const { timer, advance, tasks, events } = setup();
    timer.setActive(true); timer.destroy(); timer.setActive(true); timer.setHeld(false); timer.activity();
    advance(8000); assert.equal(tasks.size, 0); assert.deepEqual(events, []);
});
