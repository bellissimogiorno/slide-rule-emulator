/** Shared native-test dependency selection; never installs tools or browsers.
 * PLAYWRIGHT_NODE_MODULE explicitly selects a package directory, including the
 * playwright-core copy shipped in Python Playwright's driver/package. This
 * keeps the JavaScript client and installed browser revision in agreement.
 */
import { createRequire } from 'node:module';
import { join } from 'node:path';

const requirePackage = createRequire(import.meta.url);

function loadPackage(specifier, requireModule) {
    const playwright = requireModule(specifier);
    if (typeof playwright?.chromium?.launch !== 'function')
        throw new TypeError(`Playwright package ${specifier} does not expose chromium.launch.`);
    const metadata = requireModule(specifier === 'playwright'
        ? 'playwright/package.json' : join(specifier, 'package.json'));
    return { playwright, version: metadata.version, modulePath: specifier };
}

/** The explicit override is authoritative: an invalid path must fail rather
 * than silently selecting another toolchain. Otherwise retain local-package
 * selection followed by the managed-runtime fallback used by these runners.
 * Dependency injection lets the selection policy be tested without installing
 * Playwright, constructing fake packages or launching a browser.
 */
export function loadPlaywright({ env = process.env, requireModule = requirePackage } = {}) {
    if (env.PLAYWRIGHT_NODE_MODULE)
        return loadPackage(env.PLAYWRIGHT_NODE_MODULE, requireModule);
    try {
        return loadPackage('playwright', requireModule);
    } catch (error) {
        if (!env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw error;
        return loadPackage(join(env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'), requireModule);
    }
}
