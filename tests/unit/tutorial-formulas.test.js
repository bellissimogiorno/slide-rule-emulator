/** Exercise the real teaching settings, appearance projection and row renderer.
 * Native visibility and clipping are checked by tests/browser/tutorial.mjs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTutorialProgramme, TUTORIAL_LAYOUTS } from '#tutorial/programme.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { renderAppearanceControls } from '#ui/programme-controls.js';
import { renderScaleRow } from '#ui/scale-markup.js';
import { escapeHtml } from '#ui/html.js';
import { exportableState } from '#model/program.js';
import { parseProgramText } from '#model/validation.js';

const rails = ['topStator', 'slide', 'bottomStator'];

test('teaching settings activate formula captions through the actual appearance controls and programme round-trip', () => {
    const names = ['magnificationSelect', 'modelBadge', 'themeSelect', 'densitySelect',
        'graduationModeSelect', 'adaptiveSpacingSelect', 'adaptiveSpacingField', 'logGraduationsField',
        'logGraduationsSelect', 'formulaToggle', 'compactScaleToggle', 'fullPrecisionToggle', 'slideWraparoundToggle'];
    const dom = Object.fromEntries(names.map(name => [name, {}]));
    dom.ruleCanvas = { parentElement: { style: {} } };
    dom.cursorShapeButtons = dom.cursorColourButtons = dom.cursorAppearanceButtons = [];
    const document = { body: { dataset: {} } };
    for (const layout of Object.keys(TUTORIAL_LAYOUTS)) {
        const programme = createTutorialProgramme({ slideOffset: 0, cursor: .5 }, layout);
        const before = JSON.stringify(programme);
        renderAppearanceControls(document, dom, programme);
        assert.equal(document.body.dataset.formulas, 'true', layout);
        assert.equal(dom.formulaToggle.checked, true, layout);
        assert.equal(document.body.dataset.compactScales, 'false', layout);
        assert.equal(JSON.stringify(programme), before, 'Rendering does not mutate the teaching programme');
        assert.equal(parseProgramText(JSON.stringify(exportableState(programme))).showFormulas, true, layout);
    }
});

test('every taught scalar row renders its mathematical formula in the reserved legend gutter', () => {
    const checked = new Set();
    const context = { library: BUILTIN_SCALES, width: 1000, minGap: 1.8,
        fullPrecision: false, graduationMode: 'conventional', logGraduations: 'standard' };
    for (const profile of Object.values(TUTORIAL_LAYOUTS)) for (const rail of rails) {
        for (const [index, id] of profile[rail].entries()) {
            if (checked.has(id)) continue;
            const definition = BUILTIN_SCALES[id];
            assert(definition && !definition.layers, `${id} is a scalar teaching row`);
            assert.equal(typeof definition.formula, 'string', `${id} has a formula`);
            assert.match(definition.formula, /\S/, id);
            const markup = renderScaleRow(id, rail === 'slide', rail, index, profile[rail].length, context);
            const legend = markup.slice(markup.lastIndexOf('<div class="scale-legend"'));
            assert.ok(legend.includes(`<span class="legend-formula">${escapeHtml(definition.formula)}</span>`), id);
            assert.ok(markup.indexOf('class="tick-pane"') < markup.lastIndexOf('class="scale-legend"'),
                `${id}: formula lives after the graduated pane, outside its moving ticks`);
            checked.add(id);
        }
    }
    assert(checked.size > 0);
});
