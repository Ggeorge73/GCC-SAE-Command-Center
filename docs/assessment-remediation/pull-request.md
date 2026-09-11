The senior-partner assessment exposed lost multi-tab edits, wrong-client request details, disconnected service drafts, calendar management gaps, invalid record acceptance and changing report metrics. This change corrects those demo workflows, adds durable pending-edit recovery, and retains the assessment's acceptance cases in CI.

The new Practice desk connects saved intake review to one approved demo matter, attorney time to reviewed invoice drafts, client requests and approved update drafts, research instructions, closing preparation, checksummed workspace restore and pilot observations. Existing design and evidence-review safeguards remain in place. No external messages, payment requests, authenticated approvals or live research are simulated as completed operations.

The optional local API validates names/statuses/dates, rejects missing parent matters, supports bounded paging, replaces inferred jurisdiction obligations with applicability-review controls, and makes interrupted matter initialization retryable with an Idempotency-Key. CI adds an isolated real-Mongo fault/retry check.

Validation: production build; 65-case full Chromium run; 15 frontend unit tests; 21 isolated Python tests; 13-screen accessibility scan with no confirmed violations. A final additional wizard regression brings the browser inventory to 66. See `docs/assessment-remediation/validation.md` and the CI report for exact results.

Dependency findings reduced from 37 to 16. Remaining legacy build/dev-tool advisories and production identity, persistence, research, delivery, billing-provider and retention requirements are explicitly tracked in `docs/assessment-remediation/README.md` and `dependency-triage.md`. This is a hardened connected demonstration, not approval for confidential-data adoption.
