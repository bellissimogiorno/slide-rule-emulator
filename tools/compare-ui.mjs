#!/usr/bin/env node
/** Optional differential audit against a trusted reference repository.
 *
 * Usage: node tools/compare-ui.mjs --reference /path/to/reference/repository
 *        [--output /path/to/results.json]
 *
 * Reference application.js must retain its original inline control-rendering
 * and geometry functions. Extract their closures verbatim; do not duplicate
 * their implementation in the oracle. Reference modules are executable code,
 * so only use a local repository whose code you trust.
 *
 * Synthetic nodes record exact ordered DOM property/attribute writes. Synthetic
 * measured rectangles exercise coordinate arithmetic independently of rendering.
 * These checks do not model native selects, focus, pointer capture, browser
 * layout or event ordering. They supplement native browser acceptance tests.
 */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { compileFunction } from 'node:vm';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderAppearanceControls, renderFaceControls, renderPresetControls } from '#ui/programme-controls.js';
import { createScaleGeometry } from '#ui/scale-geometry.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const options = {};
for (let index = 0; index < args.length; index++) {
    const name = args[index];
    if (name === '--help') {
        console.log('Usage: node tools/compare-ui.mjs --reference /path/to/reference/repository [--output /path/to/results.json]');
        process.exit(0);
    }
    assert(['--reference', '--output'].includes(name), 'Unknown option: ' + name);
    assert(args[index + 1] && !args[index + 1].startsWith('--'), name + ' requires a value');
    assert(!Object.hasOwn(options, name), 'Repeated option: ' + name);
    options[name] = args[++index];
}
assert(options['--reference'], '--reference /path/to/reference/repository is required');
const reference = resolve(options['--reference']);
const output = options['--output'] ? resolve(options['--output']) : resolve(root, 'qa/refactor-ui/results.json');
const referenceModule = path => import(pathToFileURL(resolve(reference, 'src', path)).href);
const [source, { THEMES, DENSITIES }, { PRESETS }, { presetMenuGroups },
    { CURSOR_SHAPES, CURSOR_COLOURS }, { DEFAULT_LABEL_W }, { escapeHtml, titleCase }, { DEFAULT_STATE }] = await Promise.all([
    readFile(resolve(reference, 'src/ui/application.js'), 'utf8'),
    referenceModule('catalog/appearance.js'), referenceModule('catalog/presets.js'),
    referenceModule('catalog/preset-menu.js'), referenceModule('model/cursor-appearance.js'),
    referenceModule('version.js'), referenceModule('ui/html.js'), referenceModule('catalog/defaults.js')
]);
function inlineFunctions(first, after) {
    const start = source.indexOf('    function ' + first + '(');
    const end = source.indexOf('    function ' + after + '(', start);
    assert(start >= 0 && end > start,
        'Reference application.js must contain the inline ' + first + ' functions before ' + after + '.');
    return source.slice(start, end);
}
const originalControls = compileFunction(inlineFunctions('applyAppearance', 'applyPreset') + '\nreturn {applyAppearance,renderSideSelect,renderPresetSelect};',
    ['document','dom','state','THEMES','DENSITIES','PRESETS','presetMenuGroups','CURSOR_SHAPES','CURSOR_COLOURS','escapeHtml','titleCase']);
const originalGeometry = compileFunction(inlineFunctions('getLabelWidth', 'applyProgramme') + '\nreturn {getScaleGeometry,getScalePixelWidth};',
    ['dom','state','getComputedStyle','DEFAULT_LABEL_W']);

function fixture() {
    const changes = [];
    const tracked = (name, value = {}) => new Proxy(value, { set(target, field, value) { changes.push([name, field, value]); target[field] = value; return true; } });
    const node = (name, dataset = {}) => tracked(name, { dataset, setAttribute(field, value) { changes.push([name, 'attribute:' + field, value]); } });
    const fields = ['magnificationSelect','modelBadge','themeSelect','densitySelect','graduationModeSelect','adaptiveSpacingSelect','adaptiveSpacingField','logGraduationsField','logGraduationsSelect','formulaToggle','compactScaleToggle','fullPrecisionToggle','slideWraparoundToggle','sideSelect','bothSidesButton','flipButton','editSideField','editSideSelect','ruleTopNote','instrumentNote','presetSelect','slidePresetSelect','presetDescription'];
    const dom = Object.fromEntries(fields.map(id => [id, node(id)]));
    dom.ruleCanvas = { parentElement: { style: tracked('ruleCanvas.parentElement.style') } };
    dom.cursorShapeButtons = Object.keys(CURSOR_SHAPES).map(cursorShape => node('shape:' + cursorShape, { cursorShape }));
    dom.cursorColourButtons = Object.keys(CURSOR_COLOURS).map(cursorColour => node('colour:' + cursorColour, { cursorColour }));
    dom.cursorAppearanceButtons = [node('cursorAppearance:0'),node('cursorAppearance:1')];
    return { document: { body: { dataset: tracked('body.dataset') } }, dom, changes };
}
function checkControl(state, name) {
    const before = structuredClone(state);
    const expected = fixture(), actual = fixture();
    const old = originalControls(expected.document, expected.dom, state, THEMES, DENSITIES, PRESETS, presetMenuGroups, CURSOR_SHAPES, CURSOR_COLOURS, escapeHtml, titleCase);
    if (name === 'appearance') { old.applyAppearance(); renderAppearanceControls(actual.document, actual.dom, state); }
    if (name === 'faces') { old.renderSideSelect(); renderFaceControls(actual.dom, state); }
    if (name === 'presets') { old.renderPresetSelect(); renderPresetControls(actual.dom, state); }
    assert.deepEqual(actual.changes, expected.changes, name + ': ordered DOM mutations changed');
    assert.deepEqual(state, before, name + ': programme was mutated');
}
const counts = { appearance: 0, faces: 0, presets: 0, geometry: 0 };
for (const theme of Object.keys(THEMES)) for (const density of Object.keys(DENSITIES))
for (const graduationMode of ['adaptive','conventional']) for (const fullPrecision of [false,true])
for (const slideWraparound of [false,true]) for (const cursorShape of Object.keys(CURSOR_SHAPES))
for (const cursorColour of Object.keys(CURSOR_COLOURS)) {
    const index = counts.appearance++;
    checkControl({...structuredClone(DEFAULT_STATE), theme, density, graduationMode, fullPrecision, slideWraparound, cursorShape, cursorColour,
        adaptiveSpacing: ['clear','balanced','fine'][index % 3], logGraduations: ['adaptive','standard','pocket','fine'][index % 4],
        magnification: [.75,1,1.25,1.5,2][index % 5], compactScales: index % 2 === 0, showFormulas: index % 3 === 0,
        modelLabel: index % 2 ? '<& custom model>' : ''}, 'appearance');
}
for (const viewMode of ['single','both']) for (const count of [1,2,3]) for (const note of ['', '<b>own note</b>'])
for (const activeIndex of [0,1,2]) {
    const sides = Object.fromEntries(['front','back','<& extra " face>'].slice(0,count).map((id,i) => [id, {name: i === 0 ? '' : '<& Face " ' + i + '>', note}]));
    const activeSide = Object.keys(sides)[activeIndex % count];
    checkControl({sides,viewMode,activeSide,instrumentNote: '<& instrument note>'}, 'faces'); counts.faces++;
}
for (const presetId of [...Object.keys(PRESETS),'custom','unknown','']) {
    checkControl({presetId}, 'presets'); counts.presets++;
}

for (const magnification of [.75,1,1.25,1.5,2]) for (const clientWidth of [1,200,960,1200])
for (const label of ['', 'auto','Infinity','66px','0px']) for (const legend of ['', 'NaN','12.5px'])
for (const mode of ['startup','empty','pane','second-face']) for (const screenLeft of [-427,0,123.75])
for (const browserScale of [.8,1.25]) {
    const state = { magnification };
    const style = { getPropertyValue: property => property === '--label-w' ? label : legend };
    const getComputedStyle = () => style;
    const zoom = magnification * browserScale;
    const pane = { getBoundingClientRect: () => ({left:screenLeft + 66 * zoom,width:Math.max(1,clientWidth - 90) * zoom}) };
    const face = {offsetWidth:clientWidth,getBoundingClientRect: () => ({left:screenLeft,width:clientWidth * zoom}),querySelector: () => mode === 'pane' || mode === 'second-face' ? pane : null};
    const canvas = {ownerDocument:{defaultView:{getComputedStyle}},clientWidth,getBoundingClientRect:face.getBoundingClientRect,
        querySelector: selector => selector === '.rule-face-body' ? (mode === 'startup' ? null : face) : null};
    const old = originalGeometry({ruleCanvas:canvas},state,getComputedStyle,DEFAULT_LABEL_W);
    const next = createScaleGeometry({canvas,getMagnification: () => state.magnification});
    const explicitFace = mode === 'second-face' ? {...face,getBoundingClientRect: () => ({left:screenLeft + 99,width:clientWidth * zoom})} : undefined;
    assert.deepEqual(next.getScaleGeometry(explicitFace), old.getScaleGeometry(explicitFace));
    assert.equal(next.getScalePixelWidth(), old.getScalePixelWidth());
    // Replacement imports and CSS magnification use the current programme.
    state.magnification = 2;
    assert.deepEqual(next.getScaleGeometry(explicitFace), old.getScaleGeometry(explicitFace));
    counts.geometry++;
}
const report = { passed: true, reference: 'Inline application control and geometry closures', candidate: 'Extracted UI modules', cases: counts,
    assertions: ['Exact ordered DOM mutation traces and text/HTML match for controls', 'Applied programmes remain unchanged by render projections',
        'Local and screen coordinates plus pixel widths exactly match',
        'Empty and pre-render faces, explicit second faces, zoom, negative scroll and programme replacement retain reference behavior'],
    limitations: ['Synthetic DOM projection and coordinate checks; this is not native browser acceptance evidence.'] };
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
