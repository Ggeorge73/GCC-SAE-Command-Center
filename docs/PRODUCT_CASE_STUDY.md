# Product Case Study: Operating Legal AI at Enterprise Scale

## Executive summary

The original Law Suite prototype helped a lawyer work inside a matter: ask a jurisdiction-aware question, upload documents, track compliance, and preserve an audit history.

That solved only one side of enterprise adoption. Innovation, Legal Operations, IT, Security, and firm leadership must operate the deployment across hundreds or thousands of people. They need reliable answers to three questions:

1. Are teams using the product in ways that create value?
2. Is that use consistent with organizational policy?
3. What action will improve the outcome?

The Law Suite Control Center is a vertical slice of that administrator experience. It connects adoption analytics, identity governance, and recommended interventions in one workflow.

## Problem framing

### The administrator's current reality

Enterprise legal-AI administrators often assemble a fragmented operating picture from product exports, identity-provider attributes, spreadsheets, help-desk tickets, training attendance, and anecdotal partner feedback.

This creates four problems:

- **Visibility:** access and login counts do not reveal repeat value or workflow sophistication.
- **Diagnosis:** a low-usage group may have a training, relevance, leadership, trust, or permission problem; the same intervention will not solve each one.
- **Governance:** stale identities and policy gaps become manual review projects detached from actual usage.
- **Actionability:** dashboards report the past but do not help administrators decide what to do next or measure whether it worked.

### Jobs to be done

| Persona | Job to be done | Evidence of success |
|---|---|---|
| Director of Innovation | When leadership asks whether AI is working, help me explain adoption, value, and the next investment with defensible evidence. | Leadership report created in minutes; recommendations have owners and expected impact. |
| Legal Operations lead | When adoption differs by team, help me identify why and launch the smallest useful intervention. | Higher retained use in the target cohort without blanket training. |
| Security/IT administrator | When identities, roles, or policies drift, help me resolve the material exceptions before they become incidents. | Access reviews close on time; revocations and approvals are auditable. |
| Practice leader | When my team's results lag, show me comparable workflows and credible peers—not a generic usage leaderboard. | Users adopt relevant workflows and continue after enablement. |

## Discovery assumptions to validate

This portfolio prototype starts with explicit assumptions rather than presenting synthetic data as research.

1. Innovation leaders care more about repeat workflow value than raw message or login volume.
2. Practice group, role, region, tenure, and enablement exposure are the minimum useful segmentation dimensions.
3. Administrators need row-level evidence behind every insight before they will act on an AI-generated recommendation.
4. Identity review is most useful when sensitivity and recent behavior are visible together.
5. A recommendation becomes operational only when it has an owner, expected impact, due date, and follow-up measurement.

### Proposed research

- 8 interviews with Innovation and Knowledge leaders
- 5 contextual inquiries while administrators build a leadership update
- 5 interviews with IT/Security owners responsible for SSO, SCIM, and access certification
- 3 workflow-mapping sessions with Customer Success or enablement teams
- Analysis of the most common analytics exports, ad hoc SQL requests, and access-review tickets

The synthesis artifact would map each recurring decision to the evidence, latency, and manual work required today.

## Product principles

1. **Measure outcomes, not activity theatre.** A login or isolated prompt is not adoption.
2. **Make every aggregate explainable.** Administrators must be able to inspect definition, denominator, freshness, and contributing cohort.
3. **Separate description from recommendation.** The system should distinguish observed facts, model inference, and proposed action.
4. **Default to least privilege.** Analytics visibility and administrative mutation are different permissions.
5. **Design for intervention loops.** Every high-priority insight should connect to an owner and subsequent measurement.
6. **Minimize employee surveillance risk.** Cohort-level analytics should be the default; named-user detail requires a legitimate administrative purpose and auditable access.

## Metric tree

### North-star metric

**Governed Weekly Value Users (GWVU):** the percentage of licensed users who complete at least one qualifying, policy-covered workflow during a rolling seven-day window.

A qualifying workflow must be more meaningful than opening the application. Examples include completing document analysis, producing a cited research output, or completing an approved matter workflow.

### Supporting metrics

| Dimension | Metric | Definition | Guardrail |
|---|---|---|---|
| Activation | First-value rate | New users completing a qualifying workflow within seven days of provisioning | Exclude automated/service activity |
| Retention | 4-week retained use | Activated users with a qualifying workflow in at least 3 of the next 4 weeks | Report by cohort, not blended average |
| Depth | Advanced-workflow depth | Share of active users completing two or more workflow types | Do not reward unnecessary volume |
| Governance | Policy-covered interactions | Qualifying events evaluated under the current organization policy | Coverage is not the same as policy approval |
| Identity | Access-review completion | In-scope identities certified or remediated before the deadline | Track overdue high-sensitivity access separately |
| Admin efficiency | Time to leadership report | Median time from request to approved report | Include manual reconciliation time |
| Value | Estimated time returned | Completed workflows multiplied by validated workflow-specific baselines | Always expose assumptions and confidence range |

### Metric quality requirements

- Version every event and metric definition.
- Display data freshness and incomplete-source warnings.
- Preserve numerator and denominator for every percentage.
- Prevent retroactive metric drift when workflow classification changes.
- Reconcile identity joins and unmatched accounts.
- Exclude test, service, and support impersonation events.

## MVP scope and prioritization

The first portfolio release prioritizes the smallest coherent administrator loop.

| Capability | User value | Why now | Portfolio implementation |
|---|---|---|---|
| Adoption segmentation | Identifies where activation or retention differs | Foundational to every intervention | Practice-group chart and filters |
| Governance coverage | Surfaces material control gaps | Enterprise adoption depends on trust | SSO, SCIM, RBAC, and review summary |
| Evidence-backed insight | Converts data into a diagnosis | Demonstrates analytical product thinking | Three bounded, deterministic questions |
| Identity review | Connects governance signal to action | Avoids a score-only dashboard | Searchable access table and posture |
| Recommended interventions | Creates a closed operating loop | Makes analytics actionable | Owner, expected impact, and started state |
| Leadership export | Supports a recurring admin workflow | Fast, concrete value | CSV practice report |

### Intentionally out of scope for this slice

- Real employee or customer telemetry
- Provider-backed user mutations
- Automated ROI claims without validated baselines
- A free-form analytics agent that can query unrestricted employee data
- Production authentication or authorization

## Key trade-offs

### Synthetic data vs. premature telemetry implementation

The repository does not contain enterprise usage history or an identity provider. Inventing a backend pipeline would make the code look larger without making the product evidence more honest. The prototype therefore uses a clearly labeled sample dataset and documents the target contracts.

### Named-user access detail vs. privacy

Named-user tables are appropriate for access certification but risky as general performance analytics. The proposed permission model allows identity-level visibility only to administrators with a governance purpose. Adoption reporting defaults to cohorts and suppresses small groups.

### Time-saved metrics vs. defensibility

Time returned is useful to leadership but easy to overstate. Production estimates must use workflow-specific baselines, show confidence intervals, and allow customers to replace defaults with their own validated assumptions.

### Recommendations vs. trust

The MVP uses bounded questions and deterministic explanations. A later analytics agent must show evidence, respect row/column-level permissions, and be evaluated against a curated set of administrator questions before launch.

## Target information architecture

- **Overview:** adoption, value, governance, and urgent exceptions
- **Adoption:** cohorts, activation funnel, retention, workflow depth, power users
- **Governance:** policy coverage, exception queue, audit exports, retention
- **People & access:** users, groups, roles, provisioning state, reviews
- **Interventions:** enablement campaigns, owners, due dates, measured outcomes
- **Reports:** saved leadership views, scheduled exports, metric provenance
- **Settings:** SSO, SCIM, role templates, event mappings, data controls

## Target event taxonomy

Every event includes `organization_id`, `actor_id` (pseudonymized in analytics), `event_version`, `occurred_at`, `surface`, `workflow_type`, `practice_group`, `policy_decision_id`, and `matter_sensitivity` where permitted.

Initial events:

- `identity.provisioned`
- `identity.role_changed`
- `identity.deprovisioned`
- `session.started`
- `workflow.started`
- `workflow.completed`
- `document.analysis_completed`
- `research.answer_exported`
- `policy.evaluated`
- `admin.access_review_completed`
- `intervention.assigned`
- `intervention.outcome_measured`

Prompt text, document content, matter names, and legal advice are excluded from default product analytics.

## Launch and learning plan

### Phase 1: Instrument and trust

- Agree on event definitions with Engineering, Security, Data, and Customer Success.
- Validate identity joins and metric reconciliation with design partners.
- Ship cohort analytics and metric provenance before recommendations.
- Success gate: less than 1% unmatched active identities and less than 0.5% event reconciliation variance.

### Phase 2: Diagnose and report

- Add segmentation, saved views, leadership reports, and bounded deployment questions.
- Test whether administrators reach a defensible diagnosis faster than with exports.
- Success gate: 50% reduction in median leadership-report preparation time.

### Phase 3: Intervene and measure

- Add action owners, due dates, enablement cohorts, and outcome measurement.
- Compare recommended interventions with administrator-chosen actions.
- Success gate: target cohorts improve 4-week retained use without degradation in policy coverage.

## Risks and mitigations

| Risk | Consequence | Mitigation |
|---|---|---|
| Optimizing prompt volume | Encourages shallow or unnecessary use | Qualifying-workflow and retention metrics |
| Employee surveillance perception | Reduces trust and adoption | Cohort defaults, purpose-bound access, small-group suppression |
| Incorrect identity joins | Misleading access or adoption decisions | SCIM reconciliation, unmatched queue, immutable source identifiers |
| ROI overclaim | Loss of executive credibility | Customer-editable assumptions, ranges, metric provenance |
| Analytics-agent hallucination | Unsafe administrative decisions | Bounded tools, evidence links, evaluations, no autonomous mutation |
| Admin control misuse | Privilege escalation or accidental lockout | Separation of duties, approval policies, step-up authentication, audit log |

## What I would test next

1. Can an Innovation leader identify the lowest-retained cohort and explain why in under three minutes?
2. Can a Security administrator move from an exception count to the correct identity and workspace without exposing unrelated activity?
3. Do recommended interventions change the administrator's decision, or merely restate the chart?
4. Can leadership understand the difference between usage, adoption, depth, and estimated value without facilitator explanation?
5. Does showing individual detail reduce trust among lawyers even when it is limited to access review?

## Portfolio outcome

This case study demonstrates the end-to-end PM arc: frame an enterprise problem, define the user and decision, select a metric model, make scope trade-offs, design a working vertical slice, document governance constraints, and specify how to learn after launch.
