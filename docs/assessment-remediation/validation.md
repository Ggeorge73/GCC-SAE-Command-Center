# Remediation validation

The original September 10 assessment found 13 failed acceptance cases. Its additional tests were retained and integrated into the repository suites; none of the substantive original expectations was weakened. The existing navigation helper was made atomic when reading a tab that can unmount during navigation, and an assessment screenshot now attaches to the test report instead of writing into a source folder.

Local verification:

- CI-mode production build with `/Law-Suite/` asset paths: passed.
- Full Chromium regression run: **65/65 passed**, covering the 30 original browser tests, all 28 assessment browser cases, four connected-practice journeys and three additional persistence/event tests.
- Review, schema, merge, workflow and financial-arithmetic unit tests: **15/15 passed**.
- Isolated Python tests: **21 passed**; the additional real-Mongo test is explicitly skipped locally because no disposable MongoDB is connected. The CI workflow runs it separately against its disposable MongoDB service.
- Accessibility: **13 sampled screens, no confirmed automated violations**. Gradient contrast still produces incomplete checks; this is not full WCAG/assistive-technology certification.
- Locked npm audit: **37 → 16 affected-package entries**. The remaining 11 high and five moderate entries are documented in `dependency-triage.md`; the audit remains nonzero.
- Desktop and mobile Practice desk captures reviewed for layout and readability.

After that full run, a small wizard control was added to start another draft without overwriting the earlier saved intake/proposal, with one additional regression case. The final build passed, followed by **5/5 Practice desk browser cases**, including that new case. The complete suite now contains 66 browser cases. CI runs the full inventory against the pull request commit.

The local HTML report is generated in `frontend/playwright-report/index.html`; GitHub CI uploads its own report artifact for the exact checked commit. Build/test output does not imply deployment or readiness for confidential client use.
