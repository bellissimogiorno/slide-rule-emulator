/** Controller behaviour with explicit events, clocks and animation frames.
 * The drawing double records DOM work rather than pretending to render fonts.
 * These tests establish scheduling and geometry contracts, not browser latency.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createLoupe } from '#ui/loupe.js';

function loupeHarness() {
    let now = 0, nextId = 0, lens;
    const frames = new Map(), timers = new Map(), operations = [], drawings = [];
    const event = (target, type, properties = {}) => {
        const value = Object.assign(new Event(type, { cancelable: true }), properties);
        target.dispatchEvent(value);
        return value;
    };
    function node(name) {
        const attrs = new Map(), classes = new Set();
        const result = Object.assign(new EventTarget(), {
            name, dataset: {}, children: [], isConnected: false, parentElement: null,
            setAttribute(key, value) { attrs.set(key, String(value)); },
            getAttribute(key) { return attrs.get(key) ?? null; },
            removeAttribute(key) { attrs.delete(key); },
            classList: {
                toggle(key, force) {
                    if (force ?? !classes.has(key)) classes.add(key);
                    else classes.delete(key);
                    return classes.has(key);
                },
                contains: key => classes.has(key)
            },
            replaceChildren(...children) {
                if (this.isConnected) operations.push({ kind: 'write', name, property: 'children' });
                for (const child of this.children) { child.isConnected = false; child.parentElement = null; }
                this.children = children;
                for (const child of children) { child.isConnected = this.isConnected; child.parentElement = this; }
            },
            remove() { this.isConnected = false; this.parentElement = null; },
            focus(options) { document.activeElement = this; this.focusOptions = options; }
        });
        Object.defineProperty(result, 'firstElementChild', { get: () => result.children[0] ?? null });
        const values = {};
        result.style = new Proxy(values, {
            set(target, property, value) {
                if (result.isConnected) operations.push({ kind: 'write', name, property, value });
                target[property] = value;
                return true;
            },
            get(target, property) {
                if (property === 'setProperty') return (key, value) => { result.style[key] = value; };
                return target[property];
            }
        });
        return result;
    }
    const media = new EventTarget(), fonts = new EventTarget(), visual = new EventTarget();
    Object.assign(visual, { offsetLeft: 0, offsetTop: 0, width: 1600, height: 1200 });
    const window = Object.assign(new EventTarget(), {
        AbortController, innerWidth: 1600, innerHeight: 1200, visualViewport: visual,
        matchMedia: () => media,
        getComputedStyle(face) {
            operations.push({ kind: 'read', name: face.name, property: 'computed-style' });
            return { width: '1000px', height: '300px' };
        },
        requestAnimationFrame(fn) { const id = ++nextId; frames.set(id, fn); return id; },
        cancelAnimationFrame(id) { frames.delete(id); },
        setTimeout(fn, delay) { const id = ++nextId; timers.set(id, { fn, at: now + delay }); return id; },
        clearTimeout(id) { timers.delete(id); }
    });
    const document = Object.assign(new EventTarget(), {
        defaultView: window, fonts, hidden: false,
        createElement() { lens = node('lens'); return lens; },
        body: {
            appendChild(element) { element.isConnected = true; },
            append(element) { element.isConnected = true; }
        },
        elementFromPoint(x, y) {
            operations.push({ kind: 'read', name: 'document', property: 'hit-test', x, y });
            return faces.find(face => x >= face.rect.left && x <= face.rect.right &&
                y >= face.rect.top && y <= face.rect.bottom) ?? null;
        }
    });
    const faces = [100, 600].map((top, index) => {
        const face = node(index ? 'back' : 'front');
        face.rect = { left: 0, top, width: 1000, height: 300, right: 1000, bottom: top + 300 };
        face.motion = 0;
        face.closest = selector => selector === '.rule-face-body' ? face : null;
        face.getBoundingClientRect = () => {
            operations.push({ kind: 'read', name: face.name, property: 'bounds' });
            return { ...face.rect };
        };
        return face;
    });
    const canvas = { contains: face => faces.includes(face) };
    const button = node('button'), focusTarget = node('motion');
    document.activeElement = focusTarget;
    const lifetime = new AbortController();
    const createDrawing = face => {
        operations.push({ kind: 'read', name: face.name, property: 'snapshot' });
        const element = node(`${face.name}-drawing`);
        const drawing = {
            element, face, size: { width: 1000, height: 300 }, measurements: 0, placements: [],
            measureMotion() {
                operations.push({ kind: 'read', name: face.name, property: 'motion' });
                drawing.measurements++;
                return [{ motion: face.motion }];
            },
            place(x, y, positions = []) {
                operations.push({ kind: 'write', name: element.name, property: 'placement' });
                drawing.placements.push({ x, y, positions });
                if (positions.length) drawing.paintedMotion = positions[0].motion;
            }
        };
        drawings.push(drawing);
        return drawing;
    };
    const controller = createLoupe({ document, canvas, button, signal: lifetime.signal,
        returnTarget: () => focusTarget, createDrawing });
    function flush() {
        const queued = [...frames]; frames.clear();
        for (const [, fn] of queued) fn(now);
    }
    function advance(ms) {
        const end = now + ms;
        while (true) {
            const due = [...timers].filter(([, task]) => task.at <= end)
                .sort((a, b) => a[1].at - b[1].at)[0];
            if (!due) break;
            now = due[1].at; timers.delete(due[0]); due[1].fn();
        }
        now = end;
    }
    const pointer = (x = 350, y = 220, properties = {}) => event(window, 'pointermove',
        { clientX: x, clientY: y, pointerType: 'mouse', isPrimary: true, ...properties });
    const start = () => { controller.setEnabled(true); pointer(); flush(); operations.length = 0; };
    return { controller, window, document, button, lens, faces, drawings, operations,
        frames, timers, media, fonts, visual, focusTarget, event, pointer, flush, advance, start,
        destroy: () => lifetime.abort() };
}

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8,
    `${actual} differs from ${expected}`);
function lensPosition(lens) {
    const translated = String(lens.style.transform).match(/translate(?:3d)?\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px/);
    return translated ? { x: Number(translated[1]), y: Number(translated[2]) }
        : { x: parseFloat(lens.style.left) || 0, y: parseFloat(lens.style.top) || 0 };
}

test('pointer bursts paint one frame at the latest point and keep the source point fixed', t => {
    const ui = loupeHarness(); t.after(ui.destroy);
    ui.controller.setEnabled(true);
    for (let x = 200; x < 300; x++) ui.pointer(x, 220);
    assert.equal(ui.frames.size, 1);
    ui.flush();
    assert.equal(ui.drawings.length, 1);
    assert.equal(ui.drawings[0].placements.length, 1);
    const place = ui.drawings[0].placements[0], lens = lensPosition(ui.lens);
    close(lens.x + place.x + 299 * 2.5, 299);
    close(lens.y + place.y + (220 - 100) * 2.5, 220);
    assert.equal(ui.lens.hidden, false);
});

test('warm pointer frames reuse the drawing without measuring moving parts', t => {
    const ui = loupeHarness(); t.after(ui.destroy); ui.start();
    const drawing = ui.drawings[0], before = drawing.measurements;
    for (const x of [360, 370, 380]) { ui.pointer(x); ui.flush(); }
    assert.equal(ui.drawings.length, 1);
    assert.equal(drawing.measurements, before);
    assert.equal(ui.operations.some(op => op.property === 'computed-style'), false);
    assert.equal(ui.operations.some(op => op.name === 'lens' && ['width', 'height'].includes(op.property)), false);
    assert.equal(ui.operations.some(op => op.property === 'children'), false);
});

test('both face drawings are reused when crossing between visible faces', t => {
    const ui = loupeHarness(); t.after(ui.destroy); ui.start();
    const front = ui.drawings[0];
    ui.pointer(350, 720); ui.flush();
    assert.equal(ui.drawings.length, 2);
    const back = ui.drawings[1];
    ui.pointer(350, 220); ui.flush();
    assert.equal(ui.drawings.length, 2);
    assert.equal(ui.lens.children[0], front.element);
    ui.pointer(350, 720); ui.flush();
    assert.equal(ui.lens.children[0], back.element);
});

test('motion refresh updates the active drawing and a cached inactive face catches up', t => {
    const ui = loupeHarness(); t.after(ui.destroy); ui.start();
    ui.pointer(350, 720); ui.flush();
    ui.pointer(350, 220); ui.flush();
    const [front, back] = ui.drawings;
    const measurements = [front.measurements, back.measurements];
    ui.faces[0].motion = .075; ui.faces[1].motion = -.125;
    ui.controller.refresh(); ui.flush();
    assert.equal(front.paintedMotion, .075);
    assert.equal(front.measurements, measurements[0] + 1);
    assert.equal(back.measurements, measurements[1]);
    ui.pointer(350, 720); ui.flush();
    assert.equal(back.paintedMotion, -.125);
    assert.equal(back.measurements, measurements[1] + 1);
    assert.equal(ui.drawings.length, 2);
});

test('warm motion frames finish source reads before writing attached loupe DOM', t => {
    const ui = loupeHarness(); t.after(ui.destroy); ui.start();
    ui.faces[0].motion = .15;
    ui.controller.refresh(); ui.flush();
    const firstWrite = ui.operations.findIndex(op => op.kind === 'write');
    assert.ok(firstWrite >= 0);
    assert.ok(ui.operations.slice(0, firstWrite).some(op => op.property === 'motion'));
    assert.equal(ui.operations.slice(firstWrite).some(op => op.kind === 'read'), false,
        JSON.stringify(ui.operations));
});

for (const [name, invalidate] of [
    ['structure refresh', ui => ui.controller.refresh({ structure: true })],
    ['font loading', ui => ui.event(ui.fonts, 'loadingdone')],
    ['forced colours', ui => ui.event(ui.media, 'change')],
    ['window resize', ui => ui.event(ui.window, 'resize')],
    ['visual viewport resize', ui => ui.event(ui.visual, 'resize')]
]) test(`${name} invalidates both cached faces and coalesces a rebuild`, t => {
    const ui = loupeHarness(); t.after(ui.destroy); ui.start();
    ui.pointer(350, 720); ui.flush();
    ui.pointer(350, 220); ui.flush();
    invalidate(ui); invalidate(ui);
    assert.equal(ui.frames.size, 1);
    ui.flush();
    assert.equal(ui.drawings.length, 3);
    ui.pointer(350, 720); ui.flush();
    assert.equal(ui.drawings.length, 4);
});

test('scrolling repositions the cached drawing without rebuilding or measuring motion', t => {
    const ui = loupeHarness(); t.after(ui.destroy); ui.start();
    const drawing = ui.drawings[0], before = drawing.measurements;
    ui.faces[0].rect.left = -100; ui.faces[0].rect.right = 900;
    ui.event(ui.window, 'scroll'); ui.flush();
    assert.equal(ui.drawings.length, 1);
    assert.equal(drawing.measurements, before);
    const place = drawing.placements.at(-1), lens = lensPosition(ui.lens);
    close(lens.x + place.x + (350 + 100) * 2.5, 350);
});

test('four-second idle suppresses painting and pointer activity wakes the retained drawing', t => {
    const ui = loupeHarness(); t.after(ui.destroy); ui.start();
    const drawing = ui.drawings[0], before = drawing.placements.length;
    ui.advance(3999); assert.equal(ui.lens.classList.contains('is-idle'), false);
    ui.advance(1); assert.equal(ui.lens.classList.contains('is-idle'), true);
    ui.faces[0].motion = .2;
    ui.controller.refresh(); ui.event(ui.window, 'scroll'); ui.flush();
    assert.equal(drawing.placements.length, before);
    ui.pointer(351); ui.flush();
    assert.equal(ui.lens.classList.contains('is-idle'), false);
    assert.equal(drawing.paintedMotion, .2);
    assert.equal(ui.drawings.length, 1);
});

test('held keys prevent idle fading and release restarts the deadline', t => {
    const ui = loupeHarness(); t.after(ui.destroy); ui.start();
    ui.event(ui.window, 'keydown', { code: 'ArrowRight', key: 'ArrowRight' });
    ui.advance(10000); assert.equal(ui.lens.classList.contains('is-idle'), false);
    ui.event(ui.window, 'keyup', { code: 'ArrowRight', key: 'ArrowRight' });
    ui.advance(3999); assert.equal(ui.lens.classList.contains('is-idle'), false);
    ui.advance(1); assert.equal(ui.lens.classList.contains('is-idle'), true);
});

test('touch and off-instrument pointers hide the lens without painting stale content', t => {
    const ui = loupeHarness(); t.after(ui.destroy); ui.start();
    ui.pointer(10, 10); ui.flush(); assert.equal(ui.lens.hidden, true);
    ui.pointer(); ui.flush(); assert.equal(ui.lens.hidden, false);
    ui.event(ui.window, 'pointerdown', { pointerType: 'touch', isPrimary: true });
    assert.equal(ui.lens.hidden, true);
    const before = ui.drawings[0].placements.length;
    ui.controller.refresh(); ui.flush(); assert.equal(ui.drawings[0].placements.length, before);
    ui.pointer(); ui.flush(); assert.equal(ui.lens.hidden, false);
});

test('button activation preserves motion focus without scrolling the page', t => {
    const ui = loupeHarness(); t.after(ui.destroy);
    assert.equal(ui.event(ui.button, 'pointerdown', { isPrimary: true, button: 0 }).defaultPrevented, true);
    ui.event(ui.button, 'click');
    assert.equal(ui.controller.enabled, true);
    assert.equal(ui.document.activeElement, ui.focusTarget);
    ui.document.activeElement = ui.button;
    ui.event(ui.button, 'click');
    assert.equal(ui.controller.enabled, false);
    assert.equal(ui.document.activeElement, ui.focusTarget);
    assert.deepEqual(ui.focusTarget.focusOptions, { preventScroll: true });
});

test('disable cancels pending work and destroy removes listeners and the runtime lens', () => {
    const ui = loupeHarness(); ui.start();
    assert.equal(ui.lens.getAttribute('aria-hidden'), 'true');
    assert.equal(ui.lens.getAttribute('inert'), '');
    assert.ok(Object.hasOwn(ui.lens.dataset, 'runtimeOnly'));
    ui.pointer(360); assert.equal(ui.frames.size, 1);
    ui.controller.setEnabled(false);
    assert.equal(ui.frames.size, 0); assert.equal(ui.timers.size, 0);
    assert.equal(ui.lens.hidden, true); assert.equal(ui.lens.children.length, 0);
    ui.controller.setEnabled(true); ui.pointer();
    ui.destroy(); assert.equal(ui.frames.size, 0); assert.equal(ui.timers.size, 0);
    assert.equal(ui.lens.isConnected, false);
    const before = ui.drawings.length;
    ui.pointer(); ui.event(ui.button, 'click'); ui.event(ui.fonts, 'loadingdone'); ui.flush();
    assert.equal(ui.drawings.length, before); assert.equal(ui.controller.enabled, false);
});
