import { useState } from "react";
import {
  actors,
  initialWorkspace,
  loadWorkspace,
  STORAGE_KEY,
  reviewPacket,
  validWorkspace,
} from "@/lib/matterWorkspace";
import { useRecords } from "@/lib/localRecords";
import {
  emptyPractice,
  money,
  practiceChange,
  timeAmount,
} from "@/lib/practiceRecords";
import { navigateTo } from "@/lib/workspaceNavigation";
import { Panel, Button, Field, Badge, StatusMessage } from "./Glass";

export function usePractice() {
  const [seed] = useState(loadWorkspace);
  return useRecords(STORAGE_KEY, seed, validWorkspace);
}
function download(name, value, type = "application/json") {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const digest = async (text) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
  )
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

export default function PracticeDesk() {
  const [state, setState, error, recover] = usePractice();
  const [tab, setTab] = useState("Intake & opening");
  const [matterId, setMatterId] = useState(state.selectedId);
  const [forms, setForms] = useState({});
  const form = forms[matterId] || {
    minutes: "60",
    rate: "350",
    date: new Date().toISOString().slice(0, 10),
    kind: "Proposed update",
    phase: "Baseline",
    category: "Administration",
  };
  const setForm = (value) => setForms((current) => ({ ...current, [matterId]: typeof value === "function" ? value(current[matterId] || form) : value }));
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");
  const [restore, setRestore] = useState(null);
  const p = { ...emptyPractice, ...state.practice };
  const matter =
    state.matters.find((m) => m.id === matterId) || state.matters[0];
  const field = (key, label, type = "text", required = true) => (
    <Field
      key={key}
      label={label}
      type={type}
      required={required}
      value={form[key] ?? ""}
      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
    />
  );
  const act = (action, notice = "Saved locally.") => {
    try {
      setState((current) => practiceChange(current, action));
      setMessage(notice);
    } catch (e) {
      setMessage(e.message);
    }
  };
  const related = (records) => records.filter((r) => r.matterId === matter.id);
  const submit = (action) => (event) => {
    event.preventDefault();
    act(action);
  };
  const openInvoice = (invoice) => {
    const client = state.matters.find((m) => m.id === invoice.matterId);
    download(
      `law-suite-invoice-${invoice.id}.html`,
      `<!doctype html><html lang="en"><meta charset="utf-8"><title>Law Suite draft invoice</title><style>body{font:16px sans-serif;max-width:900px;margin:40px auto}td,th{padding:12px;text-align:left}table{width:100%}</style><h1>Law Suite — demo invoice</h1><p>${escape(client.client)} · ${escape(client.name)} · ${escape(client.id)}</p><p>${escape(invoice.status)}. Fictional record; no payment requested.</p><table><thead><tr><th>Attorney / narrative</th><th>Minutes</th><th>Hourly rate</th><th>Amount</th></tr></thead><tbody>${invoice.lines.map((t) => `<tr><td>${escape(t.attorney)} — ${escape(t.narrative)}</td><td>${t.minutes}</td><td>${money(t.rateCents)}</td><td>${money(timeAmount(t))}</td></tr>`).join("")}</tbody></table><h2>Total ${money(invoice.totalCents)}</h2><p>Review: ${escape(invoice.reviewNote || "Pending")}</p></html>`,
      "text/html",
    );
  };
  return (
    <>
      <Panel
        title="Practice desk"
        subtitle="Connected workflows for fictional matters. Browser-local records, simulated reviewers, no external delivery."
      >
        <div
          className="v-inline wrap"
          role="group"
          aria-label="Practice workflows"
        >
          {[
            "Intake & opening",
            "Time & billing",
            "Client updates",
            "Research requests",
            "Closing & recovery",
            "Pilot measures",
          ].map((name) => (
            <Button
              key={name}
              secondary={tab !== name}
              onClick={() => {
                setTab(name);
                setMessage("");
              }}
            >
              {name}
            </Button>
          ))}
        </div>
        <div className="v-form-grid">
          <label className="v-field">
            <span>Practice matter</span>
            <select
              value={matter.id}
              onChange={(e) => setMatterId(e.target.value)}
            >
              {state.matters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} · {m.client} · {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="v-field">
            <span>Reviewer preview</span>
            <select
              value={state.actor}
              onChange={(e) =>
                setState((s) => ({ ...s, actor: e.target.value }))
              }
            >
              {actors.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
        </div>
        <StatusMessage>{error || message}</StatusMessage>
        {error && (
          <Button secondary onClick={recover}>
            Download recovery copy
          </Button>
        )}
      </Panel>
      {tab === "Intake & opening" && (
        <Panel
          title="Prospective matters"
          action={
            <Button onClick={() => navigateTo("/applications/wizard")}>
              New intake draft
            </Button>
          }
          subtitle="Record the parties, search scope, results, and engagement terms. The demonstration does not run or automatically clear conflicts."
        >
          <Field
            label="Search intake drafts"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {p.intakes
            .filter((i) =>
              `${i.name} ${i.client}`
                .toLowerCase()
                .includes(filter.toLowerCase()),
            )
            .map((i) => (
              <article className="v-task" key={i.id}>
                <h3>{i.name}</h3>
                <p>
                  {i.client} · {i.id}
                </p>
                <Badge>{i.status}</Badge>
                <p>{i.scope}</p>
                {i.matterId ? (
                  <Button
                    onClick={() => navigateTo(`/matters/${i.matterId}/issues`)}
                  >
                    Open approved demo matter
                  </Button>
                ) : (
                  <form
                    onSubmit={submit({
                      type: "intakeReview",
                      id: i.id,
                      parties: form[`parties-${i.id}`],
                      note: form[`note-${i.id}`],
                      decision: i.conflictNote
                        ? "Open matter"
                        : "Conflicts reviewed",
                    })}
                  >
                    {field(
                      `parties-${i.id}`,
                      `Related and adverse parties · ${i.name}`,
                    )}
                    {field(
                      `note-${i.id}`,
                      i.conflictNote
                        ? `Engagement terms and approval · ${i.name}`
                        : `Conflicts search and decision · ${i.name}`,
                    )}
                    {i.conflictNote && (
                      <p>Recorded conflicts review: {i.conflictNote}</p>
                    )}
                    <Button>
                      {i.conflictNote
                        ? "Approve and open demo matter"
                        : "Record conflicts review"}
                    </Button>
                  </form>
                )}
              </article>
            ))}
          {!p.intakes.length && (
            <p>
              No intake drafts yet. Saved wizard drafts appear here before a
              matter can be opened.
            </p>
          )}
        </Panel>
      )}
      {tab === "Time & billing" && (
        <>
          <Panel
            title="Attorney time ledger"
          subtitle="Matter-specific time and invoice lines that preserve the recorded rates. Rates are demo inputs; trust accounting and payments are outside this workflow."
          >
            <form
              onSubmit={submit({
                type: "time",
                record: {
                  matterId: matter.id,
                  attorney: form.attorney || state.actor,
                  narrative: form.narrative,
                  minutes: Number(form.minutes),
                  rateCents: Math.round(Number(form.rate) * 100),
                  date: form.date,
                },
              })}
            >
              <div className="v-form-grid">
                {field("attorney", "Attorney name", "text", false)}
                {field("narrative", "Time narrative")}
                {field("minutes", "Minutes worked", "number")}
                {field("rate", "Hourly rate (USD)", "number")}
                {field("date", "Work date", "date")}
              </div>
              <Button>Record time</Button>
            </form>
            <div className="v-table-scroll">
              <table className="v-table">
                <thead>
                  <tr>
                    <th>Attorney / date</th>
                    <th>Narrative</th>
                    <th>Minutes</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {related(p.time).map((t) => (
                    <tr key={t.id}>
                      <td>
                        {t.attorney}
                        <small>{t.date}</small>
                      </td>
                      <td>{t.narrative}</td>
                      <td>{t.minutes}</td>
                      <td>{money(timeAmount(t))}</td>
                      <td>{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={() => act({ type: "bill", matterId: matter.id })}>
              Prepare draft invoice
            </Button>
          </Panel>
          <Panel title="Matter invoices">
            {related(p.invoices).map((invoice) => (
              <article className="v-task" key={invoice.id}>
                <h3>{money(invoice.totalCents)}</h3>
                <p>{invoice.id}</p>
                <Badge>{invoice.status}</Badge>
                {field(
                  `billing-${invoice.id}`,
                  `Billing review · ${invoice.id}`,
                )}
                <div className="v-inline wrap">
                  <Button
                    onClick={() =>
                      act({
                        type: "approveBill",
                        id: invoice.id,
                        note: form[`billing-${invoice.id}`],
                      })
                    }
                  >
                    Record partner billing review
                  </Button>
                  <Button secondary onClick={() => openInvoice(invoice)}>
                    Export printable invoice
                  </Button>
                </div>
              </article>
            ))}
            {!related(p.invoices).length && <p>No invoices for this matter.</p>}
          </Panel>
        </>
      )}
      {tab === "Client updates" && (
        <Panel
          title="Client coordination"
          subtitle="Only explicitly entered client-facing text appears in exported drafts. Internal review notes are never copied automatically."
        >
          <p>
            {matter.client} · {matter.name} · {matter.id}
          </p>
          <form
            onSubmit={submit({
              type: "communication",
              record: {
                matterId: matter.id,
                kind: form.kind,
                body: form.body,
                due: form.responseDue || "",
              },
            })}
          >
            <label className="v-field">
              <span>Record type</span>
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
              >
                <option>Proposed update</option>
                <option>Client request</option>
              </select>
            </label>
            {field("body", "Client-facing text or instruction")}
            {field("responseDue", "Internal response target", "date", false)}
            <Button>Save coordination record</Button>
          </form>
          {related(p.communications).map((c) => (
            <article className="v-task" key={c.id}>
              <Badge>{c.status}</Badge>
              <h3>{c.kind}</h3>
              <p>{c.body}</p>
              <small>
                {c.delivery} · {c.due || "No response target"}
              </small>
              {c.kind === "Proposed update" && (
                <>
                  {field(
                    `client-${c.id}`,
                    `Client disclosure review · ${c.id}`,
                  )}
                  <Button
                    onClick={() =>
                      act({
                        type: "approveUpdate",
                        id: c.id,
                        note: form[`client-${c.id}`],
                      })
                    }
                  >
                    Approve draft for export
                  </Button>
                  <Button
                    secondary
                    disabled={!c.status.startsWith("Approved")}
                    onClick={() =>
                      download(
                        `client-update-${c.id}.txt`,
                        `${matter.client}\n${matter.name}\n${c.body}\n\nApproved demo draft — not sent.`,
                        "text/plain",
                      )
                    }
                  >
                    Export client draft
                  </Button>
                </>
              )}
            </article>
          ))}
        </Panel>
      )}
      {tab === "Research requests" && (
        <Panel
          title="Research instruction queue"
          subtitle="Assign questions with jurisdiction, expected authority, and source limitations before substantive research. Provider search and authority treatment are not connected."
        >
          <form
            onSubmit={submit({
              type: "research",
              record: {
                matterId: matter.id,
                question: form.question,
                jurisdiction: form.jurisdiction,
                owner: form.researchOwner || state.actor,
                sources: form.sources || "",
                limitations: form.limitations || "",
              },
            })}
          >
            {field("question", "Research question")}
            {field("jurisdiction", "Research jurisdiction")}
            {field("researchOwner", "Research owner", "text", false)}
            {field("sources", "Expected primary sources", "text", false)}
            {field("limitations", "Known gaps and limitations", "text", false)}
            <Button>Save research instruction</Button>
          </form>
          {related(p.research).map((r) => (
            <article className="v-task" key={r.id}>
              <h3>{r.question}</h3>
              <Badge>{r.status}</Badge>
              <p>
                {r.jurisdiction} · {r.owner}
              </p>
              <p>{r.sources}</p>
              <p>{r.limitations}</p>
              <Button
                secondary
                onClick={() => navigateTo(`/matters/${matter.id}/drafts`)}
              >
                Open matter draft and sources
              </Button>
            </article>
          ))}
        </Panel>
      )}
      {tab === "Closing & recovery" && (
        <Panel
          title="Closing and recovery"
          subtitle="Prepare closing only against an approved review. Local retention instructions and hold flags do not enforce a server policy."
        >
          <form
            onSubmit={submit({
              type: "close",
              record: {
                matterId: matter.id,
                residual: form.residual,
                retention: form.retention,
                distribution: form.distribution,
                hold: Boolean(form.hold),
              },
            })}
          >
            {field("residual", "Residual obligations")}
            {field("retention", "Retention instructions")}
            {field("distribution", "Client distribution record")}
            <label>
              <input
                type="checkbox"
                checked={Boolean(form.hold)}
                onChange={(e) => setForm({ ...form, hold: e.target.checked })}
              />{" "}
              Legal hold recorded locally
            </label>
            <Button>Prepare closing checklist</Button>
          </form>
          {related(p.closings).map((c) => (
            <article className="v-task" key={c.id}>
              <Badge>
                {JSON.stringify(c.approval) === JSON.stringify(matter.approval)
                  ? c.status
                  : "Reopened — approval changed"}
              </Badge>
              <p>{c.residual}</p>
              <p>{c.retention}</p>
              <p>Hold: {c.hold ? "Recorded" : "None recorded"}</p>
            </article>
          ))}
          <div className="v-inline wrap">
            <Button
              secondary
              onClick={() =>
                download(
                  `matter-${matter.id}.json`,
                  JSON.stringify(reviewPacket(state, matter), null, 2),
                )
              }
            >
              Export exact matter review packet
            </Button>
            <Button
              onClick={async () => {
                const payload = JSON.stringify(state);
                download(
                  "law-suite-workspace-backup.json",
                  JSON.stringify(
                    {
                      format: "law-suite-workspace",
                      schema: 1,
                      synthetic: true,
                      exportedAt: new Date().toISOString(),
                      sha256: await digest(payload),
                      payload,
                    },
                    null,
                    2,
                  ),
                );
              }}
            >
              Export workspace backup
            </Button>
          </div>
          <p>
            Backup includes the matter workspace and practice ledger. Calendar,
            appearance, and legacy sample preferences are separate local
            records. A checksum detects accidental damage; it is not proof of
            authenticity.
          </p>
          <Field
            label="Validate workspace backup"
            type="file"
            accept=".json"
            onChange={async (e) => {
              try {
                const file = e.target.files[0];
                if (!file || file.size > 10000000)
                  throw new Error("Choose a workspace backup under 10 MB.");
                const backup = JSON.parse(await file.text());
                if (
                  backup.format !== "law-suite-workspace" ||
                  backup.schema !== 1 ||
                  !backup.synthetic ||
                  (await digest(backup.payload)) !== backup.sha256
                )
                  throw new Error("Backup format or checksum is invalid.");
                const data = JSON.parse(backup.payload),
                  baseline = initialWorkspace();
                if (
                  data.version !== 2 ||
                  !Array.isArray(data.matters) ||
                  !data.documents ||
                  !Array.isArray(data.events) ||
                  !baseline.matters.every((m) =>
                    data.matters.some((x) => x.id === m.id),
                  ) ||
                  !data.matters.every(
                    (m) =>
                      Array.isArray(m.issues) &&
                      m.issues.length &&
                      Array.isArray(m.controls) &&
                      m.deadline,
                  )
                )
                  throw new Error("Backup workspace schema is invalid.");
                setRestore(data);
                setMessage(
                  `Validated ${data.matters.length} matters. Restoring replaces the current workspace; export it first.`,
                );
              } catch (e) {
                setRestore(null);
                setMessage(e.message);
              }
            }}
          />
          {restore && (
            <Button
              onClick={() => {
                setState(restore);
                setRestore(null);
                setMessage(
                  "Workspace restore requested. Check for a storage or conflict warning before leaving.",
                );
              }}
            >
              Replace workspace with validated backup
            </Button>
          )}
        </Panel>
      )}
      {tab === "Pilot measures" && (
        <Panel
          title="Measure the whole task"
          subtitle="Record observed effort, including corrections and supervision. No time savings are inferred from sample dashboard figures."
        >
          <form
            onSubmit={submit({
              type: "measurement",
              record: {
                matterId: matter.id,
                phase: form.phase,
                category: form.category,
                minutes: Number(form.observedMinutes),
                note: form.measureNote || "",
              },
            })}
          >
            <div className="v-form-grid">
              <label className="v-field">
                <span>Measurement phase</span>
                <select
                  value={form.phase}
                  onChange={(e) => setForm({ ...form, phase: e.target.value })}
                >
                  <option>Baseline</option>
                  <option>Law Suite evaluation</option>
                </select>
              </label>
              <label className="v-field">
                <span>Task measured</span>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {[
                    "Administration",
                    "Partner review",
                    "Duplicate entry",
                    "Rework",
                    "Client response",
                    "Client-facing work",
                    "Support and recovery",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              {field("observedMinutes", "Observed minutes", "number")}
              {field(
                "measureNote",
                "Complexity and observation notes",
                "text",
                false,
              )}
            </div>
            <Button>Record observation</Button>
          </form>
          {related(p.measurements).map((r) => (
            <p key={r.id}>
              {r.phase} · {r.category}: {r.minutes} minutes · {r.note}
            </p>
          ))}
          <Button
            secondary
            onClick={() =>
              download(
                "law-suite-pilot-observations.json",
                JSON.stringify(related(p.measurements), null, 2),
              )
            }
          >
            Export observations
          </Button>
        </Panel>
      )}
    </>
  );
}
