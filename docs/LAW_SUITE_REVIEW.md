# Law Suite: codebase, website, and competitive review

Reviewed September 6, 2026 against the downloaded repository and its published GitHub Pages site. Scope: application components, backend routes/model path, storage helper, entrypoint, configuration, tests, deployment workflow, and product/security documentation. Generated UI primitives were treated as scaffolding, not independently security-audited. No confidential customer material or competitor implementation was accessed.

## Conclusion

The starting product was a portfolio prototype, not a production alternative to Harvey. Renaming it or adding a larger feature list would not establish superiority. The strongest near-term direction is accountable work product review: source-level evidence, exceptions, version awareness, reviewer decisions, and explicit handoff requirements. Matter Review now makes that proposition concrete with fictional US matters. A production advantage remains a hypothesis requiring engineering, licensed content, security validation, and lawyer-led evaluation.

## Harvey's documented offering

Updated September 7, 2026 after the attorney walkthrough. [Harvey II, announced August 18](https://www.harvey.ai/blog/introducing-harvey-ii), describes inherited matter documents, parties, permissions, task routing, and memory. [Agents](https://www.harvey.ai/platform/agents) describes approval, citations, and logged steps; [Contract Intelligence](https://www.harvey.ai/platform/contract-intelligence) describes queues, assignments, playbooks, and obligations. Human review, matter context, and assignments therefore belong to the competitive baseline. Vendor-neutral review, source-change impact, and faster exception resolution remain hypotheses to evaluate, not established exclusive features.

The second demo iteration implements the attorney feedback: persistent decision drafts, notes/assignments on blocked findings, explicit exclusions, participant-stamped prerequisites, source comparisons that reopen dependent reviews, a connected working draft, reference-only text intake, internal target assumptions, and an exportable review memorandum. A layered dashboard and progress cards expose actual demo state; Firm Operations moves under Administration. These behaviors operate on fictional browser-local fixtures. They do not demonstrate legal AI accuracy, verified authorities, a Word add-in, real provider integrations, or server-enforced approvals.

This is a comparison of public vendor descriptions, not hands-on access to a paid deployment or a benchmark of legal accuracy. An undocumented feature must not be assumed absent.

| Publicly documented capability | Implication for Law Suite |
|---|---|
| Research, document work, workflow agents, and Microsoft tools in the [product walkthrough](https://help.harvey.ai/articles/harvey-product-walkthrough) | Chat, drafting, and workflow automation are baseline categories. |
| Large-collection organization and analysis in [Vault](https://www.harvey.ai/platform/vault) | A renamed upload list is not document intelligence; extraction, retrieval, permissions, and scale must be built and measured. |
| Client/co-counsel collaboration in [Spaces](https://www.harvey.ai/platform/spaces) | Shared matter work and reusable workflows are not unique inventions. |
| Adoption segmentation, peer comparisons, SCIM attributes, analytics questions, and administration in [Command Center](https://www.harvey.ai/platform/command-center) | The original administrator surface overlaps materially with this category. It should not lead the competitive proposition. |
| Word and research/productivity integrations in the [ecosystem](https://www.harvey.ai/platform/ecosystem) | Integration with actual documents and firm systems is a prerequisite. |
| Source-linked drafting and lawyer verification in its [brief-writing description](https://www.harvey.ai/blog/ai-legal-brief-writing) | Having citations and human review is insufficient differentiation; compare support accuracy and total review effort. |
| Intapp ethical-wall integration in [release notes](https://help.harvey.ai/release-notes/category/integrations) | Ethical walls are a required trust control, not an unoccupied feature category. |

## Naming and originality

- Standardize **Law Suite** in navigation, metadata, exports, API descriptions, and documentation.
- Replace **CommandCenter / Control Center** with **Firm Operations**, including component/test names and export filenames.
- Replace **Vault / The Vault** with **Document Records**. Technical protocol roles such as `assistant` remain generic implementation terms.
- Replace **Learned Silk** and inflated senior-lawyer credentials with **Law Suite Research** and explicit draft boundaries.
- Lead with **Matter Review**: sage, ivory, and deep green; a matter queue, excerpt panel, review notes, and handoff requirements authored for this project. No Harvey code, screenshots, assets, or copy were imported.
- The review identified naming and thematic overlap, not proven verbatim copying or infringement. It cannot establish provenance for every historical line. Git history is preserved; competitor names remain in comparative research citations.
- The requested name is implemented. Trademark/domain clearance was not performed; this review is not a legal clearance opinion.

## Codebase and website findings

| Priority | Baseline finding | Change / remaining work |
|---|---|---|
| Critical | Data routes had no authenticated user or tenant/matter authorization | Data API now fails closed by default, requires explicit local-demo opt-in, and rejects remote clients. Real authentication, tenancy, and authorization remain unimplemented. Do not expose the demo through a reverse proxy. |
| Critical | Model failures returned canned legal opinions described as cached advice | Removed canned legal content. Failure/empty results return an unavailable notice with `status=unavailable` and `sources_verified=false`. |
| High | Uploads were immediately called indexed; the model received only filenames | Documents now say stored. Research discloses filename-only context. No extraction, primary-law retrieval, or verification is implied. |
| High | In-memory model sessions keyed only by matter could share history and stale context | Request-scoped model calls replace shared sessions; frontend chat resets across matter/jurisdiction changes. Authenticated conversation persistence is still required. |
| High | Unlimited file reads and unverified client hashes; arbitrary external storage metadata | Added 10 MiB limit, actual-byte hash validation, matter/folder validation, and rejection of public/external registration. Disabled frontend external-storage fallback. Malware scanning and protected object storage remain required. |
| High | Public research screen advertised service without a backend and displayed SECURE | Public preview now explains the disconnected service. Unsupported security/persona claims removed. |
| Medium | Primary navigation hidden on mobile | Shared navigation and Matter Review work at 390px. Legacy connected research still needs a mobile redesign. |
| Medium | CSV ignored practice filter | Export now uses selected practice. Filter scope and sample-history limitations are explicit. |
| Medium | Access-review buttons did nothing | Buttons record sample review state and disclose that permissions are unchanged. Durable access workflows remain required. |
| Medium | Arbitrary checklist statuses; unchanged update could report not found | Status validation and matched-count existence checks added. Checklist templates remain examples, not compliance determinations. |
| Medium | Hash failure in Firebase helper silently returned a timestamp | Dormant helper now stops when hashing fails. |
| Medium | Activity aggregation could be mistaken for an immutable audit | Review export is explicitly an editable browser-local demo record; backend activity remains a mutable aggregation. |
| Medium | Large dependency scaffold and older build architecture | Builds/tests are checked; modernization and dependency reduction remain planned. No comprehensive vulnerability audit is claimed. |

## Difficult US firm workflows to prioritize

These are product hypotheses informed by public evidence and workflow reasoning, not customer-interview findings. [ABA Formal Opinion 512](https://www.americanbar.org/content/dam/aba/administrative/professional_responsibility/ethics-opinions/aba-formal-opinion-512.pdf) addresses competence, confidentiality, supervision, candor, communication, and reasonable fees in generative AI use; applicable jurisdictional rules and facts still require counsel's assessment. The [Thomson Reuters/Georgetown 2026 market report](https://www.thomsonreuters.com/en/institute/reports/state-of-the-us-legal-market-2026) describes shifting client demand and cost pressure, supporting a focus on measurable outcomes.

| Workflow | Proposed service | Required evidence of value |
|---|---|---|
| Litigation briefs/motions | Proposition-to-authority and record matrix; pinpoint support; adverse-authority queue; version comparison; unresolved-assertion delivery gate | Support precision, adverse-authority recall, material omission rate, and lawyer verification time |
| M&A/private equity | Consent/assignment exceptions across contracts and schedules; follow-up owners; source changes propagated into diligence and closing deliverables | Material-exception recall, false-positive burden, traceable versions, time to resolve exceptions |
| Multistate regulatory surveys | Jurisdiction/effective-date inventory, missing-state coverage, change-triggered reassessment, explicit no-result state | Complete coverage, correct effective dates, fewer stale conclusions |
| Client restrictions/ethical walls | Matter-specific model, source, sharing, retention, and consent policy before ingestion/retrieval/export | Negative access tests, revocation propagation, policy-version records, no cross-matter leakage |
| Firm precedent reuse | Permission-aware precedent selection with provenance, approval, date, and deviations from current guidance | Authorized, relevant precedents; avoidance of obsolete advice; measured revision savings |
| Pricing and delivery | Actual effort plus review/rework, model/source costs, phase budgets, client commitments, approved billing exports | Cost per accepted deliverable; no manufactured billable hours or omitted review cost |
| Multi-team handoff | Versioned packet carrying evidence, qualifications, owners, decisions, and supervisor sign-off into Word/DMS | Fewer omissions/repeat reviews; traceable acceptance of specific versions |

Only a local interaction slice of review and handoff is implemented. Automatic contradiction detection, new-source intake, primary-law research, deadline calculation, privilege classification, licensed citators, and autonomous legal services are not implemented.

## Engineering and release sequence

1. **Identity and matter boundary.** Organizations, users, memberships, ethical walls, signed sessions, and server-side authorization on every query/object operation. Cross-tenant and revoked-user tests before real data.
2. **Versioned evidence pipeline.** Authorized encrypted object storage, malware scan, extraction/OCR, immutable content versions, page/paragraph anchors. Separate storage, extraction, indexing, retrieval, and verification states. Retention/legal hold must extend to derived indexes and backups.
3. **Research and review service.** Contracted primary-law coverage and usage rights, effective dates/treatment checks, retrieval evaluation, proposition support, contradictory evidence, and abstention. Generation is not verification.
4. **Durable decisions.** Server-side state machine, optimistic concurrency, source-change invalidation, authenticated reviewers/approvers, append-only events, policy checks, and export authorization. The current React gate is not a security boundary.
5. **Firm integration.** Word and the design partner's DMS first; preserve source links and qualifications in real deliverables. Add client instructions, approvals, and billing integrations with scoped authorization.
6. **Evaluated specialist services.** One bounded diligence or litigation workflow with a design partner before broader regulatory or agent orchestration.

Target architecture: React client → authenticated API/policy layer → matter/source-version/issue/decision services → authorized object storage and search plus licensed primary-law connectors. A separate scoped job service performs extraction/model work. Versioned sources, model runs, and append-only review decisions support reproducibility. Default telemetry excludes privileged text.

## Proving an advantage

Proposed pilot, not a completed study: matched, permissioned, de-identified tasks for one transactional and one litigation workflow; equivalent source access, factual context, and time budgets across tools; independent blinded lawyer grading and held-out tasks. Aim for at least 100 representative tasks once reviewers/access are secured, while reporting uncertainty rather than assuming this size establishes statistical sufficiency.

Measure material errors/omissions, pinpoint/citation support, exception recall, abstentions, review/rework minutes, completion, cost per accepted deliverable, and policy violations. Include formatting and source-verification effort. Proposed gates: no critical access failures; no known unsupported material assertion passing delivery checks; at least 25% lower median review-plus-rework time without worse material-error rates. These are targets, not results or guarantees. Re-evaluate model, retrieval, policy, and source-pipeline changes.

## Verification boundary

Local checks include production build, desktop/mobile browser workflows and export contents, research-safety tests, and API boundary tests using fake persistence. CI separately exercises disposable MongoDB integration. No live-model legal benchmark, penetration test, licensed-content integration test, or hands-on competitor evaluation was performed. Actual CI and PR status are reported in the task delivery.
