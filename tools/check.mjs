/** Dependency-free repository checks; numerical and browser tests are separate. */
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, sourceFiles } from './build.mjs';
import { APP_VERSION } from '../src/version.js';
import { SCALE_TYPES, TICK_MODES } from '../src/core/scale-types.js';
import { PRESETS } from '../src/catalog/presets.js';
import { THEMES, DENSITIES } from '../src/catalog/appearance.js';
import { BUILTIN_SCALES } from '../src/catalog/scales.js';
import { validateProgram, parseProgramText } from '../src/model/validation.js';
const packageInfo = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));
assert.equal(APP_VERSION, packageInfo.version, 'Version disagreement');
assert.equal(await readFile(join(ROOT, 'VERSION'), 'utf8'), packageInfo.version + '\n',
    'VERSION must match package.json and contain a single LF-terminated line');
const files = await sourceFiles();
const graph = new Map();
for (const file of files) {
    const name = relative(join(ROOT, 'src'), file).replaceAll('\\', '/');
    const code = await readFile(file, 'utf8');
    assert.ok(code.endsWith('\n') && !code.includes('\r'), name + ': expected LF and final newline');
    const syntax = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    assert.equal(syntax.status, 0, syntax.stderr);
    assert.ok(!/\beval\s*\(|\bnew\s+Function\s*\(/.test(code), name + ': dynamic code execution');
    const imports = [...code.matchAll(/\b(?:import|export)\s[^;]*?\bfrom\s*["']([^"']+)["']/g)].map(match => match[1]);
    const edges = [];
    for (const specifier of imports) {
        assert.ok(specifier.startsWith('#'), name + ': unexpected external import ' + specifier);
        const target = specifier.slice(1);
        assert.ok(files.includes(join(ROOT, 'src', target)), name + ': unresolved ' + target);
        if (name.startsWith('core/'))
            assert.ok(target.startsWith('core/'), name + ': core depends on outer layer');
        if (name.startsWith('catalog/'))
            assert.ok(/^(core|catalog)\//.test(target), name + ': catalogue depends on outer layer');
        if (name.startsWith('model/'))
            assert.ok(!target.startsWith('ui/'), name + ': model depends on UI');
        edges.push(target);
    }
    graph.set(name, edges);
}
const finished = new Set();
function visit(name, path = []) {
    assert.ok(!path.includes(name), 'Module cycle: ' + [...path, name].join(' -> '));
    if (finished.has(name))
        return;
    for (const edge of graph.get(name))
        visit(edge, [...path, name]);
    finished.add(name);
}
for (const name of graph.keys())
    visit(name);
const schema = JSON.parse(await readFile(join(ROOT, 'schema/program.schema.json'), 'utf8'));
assert.deepEqual([...schema.properties.theme.enum].sort(), Object.keys(THEMES).sort(), 'Schema themes drifted');
assert.deepEqual([...schema.properties.density.enum].sort(), Object.keys(DENSITIES).sort(), 'Schema densities drifted');
const scale = schema.properties.customScales.items.properties;
assert.deepEqual([...scale.type.enum].sort(), [...SCALE_TYPES].sort(), 'Schema scale types drifted');
assert.deepEqual([...scale.tickMode.enum].sort(), [...TICK_MODES].sort(), 'Schema tick modes drifted');
for (const preset of Object.values(PRESETS))
    validateProgram({ ...preset, customScales: [] });
for (const filename of await readdir(join(ROOT, 'examples'))) {
    if (filename.endsWith('.json'))
        parseProgramText(await readFile(join(ROOT, 'examples', filename), 'utf8'));
}
const template = await readFile(join(ROOT, 'src/index.html'), 'utf8');
const ids = [...template.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate template IDs');
assert.equal(ids.filter(id => id === 'embedded-program').length, 1);
console.log(`Checked ${files.length} ES modules: syntax, imports, layer boundaries and acyclic graph.`);
console.log(`Checked version, schema enums, template IDs, ${Object.keys(PRESETS).length} presets and ${Object.keys(BUILTIN_SCALES).length} catalogue entries.`);
