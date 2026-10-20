/** Presentation contracts, using declared colours and readable source rules.
 * These checks do not substitute for native layout, font or interaction tests.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PAGE_THEMES } from '#ui/page-theme.js';

const styles = Object.fromEntries(await Promise.all(
    ['base', 'page-themes', 'controls', 'motion', 'readout'].map(async name =>
        [name, await readFile(new URL(`../../src/styles/${name}.css`, import.meta.url), 'utf8')])));

function themeTokens(theme) {
    const selector = theme === 'light' ? ':root {' : `:root[data-page-theme="${theme}"]`;
    const block = styles['page-themes'].slice(styles['page-themes'].indexOf(selector)).match(/\{([^}]+)\}/)?.[1];
    assert.ok(block, `Missing page theme ${theme}`);
    return Object.fromEntries([...block.matchAll(/--ui-([\w-]+):\s*(#[0-9a-f]{6});/g)]
        .map(([, name, colour]) => [name, colour]));
}

function luminance(colour) {
    assert.match(colour || '', /^#[0-9a-f]{6}$/i, 'Expected an opaque sRGB colour');
    const channels = colour.slice(1).match(/../g).map(part => parseInt(part, 16) / 255)
        .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}

function contrast(first, second) {
    const [low, high] = [luminance(first), luminance(second)].sort((a, b) => a - b);
    return (high + .05) / (low + .05);
}

for (const theme of PAGE_THEMES) {
    test(`${theme}: text stays readable across page, popup, editor, hover and inactive surfaces`, () => {
        const tokens = themeTokens(theme);
        for (const ink of ['ink', 'muted']) {
            for (const background of ['bg', 'panel', 'card', 'control', 'code', 'motion-top',
                'motion-bottom', 'hover', 'inactive']) {
                assert.ok(contrast(tokens[ink], tokens[background]) >= 4.5,
                    `${ink} on ${background} in ${theme}`);
            }
        }
        for (const [ink, background] of [['accent', 'panel'], ['selected-ink', 'selected'],
            ['on-primary', 'primary'], ['danger', 'panel'], ['success', 'panel'],
            ['warning-ink', 'warning']]) {
            assert.ok(contrast(tokens[ink], tokens[background]) >= 4.5,
                `${ink} on ${background} in ${theme}`);
        }
    });

    test(`${theme}: keyboard focus and both motion grips remain distinguishable`, () => {
        const tokens = themeTokens(theme);
        for (const [foreground, background] of [['focus', 'panel'], ['track-border', 'motion-top'],
            ['track-border', 'motion-bottom'], ['grip-line', 'motion-top'], ['grip-line', 'motion-bottom']]) {
            assert.ok(contrast(tokens[foreground], tokens[background]) >= 3,
                `${foreground} on ${background} in ${theme}`);
        }
    });
}

test('page text metrics cannot propagate into the physical instrument', () => {
    const css = styles.base.replace(/\/\*[\s\S]*?\*\//g, '');
    let inspected = 0;
    for (const [, selectors, declarations] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (selectors.split(',').some(selector => [':root', 'body', '.workbench']
            .includes(selector.trim()))) {
            assert.doesNotMatch(declarations, /(?:^|;)\s*(?:font|font-size|line-height)\s*:/,
                `${selectors.trim()}: page type would change inherited instrument metrics`);
            inspected++;
        }
    }
    assert.ok(inspected >= 3, 'Inspect root, body and workbench rules');
});

test('readings and explanatory text retain complete wrapping content', () => {
    // A long scientific value or description must wrap; horizontal scrolling is
    // reserved for the instrument itself rather than hiding numerical content.
    const clipping = /(?:text-overflow\s*:\s*ellipsis|(?:-webkit-)?line-clamp\s*:|white-space\s*:\s*nowrap|overflow(?:-[xy])?\s*:\s*(?:hidden|clip)|max-height\s*:)/;
    assert.doesNotMatch(styles.readout, clipping);
    assert.match(styles.readout, /\.readout-card\s*\{[^}]*overflow-wrap:\s*anywhere/);
    const helpRules = [
        ['controls', '.hint, .status'], ['motion', '.motion-help'],
        ['motion', '.motion-instructions'], ['controls', '.footer-note']
    ];
    for (const [name, selector] of helpRules) {
        const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const declarations = styles[name].match(new RegExp(escaped + '\\s*\\{([^}]+)\\}'))?.[1];
        assert.ok(declarations, `Missing readable text rule ${selector}`);
        assert.doesNotMatch(declarations, clipping, selector);
    }
});
