import { reviewPacket, targetDate } from "./matterWorkspace";
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const date = (at) => new Date(at).toLocaleString();

export function exportMemorandum(state, matter) {
  const packet = reviewPacket(state, matter);
  const rows = matter.issues
    .map(
      (i) =>
        `<section><h2>${escape(i.id)} · ${escape(i.title)}</h2><p><b>${i.excluded ? "Excluded from reliance" : escape(i.evidenceState)}</b> · ${i.review ? "Review recorded" : "Review open"} · ${escape(i.workState)}</p><p>${escape(i.excluded ? "This proposition is excluded. Further research or evidence is required before reliance." : (matter.draftEdits[i.id] ?? i.statement))}</p><p>Sources: ${escape(i.sources.map((id) => `${state.documents[id].title} v${state.documents[id].version}`).join(", ") || "None")}</p><p>Review: ${escape(i.review ? `${i.review.reviewer} · ${date(i.review.at)} · ${i.review.note}` : "Not completed")}</p><p>Next owner: ${escape(i.assignee)} · Task target: ${escape(i.taskDue)}</p>${i.notes.map((n) => `<p>${escape(n.state)} · ${escape(n.by)} · ${escape(date(n.at))}: ${escape(n.text)}</p>`).join("")}</section>`,
    )
    .join("");
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>Law Suite — ${escape(matter.name)} review memorandum</title><style>body{max-width:850px;margin:48px auto;padding:0 24px;color:#17332e;font:15px/1.7 system-ui}h1{font-size:32px}h2{font-size:19px}section{border-top:1px solid #cddbd6;margin-top:28px;padding-top:15px;break-inside:avoid}small{color:#53635e}@media print{body{margin:0}}</style><body><small>LAW SUITE · FICTIONAL DEMONSTRATION</small><h1>${escape(matter.name)}</h1><h2>Internal review memorandum</h2><p>${escape(packet.handoff)}${packet.qualified ? " · QUALIFIED SCOPE" : ""}</p><p>${escape(matter.approval ? `Approved internally by ${matter.approval.by} at ${date(matter.approval.at)}` : "Partner approval outstanding")}</p><p>${escape(packet.disclaimer)}</p>${rows}<section><h2>Prerequisite checks</h2>${matter.controls.map((c) => `<p>${escape(c.label)}: ${c.checked ? "Recorded" : "Outstanding"}${c.by ? ` · ${escape(c.by)} · ${escape(date(c.at))}` : ""}</p>`).join("")}<h2>Internal review target</h2><p>${escape(targetDate(matter.deadline) || "Incomplete")} · ${escape(matter.deadline.basis)} ${escape(matter.deadline.assumption)}</p></section><section><h2>Decision history</h2>${packet.events.map((e) => `<p>${escape(date(e.at))} · ${escape(e.actor)} · ${escape(e.action)}</p>`).join("") || "No decisions recorded."}</section><small>Generated ${escape(date(packet.generatedAt))}. This record is editable and is not an immutable audit log.</small></body></html>`;
}
