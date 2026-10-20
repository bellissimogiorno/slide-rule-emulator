/**
 * Text contracts for our deliberately small, hand-maintained workflows.
 * These are not a YAML parser, a general workflow linter or a hosted-run test.
 * Keep version numbers out of assertions so Dependabot updates remain possible.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL('../../' + path, import.meta.url), 'utf8');
const ci = await read('.github/workflows/ci.yml');
const pages = await read('.github/workflows/pages.yml');
const dependabot = await read('.github/dependabot.yml');
const workflows = [ci, pages];
const deployStart = pages.indexOf('\n  deploy:\n');
const build = pages.slice(0, deployStart);
const deploy = pages.slice(deployStart);

test('direct workflow actions have full commit pins and release comments', () => {
    const seen = new Map();
    for (const workflow of workflows) {
        const uses = workflow.split('\n').filter(line => /^\s+(?:- )?uses:/.test(line));
        assert.ok(uses.length > 0);
        for (const line of uses) {
            const match = line.match(/uses: (actions\/[a-z-]+)@([a-f0-9]{40}) # (v\d+\.\d+\.\d+)$/);
            assert.ok(match, 'Expected an official action, full SHA and version comment: ' + line);
            const [, action, sha, version] = match;
            const pin = sha + ' ' + version;
            if (seen.has(action)) assert.equal(pin, seen.get(action), action + ': inconsistent pins');
            seen.set(action, pin);
        }
    }
});

test('verification remains read-only and cannot run as pull_request_target', () => {
    assert.match(ci, /permissions:\n  contents: read\n/);
    for (const event of ['push', 'pull_request', 'workflow_dispatch']) {
        assert.ok(ci.includes('\n  ' + event + ':\n'), event + ': missing verification event');
    }
    for (const workflow of workflows) {
        assert.doesNotMatch(workflow, /pull_request_target:|write-all|secrets: inherit/);
        assert.doesNotMatch(workflow, /continue-on-error:\s*true|\|\|\s*true/);
        const checkouts = workflow.match(/uses: actions\/checkout@/g) || [];
        const noCredentials = workflow.match(/persist-credentials: false/g) || [];
        assert.equal(checkouts.length, noCredentials.length, 'Every checkout must disable credentials');
    }
    assert.doesNotMatch(ci, /:\s*write\b/);
});

test('both Node versions complete even when one matrix leg fails', () => {
    assert.match(ci, /fail-fast: false/);
    assert.match(ci, /node: \[22, 24\]/);
});

test('logged checks retain failures through explicit bash pipefail', () => {
    for (const workflow of workflows) {
        assert.match(workflow, /defaults:\n  run:\n(?:    #[^\n]*\n)*    shell: bash\n/);
        assert.match(workflow, /npm run verify 2>&1 \| tee /);
        assert.match(workflow, /if: always\(\)\n\s+uses: actions\/upload-artifact@/);
    }
    assert.match(ci, /name: core-node-\$\{\{ matrix.node \}\}-evidence/);
    assert.match(ci, /name: chromium-native-evidence/);
});

test('browser CI installs the matching browser and retains strict native mode', () => {
    const dependencyInstall = ci.indexOf('python -m pip install -r requirements-dev.txt');
    const browserInstall = ci.indexOf('python -m playwright install --with-deps chromium');
    const checks = ci.indexOf('python tests/browser/run.py --mode native --visual');
    assert.ok(dependencyInstall >= 0 && browserInstall > dependencyInstall && checks > browserInstall);
    assert.match(ci, /python -m pip check/);
    assert.match(ci, /python -m playwright --version/);
    assert.doesNotMatch(ci, /--mode dom/);
    assert.doesNotMatch(ci, /pip-install:/); // Removed from setup-python v7.
});

test('Pages pull requests exercise packaging without configuring or deploying a site', () => {
    assert.ok(deployStart > 0, 'Missing independent deploy job');
    assert.match(pages, /'on':\n  pull_request:\n  workflow_dispatch:\n/);
    assert.match(build, /if: github.event_name == 'workflow_dispatch'\n\s+uses: actions\/configure-pages@/);
    assert.match(build, /uses: actions\/upload-pages-artifact@/);
    assert.match(build, /path: dist\n/);
    assert.doesNotMatch(build, /:\s*write\b/);
    assert.match(deploy, /if: github.event_name == 'workflow_dispatch' && github.ref == format\('refs\/heads\/\{0\}', github.event.repository.default_branch\)/);
    assert.match(deploy, /needs: build/);
    assert.match(deploy, /permissions:\n      pages: write\n      id-token: write/);
    assert.match(deploy, /name: github-pages/);
});

test('Pages refuses manual publication from another branch and isolates PR concurrency', () => {
    assert.match(build, /if: github.event_name == 'workflow_dispatch' && github.ref != format\('refs\/heads\/\{0\}', github.event.repository.default_branch\)/);
    assert.match(build, /Select the repository default branch for a Pages deployment\.[\s\S]*?exit 1/);
    assert.match(pages, /group: pages-\$\{\{ github.event_name \}\}-\$\{\{ github.ref \}\}/);
});

test('routine Dependabot updates are monthly and majors are not silently grouped or ignored', () => {
    assert.equal((dependabot.match(/interval: monthly/g) || []).length, 2);
    assert.equal((dependabot.match(/applies-to: version-updates/g) || []).length, 2);
    assert.equal((dependabot.match(/update-types: \[minor, patch\]/g) || []).length, 2);
    assert.match(dependabot, /exclude-patterns: \[playwright\]/);
    assert.doesNotMatch(dependabot, /^\s*(ignore|target-branch):/m);
    assert.doesNotMatch(dependabot, /open-pull-requests-limit:\s*0\b/);
});

test('optional Python tools retain exact version pins', async () => {
    const requirements = (await read('requirements-dev.txt')).split('\n')
        .filter(line => line.trim() && !line.startsWith('#'));
    assert.ok(requirements.some(line => line.startsWith('playwright==')));
    for (const line of requirements) assert.match(line, /^[A-Za-z0-9_.-]+==\d+\.\d+\.\d+$/);
});


test('browser CI verifies actual Pages entry points after installing Chromium', () => {
    const install = ci.indexOf('python -m playwright install --with-deps chromium');
    const pagesCheck = ci.indexOf('python tests/browser/pages.py --output qa/ci/pages');
    assert.ok(install >= 0 && pagesCheck > install);
    assert.match(ci, /pages\.py --output qa\/ci\/pages 2>&1 \| tee qa\/ci\/pages\.log/);
});

test('Mathema and Aristo native checks are available locally and required by browser CI', async () => {
    const scripts = JSON.parse(await read('package.json')).scripts;
    assert.equal(scripts['test:new-instruments'], 'python tests/browser/new_instruments.py --mode native');
    const install = ci.indexOf('python -m playwright install --with-deps chromium');
    const focused = ci.indexOf('python tests/browser/new_instruments.py --mode native --visual --output qa/ci/new-instruments');
    const upload = ci.indexOf('- name: Preserve actual results, including failures');
    assert.ok(install >= 0 && focused > install && upload > focused);
    assert.match(ci, /new_instruments\.py --mode native --visual --output qa\/ci\/new-instruments 2>&1 \| tee qa\/ci\/new-instruments\.log/);
    assert.match(ci.slice(upload), /if: always\(\)[\s\S]*path: qa\/ci\//);
});


test('focused Node native suites use the browser revision installed by Python Playwright', () => {
    const install = ci.indexOf('python -m playwright install --with-deps chromium');
    const selection = ci.indexOf('- name: Select the matching Node Playwright client');
    const upload = ci.indexOf('- name: Preserve actual results, including failures');
    assert.ok(install >= 0 && selection > install && upload > selection);
    const setup = ci.slice(selection, ci.indexOf('- name: Check JSON programme schemas', selection));
    assert.match(setup, /import playwright/);
    assert.match(setup, /Path\(playwright\.__file__\)\.resolve\(\)\.parent \/ 'driver' \/ 'package'/);
    assert.match(setup, /os\.environ\['GITHUB_ENV'\]/);
    assert.match(setup, /PLAYWRIGHT_NODE_MODULE=/);
    assert.doesNotMatch(ci, /npm install|npx playwright install/);
    for (const [runner, output, visual] of [
        ['historical_cursors', 'historical-cursors', ' --visual'],
        ['cursor_appearance', 'cursor-appearance', ''],
        ['display_precision', 'display-precision', ''],
        ['slide_preset', 'slide-preset', ''],
        ['slide_wraparound', 'slide-wraparound', '']
    ]) {
        const command = `node tests/browser/${runner}.mjs${visual} --output qa/ci/${output} 2>&1 | tee qa/ci/${output}.log`;
        const start = ci.indexOf(command);
        assert.ok(start > selection && start < upload, runner + ': native check absent from retained CI scope');
        const step = ci.slice(ci.lastIndexOf('      - name:', start), start);
        assert.match(step, /if: \$\{\{ !cancelled\(\) && steps\.node_playwright\.outcome == 'success' \}\}/,
            runner + ': each native suite must still run after another suite fails');
    }
});
