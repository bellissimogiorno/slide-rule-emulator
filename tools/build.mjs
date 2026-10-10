/** Assemble a single offline HTML file without compiling or rewriting JavaScript.
 * Native ES modules keep their real boundaries. An import map embeds each module
 * exactly once as a data URL; the same #paths resolve in Node via package.json.
 */
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative, join } from 'node:path';
export const ROOT = fileURLToPath(new URL('../', import.meta.url));
const STYLE_ORDER = ['base', 'scales', 'paired', 'compact', 'cursor', 'themes', 'controls', 'layout', 'graduations'];
export async function sourceFiles(directory = join(ROOT, 'src')) {
    const result = [];
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
        const path = join(directory, entry.name);
        if (entry.isDirectory())
            result.push(...await sourceFiles(path));
        else if (entry.isFile() && path.endsWith('.js'))
            result.push(path);
    }
    return result;
}
/** Deterministic: no timestamps, absolute paths, minification, network or cache. */
export async function buildHtml() {
    const { version } = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));
    const template = await readFile(join(ROOT, 'src/index.html'), 'utf8');
    const licence = (await readFile(join(ROOT, 'LICENSE'), 'utf8')).replace(/\r\n/g, '\n').trimEnd();
    if (licence.includes('--') || licence.endsWith('>'))
        throw new Error('The licence text cannot be embedded safely in an HTML comment.');
    // Keep the notice inside the document element so configured exports retain it.
    const licenceNotice = '<!--\n' + licence + '\n-->';
    const imports = {};
    for (const path of await sourceFiles()) {
        const name = relative(join(ROOT, 'src'), path).split('\\').join('/');
        const source = (await readFile(path, 'utf8')).replace(/\r\n/g, '\n');
        // DevTools shows a useful filename rather than an enormous data URL.
        const namedSource = source + '\n//# sourceURL=slide-rule/' + name + '\n';
        imports['#' + name] = 'data:text/javascript;base64,' + Buffer.from(namedSource).toString('base64');
    }
    let css = '';
    for (const name of STYLE_ORDER)
        css += '\n/* styles/' + name + '.css */\n' + await readFile(join(ROOT, 'src/styles', name + '.css'), 'utf8');
    if (/<\/style/i.test(css))
        throw new Error('A stylesheet contains a closing style tag.');
    for (const marker of ['<!-- LICENCE_NOTICE -->', '<!-- STYLE_BUNDLE -->', '<!-- MODULE_BUNDLE -->']) {
        if (template.split(marker).length !== 2)
            throw new Error('Expected exactly one build marker: ' + marker);
    }
    const boot = `<script id="module-map" type="importmap">${JSON.stringify({ imports }).replace(/</g, '\\u003c')}</script>
<script type="module">
import('#main.js').catch(error => {
  const status = document.getElementById('appStatus');
  status.hidden = false;
  status.textContent = 'The emulator could not start: ' + error.message;
  console.error(error);
});
</script>`;
    return template.replaceAll('{{VERSION}}', version)
        .replace('<!-- LICENCE_NOTICE -->', () => licenceNotice)
        .replace('<!-- STYLE_BUNDLE -->', '<style>\n' + css + '\n</style>')
        .replace('<!-- MODULE_BUNDLE -->', boot).replace(/\r\n/g, '\n');
}
export async function build({ check = false } = {}) {
    const html = await buildHtml();
    const output = join(ROOT, 'dist/index.html');
    if (check) {
        const current = await readFile(output, 'utf8');
        if (current !== html)
            throw new Error('dist/index.html is stale. Run npm run build and commit the result.');
    }
    else {
        await mkdir(join(ROOT, 'dist'), { recursive: true });
        await writeFile(output, html);
        await writeFile(join(ROOT, 'dist/.nojekyll'), '');
    }
    return { output, bytes: Buffer.byteLength(html) };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        const result = await build({ check: process.argv.includes('--check') });
        console.log(`${process.argv.includes('--check') ? 'Verified' : 'Built'} dist/index.html (${result.bytes} bytes)`);
    }
    catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}
