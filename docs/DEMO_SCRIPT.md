# Six-Minute Hiring Manager Demo

## Positioning

“Law Suite began as a practitioner-facing legal AI deal room. I used it to explore a second problem: once an enterprise provisions legal AI, how does an administrator know whether it is creating value safely—and what should they do next?”

Do not position the project as a competitor clone. Position it as evidence of how you approach an enterprise administration problem.

## 0:00–0:45 — Establish the problem

Open the **Deal workspace** briefly.

“This surface demonstrates the underlying legal workflows: advisory conversations, documents, compliance, and matter history. But a strong practitioner workflow creates a new enterprise problem. Innovation and Legal Ops teams now need to operate adoption, access, and governance across the organization.”

Switch to **Control Center**.

“The thesis is that access is not adoption, activity is not value, and a dashboard is incomplete if it does not help an administrator intervene.”

## 0:45–2:00 — Show the executive operating picture

Point to:

- Weekly active users
- Adopted seats
- Policy-covered interactions
- Estimated time returned

Explain:

“I paired adoption with workflow depth and policy coverage. Raw login or prompt volume can look successful while masking shallow use or unmanaged activity. The north-star metric I would validate is Governed Weekly Value Users: licensed users completing a meaningful, policy-covered workflow each week.”

Use the practice filter to select **Tax**.

“The purpose of segmentation is not a leaderboard. It is to isolate a cohort where the right intervention might change behavior.”

## 2:00–3:15 — Move from signal to diagnosis

In **Ask about your rollout**, select:

1. “Where is adoption lagging?”
2. “Where is governance exposed?”

Explain:

“I bounded the questions for the prototype instead of building an ungoverned free-form analytics agent. Each answer separates the conclusion from its evidence. In production, every statement would link to a metric definition, data freshness, cohort, and source query.”

## 3:15–4:15 — Show enterprise administration depth

Move to **Identity and access**. Filter the role to **Contractor**.

“This is where governance becomes operational. A score of 92 is not enough. The administrator needs the exceptions, recent activity, role, and a review action. I would separate permission to view aggregated adoption from permission to inspect or mutate individual access.”

Call out:

- SSO enforcement
- SCIM reconciliation
- RBAC coverage
- Access-review exceptions

## 4:15–5:15 — Close the loop

Start the **Complete contractor access review** plan.

“A recommendation is only useful when it has an owner, expected impact, and follow-up measurement. The next release would add due dates, approvals, and outcome tracking so we can tell whether the intervention changed retained use or closed risk.”

Export the report.

“Leadership reporting is a frequent job. Even this small export removes spreadsheet assembly. The production version would add saved, scheduled reports with metric provenance.”

## 5:15–6:00 — Demonstrate PM judgment

Close with three explicit decisions:

1. “The sample dataset is clearly labeled; I did not imply access to real enterprise telemetry.”
2. “I chose a coherent observe-diagnose-intervene loop over a broad collection of admin pages.”
3. “I documented the security, privacy, metric-quality, and rollout gates because enterprise admin products win on trust as much as feature breadth.”

Then invite discussion:

“The question I would most want to explore with customers is whether the first wedge should be leadership reporting, targeted enablement, or identity governance. The prototype lets us test those decisions before committing to a large platform build.”

## Likely questions and concise answers

### Why add this to a legal deal-room product?

The practitioner workflow produces the telemetry and governance needs the administrator must manage. Showing both surfaces demonstrates platform thinking and a credible land-and-expand loop.

### Why is the data synthetic?

The repository has no enterprise event warehouse or identity provider. Synthetic data is the most honest way to test product comprehension and interaction without fabricating customer evidence.

### What would you build first in production?

Event definitions, identity reconciliation, and metric provenance. Recommendations are not trustworthy until the underlying telemetry is reconciled and explainable.

### What is the biggest product risk?

Turning analytics into employee surveillance or optimizing shallow activity. Cohort defaults, purpose-based access, small-group suppression, and value-oriented metrics are core product requirements.

### How would you measure success?

Start with admin efficiency and metric trust, then measure Governed Weekly Value Users and target-cohort retained use after interventions. Guardrails include policy coverage, access-review completion, support burden, and user trust.

### What did you personally do?

Be precise and truthful: explain the problem framing, prioritization, metric design, governance model, product requirements, implementation decisions, validation, and use of AI-assisted development. Do not imply that generated scaffold code was written manually.
