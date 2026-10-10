# Security and data handling

The application is static and works without a backend, login, telemetry, network request or service worker. Custom formulae use a restricted expression parser rather than JavaScript evaluation. Imported and stored programmes pass through a bounded validator before becoming live state. UI text and JSON embedded in configured HTML are escaped.

These are mitigations, not a formal security proof. Numerical probes cannot prove that arbitrary input is well behaved. Explicit limits bound programme size, nesting, scale count, rows, expression complexity and tick generation. Tests exercise invalid tick strategies and numerical loops that could otherwise fail to advance.

Programmes may be stored in the browser and embedded in exported HTML. Treat exports as data you are publishing, especially custom descriptions. Storage is not a backup; retain portable JSON copies. Browser storage policies vary, so test persistence in the intended deployment environment. The application reports storage denial and supports recovery of rejected data.

The preview server binds to 127.0.0.1, serves only the application and does not expose an arbitrary directory. It is a development convenience, not a production server. GitHub workflows use limited permissions, no repository secrets and manual-only Pages publication. Review workflows before enabling them in a repository containing sensitive material.

## Reporting vulnerabilities

The repository owner should enable private vulnerability reporting or supply a security contact before public release. Do not post private programmes, credentials or sensitive exploit material in public issues. Report the affected version, minimal reproduction and whether data integrity, availability or code execution is involved.

## Appropriate use

This is an educational calculator, not a safety-critical or metrology-certified system. Independently cross-check consequential calculations. See [instrument fidelity and limitations](docs/HISTORICAL_FIDELITY.md).
