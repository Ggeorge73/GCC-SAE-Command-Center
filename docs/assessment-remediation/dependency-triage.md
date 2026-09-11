# Dependency advisory disposition — September 10, 2026

The assessment counted 37 affected-package entries (16 high, 10 moderate, 11 low). After compatible lockfile updates, ESLint 9.39.5, and explicit patched overrides for `qs` 6.16.0, `underscore` 1.13.8, and `@tootallnate/once` 2.0.1, the fresh locked audit records **16 entries: 11 high, 5 moderate, zero low or critical**. These entries include parent dependency chains and are not 16 independently established exploits.

`dependency-audit.json` contains exact advisory links, ranges, paths, and npm's suggested changes. The audit exits nonzero because findings remain. No force install of npm's suggested `react-scripts@0.0.0` was performed: that would remove the working build toolchain rather than provide a reviewed migration.

| Remaining entries | Actual use / exposure | Disposition |
|---|---|---|
| `@svgr/plugin-svgo`, `@svgr/webpack`, `svgo`, `css-select`, `nth-check` | CRA/webpack SVG transformation during a build; not a legal-document parsing endpoint | Replace the legacy SVG/build chain in a separately validated toolchain migration. Do not accept untrusted repository/build inputs. |
| `resolve-url-loader`, nested `postcss` | Build-time stylesheet/Sass URL handling | Replace the legacy loader chain. Uploaded documents are not passed to it. |
| `css-minimizer-webpack-plugin`, `serialize-javascript` | Build-time minifier serialization | Upgrade the minifier and serializer together; a major override requires compatibility testing. |
| `rollup-plugin-terser`, `workbox-build`, `workbox-webpack-plugin` | CRA's service-worker build tooling; this app does not register a service worker | Remove with the CRA migration; do not equate an unused plugin chain with a reachable production exploit. |
| `webpack-dev-server`, `sockjs`, nested `uuid` | Local development server and its transport, not the static Pages host | Bind development to loopback; replace the old dev server as part of migration. |
| `react-scripts` | Aggregates the affected build/test/dev chains above | Track a supported build-tool replacement. Static production output and development tooling have different exposure, but the audit has not certified the output secure. |

The original entries no longer reported are `@eslint/plugin-kit`, `@jest/core`, `@tootallnate/once`, `ajv`, `bfj`, `body-parser`, `colord`, `eslint`, `express`, `fast-uri`, `http-proxy-agent`, `jest`, `jest-cli`, `jest-config`, `jest-environment-jsdom`, `jest-runner`, `js-yaml`, `jsdom`, `jsonpath`, `qs`, and `underscore`.

Primary advisory examples checked during remediation: [query-parser bounds](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx), [once control-flow correction](https://github.com/advisories/GHSA-vpq2-c234-7xj6), and [serializer exhaustion](https://github.com/advisories/GHSA-qj8w-gfj5-8c6v). The last requires serializer 7.0.5 or later and remains in the legacy build chain.

This is dependency triage and partial remediation, not a penetration test or production-security certification. Python advisory screening, supply-chain review and an independent security assessment remain release gates from the original report.
