import { initialWorkspace } from "./matterWorkspace";
import { validDate } from "./localRecords";
const now = () => new Date().toISOString();
export const emptyPractice = {
  intakes: [],
  time: [],
  invoices: [],
  communications: [],
  closings: [],
  measurements: [],
  research: [],
};
export const money = (cents) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
export function timeAmount(entry) {
  return Math.round((entry.minutes * entry.rateCents) / 60);
}
export function practiceChange(workspace, action) {
  const next = structuredClone(workspace);
  const p = (next.practice = {
    ...structuredClone(emptyPractice),
    ...next.practice,
  });
  const record = {
    ...action.record,
    id: action.record?.id || crypto.randomUUID(),
    at: now(),
  };
  const log = (matterId, text) =>
    next.events.push({
      id: crypto.randomUUID(),
      matterId,
      actor: next.actor,
      at: now(),
      action: text,
      issueId: null,
    });
  if (action.type === "intake") {
    for (const key of ["name", "client", "lead", "jurisdiction", "scope"]) {
      if (!record[key]?.trim() || record[key].length > 250)
        throw new Error(`Enter a meaningful ${key} (up to 250 characters).`);
      record[key] = record[key].trim();
    }
    if (p.intakes.some((i) => i.id === record.id && i.matterId))
      throw new Error(
        "This intake already opened a matter. Amend the matter instead.",
      );
    p.intakes = [
      ...p.intakes.filter((i) => i.id !== record.id),
      {
        ...record,
        status: "Pending conflicts",
        parties: "",
        conflictNote: "",
        engagementNote: "",
      },
    ];
  } else if (action.type === "intakeReview") {
    const intake = p.intakes.find((i) => i.id === action.id);
    if (!intake || intake.matterId)
      throw new Error("Select an unopened intake.");
    if (!action.parties?.trim() || action.note?.trim().length < 15)
      throw new Error(
        "Record related/adverse parties and at least 15 characters explaining the review.",
      );
    intake.parties = action.parties.trim();
    if (action.decision === "Conflicts reviewed") {
      intake.conflictNote = action.note.trim();
      intake.status = "Pending engagement";
    } else {
      if (!intake.conflictNote)
        throw new Error("Document the conflicts review first.");
      if (!next.actor.includes("Partner"))
        throw new Error(
          "Select the supervising partner preview to approve opening.",
        );
      intake.engagementNote = action.note.trim();
      const id = `LS-${intake.id}`;
      const template = initialWorkspace().matters[0];
      const gap = {
        ...template.issues[2],
        id: `${id}-scope`,
        title: "Define the evidence and review questions",
        finding:
          "No source material has been reviewed for this new demo matter.",
        statement: "Evidence review has not started.",
        next: "Identify required sources and record the review scope.",
        owner: intake.lead,
        assignee: intake.lead,
      };
      const matter = {
        ...template,
        id,
        name: intake.name,
        client: intake.client,
        clientId: intake.clientId || `client-${intake.id}`,
        owner: intake.lead,
        jurisdiction: intake.jurisdiction,
        practice: intake.practice || "Corporate",
        summary: intake.scope,
        budget: 0,
        spent: 0,
        due: "Not set",
        deadline: {
          ...template.deadline,
          trigger: "",
          basis: "Internal target not yet agreed",
        },
        issues: [gap],
        approval: null,
        intakeId: intake.id,
      };
      if (!next.matters.some((m) => m.id === id)) next.matters.push(matter);
      intake.matterId = id;
      intake.status = "Opened locally";
      intake.openedAt = now();
      log(
        id,
        "Demo matter opened after documented conflicts and engagement review; identities are simulated.",
      );
    }
  } else if (action.type === "time") {
    if (!validDate(record.date)) throw new Error("Enter a valid work date.");
    if (
      !next.matters.some((m) => m.id === record.matterId) ||
      !record.narrative?.trim() ||
      !record.attorney?.trim()
    )
      throw new Error("Select a matter, attorney, and meaningful narrative.");
    if (
      !Number.isInteger(record.minutes) ||
      record.minutes < 1 ||
      record.minutes > 1440 ||
      !Number.isInteger(record.rateCents) ||
      record.rateCents < 0 ||
      record.rateCents > 1000000
    )
      throw new Error(
        "Enter 1–1440 minutes and a valid hourly rate up to $10,000.",
      );
    p.time.push({ ...record, status: "Unbilled" });
    log(record.matterId, "Time entry recorded locally.");
  } else if (action.type === "bill") {
    const entries = p.time.filter(
      (t) => t.matterId === action.matterId && t.status === "Unbilled",
    );
    if (!entries.length)
      throw new Error("Record unbilled time for this matter first.");
    const invoice = {
      id: crypto.randomUUID(),
      matterId: action.matterId,
      at: now(),
      status: "Draft",
      lines: structuredClone(entries),
      totalCents: entries.reduce((sum, t) => sum + timeAmount(t), 0),
      reviewNote: "",
    };
    p.invoices.push(invoice);
    entries.forEach((t) => {
      t.status = "In draft invoice";
      t.invoiceId = invoice.id;
    });
    log(action.matterId, "Draft invoice prepared from the time ledger.");
  } else if (action.type === "approveBill") {
    const invoice = p.invoices.find((i) => i.id === action.id);
    if (
      !invoice ||
      !next.actor.includes("Partner") ||
      action.note?.trim().length < 15
    )
      throw new Error(
        "Partner preview and a documented billing review are required.",
      );
    invoice.status = "Reviewed locally — not sent";
    invoice.reviewNote = action.note.trim();
    invoice.reviewedAt = now();
    invoice.reviewedBy = next.actor;
    log(
      invoice.matterId,
      "Invoice reviewed locally. No delivery or payment occurred.",
    );
  } else if (action.type === "communication") {
    if (
      !next.matters.some((m) => m.id === record.matterId) ||
      !record.body?.trim()
    )
      throw new Error(
        "Select a matter and enter a client request or proposed update.",
      );
    p.communications.push({
      ...record,
      status:
        record.kind === "Client request"
          ? "Awaiting response"
          : "Draft — internal",
      delivery: "Not sent",
    });
    log(
      record.matterId,
      "Client coordination record created locally; no message sent.",
    );
  } else if (action.type === "approveUpdate") {
    const item = p.communications.find((c) => c.id === action.id);
    if (
      !item ||
      item.kind !== "Proposed update" ||
      !next.actor.includes("Partner") ||
      action.note?.trim().length < 15
    )
      throw new Error(
        "A partner must document the client-facing content review.",
      );
    item.status = "Approved draft — not sent";
    item.reviewNote = action.note.trim();
    item.reviewedBy = next.actor;
  } else if (action.type === "close") {
    const matter = next.matters.find((m) => m.id === record.matterId);
    if (
      !matter?.approval ||
      !record.residual?.trim() ||
      !record.retention?.trim() ||
      !record.distribution?.trim()
    )
      throw new Error(
        "Matter approval, residual obligations, distribution record, and retention instructions are required to prepare closing.",
      );
    p.closings = [
      ...p.closings.filter((c) => c.matterId !== matter.id),
      {
        ...record,
        status: "Closing prepared",
        version: matter.revisions,
        approval: structuredClone(matter.approval),
      },
    ];
    log(
      matter.id,
      "Closing checklist prepared locally. No record deletion or automatic retention enforcement.",
    );
  } else if (action.type === "measurement") {
    if (
      !next.matters.some((m) => m.id === record.matterId) ||
      !Number.isFinite(record.minutes) ||
      record.minutes < 0
    )
      throw new Error("Select a matter and a nonnegative observed time.");
    p.measurements.push(record);
  } else if (action.type === "research") {
    if (
      !next.matters.some((m) => m.id === record.matterId) ||
      !record.question?.trim() ||
      !record.jurisdiction?.trim()
    )
      throw new Error(
        "Matter, jurisdiction, and research question are required.",
      );
    p.research.push({
      ...record,
      status: "Awaiting authority research",
      verified: false,
    });
  } else throw new Error("Unknown practice action");
  return next;
}
