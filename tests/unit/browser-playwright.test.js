/** Dependency selection must not silently switch a requested browser toolchain. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { loadPlaywright } from '../browser/playwright.mjs';

const api = { chromium: { launch() {} } };
function resolver(packages) {
    const calls = [];
    const requireModule = specifier => {
        calls.push(specifier);
        if (!packages.has(specifier)) {
            const error = new Error('Module unavailable: ' + specifier);
            error.code = 'MODULE_NOT_FOUND';
            throw error;
        }
        const value = packages.get(specifier);
        if (value instanceof Error) throw value;
        return value;
    };
    return { calls, requireModule };
}
function packageEntries(specifier, version) {
    return [[specifier, api], [specifier === 'playwright'
        ? 'playwright/package.json' : join(specifier, 'package.json'), { version }]];
}

test('explicit package path selects its API and metadata before installed alternatives', () => {
    const modulePath = join('python-environment', 'playwright', 'driver', 'package');
    const f = resolver(new Map([...packageEntries(modulePath, '1.2.3'), ...packageEntries('playwright', '9.9.9')]));
    const result = loadPlaywright({ env: { PLAYWRIGHT_NODE_MODULE: modulePath,
        CODEX_PRIMARY_RUNTIME_NODE_MODULES: 'runtime' }, requireModule: f.requireModule });
    assert.deepEqual(result, { playwright: api, version: '1.2.3', modulePath });
    assert.deepEqual(f.calls, [modulePath, join(modulePath, 'package.json')]);
});

test('invalid explicit selection fails without trying a different browser revision', () => {
    const f = resolver(new Map(packageEntries('playwright', '9.9.9')));
    assert.throws(() => loadPlaywright({ env: { PLAYWRIGHT_NODE_MODULE: 'missing',
        CODEX_PRIMARY_RUNTIME_NODE_MODULES: 'runtime' }, requireModule: f.requireModule }), /Module unavailable: missing/);
    assert.deepEqual(f.calls, ['missing']);
});

test('local Playwright retains priority over the managed runtime fallback', () => {
    const f = resolver(new Map(packageEntries('playwright', '1.2.3')));
    assert.equal(loadPlaywright({ env: { CODEX_PRIMARY_RUNTIME_NODE_MODULES: 'runtime' },
        requireModule: f.requireModule }).modulePath, 'playwright');
    assert.deepEqual(f.calls, ['playwright', 'playwright/package.json']);
});

test('managed-runtime fallback supplies both API and matching version when local loading fails', () => {
    const modulePath = join('runtime', 'playwright');
    const f = resolver(new Map(packageEntries(modulePath, '4.5.6')));
    const result = loadPlaywright({ env: { CODEX_PRIMARY_RUNTIME_NODE_MODULES: 'runtime' }, requireModule: f.requireModule });
    assert.deepEqual(result, { playwright: api, version: '4.5.6', modulePath });
    assert.deepEqual(f.calls, ['playwright', modulePath, join(modulePath, 'package.json')]);
});

test('missing local dependency preserves its original error when no fallback is configured', () => {
    const original = new Error('Installation is incomplete.');
    const f = resolver(new Map([['playwright', original]]));
    assert.throws(() => loadPlaywright({ env: {}, requireModule: f.requireModule }), error => error === original);
    assert.deepEqual(f.calls, ['playwright']);
});

test('an explicit package without the native Chromium API is rejected before launch', () => {
    const f = resolver(new Map([['wrong-package', {}]]));
    assert.throws(() => loadPlaywright({ env: { PLAYWRIGHT_NODE_MODULE: 'wrong-package' },
        requireModule: f.requireModule }), /does not expose chromium.launch/);
    assert.deepEqual(f.calls, ['wrong-package']);
});
