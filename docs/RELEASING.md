# Publishing and releases

## Upload to GitHub

Use the repository contents, including `.github/`, as the repository root. Do not upload the ZIP as the only repository file. Include [LICENSE](../LICENSE) and read [LICENSING.md](../LICENSING.md) for the MIT licence and third-party reference notes.

```sh
npm run verify
git init -b main
git add .
git commit -m "Slide-rule emulator v3.2.4"
# Create an empty repository, then substitute its actual URL:
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

Do not commit access tokens, virtual environments, installed packages, local reports containing private programmes or release archives. The ignore file provides defaults, not a secret scanner.

The verification workflow uses read-only permissions and runs the numerical/build checks and native Chromium matrix. Review its actual results before advertising deployment-tested behaviour.

## Optional GitHub Pages site

The **Pages (check; manual deploy)** workflow verifies the source and packages `dist/` on pull requests, but does not configure or deploy a website for them. This exercises the Pages uploader during dependency review without granting publication permissions.

To publish, select GitHub Actions as the publishing source in repository Settings / Pages, then manually run **Pages (check; manual deploy)** from the repository's default branch. Manual dispatch from another branch fails explicitly. The independent deployment-job guard also requires manual dispatch from the default branch. The build job has read-only contents/Pages access; only the deployment job receives Pages write and identity-token permissions, and it uses the `github-pages` environment. Use an environment approval rule when publication needs approval.

A successful pull-request packaging check does not establish that site configuration, environment approvals or the remote deployment API will work. Verify the manual deployment separately. Pull-request and manual runs have separate concurrency groups.

The workflow follows [GitHub's custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). It deploys the application, not source, tests or local reports. The import map contains all JavaScript internally, so no repository-specific URL base is needed. A host Content Security Policy must allow the inline/import-map/data-module design described in [architecture](ARCHITECTURE.md).

## Prepare a release

1. Check that `VERSION`, `package.json`, `package-lock.json` and `src/version.js` agree. `VERSION` contains only the version number and a final newline; `npm run check` verifies it against `package.json`. Do not change the persistent storage key merely to match a release number.
2. Update current documentation and run `npm run catalogue` after catalogue changes.
3. Run `npm run build`, then `npm run verify`. Commit the generated `dist/index.html` with the source.
4. Run native browser checks and review screenshots for UI changes. Record unavailable environments rather than implying a pass.
5. Run `npm run release`. It verifies the repository and writes a deterministic ZIP, internal `MANIFEST.sha256` and external ZIP checksum to `releases/`.
6. Run `python tools/verify_archive.py releases/slide-rule-emulator-v3.2.4-github.zip`, extract the archive into a fresh directory, and run `npm run verify` there. Use the matching filename when preparing another version.
7. Publish the verified archive and its checksum. Keep supporting workflow artefacts separately from the distributable repository.

The packaging tool includes an explicit set of source, test, documentation, configuration and application files. It excludes `qa/`, release archives, installed dependencies and caches; rejects symlinks and sensitive file types; and uses fixed ZIP timestamps, ordering and normalised permissions. Identical repository bytes produce an identical archive.

## Maintenance

Preserve the MIT copyright and permission notice, keep package metadata consistent, and retain the embedded licence when distributing standalone HTML copies. Do not assume rights to manufacturer scans or font files. Direct GitHub Actions references use full commit SHA pins with release-version comments. Dependabot proposes monthly updates; routine minor/patch updates are grouped, while major changes and Playwright stay individually reviewable. There is no automatic merge. Optional Python test dependencies are pinned, and CI installs the browser revision required by the selected Playwright package. See [dependency maintenance](MAINTENANCE.md) for review, security-alert limitations and failed-check diagnosis.
