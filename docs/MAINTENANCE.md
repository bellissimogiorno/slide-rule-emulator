# Dependencies and workflow maintenance

The emulator has no runtime npm dependencies. Dependencies below are development,
verification and publication tools; updating them does not alter scale formulae.
Workflow checks remain required review evidence, not a guarantee of correctness.

## Selected toolchain

Direct action references in `.github/workflows/` are pinned to the release commits
listed below, with readable version comments. The full SHA prevents a moved tag
from silently selecting different code. It does not establish that the action or
its own dependencies are vulnerability-free.

| Tool | Selected release | Upstream release / documentation |
| --- | --- | --- |
| `actions/checkout` | 7.0.1 | [Release](https://github.com/actions/checkout/releases/tag/v7.0.1) |
| `actions/setup-node` | 7.1.0 | [Release](https://github.com/actions/setup-node/releases/tag/v7.1.0) |
| `actions/setup-python` | 7.0.0 | [Release](https://github.com/actions/setup-python/releases/tag/v7.0.0) |
| `actions/upload-artifact` | 7.0.1 | [Release](https://github.com/actions/upload-artifact/releases/tag/v7.0.1) |
| `actions/configure-pages` | 6.0.0 | [Release](https://github.com/actions/configure-pages/releases/tag/v6.0.0) |
| `actions/upload-pages-artifact` | 5.0.0 | [Release](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0) |
| `actions/deploy-pages` | 5.0.1 | [Release](https://github.com/actions/deploy-pages/releases/tag/v5.0.1) |
| Python Playwright | 1.63.0 | [Release](https://github.com/microsoft/playwright-python/releases/tag/v1.63.0) |

The authoritative action selections are the workflow `uses:` entries;
`requirements-dev.txt` is authoritative for Python tools. Keep this table in sync
when accepting an update. Pillow and jsonschema are also pinned in that file.
The Python packages are direct pins, not a fully locked transitive environment.

The workflows target GitHub.com-hosted Ubuntu 24.04 runners. Core checks use Node
22 and 24; browser and Pages jobs use Node 24. Python is 3.13. The actions' own
Node runtime is separate from the Node version selected for the application tests.
Custom runners and GitHub Enterprise Server need their own compatibility review.

Playwright has version-specific browser binaries. Install the package first, then
run `python -m playwright install --with-deps chromium` on Linux CI. Do not reuse
an unrelated system browser as evidence that an updated Playwright/browser pair
passes. See [Playwright browser requirements](https://playwright.dev/python/docs/browsers).

The workflows install Python packages explicitly using pip; they do not use the
removed `setup-python` `pip-install` input. General evidence uploads retain the
default archive mode. The Pages uploader packages `dist/` as a Pages artefact;
ordinary pull requests do not deploy it.

## Dependabot policy

`.github/dependabot.yml` requests monthly checks for GitHub Actions and pip.
Minor/patch Actions updates are grouped together. Minor/patch Python-tool updates
are grouped except for Playwright, which stays separate because its browser
revision may change. Major updates remain separate. There is no automatic merge,
ignored-version rule or rule disabling security updates.

These groups apply to version updates only. Repository-level Dependabot alerts
and security updates still need to be enabled and managed in GitHub settings;
shipping a configuration file does not enable all those settings. GitHub documents
that vulnerable-action alerts are limited to semantic-version references rather
than SHA-pinned actions. Keep version-update proposals enabled and review upstream
security notices as well; do not treat the absence of an alert as proof of safety.

See GitHub's [Dependabot options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)
and [secure-use reference](https://docs.github.com/actions/reference/secure-use-reference).

## Reviewing an update

Read the upstream release notes and changed inputs, runtime requirements and
permissions. Verify a proposed SHA against the official action repository and its
release tag; preserve the version comment. Update all direct uses consistently.
A SHA's syntax alone does not establish its origin.

Run `npm run verify`, then install the selected Python dependencies and matching
browser and run native functional/rendering checks. Do not widen mathematical or
visual tolerances merely to accommodate a dependency update. Review changed
screenshots where rendering differs. Confirm both Node jobs complete.

For Pages changes, review the non-deploying PR packaging check, then separately
verify the manual deployment from the default branch. Only the deployment job
has Pages write and identity-token permissions. Never switch testing to
`pull_request_target`, add write permissions to verification, or expose a secret
to untrusted PR code to make a failing dependency proposal pass.

## Diagnosing red checks

A red PR badge is not an error log. Compare the failing step with the default
branch and other PRs before attributing it to the proposed dependency.

The **Verify** workflow retains `core-node-22-evidence`,
`core-node-24-evidence` and `chromium-native-evidence`. Core evidence contains the
runtime versions and `verify.log`. Browser evidence separates build, pip install,
pip consistency, installed versions, browser installation, schema, Pages entry-point and browser
logs. The separate `pages/pages-native.json` records homepage navigation checks. `browser-native.json` contains the executed groups, actual versions and
fatal traceback when available. Functional failures attempt a screenshot.
If checkout/setup fails before logging starts, use the failed workflow step's log.

For workflow-based publication, **Pages (check; manual deploy)** also retains `pages-build-evidence`. Branch-root and branch-docs publication use the committed entry points and GitHub's branch-based Pages deployment; see [publishing methods](RELEASING.md#github-pages-site).
Artefacts expire after 14 days; the deployable Pages artefact has a one-day
retention. Cancelled or infrastructure-failed jobs may not finish uploading logs.

Fix a shared default-branch failure before blaming multiple unrelated upgrades.
Rebase an older Dependabot PR by commenting `@dependabot rebase`, then review the
new run rather than its previous status. When equivalent dependency updates are
already committed, check the PR diff and close any remaining redundant proposal;
do not merge it merely to remove the notification. Keep unrelated local changes
when applying a packaged release.

QA logs, screenshots and downloaded tools stay outside release archives. Use
[testing](TESTING.md) and [release instructions](RELEASING.md) to create reproducible
evidence without turning local diagnostics into a claim of hosted verification.
