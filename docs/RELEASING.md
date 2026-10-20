# Publishing and releases

## Upload to GitHub

Use the repository contents, including `.github/`, as the repository root. Do not upload the ZIP as the only repository file. Include [LICENSE](../LICENSE) and read [LICENSING.md](../LICENSING.md) for the MIT licence and third-party reference notes.

```sh
npm run verify
git init -b main
git add .
git commit -m "Slide-rule emulator v3.2.40"
# Create an empty repository, then substitute its actual URL:
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

Do not commit access tokens, virtual environments, installed packages, local reports containing private programmes or release archives. The ignore file provides defaults, not a secret scanner.

The verification workflow uses read-only permissions and runs the numerical/build checks and native Chromium matrix. Review its actual results before advertising deployment-tested behaviour.

## GitHub Pages site

The website's home page is the emulator, not the README. `npm run build` writes
identical, self-contained `index.html` files at the repository root, in `docs/`
and in `dist/`. Each directory also has an empty `.nojekyll` file. These are
**generated files**: commit them, but edit `src/` instead. Build verification
rejects any missing or stale copy or marker.

GitHub Pages [requires the entry file at the top of the publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).
Choose **one** of the following publishing methods in repository settings.

### Branch publication (simplest)

1. Upload the contents of `slide-rule-emulator/` as the repository root, including
   `index.html`, `.nojekyll`, `VERSION`, `LICENSE` and `.github/`. Do not add an extra
   enclosing `slide-rule-emulator/` folder inside the repository.
2. In **Settings → Pages → Build and deployment**, set **Source** to
   **Deploy from a branch**. Select the branch containing the committed build
   (usually `main`) and **/ (root)**, then **Save**.
3. Wait for GitHub's branch-based Pages deployment to finish, then use **Visit
   site** in the Pages settings. Later commits to that publishing branch update
   the site automatically. No run of the custom manual Pages workflow is needed.

The **/docs** folder option is also supported; select it instead of **/ (root)**
to publish `docs/index.html`. Both files contain the actual emulator, not a
redirect to another folder. The `.nojekyll` marker bypasses Jekyll's Markdown
processing for branch publication. The repository's **Code** tab still displays
`README.md`; that is distinct from the published Pages website.

Branch publication can make other files in the selected folder publicly
accessible. Use the workflow method below to publish only the standalone
application. Do not put secrets or private programmes in either publishing root.

See [GitHub's publishing-source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
The archive cannot change a repository's Pages source setting.

### Workflow publication (application-only)

The **Pages (check; manual deploy)** workflow verifies the source and packages
`dist/` on pull requests, but does not configure or deploy a website for them.
It exercises the Pages uploader during dependency review without granting
publication permissions.

To publish, select **GitHub Actions** as the publishing source in **Settings →
Pages**, then manually run **Pages (check; manual deploy)** from the repository's
default branch. Manual dispatch from another branch fails explicitly. The
independent deployment-job guard also requires manual dispatch from the default
branch. Only the deployment job receives Pages write and identity-token
permissions, and it uses the `github-pages` environment. Use an environment
approval rule when publication needs approval.

A successful pull-request packaging check does not establish that site
configuration, environment approvals or the remote deployment API will work.
Verify the manual deployment separately. Pull-request and manual runs have
separate concurrency groups. Remove or disable another custom workflow that
publishes a competing site before using this method.

The workflow follows [GitHub's custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
It deploys the application, not source, tests or local reports. All three copies
embed their CSS and JavaScript internally, so origin-root sites, repository
subpaths and custom domains need no repository-specific URL base. A host Content
Security Policy must allow the inline/import-map/data-module design described
in [architecture](ARCHITECTURE.md).

### When the site shows the README or an old page

Check the **published URL** from Pages settings, not the repository Code page.
Confirm that the selected branch and folder contain this release's `index.html`
and `.nojekyll` at their top level. Confirm that those files were actually
committed; adding them only to a local checkout does not change the website.
The Pages setting cannot select `dist/` for branch publication: use **/ (root)**,
**/docs**, or the GitHub Actions method above.

Review the deployment run linked from Pages settings and its commit before
refreshing the site. For workflow publication, run the manual workflow after
committing an update. When a deployment succeeds but an older page remains,
hard-refresh or try a private browser window. Preserve any existing custom-domain
configuration; this package does not create or replace a `CNAME` file.

## Prepare a release

1. Check that `VERSION`, `package.json`, `package-lock.json` and `src/version.js` agree. `VERSION` contains only the version number and a final newline; `npm run check` verifies it against `package.json`. Do not change the persistent storage key merely to match a release number.
2. Update current documentation and run `npm run catalogue` after catalogue changes.
3. Run `npm run build`, then `npm run verify`. Commit `index.html`, `docs/index.html`, `dist/index.html` and their `.nojekyll` files with the source.
4. Run `npm run test:pages` and the native browser checks; review screenshots for UI changes. Record unavailable environments rather than implying a pass.
5. Run `npm run release`. It verifies the repository and writes a deterministic ZIP, internal `MANIFEST.sha256` and external ZIP checksum to `releases/`.
6. Run `python tools/verify_archive.py releases/slide-rule-emulator-v3.2.40-github.zip`, extract the archive into a fresh directory, and run `npm run verify` there. Use the matching filename when preparing another version.
7. Publish the verified archive and its checksum. Keep supporting workflow artefacts separately from the distributable repository.

The packaging tool includes an explicit set of source, test, documentation, configuration and application files. It excludes `qa/`, release archives, installed dependencies and caches; rejects symlinks and sensitive file types; and uses fixed ZIP timestamps, ordering and normalised permissions. Identical repository bytes produce an identical archive.

## Maintenance

Preserve the MIT copyright and permission notice, keep package metadata consistent, and retain the embedded licence when distributing standalone HTML copies. Do not assume rights to manufacturer scans or font files. Direct GitHub Actions references use full commit SHA pins with release-version comments. Dependabot proposes monthly updates; routine minor/patch updates are grouped, while major changes and Playwright stay individually reviewable. There is no automatic merge. Optional Python test dependencies are pinned, and CI installs the browser revision required by the selected Playwright package. See [dependency maintenance](MAINTENANCE.md) for review, security-alert limitations and failed-check diagnosis.
