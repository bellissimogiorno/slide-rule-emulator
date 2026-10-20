/** Small measured-DOM fixture for the loupe painter.
 *
 * Boxes and computed styles are explicit inputs, not a CSS/layout simulation.
 * This exercises the real painter and counts CSSOM calls; it cannot measure
 * native rendering, font rasterisation, frame rate or compositor performance.
 */
const kebab = name => name.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());

function declarations(css) {
    const parts = [];
    let start = 0, quote = '', depth = 0;
    for (let index = 0; index <= css.length; index++) {
        const char = css[index];
        if (quote) {
            if (char === '\\') index++;
            else if (char === quote) quote = '';
        } else if (char === '"' || char === "'") quote = char;
        else if (char === '(') depth++;
        else if (char === ')') depth--;
        else if ((char === ';' && depth === 0) || index === css.length) {
            const part = css.slice(start, index), colon = part.indexOf(':');
            if (colon >= 0) {
                const value = part.slice(colon + 1).trim();
                parts.push([part.slice(0, colon).trim(), value.replace(/\s*!important\s*$/, ''), /!important\s*$/.test(value) ? 'important' : '']);
            }
            start = index + 1;
        }
    }
    return parts;
}

class Style {
    constructor(environment, node, initial = {}) {
        this.environment = environment;
        this.node = node;
        this.values = new Map(Object.entries(initial).map(([name, value]) => [kebab(name), { value: String(value), priority: '' }]));
        return new Proxy(this, {
            get(target, name, receiver) {
                if (typeof name !== 'string' || name in target) return Reflect.get(target, name, receiver);
                return target.getPropertyValue(kebab(name));
            },
            set(target, name, value, receiver) {
                if (name in target) return Reflect.set(target, name, value, receiver);
                target.setProperty(kebab(name), value);
                return true;
            }
        });
    }
    getPropertyValue(name) { return this.values.get(name)?.value || ''; }
    getPropertyPriority(name) { return this.values.get(name)?.priority || ''; }
    setProperty(name, value, priority = '') {
        this.environment.record('styleSetProperty', this.node, name);
        this.values.set(name, { value: String(value), priority });
    }
    get cssText() {
        return [...this.values].map(([name, item]) => `${name}: ${item.value}${item.priority ? ' !' + item.priority : ''};`).join(' ');
    }
    set cssText(value) {
        this.environment.record('styleCssText', this.node);
        this.values = new Map(declarations(String(value)).map(([name, text, priority]) => [name, { value: text, priority }]));
    }
}

class TextNode {
    constructor(document, text, box) { this.nodeType = 3; this.ownerDocument = document; this.textContent = text; this.box = box; this.parentElement = null; }
    remove() { this.parentElement?.removeChild(this); }
    cloneNode() { return new TextNode(this.ownerDocument, this.textContent, this.box && { ...this.box }); }
}

class Element {
    constructor(document, tag = 'div', { classes = '', box = {}, computed = {}, pseudo = {}, attributes = {} } = {}) {
        this.nodeType = 1;
        this.ownerDocument = document;
        this.tagName = tag.toUpperCase();
        this.className = classes;
        this.box = { left: 0, top: 0, width: 0, height: 0, ...box };
        this.computed = computed;
        this.pseudo = pseudo;
        this.attributes = new Map(Object.entries(attributes));
        this.dataset = {};
        this.childNodes = [];
        this.parentElement = null;
        this.style = new Style(document.environment, this);
        this.classList = {
            add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
            contains: name => this.className.split(/\s+/).includes(name)
        };
    }
    get children() { return this.childNodes.filter(node => node.nodeType === 1); }
    get textContent() { return this.childNodes.map(node => node.textContent).join(''); }
    set textContent(value) { this.childNodes = []; this.appendChild(new TextNode(this.ownerDocument, value)); }
    getBoundingClientRect() { this.ownerDocument.environment.record('rectRead', this); return { ...this.box, x: this.box.left, y: this.box.top, right: this.box.left + this.box.width, bottom: this.box.top + this.box.height }; }
    appendChild(node) { node.remove?.(); node.parentElement = this; this.childNodes.push(node); return node; }
    removeChild(node) { this.childNodes.splice(this.childNodes.indexOf(node), 1); node.parentElement = null; return node; }
    remove() { this.parentElement?.removeChild(this); }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    removeAttribute(name) { this.attributes.delete(name); }
    matches(selectors) {
        return selectors.split(',').some(selector => {
            selector = selector.trim();
            if (selector === '*') return true;
            if (selector.startsWith('.')) return selector.slice(1).split('.').every(name => this.classList.contains(name));
            if (selector.startsWith('[')) return this.attributes.has(selector.slice(1, -1));
            return this.tagName.toLowerCase() === selector;
        });
    }
    querySelectorAll(selector) {
        const result = [];
        for (const child of this.children) {
            if (child.matches(selector)) result.push(child);
            result.push(...child.querySelectorAll(selector));
        }
        return result;
    }
    cloneNode(deep) {
        const clone = new Element(this.ownerDocument, this.tagName, { classes: this.className, box: { ...this.box }, computed: { ...this.computed }, pseudo: this.pseudo, attributes: Object.fromEntries(this.attributes) });
        clone.dataset = { ...this.dataset };
        clone.style.values = new Map([...this.style.values].map(([name, value]) => [name, { ...value }]));
        if (deep) this.childNodes.forEach(child => clone.appendChild(child.cloneNode(true)));
        return clone;
    }
}

const DEFAULT_STYLE = {
    color: 'rgb(25, 29, 32)', 'background-color': 'rgba(0, 0, 0, 0)',
    'background-image': 'none', 'background-repeat': 'repeat',
    'background-position': '0% 0%', 'background-size': 'auto',
    'border-radius': '0px', 'box-shadow': 'none', opacity: '1', visibility: 'visible',
    'overflow-x': 'visible', 'overflow-y': 'visible', 'z-index': 'auto',
    'font-family': '"Fixture; Narrow", sans-serif', 'font-size': '11px',
    'font-weight': '400', 'font-style': 'normal', 'font-stretch': '100%',
    'font-variant': 'normal', 'font-feature-settings': 'normal', 'font-kerning': 'auto',
    'font-optical-sizing': 'auto', 'font-variation-settings': 'normal',
    'letter-spacing': '0.2px', 'word-spacing': '0px', 'text-transform': 'none',
    'color-scheme': 'only light', display: 'block', transform: 'none', 'box-sizing': 'border-box',
    'border-top-width': '0px', 'border-right-width': '0px', 'border-bottom-width': '0px', 'border-left-width': '0px',
    'border-top-color': 'rgb(25, 29, 32)', 'border-right-color': 'rgb(25, 29, 32)',
    'border-bottom-color': 'rgb(25, 29, 32)', 'border-left-color': 'rgb(25, 29, 32)',
    'padding-top': '0px', 'padding-right': '0px', 'padding-bottom': '0px', 'padding-left': '0px',
    'text-decoration': 'none solid rgb(25, 29, 32)', 'text-underline-offset': 'auto', content: 'none'
};

export function createLoupeFixture({ strokes = 20, zoom = 1.25 } = {}) {
    const operations = [];
    const environment = {
        operations,
        record(kind, node, property) { operations.push({ kind, node, property }); },
        reset() { operations.length = 0; },
        counts() {
            const counts = { rectRead: 0, computedStyleRead: 0, rangeRead: 0, styleSetProperty: 0, styleCssText: 0 };
            operations.forEach(({ kind }) => { counts[kind] = (counts[kind] || 0) + 1; });
            return counts;
        }
    };
    const document = {
        environment,
        createElement: tag => new Element(document, tag),
        createRange() {
            let selected;
            return { selectNodeContents(node) { selected = node; }, getBoundingClientRect() {
                environment.record('rangeRead', selected);
                return { ...selected.box };
            } };
        }
    };
    document.defaultView = {
        getComputedStyle(node, pseudo) {
            environment.record('computedStyleRead', node, pseudo);
            const values = { ...DEFAULT_STYLE, width: node.box.width / zoom + 'px', height: node.box.height / zoom + 'px', ...node.computed, ...(pseudo ? node.pseudo[pseudo] || { content: 'none' } : {}) };
            return new Proxy({ getPropertyValue: name => values[name] || '' }, {
                get(target, name) { return name in target ? target[name] : values[kebab(String(name))] || ''; }
            });
        },
        DOMMatrixReadOnly: class {
            constructor(value) {
                const values = value?.match(/^matrix\(([^)]+)\)$/)?.[1].split(',').map(Number);
                this.e = values?.[4] || 0;
                this.f = values?.[5] || 0;
            }
        }
    };
    const box = (left, top, width, height) => ({ left: 120 + left * zoom, top: 80 + top * zoom, width: width * zoom, height: height * zoom });
    const make = (parent, classes, dimensions, computed = {}, attributes = {}) => {
        const node = new Element(document, 'div', { classes, box: box(...dimensions), computed, attributes });
        parent?.appendChild(node);
        return node;
    };
    const face = make(null, 'rule-face-body', [0, 0, 800, 240], { width: '800px', height: '240px', 'background-color': 'rgb(248, 242, 223)' }, { id: 'source-face', tabindex: '0' });
    const top = make(face, 'rail top-stator', [0, 0, 800, 60]);
    const fixedPane = make(top, 'tick-pane', [40, 0, 720, 60], { 'overflow-x': 'hidden', 'overflow-y': 'hidden' });
    const slide = make(face, 'rail slide-rail', [0, 60, 800, 90]);
    const slidePane = make(slide, 'tick-pane', [40, 60, 720, 90], { 'overflow-x': 'hidden' });
    const mover = make(slidePane, 'slide-mover', [76, 60, 720, 90]);
    const secondMover = make(slidePane, 'slide-mover slide-wraparound-copy', [-644, 60, 720, 90]);
    secondMover.dataset.wrapPeriod = '-1';
    const seam = make(slidePane, 'slide-wraparound-seam', [76, 60, 2, 90], { 'background-color': 'rgba(255, 226, 76, 0.5)' });
    const baseline = make(fixedPane, 'baseline', [40, 45, 720, 1], { 'border-top-width': '1px', 'border-top-color': 'rgb(14, 44, 65)' });
    let firstTick;
    for (let index = 0; index < strokes; index++) {
        const parent = index % 2 ? mover : fixedPane;
        const x = (index % 2 ? 76 : 40) + (index % 719);
        const tick = make(parent, 'tick', [x, index % 2 ? 100 : 25, 1, 15], { 'border-left-width': '1px', 'border-left-color': index % 3 ? 'rgb(25, 29, 32)' : 'rgb(165, 28, 40)' }, { title: 'Constant mark', id: 'tick-' + index });
        firstTick ||= tick;
    }
    const text = (parent, classes, dimensions, content, computed = {}) => {
        const element = make(parent, classes, dimensions, computed, { id: 'source-label', 'aria-describedby': 'source-help', 'aria-labelledby': 'source-title' });
        const node = new TextNode(document, content, box(...dimensions));
        element.appendChild(node);
        return element;
    };
    const label = text(fixedPane, 'tick-label', [60, 8, 20, 14], '1.25', { 'text-decoration': 'underline solid rgb(25, 29, 32)', 'text-underline-offset': '1px' });
    const hidden = text(fixedPane, 'tick-label label-hidden', [90, 8, 20, 14], '2', { visibility: 'hidden' });
    const omitted = text(fixedPane, 'tick-label omitted', [0, 0, 0, 0], '3', { display: 'none' });
    text(mover, 'tick-label moving-label', [110, 70, 30, 14], 'π');
    const cursor = make(face, 'cursor', [394, 0, 12, 240], { 'background-color': 'rgba(255, 255, 255, 0.2)' }, { id: 'cursor', tabindex: '0', title: 'Cursor' });
    cursor.pseudo = {
        '::before': { content: '""', left: '5px', top: '0px', width: '1px', height: '240px', 'background-color': 'rgb(177, 27, 39)', transform: 'matrix(1, 0, 0, 1, -0.5, 0)' },
        '::after': { content: '""', left: '0px', top: '3px', width: '12px', height: '1px', 'border-bottom-width': '1px', 'border-bottom-color': 'rgb(177, 27, 39)' }
    };
    function shift(node, dx, dy = 0) {
        node.box.left += dx;
        node.box.top += dy;
        for (const child of node.childNodes) {
            if (child.nodeType === 1) shift(child, dx, dy);
            else if (child.box) { child.box.left += dx; child.box.top += dy; }
        }
    }
    environment.reset();
    return { document, face, fixedPane, slidePane, mover, secondMover, seam, cursor, baseline, firstTick, label, hidden, omitted, environment, shift, zoom };
}

export function styleSnapshot(node) {
    return Object.fromEntries([...node.style.values].sort(([a], [b]) => a.localeCompare(b)).map(([name, item]) => [name, { ...item }]));
}

/** Canonicalise the intended translation only; all other paint/geometry stays. */
export function drawingSnapshot(drawing) {
    return [drawing.element, ...drawing.element.querySelectorAll('*')].map((node, index) => {
        const style = styleSnapshot(node);
        let translation;
        if (index === 0) {
            const transform = style.transform?.value || 'none';
            const match = /^translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)$/.exec(transform);
            if (transform !== 'none' && !match) throw new Error('Unexpected non-translation root transform: ' + transform);
            translation = { x: parseFloat(style.left?.value || 0) + Number(match?.[1] || 0), y: parseFloat(style.top?.value || 0) + Number(match?.[2] || 0) };
            for (const name of ['left', 'top', 'transform']) delete style[name];
        }
        return { className: node.className, attributes: [...node.attributes].sort(), dataset: { ...node.dataset }, text: node.childNodes.filter(child => child.nodeType === 3).map(child => child.textContent), style, ...(translation ? { translation } : {}) };
    });
}
