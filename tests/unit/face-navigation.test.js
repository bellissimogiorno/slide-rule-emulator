/** Real navigation policy and event listeners with explicit DOM event inputs.
 * Native focus, button activation, pointer geometry and paint are separate.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { bindFaceNavigation, faceFlipShortcut, nextFace } from '#ui/face-navigation.js';

function target(...selectors) {
    return { closest: selector => selector.split(',').some(item => selectors.includes(item.trim())) ? {} : null };
}
class Button extends EventTarget {
    disabled = false;
    title = '';
    click() { if (!this.disabled) this.dispatchEvent(new Event('click')); }
}
function harness() {
    let state = { activeSide: 'front', viewMode: 'single', cursor: .825, slideOffset: -.175,
        sides: { front: {}, back: {} } };
    let locked = false, flips = 0;
    const button = new Button(), left = new Button(), right = new Button(), root = new EventTarget();
    const lifetime = new AbortController();
    const document = { querySelectorAll: selector => {
        assert.equal(selector, '[data-rule-flip]'); return [left, right];
    } };
    const navigation = bindFaceNavigation({ document, root, button, signal: lifetime.signal,
        getState: () => state, isLocked: () => locked,
        onFlip: side => { state.activeSide = side; flips++; navigation.refresh(); }
    });
    navigation.refresh();
    return { button, left, right, root, navigation, lifetime,
        get state() { return state; }, get flips() { return flips; },
        replace: value => { state = value; navigation.refresh(); },
        lock: value => { locked = value; navigation.refresh(); },
        key(target, properties = {}) {
            const event = new Event('keydown', { cancelable: true });
            Object.defineProperty(event, 'target', { value: target });
            Object.assign(event, { key: 'f', ...properties });
            root.dispatchEvent(event);
            return event;
        }
    };
}

test('next face cycles custom side keys without mutating programme data or positions', () => {
    const state = { activeSide: 'obverse', viewMode: 'single', cursor: .825, slideOffset: -.175,
        sides: { obverse: {}, reverse: {}, reference: {} } };
    const before = structuredClone(state);
    assert.equal(nextFace(state), 'reverse');
    assert.deepEqual(state, before);
    assert.equal(nextFace({ ...state, activeSide: 'reference' }), 'obverse');
    assert.equal(nextFace({ ...state, activeSide: 'unknown' }), 'reverse');
});

test('one-face, empty, linked-view and locked programmes have no flip action', () => {
    for (const sides of [{}, { front: {} }])
        assert.equal(nextFace({ activeSide: 'front', viewMode: 'single', sides }), null);
    const duplex = { activeSide: 'front', viewMode: 'single', sides: { front: {}, back: {} } };
    assert.equal(nextFace({ ...duplex, viewMode: 'both' }), null);
    assert.equal(nextFace(duplex, true), null);
});

test('F is local to the instrument and position controls, including native range grips', () => {
    for (const element of [target('#ruleViewport'), target('.position-control'),
        target('#ruleViewport', '[data-rule-flip]')]) {
        assert.equal(faceFlipShortcut({ key: 'f', target: element }), true);
        assert.equal(faceFlipShortcut({ key: 'F', target: element }), true, 'Caps Lock is still unmodified F');
    }
    for (const element of [target(), target('textarea'), target('select'), target('[contenteditable]'),
        target('input:not([type="range"])'), null])
        assert.equal(faceFlipShortcut({ key: 'f', target: element }), false);
});

test('composition, repeats, modified keys and prevented events retain their own behaviour', () => {
    const event = { key: 'f', target: target('#ruleViewport') };
    for (const field of ['defaultPrevented', 'isComposing', 'repeat', 'ctrlKey', 'metaKey', 'altKey', 'shiftKey'])
        assert.equal(faceFlipShortcut({ ...event, [field]: true }), false, field);
    for (const key of ['s', 'c', 'm', 'ArrowLeft', 'F1', 'Enter', ' ', 'Escape', undefined])
        assert.equal(faceFlipShortcut({ ...event, key }), false, String(key));
});

test('text fields and popup triggers inside the motion cards do not acquire the shortcut', () => {
    for (const excluded of ['textarea', 'select', '[contenteditable]', 'input:not([type="range"])',
        '[data-cursor-appearance-trigger]', '[data-slide-preset-trigger]']) {
        assert.equal(faceFlipShortcut({ key: 'f', target: target('.position-control', excluded) }), false, excluded);
    }
});

test('toolbar and both static rule ends share one action while preserving exact positions', t => {
    const ui = harness(); t.after(() => ui.lifetime.abort());
    const original = structuredClone(ui.state);
    for (const control of [ui.button, ui.left, ui.right]) {
        control.click();
        assert.equal(ui.state.activeSide, ui.flips % 2 ? 'back' : 'front');
        assert.deepEqual(ui.state, { ...original, activeSide: ui.state.activeSide });
        assert.equal(control.disabled, false);
        assert.match(control.title, /\bF\b/);
    }
    assert.equal(ui.flips, 3, 'One user activation performs exactly one flip');
});

test('a handled F flips once and prevents default, while a held key cannot cycle faces', t => {
    const ui = harness(); t.after(() => ui.lifetime.abort());
    const rule = target('#ruleViewport');
    assert.equal(ui.key(rule).defaultPrevented, true);
    assert.equal(ui.flips, 1);
    for (let index = 0; index < 5; index++) assert.equal(ui.key(rule, { repeat: true }).defaultPrevented, false);
    assert.equal(ui.flips, 1);
    for (const context of [target(), target('.position-control', 'select'), target('.position-control', '[contenteditable]')])
        assert.equal(ui.key(context).defaultPrevented, false);
    assert.equal(ui.flips, 1);
});

test('disabled controls and synthetic activation cannot bypass one-face, both-view or lesson locks', t => {
    const ui = harness(); t.after(() => ui.lifetime.abort());
    const original = structuredClone(ui.state);
    for (const state of [{ ...original, viewMode: 'both' }, { ...original, sides: { front: {} } }]) {
        ui.replace(state);
        for (const control of [ui.button, ui.left, ui.right]) {
            assert.equal(control.disabled, true);
            control.click();
            control.dispatchEvent(new Event('click'));
        }
        assert.equal(ui.key(target('#ruleViewport')).defaultPrevented, false);
        assert.equal(ui.flips, 0);
    }
    ui.replace(original); ui.lock(true);
    for (const control of [ui.button, ui.left, ui.right]) {
        assert.equal(control.disabled, true);
        control.dispatchEvent(new Event('click'));
    }
    ui.key(target('#ruleViewport'));
    assert.equal(ui.flips, 0);
    assert.deepEqual(ui.state, original);
    ui.lock(false); ui.right.click();
    assert.equal(ui.flips, 1);
});

test('navigation uses the current replacement programme and releases every listener on abort', () => {
    const ui = harness();
    ui.replace({ ...ui.state, activeSide: 'first', sides: { first: {}, second: {}, third: {} } });
    ui.left.click(); assert.equal(ui.state.activeSide, 'second');
    ui.lifetime.abort();
    ui.button.click(); ui.left.click(); ui.right.click(); ui.key(target('#ruleViewport'));
    assert.equal(ui.flips, 1);
    assert.equal(ui.state.activeSide, 'second');
});
