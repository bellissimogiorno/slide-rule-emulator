import test from 'node:test';
import assert from 'node:assert/strict';
import { standaloneHtml } from '#ui/files.js';
import { createTutorialWorkspace } from '#tutorial/workspace.js';

/** Minimal cloneable DOM with the file boundary's selector semantics. Native
 * serialisation/download/reload still belongs to the browser acceptance suite.
 */
function exportDocument({ readoutLive = 'polite' } = {}) {
    const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;')
        .replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    class Element {
        constructor(tag, attrs = {}, text = '') {
            this.tag = tag; this.attrs = new Map(Object.entries(attrs)); this.children = [];
            this.parentElement = null; this.text = text;
            this.classList = {
                remove: (...names) => this.setAttribute('class', (this.getAttribute('class') || '').split(/\s+/)
                    .filter(name => name && !names.includes(name)).join(' ')),
                contains: name => (this.getAttribute('class') || '').split(/\s+/).includes(name)
            };
        }
        append(child) { this.children.push(child); child.parentElement = this; return child; }
        remove() {
            if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this);
            this.parentElement = null;
        }
        setAttribute(name, value) { this.attrs.set(name, String(value)); }
        getAttribute(name) { return this.attrs.get(name) ?? null; }
        removeAttribute(name) { this.attrs.delete(name); }
        get textContent() { return this.text + this.children.map(child => child.textContent).join(''); }
        set textContent(value) { this.text = String(value); this.children = []; }
        matches(selector) {
            if (selector.startsWith('#')) return this.getAttribute('id') === selector.slice(1);
            if (selector.startsWith('[')) return this.attrs.has(selector.slice(1, -1));
            return this.tag === selector;
        }
        querySelectorAll(selector) {
            const options = selector.split(',').map(part => part.trim()), result = [];
            const visit = node => {
                for (const child of node.children) {
                    if (options.some(option => child.matches(option))) result.push(child);
                    visit(child);
                }
            };
            visit(this); return result;
        }
        querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
        cloneNode(deep) {
            const copy = new Element(this.tag, Object.fromEntries(this.attrs), this.text);
            if (deep) this.children.forEach(child => copy.append(child.cloneNode(true)));
            return copy;
        }
        get outerHTML() {
            const attrs = [...this.attrs].map(([name, value]) => ` ${name}="${escape(value)}"`).join('');
            const text = this.tag === 'script' ? this.text : escape(this.text);
            return `<${this.tag}${attrs}>${text}${this.children.map(child => child.outerHTML).join('')}</${this.tag}>`;
        }
    }
    const root = new Element('html', { 'data-app-ready': 'true' });
    const body = root.append(new Element('body', { class: 'focus-mode tutorial-active', 'data-tutorial-focus': 'slide' }));
    for (const id of ['ruleCanvas', 'readout', 'railEditors', 'libraryList', 'jsonEditor', 'appStatus', 'jsonStatus', 'reorderStatus'])
        body.append(new Element('div', { id,
            ...(id === 'railEditors' ? { class: 'is-reordering' } : {}),
            ...(id === 'readout' ? { 'aria-live': 'off', 'data-tutorial-live': readoutLive } : {})
        }, 'Temporary learning content'));
    body.append(new Element('script', { id: 'embedded-program' }, 'null'));
    body.append(new Element('button', { id: 'loupeButton', 'aria-pressed': 'true' }));
    body.append(new Element('button', { id: 'focusButton', 'aria-pressed': 'true' }, 'Show controls'));
    body.append(new Element('button', { id: 'tutorialButton', 'aria-expanded': 'true' }, 'Learn slide rule'));
    const tutorial = body.append(new Element('section', { id: 'tutorialPanel' }, 'Visible lesson'));
    for (const id of ['tutorialSectionSelect', 'tutorialLessonSelect']) {
        const select = tutorial.append(new Element('select', { id }));
        select.append(new Element('option', { value: 'previous-session' }, 'Previous lesson — practised'));
    }
    tutorial.append(new Element('p', { id: 'tutorialSectionSummary' }, 'Course section'));
    tutorial.append(new Element('span', { id: 'tutorialSessionProgress' }, 'Previous session progress'));
    tutorial.append(new Element('span', { id: 'tutorialProblemLabel' }, 'Problem'));
    tutorial.append(new Element('p', { id: 'tutorialProblem' }, 'Solve x = 2 × 3.'));
    body.append(new Element('div', { id: 'cursorAppearance' }));
    body.append(new Element('div', { id: 'slidePresetPanel' }));
    body.append(new Element('button', { 'data-cursor-appearance-trigger': '', 'aria-expanded': 'true' }));
    body.append(new Element('button', { 'data-slide-preset-trigger': '', 'aria-expanded': 'true' }));
    body.append(new Element('aside', { id: 'temporaryLock', inert: '', 'data-tutorial-lock': 'remove' }));
    body.append(new Element('aside', { id: 'previousInert', inert: 'previous', 'data-tutorial-lock': 'keep' }));
    body.append(new Element('aside', { id: 'unrelatedInert', inert: '' }));
    body.append(new Element('div', { 'data-runtime-only': '', class: 'rule-loupe' }, 'Live loupe'));
    body.append(new Element('div', { 'data-runtime-only': '' }, 'Live tooltip'));
    const document = { documentElement: root, clone: null };
    const clone = root.cloneNode.bind(root);
    root.cloneNode = deep => { document.clone = clone(deep); return document.clone; };
    return document;
}

test('configured exports remove tutorial locks and session presentation without mutating the live page', () => {
    const document = exportDocument(), before = document.documentElement.outerHTML;
    const programme = { cursor: .825, slideOffset: -.175, modelLabel: 'Original' };
    const original = structuredClone(programme);
    const html = standaloneHtml(document, programme), copy = document.clone;
    assert.equal(document.documentElement.outerHTML, before);
    assert.deepEqual(programme, original);
    assert.ok(html.startsWith('<!doctype html>\n'));
    assert.equal(copy.getAttribute('data-app-ready'), null);
    assert.equal(copy.querySelectorAll('[data-runtime-only]').length, 0);
    assert.equal(copy.querySelector('#tutorialPanel').getAttribute('hidden'), '');
    assert.equal(copy.querySelector('#tutorialButton').getAttribute('aria-expanded'), 'false');
    // The shell remains available for the controller, which rebuilds choices
    // and zeroes its session-only counts when the configured page starts.
    for (const id of ['tutorialSectionSelect', 'tutorialLessonSelect', 'tutorialSectionSummary', 'tutorialSessionProgress', 'tutorialProblemLabel', 'tutorialProblem'])
        assert.ok(copy.querySelector('#' + id), id);
    assert.equal(copy.querySelector('#temporaryLock').getAttribute('inert'), null);
    assert.equal(copy.querySelector('#previousInert').getAttribute('inert'), 'previous');
    assert.equal(copy.querySelector('#unrelatedInert').getAttribute('inert'), '');
    assert.equal(copy.querySelectorAll('[data-tutorial-lock]').length, 0);
    assert.equal(copy.querySelector('#readout').getAttribute('aria-live'), 'polite');
    assert.equal(copy.querySelectorAll('[data-tutorial-live]').length, 0);
    assert.equal(document.documentElement.querySelector('#readout').getAttribute('aria-live'), 'off');
    const body = copy.querySelector('body');
    assert.equal(body.classList.contains('tutorial-active'), false);
    assert.equal(body.classList.contains('focus-mode'), false);
    assert.equal(body.getAttribute('data-tutorial-focus'), null);
    assert.equal(copy.querySelector('#focusButton').textContent, 'Focus rule');
    assert.equal(copy.querySelector('#focusButton').getAttribute('aria-pressed'), 'false');
    for (const id of ['ruleCanvas', 'readout', 'railEditors', 'libraryList', 'jsonEditor', 'appStatus', 'jsonStatus', 'reorderStatus'])
        assert.equal(copy.querySelector('#' + id).textContent, '', id);
    assert.deepEqual(JSON.parse(copy.querySelector('#embedded-program').textContent), original);
});

test('exports during a lesson use the original programme and safely encode its text', () => {
    const original = { cursor: .825, slideOffset: -.175, showFormulas: false, modelLabel: '</script><p>Original & custom</p>' };
    let state = original;
    const workspace = createTutorialWorkspace({ getState: () => state, setState: value => { state = value; } });
    workspace.enter({ cursor: Math.log10(6), slideOffset: Math.log10(2), showFormulas: true, modelLabel: 'Tutorial' });
    const document = exportDocument();
    const html = standaloneHtml(document, workspace.getPersistentState());
    const saved = JSON.parse(document.clone.querySelector('#embedded-program').textContent);
    assert.deepEqual(saved, original);
    assert.notEqual(saved.cursor, state.cursor);
    assert.equal(saved.showFormulas, false);
    assert.equal(state.showFormulas, true);
    assert.equal(html.includes('</script><p>Original'), false);
    assert.equal(html.includes('\\u003c/script>'), true);
    assert.equal(workspace.active, true);
    workspace.leave(); assert.equal(state, original);
});

test('exports restore the original readout announcement policy, including an absent attribute', () => {
    for (const [readoutLive, expected] of [['none', null], ['assertive', 'assertive'], ['off', 'off']]) {
        const document = exportDocument({ readoutLive });
        standaloneHtml(document, { cursor: .5, slideOffset: 0 });
        const saved = document.clone.querySelector('#readout');
        assert.equal(saved.getAttribute('aria-live'), expected);
        assert.equal(saved.getAttribute('data-tutorial-live'), null);
        const live = document.documentElement.querySelector('#readout');
        assert.equal(live.getAttribute('aria-live'), 'off');
        assert.equal(live.getAttribute('data-tutorial-live'), readoutLive);
    }
});
