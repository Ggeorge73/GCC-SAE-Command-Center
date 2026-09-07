// Synthetic fixtures and deterministic review rules. No legal verification occurs here.
export const reviewDate = "2026-09-06";
export const sampleMatters = [
  {
    id: "LS-2401",
    name: "Project Northstar",
    client: "Aster Manufacturing",
    practice: "Corporate",
    jurisdiction: "Delaware · acquisition",
    owner: "Maya Chen",
    due: "Sep 10",
    budget: 120000,
    spent: 78400,
    summary:
      "Resolve consent exceptions before the acquisition committee receives the diligence memo.",
    restrictions:
      "Internal review only. Client approval required before external AI processing.",
    controls: [
      { id: "policy", label: "Client AI-use terms reviewed", checked: false },
      {
        id: "scope",
        label: "Matter team and sharing scope confirmed",
        checked: true,
      },
    ],
    issues: [
      {
        id: "N1",
        title: "Change-of-control consent is outstanding",
        severity: "Critical",
        category: "Contract exception",
        owner: "Maya Chen",
        status: "open",
        evidenceState: "supported",
        source: "Supply agreement · §12.2 · v3",
        quote:
          "A change in control of the purchaser requires the supplier’s prior written consent.",
        finding:
          "The sample agreement contains a consent condition. The closing checklist has no corresponding consent deliverable.",
        next: "Assign the consent request and add evidence of satisfaction to the closing checklist.",
        checkedOn: "2026-09-05",
      },
      {
        id: "N2",
        title: "Disclosure schedule conflicts with the contract",
        severity: "High",
        category: "Contradiction",
        owner: "Daniel Foster",
        status: "open",
        evidenceState: "contradicted",
        source: "Disclosure schedule · §4.8 · v2",
        quote:
          "No material customer contract requires consent in connection with the transaction.",
        finding:
          "This statement conflicts with the consent clause in the supply agreement. A reviewer must reconcile the two documents.",
        next: "Obtain a corrected schedule or a documented explanation from deal counsel.",
        checkedOn: "2026-09-05",
      },
      {
        id: "N3",
        title: "Current authority check has not been completed",
        severity: "High",
        category: "Authority gap",
        owner: "Priya Raman",
        status: "open",
        evidenceState: "missing",
        source: null,
        quote: null,
        finding:
          "The draft memo’s legal proposition has no linked primary authority or treatment check.",
        next: "Research the governing proposition in a licensed primary-law source and record jurisdiction, pinpoint, and treatment.",
        checkedOn: null,
      },
    ],
  },
  {
    id: "LS-2402",
    name: "Meridian commercial dispute",
    client: "Meridian Systems",
    practice: "Litigation",
    jurisdiction: "New York · commercial litigation",
    owner: "Daniel Foster",
    due: "Sep 12",
    budget: 85000,
    spent: 62100,
    summary:
      "Make every material statement in the chronology traceable before partner review.",
    restrictions:
      "Internal work product. No client delivery or court filing from this demonstration.",
    controls: [
      { id: "policy", label: "Client AI-use terms reviewed", checked: true },
      {
        id: "scope",
        label: "Matter team and sharing scope confirmed",
        checked: true,
      },
    ],
    issues: [
      {
        id: "M1",
        title: "Notice date is supported by the record",
        severity: "Medium",
        category: "Fact review",
        owner: "Daniel Foster",
        status: "open",
        evidenceState: "supported",
        source: "Delivery receipt · p1 · v1",
        quote:
          "Notice received by the contract administrator on August 14, 2026, at 10:42 a.m. Eastern Time.",
        finding:
          "The chronology records August 14 as the receipt date. The sample receipt supports that fact; no deadline has been calculated.",
        next: "Compare the statement with the receipt and record the scope of your review.",
        checkedOn: "2026-09-06",
      },
      {
        id: "M2",
        title: "Damages assumption needs an explicit qualification",
        severity: "High",
        category: "Work product review",
        owner: "Maya Chen",
        status: "open",
        evidenceState: "supported",
        source: "Finance estimate · p2 · v1",
        quote:
          "The estimate excludes mitigation and is preliminary, subject to supporting invoices.",
        finding:
          "The draft must describe the estimate as preliminary and identify the missing invoices. This is a review of the stated assumption, not a damages determination.",
        next: "Confirm the qualification appears in the draft and note the outstanding invoice request.",
        checkedOn: "2026-09-06",
      },
    ],
  },
  {
    id: "LS-2403",
    name: "Evergreen policy review",
    client: "Evergreen Health Technologies",
    practice: "Regulatory",
    jurisdiction: "US · multistate policy review",
    owner: "Priya Raman",
    due: "Sep 15",
    budget: 65000,
    spent: 29200,
    summary:
      "Identify coverage gaps in a multistate policy survey before relying on the synthesis.",
    restrictions:
      "Synthetic policies only. No patient information or personal data.",
    controls: [
      { id: "policy", label: "Client AI-use terms reviewed", checked: true },
      {
        id: "scope",
        label: "Matter team and sharing scope confirmed",
        checked: false,
      },
    ],
    issues: [
      {
        id: "E1",
        title: "Survey relies on an earlier policy version",
        severity: "High",
        category: "Version gap",
        owner: "Priya Raman",
        status: "open",
        evidenceState: "stale",
        source: "Retention policy · §3 · v1 (superseded)",
        quote: "The retention period is defined in the departmental schedule.",
        finding:
          "Version 2 is listed in the document register, but the survey cites version 1. The newer text has not been reviewed.",
        next: "Retrieve the current policy and rerun the affected review with a version comparison.",
        checkedOn: "2026-07-01",
      },
      {
        id: "E2",
        title: "State coverage is incomplete",
        severity: "High",
        category: "Research scope",
        owner: "Daniel Foster",
        status: "open",
        evidenceState: "missing",
        source: null,
        quote: null,
        finding:
          "The survey does not include a source record for every state in scope. An empty result must not be treated as absence of a requirement.",
        next: "Complete the source inventory with effective dates and a documented no-result protocol.",
        checkedOn: null,
      },
    ],
  },
];

export function assessMatter(matter) {
  const evidenceGaps = matter.issues.filter(
    (issue) => issue.evidenceState !== "supported",
  );
  const unresolved = matter.issues.filter(
    (issue) => issue.status !== "reviewed",
  );
  const policyGaps = matter.controls.filter((control) => !control.checked);
  return {
    evidenceGaps,
    unresolved,
    policyGaps,
    ready:
      evidenceGaps.length === 0 &&
      unresolved.length === 0 &&
      policyGaps.length === 0,
  };
}

export function reviewIssue(
  issue,
  reviewer,
  note,
  now = new Date().toISOString(),
) {
  if (issue.evidenceState !== "supported")
    throw new Error(
      "Resolve the evidence gap before recording a completed review.",
    );
  if (!reviewer.trim() || note.trim().length < 15)
    throw new Error(
      "Enter a reviewer and a review note of at least 15 characters.",
    );
  return {
    ...issue,
    status: "reviewed",
    review: { reviewer: reviewer.trim(), note: note.trim(), at: now },
  };
}

export function createReviewPacket(matter, events) {
  return {
    product: "Law Suite",
    schemaVersion: 1,
    synthetic: true,
    disclaimer:
      "Demonstration only. User-recorded review, not independent source verification, legal advice, or authorization to file or share.",
    generatedAt: new Date().toISOString(),
    fixtureDate: reviewDate,
    handoff: assessMatter(matter).ready
      ? "Ready for supervising lawyer review"
      : "Blocked — unresolved review requirements",
    matter,
    events: events.filter((event) => event.matterId === matter.id),
  };
}
