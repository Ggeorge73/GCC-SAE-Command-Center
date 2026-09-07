import { sampleMatters } from "./matterReview";

export const STORAGE_KEY = "law-suite-workspace-v2";
export const actors = [
  "Maya Chen · Partner",
  "Daniel Foster · Associate",
  "Priya Raman · Research counsel",
];
const stamp = () => new Date().toISOString();
const doc = (id, title, version, sections) => ({
  id,
  title,
  version,
  sections,
  synthetic: true,
});

export function initialWorkspace() {
  const matters = structuredClone(sampleMatters).map((matter) => ({
    ...matter,
    approval: null,
    revisions: 0,
    draftEdits: {},
    imported: null,
    deadline: {
      trigger: "2026-09-07",
      days: 3,
      basis:
        "Fictional engagement instruction: deliver the internal review three calendar days after receipt of the complete packet.",
      assumption:
        "Receipt date excluded; calendar days; no holiday adjustment; 5 p.m. America/New_York. Internal target only, not a court or statutory deadline.",
    },
    controls: matter.controls.map((c) => ({
      ...c,
      checked: false,
      by: null,
      at: null,
    })),
    issues: matter.issues.map((i) => ({
      ...i,
      workState: "Open",
      assignee: i.owner,
      taskDue: "2026-09-09",
      draftNote: "",
      notes: [],
      review: null,
      excluded: false,
      pendingChange: null,
      sources: i.quote ? [i.id] : [],
      statement:
        i.id === "N1"
          ? "Written supplier consent remains an outstanding closing deliverable. This review does not establish that consent has been obtained."
          : i.id === "M2"
            ? "The finance estimate is preliminary, excludes mitigation, and remains subject to supporting invoices."
            : i.finding,
    })),
  }));
  const documents = {
    N1: doc("N1", "Supply agreement", "3", [
      {
        anchor: "§12.1",
        text: "The purchaser will notify the supplier of a proposed transfer.",
      },
      {
        anchor: "§12.2",
        text: "A change in control of the purchaser requires the supplier’s prior written consent.",
      },
      {
        anchor: "§12.3",
        text: "Consent requests must identify the proposed purchaser and anticipated closing date.",
      },
    ]),
    N2: doc("N2", "Disclosure schedule", "2", [
      {
        anchor: "§4.7",
        text: "The supply agreement is listed as a material agreement.",
      },
      {
        anchor: "§4.8",
        text: "No material customer contract requires consent in connection with the transaction.",
      },
    ]),
    M1: doc("M1", "Delivery receipt", "1", [
      {
        anchor: "p1",
        text: "Notice received by the contract administrator on August 14, 2026, at 10:42 a.m. Eastern Time.",
      },
      {
        anchor: "p1, record scope",
        text: "This receipt records delivery only. It does not establish the method or legal effectiveness of service.",
      },
    ]),
    M2: doc("M2", "Finance estimate", "1", [
      {
        anchor: "p1",
        text: "Prepared for internal discussion. Supporting invoices remain outstanding.",
      },
      {
        anchor: "p2",
        text: "The estimate excludes mitigation and is preliminary, subject to supporting invoices.",
      },
    ]),
    E1: doc("E1", "Retention policy", "1", [
      {
        anchor: "§3",
        text: "The retention period is defined in the departmental schedule.",
      },
      { anchor: "§4", text: "Department owners maintain the local schedule." },
    ]),
  };
  return {
    version: 2,
    matters,
    documents,
    events: [],
    actor: actors[0],
    selectedId: matters[0].id,
  };
}

export function loadWorkspace() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const expected = initialWorkspace();
    if (
      saved?.version === 2 &&
      saved.documents &&
      Array.isArray(saved.events) &&
      actors.includes(saved.actor) &&
      expected.matters.every((m) => {
        const item = saved.matters?.find((s) => s.id === m.id);
        return (
          item?.issues?.length === m.issues.length &&
          item.controls?.length === m.controls.length &&
          item.controls.every((c) => typeof c.checked === "boolean") &&
          item.deadline &&
          item.draftEdits &&
          item.issues.every(
            (i, index) =>
              i.id === m.issues[index].id &&
              typeof i.draftNote === "string" &&
              Array.isArray(i.notes) &&
              typeof i.assignee === "string" &&
              typeof i.statement === "string" &&
              Array.isArray(i.sources) &&
              i.sources.every((id) =>
                saved.documents[id]?.sections?.every(
                  (s) => typeof s.text === "string",
                ),
              ),
          )
        );
      }) &&
      Object.keys(expected.documents).every(
        (id) =>
          saved.documents[id]?.sections?.length &&
          typeof saved.documents[id].version === "string",
      ) &&
      saved.matters.some((m) => m.id === saved.selectedId)
    )
      return saved;
  } catch {
    /* A blocked store or old fixture must not prevent opening the demo. */
  }
  return initialWorkspace();
}

export function readiness(matter) {
  const gaps = matter.issues.filter(
    (i) => !i.excluded && i.evidenceState !== "supported",
  );
  const open = matter.issues.filter((i) => !i.review || i.pendingChange);
  const tasks = matter.issues.filter((i) =>
    ["Assigned", "Escalated", "Deferred"].includes(i.workState),
  );
  const controls = matter.controls.filter((c) => !c.checked);
  const validTarget = Boolean(targetDate(matter.deadline));
  return {
    gaps,
    open,
    tasks,
    controls,
    validTarget,
    ready:
      !gaps.length &&
      !open.length &&
      !tasks.length &&
      !controls.length &&
      validTarget,
    qualified: matter.issues.some((i) => i.excluded),
  };
}

export function targetDate(deadline) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(deadline.trigger) ||
    String(deadline.days).trim() === "" ||
    !Number.isInteger(Number(deadline.days)) ||
    Number(deadline.days) < 0 ||
    Number(deadline.days) > 365
  )
    return null;
  const date = new Date(`${deadline.trigger}T12:00:00Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== deadline.trigger
  )
    return null;
  date.setUTCDate(date.getUTCDate() + Number(deadline.days));
  return date.toISOString().slice(0, 10);
}

export function changeWorkspace(current, action) {
  const state = structuredClone(current);
  const matter = state.matters.find((m) => m.id === action.matterId);
  const issue = matter?.issues.find((i) => i.id === action.issueId);
  const at = stamp();
  const log = (text) =>
    state.events.push({
      id: crypto.randomUUID(),
      matterId: matter.id,
      issueId: issue?.id || null,
      actor: state.actor,
      at,
      action: text,
    });
  const invalidate = () => {
    matter.approval = null;
  };
  if (action.type === "actor") {
    state.actor = action.value;
    return state;
  }
  if (action.type === "select") {
    state.selectedId = action.matterId;
    return state;
  }
  if (!matter) throw new Error("Select a matter first.");
  if (action.type === "importDraft") matter.importDraft = action.value;
  if (action.type === "importProvider") matter.importProvider = action.value;
  if (action.type === "noteDraft") issue.draftNote = action.value;
  if (action.type === "taskField") issue[action.field] = action.value;
  if (action.type === "decision") {
    if (issue.draftNote.trim().length < 15)
      throw new Error("Describe your decision in at least 15 characters.");
    if (
      ["Assigned", "Escalated", "Deferred"].includes(action.value) &&
      (!issue.assignee.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(issue.taskDue))
    )
      throw new Error("Choose a next owner and a due date.");
    issue.notes.push({
      by: state.actor,
      at,
      text: issue.draftNote,
      state: action.value,
      assignee: issue.assignee,
      due: issue.taskDue,
    });
    if (action.value !== "Note saved") issue.workState = action.value;
    log(
      `${action.value} ${issue.id}: ${issue.draftNote}${action.value === "Note saved" ? "" : ` — ${issue.assignee}; due ${issue.taskDue}`}`,
    );
    issue.draftNote = "";
    invalidate();
  }
  if (action.type === "review") {
    if (
      issue.pendingChange ||
      (!issue.excluded && issue.evidenceState !== "supported")
    )
      throw new Error(
        "Resolve or explicitly exclude the unsupported proposition before review.",
      );
    if (issue.draftNote.trim().length < 15)
      throw new Error(
        "Describe the review and its qualifications in at least 15 characters.",
      );
    issue.review = { reviewer: state.actor, note: issue.draftNote.trim(), at };
    issue.status = "reviewed";
    if (!["Assigned", "Escalated", "Deferred"].includes(issue.workState))
      issue.workState = "Resolved";
    log(`${state.actor} recorded review of ${issue.id}: ${issue.draftNote}`);
    issue.draftNote = "";
    invalidate();
  }
  if (action.type === "reopen") {
    issue.review = null;
    issue.status = "open";
    if (!["Assigned", "Escalated", "Deferred"].includes(issue.workState))
      issue.workState = "Open";
    invalidate();
    log(`Reopened ${issue.id}`);
  }
  if (action.type === "exclude") {
    if (issue.draftNote.trim().length < 15)
      throw new Error(
        "Explain why the proposition is excluded and what work remains.",
      );
    if (issue.pendingChange)
      throw new Error("Inspect the changed source before changing the scope.");
    issue.excluded = !issue.excluded;
    issue.review = null;
    issue.status = "open";
    if (!["Assigned", "Escalated", "Deferred"].includes(issue.workState))
      issue.workState = "Open";
    log(
      `${issue.excluded ? "Excluded from reliance" : "Restored to scope"} ${issue.id}: ${issue.draftNote}`,
    );
    issue.notes.push({
      by: state.actor,
      at,
      text: issue.draftNote,
      state: "Scope decision",
    });
    issue.draftNote = "";
    invalidate();
  }
  if (action.type === "control") {
    const control = matter.controls.find((c) => c.id === action.id);
    control.checked = !control.checked;
    control.by = state.actor;
    control.at = at;
    invalidate();
    log(`${control.label}: ${control.checked ? "recorded" : "reopened"}`);
  }
  if (action.type === "approve") {
    if (!state.actor.endsWith("Partner") || !readiness(matter).ready)
      throw new Error(
        "Partner approval requires completed reviews, assignments, and prerequisite checks.",
      );
    matter.approval = {
      by: state.actor,
      at,
      qualified: readiness(matter).qualified,
    };
    log(
      "Approved the internal demo memorandum. No client delivery or filing authorized.",
    );
  }
  if (action.type === "revision") {
    const id =
      matter.id === "LS-2401" ? "N2" : matter.id === "LS-2402" ? "M1" : "E1";
    const previous = state.documents[id];
    matter.revisions += 1;
    const contradict = matter.revisions % 2 === 0;
    const changedText =
      id === "N2"
        ? contradict
          ? "All transaction consents have been obtained; no exceptions remain."
          : "The supply agreement requires prior written consent. Consent remains outstanding and is a closing deliverable."
        : id === "M1"
          ? `Corrected receipt: notice received on August ${contradict ? "16" : "15"}, 2026 at 10:42 a.m. Eastern Time. Earlier receipt superseded.`
          : "The central retention schedule controls. Departmental schedules require an approved exception and a named policy owner.";
    const next = {
      ...previous,
      version: String(Number(previous.version) + 1),
      sections: previous.sections.map((s, index) =>
        index === (id === "N2" ? 1 : 0) ? { ...s, text: changedText } : s,
      ),
    };
    state.documents[id] = next;
    const affected = matter.issues.filter(
      (i) => i.sources.includes(id) || (id === "N2" && i.id === "N1"),
    );
    affected.forEach((i) => {
      i.pendingChange = {
        previous: i.pendingChange?.previous || previous,
        next,
        proposed: id === "N2" && contradict ? "contradicted" : "supported",
        previousReview: i.pendingChange?.previousReview || i.review,
      };
      i.evidenceState = "stale";
      i.review = null;
      i.status = "open";
      if (!["Assigned", "Escalated", "Deferred"].includes(i.workState))
        i.workState = "Open";
      if (!i.sources.includes(id)) i.sources.push(id);
    });
    invalidate();
    log(
      `Sample source revision: ${next.title} v${next.version}. Reopened ${affected.map((i) => i.id).join(", ")}; internal approval revoked.`,
    );
    if (matter.imported) matter.imported.outdated = true;
  }
  if (action.type === "acceptChange") {
    if (!issue.pendingChange) throw new Error("No pending source change.");
    issue.evidenceState = issue.pendingChange.proposed;
    issue.finding =
      issue.evidenceState === "contradicted"
        ? "The revised schedule asserts that all consents exist, but the sample record contains no written consent. Resolve this unsupported assertion before relying on it."
        : issue.id.startsWith("N")
          ? "The revised schedule identifies the supplier consent as outstanding. Review the working statement and preserve that closing qualification."
          : issue.id === "M1"
            ? "The corrected receipt changes the notice date. Update the chronology's working statement and reassess any dependent timing assumptions."
            : "The current policy assigns control to the central schedule. Update the survey and retain the unresolved state-coverage limitation.";
    issue.source = `${issue.pendingChange.next.title} · v${issue.pendingChange.next.version}`;
    issue.quote =
      issue.pendingChange.next.sections[
        idAnchor(issue.pendingChange.next.id)
      ].text;
    issue.pendingChange = null;
    invalidate();
    log(
      `Inspected source comparison for ${issue.id}; fresh review still required.`,
    );
  }
  if (action.type === "draft") {
    if (issue.review || matter.approval)
      log(
        `Draft statement ${issue.id} changed; affected review and internal approval revoked.`,
      );
    matter.draftEdits[issue.id] = action.value;
    issue.review = null;
    issue.status = "open";
    invalidate();
  }
  if (action.type === "recordDraft")
    log(
      `Working draft ${issue.id} saved: ${matter.draftEdits[issue.id] ?? issue.statement}`,
    );
  if (action.type === "deadline") {
    matter.deadline[action.field] = action.value;
    invalidate();
  }
  if (action.type === "recordDeadline") {
    if (!targetDate(matter.deadline))
      throw new Error(
        "Enter a valid receipt date and 0–365 whole calendar days.",
      );
    log(
      `Internal target recorded: ${targetDate(matter.deadline)}. ${matter.deadline.basis} ${matter.deadline.assumption}`,
    );
  }
  if (action.type === "import") {
    if (!action.text.trim()) throw new Error("Paste a draft to inspect.");
    const references = [
      ...action.text.matchAll(/\[([A-Z]\d+)(?:\s+v(\d+))?\]/g),
    ].map((match) => {
      const source = state.documents[match[1]];
      const permitted = matter.issues.some((i) => i.sources.includes(match[1]));
      return {
        reference: match[0],
        id: match[1],
        result:
          !source || !permitted
            ? "Source unavailable in this matter"
            : !match[2]
              ? "Version unspecified"
              : match[2] !== source.version
                ? `Outdated reference · current v${source.version}`
                : "Reference matched · support not verified",
      };
    });
    matter.imported = {
      text: action.text,
      provider: action.provider,
      references,
      at,
      outdated: false,
    };
    log(
      `Imported a ${action.provider} draft locally; ${references.length} source references inspected. Legal support not verified.`,
    );
  }
  return state;
}
function idAnchor(id) {
  return id === "N2" ? 1 : 0;
}

export function reviewPacket(state, matter) {
  const result = readiness(matter);
  return {
    product: "Law Suite",
    schemaVersion: 2,
    synthetic: true,
    generatedAt: stamp(),
    disclaimer:
      "Fictional demonstration. Local editable history; simulated identities. No independent verification, live integration, external delivery, or legal advice.",
    handoff: result.ready
      ? "Ready for supervising lawyer review"
      : "Blocked — unresolved review requirements",
    qualified: result.qualified,
    approval: matter.approval,
    matter,
    documents: Object.values(state.documents).filter((d) =>
      matter.issues.some((i) => i.sources.includes(d.id)),
    ),
    events: state.events.filter((e) => e.matterId === matter.id),
  };
}
