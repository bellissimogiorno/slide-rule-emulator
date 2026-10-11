/** UK-English prose checks. Standard API names and identifiers are not prose. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, buildHtml } from '../../tools/build.mjs';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { PRESETS } from '#catalog/presets.js';
import { THEMES, DENSITIES } from '#catalog/appearance.js';
import { assertCatalogueEqual } from './catalogue-comparison.js';

// Deliberately contains the rejected spellings as test data, not interface text.
const NON_UK_PROSE = /\b(?:colou?rization|color(?:s|ed|ing)?|center(?:s|ed|ing)?|behavior(?:s|al)?|normaliz(?:e|ed|es|ing|ation)|moderniz(?:e|ed|es|ing|ation)|synchroniz(?:e|ed|es|ing|ation)|organiz(?:e|ed|es|ing|ation)|recogniz(?:e|ed|es|ing)|(?:re)?initializ(?:e|ed|es|ing|ation)|label(?:ed|ing)|artifacts?)\b/i;
const PROSE_KEYS = new Set([
    'name', 'label', 'modelLabel', 'description', 'instrumentNote',
    'formula', 'family', 'caption', 'startLabel', 'endLabel'
]);

function checkCatalogueProse(value, location = 'catalogue') {
    if (!value || typeof value !== 'object')
        return;
    for (const [key, child] of Object.entries(value)) {
        const path = `${location}.${key}`;
        if (typeof child === 'string' && PROSE_KEYS.has(key))
            assert.doesNotMatch(child, NON_UK_PROSE, path);
        else if (child && typeof child === 'object')
            checkCatalogueProse(child, path);
    }
}

test('application template declares UK English and consistent programme terminology', async () => {
    const template = await readFile(join(ROOT, 'src/index.html'), 'utf8');
    assert.match(template, /<html\b[^>]*\blang="en-GB"[^>]*>/);
    assert.match(template, /<summary>Programme JSON<\/summary>/);
    assert.doesNotMatch(template, /<summary>Program JSON<\/summary>/);
    // Remove markup so machine names such as embedded-program stay out of prose checks.
    assert.doesNotMatch(template.replace(/<[^>]*>/g, ' '), NON_UK_PROSE);
});

test('scale, preset and appearance catalogue descriptions use UK spelling', () => {
    checkCatalogueProse({ BUILTIN_SCALES, PRESETS, THEMES, DENSITIES });
});

test('committed catalogue data matches the current UK-English runtime catalogue', async () => {
    for (const [file, expected] of Object.entries({
        scales: BUILTIN_SCALES, presets: PRESETS, themes: THEMES, densities: DENSITIES
    })) {
        const actual = JSON.parse(await readFile(join(ROOT, 'docs/data', `${file}.json`), 'utf8'));
        assertCatalogueEqual(actual, expected, file);
    }
});

test('standalone build retains UK language and compatible standard CSS and seed identifiers', async () => {
    const html = await buildHtml();
    assert.match(html, /<html\b[^>]*\blang="en-GB"[^>]*>/);
    assert.match(html, /<summary>Programme JSON<\/summary>/);
    assert.match(html, /overscroll-behavior-x:\s*contain/);
    assert.match(html, /id="embedded-program"/);
    assert.match(html, /color-scheme:\s*var\(--ui-scheme\)/);
    assert.doesNotMatch(html, /colour-scheme:/);
});
