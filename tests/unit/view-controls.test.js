/** Structural accessibility and grouping contracts for the page template.
 * The small tag walker is limited to this authored template; native geometry,
 * keyboard activation and focus are exercised by browser/face_navigation.mjs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const template = await readFile(new URL('../../src/index.html', import.meta.url), 'utf8');
const all = [], root = { attrs: {}, children: [], parent: null }, stack = [root];
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
for (const match of template.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][^>]*>/g)) {
    const tag = match[0];
    if (tag.startsWith('<!')) continue;
    const name = tag.match(/^<\/?([\w-]+)/)[1].toLowerCase();
    if (tag.startsWith('</')) {
        assert.equal(stack.at(-1).tag, name, `Balanced template tag ${name}`);
        stack.pop(); continue;
    }
    const content = tag.slice(tag.indexOf(name) + name.length).replace(/\/?\s*>$/, '');
    const attrs = Object.fromEntries([...content.matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)]
        .map(([, key, double, single, bare]) => [key, double ?? single ?? bare ?? '']));
    const node = { tag: name, attrs, parent: stack.at(-1), children: [], index: all.length };
    node.parent.children.push(node); all.push(node);
    if (!voidTags.has(name) && !/\/\s*>$/.test(tag)) stack.push(node);
}
assert.equal(stack.length, 1, 'Template is balanced');
const one = id => {
    const nodes = all.filter(node => node.attrs.id === id);
    assert.equal(nodes.length, 1, `${id} remains unique`); return nodes[0];
};
const hasClass = (node, name) => (node.attrs.class || '').split(/\s+/).includes(name);
const closest = (node, predicate) => node && (predicate(node) ? node : closest(node.parent, predicate));
const inside = (node, ancestor) => !!closest(node, candidate => candidate === ancestor);

test('Side, Flip side and Both sides form one group before Magnification in DOM order', () => {
    const side = one('sideSelect'), flip = one('flipButton'), both = one('bothSidesButton');
    const magnification = one('magnificationSelect');
    const group = closest(side, node => hasClass(node, 'side-controls'));
    assert.ok(group, 'Side has its named control group');
    assert.ok(inside(flip, group) && inside(both, group));
    assert.ok(side.index < flip.index && flip.index < both.index && both.index < magnification.index);
    assert.equal(group.parent, closest(magnification, node => hasClass(node, 'view-controls')));
    for (const button of [flip, both]) {
        assert.equal(button.tag, 'button'); assert.equal(button.attrs.type, 'button');
        assert.equal(closest(button, node => node.tag === 'label'), null,
            'Action buttons must not be nested in the select label');
        assert.equal(closest(button, node => node.tag === 'header'), null);
    }
    assert.equal(both.attrs['aria-pressed'], 'false');
    assert.equal(both.attrs['aria-controls'], 'ruleCanvas');
    assert.equal(flip.attrs['aria-keyshortcuts'], 'F');
});

test('Reset follows Cursor appearance while remaining outside the tutorial-locked layout group', () => {
    const cursor = one('cursorAppearanceButton'), reset = one('resetButton');
    const actions = closest(cursor, node => hasClass(node, 'rule-actions'));
    assert.ok(actions && inside(reset, actions));
    const controls = all.filter(node => inside(node, actions) && ['button', 'a', 'select', 'input'].includes(node.tag));
    assert.equal(controls[controls.indexOf(cursor) + 1], reset, 'Reset is the next action after Cursor appearance');
    assert.equal(closest(reset, node => hasClass(node, 'layout-actions')), null,
        'Reset must remain available to interrupt/reset a lesson');
    assert.equal(closest(reset, node => node.tag === 'header'), null);
    assert.match(reset.attrs.title, /slide.*zero.*cursor.*centre/i);
    for (const id of ['tutorialButton', 'focusButton', 'saveHtmlButton', 'pageThemes'])
        assert.ok(closest(one(id), node => node.tag === 'header'), `${id} stays in the header`);
    assert.equal(one('tutorialButton').attrs['aria-controls'], 'tutorialPanel');
    assert.equal(one('tutorialButton').attrs['aria-expanded'], 'false');
});

test('two named native end buttons stay outside the canvas that face rendering replaces', () => {
    const buttons = all.filter(node => Object.hasOwn(node.attrs, 'data-rule-flip'));
    assert.deepEqual(buttons.map(node => node.attrs['data-rule-flip']).sort(), ['left', 'right']);
    const canvas = one('ruleCanvas');
    for (const button of buttons) {
        assert.equal(button.tag, 'button'); assert.equal(button.attrs.type, 'button');
        assert.equal(button.attrs['aria-label'], 'Flip side');
        assert.equal(button.attrs['aria-keyshortcuts'], 'F');
        assert.equal(button.parent, canvas.parent, 'Static sibling survives each face render');
        assert.ok(hasClass(button.parent, 'rule-shell'));
        assert.ok(hasClass(button, 'rule-flip'));
        assert.equal(inside(button, canvas), false);
    }
    const ids = all.filter(node => node.attrs.id).map(node => node.attrs.id);
    assert.equal(new Set(ids).size, ids.length, 'Moving controls introduces no duplicate IDs');
});
