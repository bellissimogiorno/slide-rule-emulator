import test from 'node:test';
import assert from 'node:assert/strict';
import { createTutorialWorkspace } from '#tutorial/workspace.js';
import { createTutorialProgramme, TUTORIAL_LAYOUTS } from '#tutorial/programme.js';

test('tutorial programmes are temporary and the exact original reference is restored', () => {
    const original = { cursor: .725, sides: { front: { name: 'Custom' } } };
    let state = original, prepared = 0;
    const workspace = createTutorialWorkspace({ getState: () => state,
        setState: value => { state = value; }, beforeEnter: () => prepared++ });
    const training = { cursor: .1, sides: { front: { name: 'Lesson' } } };
    assert.equal(workspace.getPersistentState(), original);
    assert.equal(workspace.active, false);
    workspace.enter(training);
    assert.equal(prepared, 1);
    assert.equal(state, training);
    assert.equal(workspace.active, true);
    assert.equal(workspace.getPersistentState(), original);
    training.cursor = .9;
    assert.equal(original.cursor, .725);
    assert.equal(workspace.leave(), original);
    assert.equal(state, original);
    assert.equal(workspace.getPersistentState(), original);
    assert.equal(workspace.active, false);
    assert.equal(workspace.leave(), null);
});

test('preparation finishes pending original changes before the snapshot is captured', () => {
    const initial = { cursor: .2 }, prepared = { cursor: .6 };
    let state = initial;
    const workspace = createTutorialWorkspace({ getState: () => state,
        setState: value => { state = value; }, beforeEnter: () => { state = prepared; } });
    workspace.enter({ cursor: .1 });
    assert.equal(workspace.getPersistentState(), prepared);
    workspace.leave(); assert.equal(state, prepared);
});

test('switching lessons retains the first original without repeating preparation', () => {
    const original = { cursor: .7 };
    let state = original, count = 0;
    const history = [{ description: 'Remove A' }];
    const workspace = createTutorialWorkspace({ getState: () => state,
        setState: value => { state = value; }, beforeEnter: () => count++ });
    workspace.enter({ cursor: .1 }); workspace.enter({ cursor: .3 });
    workspace.enter({ cursor: .9 });
    assert.equal(count, 1);
    assert.equal(workspace.getPersistentState(), original);
    assert.deepEqual(history, [{ description: 'Remove A' }]);
    workspace.leave(); assert.equal(state, original);
    workspace.enter({ cursor: .5 }); assert.equal(count, 2);
    workspace.leave(); assert.equal(state, original);
});

test('switching real scale profiles retains original work and prepares session locks only once', () => {
    const original = { cursor: .713, slideOffset: -.12,
        sides: { custom: { topStator: ['A'], slide: ['CI'], bottomStator: ['D'] } } };
    const saved = JSON.stringify(original), history = [{ description: 'Remove K' }];
    let state = original, preparations = 0;
    const workspace = createTutorialWorkspace({ getState: () => state,
        setState: value => { state = value; }, beforeEnter: () => preparations++ });
    for (const layout of [...Object.keys(TUTORIAL_LAYOUTS), 'cd', 'sine']) {
        const training = createTutorialProgramme({ slideOffset: .17, cursor: .63 }, layout);
        workspace.enter(training);
        assert.strictEqual(state, training);
        assert.deepEqual(state.sides.front.topStator, TUTORIAL_LAYOUTS[layout].topStator);
        assert.deepEqual(state.sides.front.slide, TUTORIAL_LAYOUTS[layout].slide);
        state.cursor = .2;
        assert.strictEqual(workspace.getPersistentState(), original);
        assert.equal(JSON.stringify(workspace.getPersistentState()), saved);
    }
    assert.equal(preparations, 1);
    assert.deepEqual(history, [{ description: 'Remove K' }]);
    workspace.leave();
    assert.strictEqual(state, original);
    assert.equal(JSON.stringify(state), saved);
});

test('persistent access during entry, training and restoration always returns the original', () => {
    const original = { cursor: .5 }, training = { cursor: .1 };
    let state = original, workspace;
    const writes = [];
    workspace = createTutorialWorkspace({ getState: () => state, setState: value => {
        writes.push(workspace.getPersistentState()); state = value;
    } });
    workspace.enter(training);
    const autosave = JSON.stringify(workspace.getPersistentState());
    const exported = JSON.stringify(workspace.getPersistentState());
    assert.equal(autosave, JSON.stringify(original));
    assert.equal(exported, JSON.stringify(original));
    workspace.leave();
    assert.deepEqual(writes, [original, original]);
});

test('preparation failure does not activate or replace the workspace', () => {
    const original = {};
    let state = original, writes = 0;
    const workspace = createTutorialWorkspace({ getState: () => state,
        setState: value => { writes++; state = value; },
        beforeEnter: () => { throw new Error('Could not prepare'); } });
    assert.throws(() => workspace.enter({}), /Could not prepare/);
    assert.equal(workspace.active, false); assert.equal(state, original);
    assert.equal(writes, 0); assert.equal(workspace.getPersistentState(), original);
});

test('a failed entry write retains the original so restoration can be retried', () => {
    const original = { name: 'Original' };
    let state = original, fail = true;
    const workspace = createTutorialWorkspace({ getState: () => state, setState: value => {
        state = value;
        if (fail) throw new Error('Render failed');
    } });
    assert.throws(() => workspace.enter({ name: 'Lesson' }), /Render failed/);
    assert.equal(workspace.active, true);
    assert.equal(workspace.getPersistentState(), original);
    fail = false; workspace.leave();
    assert.equal(state, original); assert.equal(workspace.active, false);
});

test('a failed restoration write does not drop ownership of the original', () => {
    const original = { name: 'Original' };
    let state = original, fail = false;
    const workspace = createTutorialWorkspace({ getState: () => state, setState: value => {
        if (fail) throw new Error('Write failed'); state = value;
    } });
    workspace.enter({ name: 'Lesson' }); fail = true;
    assert.throws(() => workspace.leave(), /Write failed/);
    assert.equal(workspace.active, true); assert.equal(workspace.getPersistentState(), original);
    fail = false; assert.equal(workspace.leave(), original);
    assert.equal(state, original); assert.equal(workspace.active, false);
});

test('invalid arguments cannot replace or deactivate a current training programme', () => {
    let state = {}, count = 0;
    const workspace = createTutorialWorkspace({ getState: () => state,
        setState: value => { state = value; }, beforeEnter: () => count++ });
    for (const invalid of [null, undefined, [], 'lesson', 1, () => {}])
        assert.throws(() => workspace.enter(invalid), TypeError);
    assert.equal(count, 0);
    const training = {}; workspace.enter(training);
    assert.throws(() => workspace.enter(null), TypeError);
    assert.equal(state, training); assert.equal(workspace.active, true);
    assert.throws(() => createTutorialWorkspace({ getState: null, setState() {} }), TypeError);
    assert.throws(() => createTutorialWorkspace({ getState() {}, setState: null }), TypeError);
    assert.throws(() => createTutorialWorkspace({ getState() {}, setState() {}, beforeEnter: 1 }), TypeError);
});

test('reentrant transitions fail before corrupting the original reference', () => {
    const original = {};
    let state = original, workspace;
    workspace = createTutorialWorkspace({ getState: () => state, setState: value => { state = value; },
        beforeEnter: () => assert.throws(() => workspace.enter({}), /already changing/) });
    workspace.enter({}); workspace.leave(); assert.equal(state, original);
});
