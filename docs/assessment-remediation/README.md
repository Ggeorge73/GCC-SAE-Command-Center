# September 10 assessment remediation

Source: the user's `assessment-2026-09-10/LAW_SUITE_SENIOR_PARTNER_ASSESSMENT.md`, assessed tree `6f4b25a6c6cd6ce44b7784f2704a1454a2d41841`.

The original assessment and evidence remain unchanged outside this repository. Acceptance tests were copied into the normal browser and Python suites so future CI runs exercise the findings.

## Finding dispositions

| Finding | Implementation | Verification and limits |
|---|---|---|
| F01 | A synchronous edit journal survives immediate refresh; Web Locks serialize canonical read/merge/write; three-way record merging retains independent edits. Competing edits retain the newer saved record and make the attempted version downloadable. Matter records merge atomically to prevent approval/source mixtures. Storage events update other tabs. | P03/P04, conflict recovery and locked-refresh browser tests, plus merge tests. Browser-local only; not a multi-user database or immutable history. Browsers without Web Locks explicitly warn and retain recovery intents instead of overwriting canonical records unsafely. |
| F02 | Requests carry a matter ID in their URL; details and related-matter actions resolve that ID; unknown IDs fail clearly. | P02; direct-link coverage. |
| F03 | Shared proposal list, stable service IDs, retrieval selector, explicit Draft state, matching edit links; creation selects its saved proposal. | P08/S03; unrelated default service retained. |
| F04 | Full searchable event list with all/upcoming/past filters and edit/date/removal controls. | P05 plus event edit regression. These are internal planning times, not legal deadlines or delivered reminders. |
| F05 | Shape/date validation, salvage of valid list records, preserved recovery copies, version/revision metadata, visible errors, root recovery boundary. | P07 and malformed-schema unit coverage. Export recovery before resetting incompatible data. |
| F06 | Required text rejects whitespace in shared UI fields; API names trim and enforce length, checklist dates validate. | P09/A01 and negative validation tests. |
| F07 | Review measures bind to stable person initials before filtering. | S01. Metrics remain explicitly illustrative. |
| F08 | One checklist status type validates creation and update; names and dates are validated. | A02 and baseline API tests. |
| F09 | Missing parents block checklist/advisory creation and related listings. API still fails closed outside explicitly opted-in loopback development. | A03/A04. Authenticated per-firm permissions and transactional deletion races remain production requirements. |
| F10 | Idempotency-Key derives a stable initialization ID. Default controls stage under deterministic IDs; the matter publishes only after all controls exist. Retries resume staging; conflicting payloads return 409. | A08 and faults at all four writes. Staged controls may remain after interruption; retry with the same key to recover. This is recoverable initialization on standalone MongoDB, not a transaction. Real Mongo validation is a separate CI gate. |
| Q01 | Darker interactive blues and lighter blue text tokens; appearance accents use readable foreground/background pairs. | Fresh automated contrast scans plus responsive/keyboard regression; not a screen-reader conformance certification. |
| Q02 | Compatible locked dependency updates and documented remaining advisory chains. | See dependency audit and triage. A passing build does not prove exploitability absent. |

## Connected demo journeys

The Practice desk adds a retrievable intake queue, documented conflicts and engagement decisions, one-time matter opening, attorney time ledger, matter-scoped invoice drafts, partner billing review, printable invoice export, client instruction/update records, partner-approved client draft export, research instruction queue, approval-gated closing preparation, checksummed workspace export/reimport, and observed pilot-effort records.

New matters start with missing evidence and no approval. They do not inherit Northstar's facts or sources. Opening requires two recorded decisions and a simulated partner; this is not an automated conflicts service. Invoice lines are snapshots in integer cents and billed time cannot be picked up twice. No messages, invoices, payment requests, or invitations are transmitted.

The Research request queue captures jurisdiction, owner, sources expected, and known limitations. It does not manufacture authorities or describe filename storage as document analysis. Checklist defaults now ask for applicability review instead of inferring financing obligations from a US jurisdiction string. API list endpoints have bounded offset/limit paging and deterministic ordering. Checklist updates append local-demo history as well as current status.

## Production dependencies retained from the report

The user's existing instruction describes a demonstration without a live operations database. These requirements therefore remain explicit implementation gates rather than claims of completion:

1. Choose identity provider, firm/role matrix, backend database and storage region; implement authenticated actors, tenancy, matter authorization, ethical walls and deprovisioning; test cross-firm and cross-matter denial.
2. Use versioned durable records, optimistic concurrency, audit events, transactional related-record changes, encryption/key management and tested backup recovery. The local merge/recovery mechanism is a demo safeguard, not that architecture.
3. Choose licensed legal sources and approved document storage; implement extraction/OCR quality evaluation, matter-scoped retrieval, pinpoint provenance, treatment/currency checks, and lawyer-scored answer/error benchmarks before enabling research claims.
4. Choose calendar/email/billing providers. Implement time zones, delivery receipts, failed reminder escalation, client-channel authorization, receipts and reconciliation. Trust/client-money accounting is explicitly outside this demonstration.
5. Validate legal deadline rules by the firm's jurisdictions and practices; enforce retention, legal hold, final-version preservation and deletion reconciliation on real storage; test restoration and incident handling.
6. Run supported-browser, assistive-technology, load, low-connectivity, security and controlled productivity pilots against agreed firm baselines. The observations ledger does not establish savings by itself.

No production deployment or live-data adoption is implied by this change. These gates trace the report's sections A–G and release sequences 2–6; none has been silently marked implemented by adding a preview form.
