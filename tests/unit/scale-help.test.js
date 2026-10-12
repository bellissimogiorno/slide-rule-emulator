/** Scale help belongs to end panels; calculation surfaces must stay quiet. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BUILTIN_SCALES as library } from '#catalog/scales.js';
import { renderScaleRow } from '#ui/scale-markup.js';
import { escapeHtml } from '#ui/html.js';

const context = { library, width: 1000, minGap: 1.65 };
const openingTags = html => html.match(/<(?:div|span)\b[^>]*>/g) || [];
const hasClass = (tag, name) => (tag.match(/\bclass="([^"]*)"/)?.[1] || '').split(' ').includes(name);
const render = (id, overrides = {}) => renderScaleRow(id, false, 'topStator', 0, 1, { ...context, ...overrides });

test('all scale types have explanation titles on both end panels, never on the row or pane', () => {
    for (const def of Object.values(library)) {
        const tags = openingTags(render(def.id));
        const help = escapeHtml(def.description || def.formula || def.label || def.id);
        for (const name of ['scale-name', 'scale-legend']) {
            const tag = tags.find(t => hasClass(t, name));
            assert.ok(tag?.includes(`title="${help}"`), `${def.id}: ${name}`);
        }
        for (const tag of tags.filter(t => /\btitle=/.test(t))) {
            assert.ok(['scale-name', 'scale-legend', 'root-gutter-label'].some(name => hasClass(tag, name))
                || /\bdata-mark-tip=/.test(tag), `${def.id}: misplaced title: ${tag}`);
        }
        const row = tags.find(t => hasClass(t, 'scale-row'));
        assert.doesNotMatch(row, /\btitle=/, def.id);
    }
});

test('stator and slide placement have the same end-only explanation policy', () => {
    for (const rail of ['topStator', 'slide', 'bottomStator']) {
        const tags = openingTags(renderScaleRow('C', rail === 'slide', rail, 0, 1, context));
        assert.doesNotMatch(tags[0], /\btitle=/);
        assert.match(tags.find(t => hasClass(t, 'scale-name')), /Sliding fundamental/);
        assert.match(tags.find(t => hasClass(t, 'scale-legend')), /Sliding fundamental/);
    }
});

test('custom scale help escapes descriptions and falls back to formula, label, then ID', () => {
    const base = { id: 'custom', type: 'log', min: 1, max: 10 };
    const hostile = '" onmouseover="alert(1)"><img src=x> & text';
    for (const [fields, expected] of [
        [{ description: hostile, formula: 'x', label: 'X' }, hostile],
        [{ formula: 'x^2', label: 'X' }, 'x^2'],
        [{ label: 'X' }, 'X'], [{}, 'custom']
    ]) {
        const html = render('custom', { library: { custom: { ...base, ...fields } } });
        assert.ok(!html.includes('<img') && !html.includes(' onmouseover="'));
        const tags = openingTags(html);
        for (const name of ['scale-name', 'scale-legend'])
            assert.ok(tags.find(t => hasClass(t, name)).includes(`title="${escapeHtml(expected)}"`));
    }
});

test('segmented numeric graduations have no invented hover annotations', () => {
    for (const def of Object.values(library).filter(def => def.type === 'segmented')) {
        // These built-in segmented rows have no explicitly annotated child marks.
        assert.doesNotMatch(render(def.id), /data-mark-tip=/, def.id);
    }
    const custom = {
        id: 'piece', type: 'log', min: 1, max: 10,
        ticks: [{ value: 2, label: '2' }, { value: 3, label: 'ref', title: 'An intentional reference' }]
    };
    const group = { id: 'group', type: 'segmented', layers: ['piece'], label: 'Group' };
    const html = render('group', { library: { piece: custom, group } });
    assert.match(html, /data-mark-tip="An intentional reference"/);
    assert.doesNotMatch(html, /data-mark-tip="(?:piece|Group|undefined):/);
});

test('constant, element and root-branch explanations remain available at their intended targets', () => {
    assert.match(render('D'), /data-mark-tip="[^"]*Circle-diameter/);
    assert.match(render('D'), /data-mark-tip="[^"]*Euler/);
    assert.match(render('CHEM_CH_AM'), /data-mark-tip="C: 12\.011/);
    const roots = render('PICKETT_SQRT');
    assert.match(roots, /class="root-gutter-label[^>]*title="For positive integers/);
});

test('rail and cursor wrappers do not reintroduce inherited native drag tooltips', async () => {
    const source = await readFile(new URL('../../src/ui/application.js', import.meta.url), 'utf8');
    assert.doesNotMatch(source, /<div[^\n>]*class="(?:rail slide-rail|cursor)"[^\n>]*title=/);
});
