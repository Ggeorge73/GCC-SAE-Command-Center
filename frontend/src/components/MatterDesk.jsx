import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileCheck2,
  FileText,
  GitBranch,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import {
  actors,
  STORAGE_KEY,
  loadWorkspace,
  initialWorkspace,
  changeWorkspace,
  readiness,
  reviewPacket,
  targetDate,
} from "@/lib/matterWorkspace";
import { exportMemorandum } from "@/lib/reviewMemorandum";
import PortfolioOverview from "./PortfolioOverview";
import MatterDirectory from "./MatterDirectory";
import { directoryPath } from "@/lib/workspaceNavigation";
import "./MatterDesk.css";
import "./WorkspaceLayout.css";

const labels = {
  supported: "Source available",
  contradicted: "Conflicting evidence",
  missing: "Source missing",
  stale: "Outdated version",
};
const tabs = [
  ["issues", "Issues & evidence"],
  ["drafts", "Draft & sources"],
  ["handoff", "Handoff requirements"],
  ["activity", "Decision history"],
  ["value", "Value estimate"],
];
const time = (at) => new Date(at).toLocaleString();
const money = (n) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
export function download(name, value, type) {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Dialog({ title, children, close }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="desk-dialog"
      onCancel={close}
      aria-labelledby="dialog-title"
    >
      <header>
        <div>
          <span className="desk-eyebrow">LAW SUITE / DEMO RECORD</span>
          <h2 id="dialog-title">{title}</h2>
        </div>
        <button
          className="desk-icon-button"
          aria-label="Close dialog"
          onClick={close}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export default function MatterDesk({ route, onNavigate }) {
  const [state, setState] = useState(loadWorkspace);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [view, setView] = useState("issues");
  const [notice, setNotice] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [modal, setModal] = useState(null);
  const [baseline, setBaseline] = useState(40);
  const [hours, setHours] = useState(18);
  const [rate, setRate] = useState(350);
  const latestState = useRef(state);
  latestState.current = state;
  const workbench = useRef(null);
  useEffect(() => {
    if (route.workspace !== "review") return;
    if (
      route.page === "detail" &&
      latestState.current.matters.some((m) => m.id === route.matterId)
    ) {
      if (latestState.current.selectedId !== route.matterId) {
        const next = changeWorkspace(latestState.current, {
          type: "select",
          matterId: route.matterId,
        });
        latestState.current = next;
        setState(next);
        setSelectedIssue(null);
      }
      setView(route.section);
    }
    setNotice("");
    document.querySelector(".matter-desk")?.scrollTo({ top: 0 });
  }, [route]);
  const unknownMatter =
    route.page === "detail" &&
    !state.matters.some((m) => m.id === route.matterId);
  const matter = state.matters.find((m) => m.id === state.selectedId);
  const importText = matter.importDraft || "";
  const provider = matter.importProvider || "External AI tool";
  const setImportText = (value) => dispatch({ type: "importDraft", value });
  const setProvider = (value) => dispatch({ type: "importProvider", value });
  const issue =
    matter.issues.find((i) => i.id === selectedIssue) || matter.issues[0];
  const assessment = readiness(matter);
  const events = state.events.filter((e) => e.matterId === matter.id);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  function dispatch(action, message) {
    try {
      const next = changeWorkspace(latestState.current, {
        matterId: matter.id,
        issueId: issue.id,
        ...action,
      });
      latestState.current = next;
      setState(next);
      if (message) setNotice(message);
    } catch (error) {
      setNotice(error.message);
    }
  }
  function navigate(section) {
    setView(section);
    onNavigate(`/matters/${matter.id}/${section}`);
  }
  function openIssue(id) {
    setSelectedIssue(id);
    navigate("issues");
    setNotice("");
  }
  function exportPacket() {
    download(
      `law-suite-${matter.id.toLowerCase()}-demo-review.json`,
      JSON.stringify(reviewPacket(state, matter), null, 2),
      "application/json",
    );
    setNotice(
      "Demo packet exported with sources, qualifications, decisions, and open work.",
    );
  }
  function memo() {
    download(
      `law-suite-${matter.id.toLowerCase()}-review-memorandum.html`,
      exportMemorandum(state, matter),
      "text/html",
    );
    setNotice(
      "Review memorandum downloaded. Open it in your browser to print or save as PDF.",
    );
  }
  const sourceButton = (id) => (
    <button
      key={id}
      className="desk-text-button"
      onClick={() => setModal({ type: "source", id })}
    >
      <FileText size={14} />
      {state.documents[id].title} v{state.documents[id].version}
      <ArrowUpRight size={13} />
    </button>
  );

  return (
    <div className="matter-desk" data-testid="matter-desk">
      <div className="desk-page">
        <div className="desk-topline">
          <span>
            FIRM PORTFOLIO <ChevronRight size={13} />{" "}
            {route.page === "dashboard"
              ? "OVERVIEW"
              : route.page === "matters"
                ? "MATTERS"
                : matter.id}
          </span>
          <div>
            <span className="desk-demo">
              <i /> Interactive demonstration
            </span>
            <button
              className="desk-icon-button"
              aria-label="Open demo guide"
              onClick={() => setModal({ type: "help" })}
            >
              <CircleHelp size={19} />
            </button>
            <button
              className="desk-icon-button"
              aria-label="Open local activity"
              onClick={() => navigate("activity")}
            >
              <Bell size={19} />
            </button>
            <button
              className="desk-icon-button"
              aria-label="Reset demo"
              onClick={() => setModal({ type: "reset" })}
            >
              <RotateCcw size={17} />
            </button>
            <span className="desk-avatar">
              {state.actor
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
        </div>
        {route.page === "dashboard" && (
          <>
            <div className="dashboard-intro">
              <div>
                <span className="desk-eyebrow">01 / THE FIRM AT A GLANCE</span>
                <h1>
                  Clarity in every matter.
                  <br />
                  <em>Perspective for the firm.</em>
                </h1>
                <p>Your portfolio, its priorities, and the decisions ahead.</p>
              </div>
              <button
                className="desk-button secondary"
                onClick={() => onNavigate("/matters")}
              >
                Explore all matters <ArrowUpRight size={16} />
              </button>
            </div>
            <PortfolioOverview
              state={state}
              browse={(filters) => onNavigate(directoryPath(filters))}
            />
            <div className="dashboard-bottom">
              <section className="dashboard-attention">
                <div className="panel-caption">
                  <h2>Needs attention</h2>
                  <button
                    className="desk-text-button"
                    onClick={() =>
                      onNavigate(
                        directoryPath({ status: "Evidence exceptions" }),
                      )
                    }
                  >
                    View exceptions <ArrowUpRight size={14} />
                  </button>
                </div>
                <p>
                  Up to five matters with the most unresolved evidence
                  questions.
                </p>
                {[...state.matters]
                  .filter((m) => readiness(m).gaps.length > 0)
                  .sort(
                    (a, b) =>
                      readiness(b).gaps.length - readiness(a).gaps.length,
                  )
                  .slice(0, 5)
                  .map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onNavigate(`/matters/${m.id}/issues`)}
                    >
                      <span>
                        <strong>{m.name}</strong>
                        <small>
                          {m.id} · {m.practice}
                        </small>
                      </span>
                      <b>{readiness(m).gaps.length} exceptions</b>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                {!state.matters.some((m) => readiness(m).gaps.length > 0) && (
                  <p className="desk-empty">
                    No unresolved evidence exceptions in the current scope.
                  </p>
                )}
              </section>
              <section className="dashboard-recent">
                <div className="panel-caption">
                  <h2>Recent decisions</h2>
                  <span>LAST 3 EVENTS</span>
                </div>
                {state.events.length ? (
                  [...state.events]
                    .reverse()
                    .slice(0, 3)
                    .map((e) => (
                      <button
                        key={e.id}
                        onClick={() =>
                          onNavigate(`/matters/${e.matterId}/activity`)
                        }
                      >
                        <Activity size={16} />
                        <span>
                          <strong>{e.action}</strong>
                          <small>
                            {e.actor} · {time(e.at)}
                          </small>
                        </span>
                        <ArrowUpRight size={14} />
                      </button>
                    ))
                ) : (
                  <div className="dashboard-recent-empty">
                    <Activity size={25} />
                    <h3>Every decision leaves a trail.</h3>
                    <p>
                      Recorded reviews and source changes appear here as your
                      team works.
                    </p>
                    <button
                      className="desk-text-button"
                      onClick={() => onNavigate("/matters")}
                    >
                      Start a matter review <ArrowUpRight size={14} />
                    </button>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
        {route.page === "matters" && (
          <MatterDirectory
            matters={state.matters}
            route={route}
            openMatter={(m) => onNavigate(`/matters/${m.id}/issues`)}
          />
        )}
        {unknownMatter && (
          <div className="desk-empty">
            <h1>Matter not found</h1>
            <p>
              This matter is not available in the current browser workspace.
            </p>
            <button
              className="desk-button"
              onClick={() => onNavigate("/matters")}
            >
              Return to matters
            </button>
          </div>
        )}
        {route.page === "detail" && !unknownMatter && (
          <>
            <div className="detail-navigation">
              <button
                className="desk-text-button"
                onClick={() => onNavigate("/matters")}
              >
                <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
                All matters
              </button>
              <span>MATTER / {matter.id}</span>
            </div>
            <section
              ref={workbench}
              className="desk-workbench"
              aria-label="Selected matter review"
            >
              <div className="desk-matter-heading">
                <div>
                  <div className="desk-eyebrow">
                    {matter.id} / {matter.jurisdiction}
                  </div>
                  <h2>{matter.name}</h2>
                  <p>{matter.summary}</p>
                </div>
                <button
                  className="desk-button secondary"
                  onClick={exportPacket}
                >
                  <ArrowDownToLine size={15} />
                  Export demo packet
                </button>
              </div>
              <div className="desk-matter-details">
                <span>
                  <Users size={15} />
                  Lead <b>{matter.owner}</b>
                </span>
                <span>
                  <Clock3 size={15} />
                  Review target{" "}
                  <b>{targetDate(matter.deadline) || "Set target"}</b>
                </span>
                <label>
                  Simulated participant
                  <select
                    aria-label="Simulated participant"
                    value={state.actor}
                    onChange={(e) =>
                      dispatch({ type: "actor", value: e.target.value })
                    }
                  >
                    {actors.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div
                className="desk-tabs"
                role="tablist"
                aria-label="Matter sections"
              >
                {tabs.map(([id, label], index) => (
                  <button
                    key={id}
                    role="tab"
                    id={`desk-tab-${id}`}
                    aria-selected={view === id}
                    aria-controls="desk-panel"
                    tabIndex={view === id ? 0 : -1}
                    onClick={() => {
                      navigate(id);
                      setNotice("");
                    }}
                    onKeyDown={(e) => {
                      let next;
                      if (e.key === "ArrowRight")
                        next = (index + 1) % tabs.length;
                      if (e.key === "ArrowLeft")
                        next = (index - 1 + tabs.length) % tabs.length;
                      if (e.key === "Home") next = 0;
                      if (e.key === "End") next = tabs.length - 1;
                      if (next !== undefined) {
                        e.preventDefault();
                        navigate(tabs[next][0]);
                        document
                          .getElementById(`desk-tab-${tabs[next][0]}`)
                          .focus();
                      }
                    }}
                  >
                    {label}
                    {id === "issues" && <span>{matter.issues.length}</span>}
                  </button>
                ))}
              </div>
              {notice && (
                <p className="desk-notice" role="status">
                  {notice}
                </p>
              )}
              <div
                id="desk-panel"
                role="tabpanel"
                aria-labelledby={`desk-tab-${view}`}
              >
                {view === "issues" && (
                  <div className="desk-review-layout">
                    <div className="desk-issue-list">
                      <span className="desk-eyebrow">PRIORITY QUEUE</span>
                      {matter.issues.map((i) => (
                        <button
                          key={i.id}
                          onClick={() => openIssue(i.id)}
                          aria-pressed={issue.id === i.id}
                          className={issue.id === i.id ? "selected" : ""}
                        >
                          <span className="desk-issue-meta">
                            {i.category}
                            <span
                              className={
                                i.severity === "Critical" ? "critical" : ""
                              }
                            >
                              {i.severity}
                            </span>
                          </span>
                          <strong>{i.title}</strong>
                          <span className="desk-issue-footer">
                            {i.review ? (
                              <span className="desk-checked">
                                <Check size={13} />
                                Review recorded
                              </span>
                            ) : i.excluded ? (
                              "Excluded · review needed"
                            ) : (
                              labels[i.evidenceState]
                            )}
                            <ChevronRight size={15} />
                          </span>
                          <small>
                            {i.workState} · {i.assignee}
                            {i.draftNote && " · Decision draft saved"}
                          </small>
                        </button>
                      ))}
                      <div className="desk-queue-note">
                        <ShieldCheck size={17} />
                        <p>
                          Record progress at any stage. Evidence gaps remain
                          visible until resolved or explicitly excluded.
                        </p>
                      </div>
                    </div>
                    <article className="desk-evidence">
                      <div className="desk-evidence-top">
                        <span className="desk-eyebrow">
                          EVIDENCE RECORD / {issue.id}
                        </span>
                        <span
                          className={`desk-source-state ${issue.evidenceState}`}
                        >
                          {labels[issue.evidenceState]}
                        </span>
                      </div>
                      <h3>{issue.title}</h3>
                      <p>{issue.finding}</p>
                      {issue.excluded && (
                        <div className="desk-alert">
                          Excluded from reliance. Evidence remains{" "}
                          {labels[issue.evidenceState].toLowerCase()}; this
                          qualification follows the draft and memorandum.
                        </div>
                      )}
                      {issue.quote ? (
                        <div className="desk-source">
                          <span>
                            <FileText size={15} />
                            {issue.source}
                          </span>
                          <blockquote>“{issue.quote}”</blockquote>
                          <small>
                            Fictional source · No independent legal verification
                          </small>
                          <div className="desk-source-links">
                            {issue.sources.map(sourceButton)}
                          </div>
                        </div>
                      ) : (
                        <div className="desk-source missing">
                          <FileCheck2 size={23} />
                          <strong>No source attached</strong>
                          <p>
                            Assign research or explicitly exclude the
                            unsupported proposition. A demo action cannot verify
                            real legal authority.
                          </p>
                        </div>
                      )}
                      {issue.id === "N2" && (
                        <div className="desk-conflict">
                          <GitBranch size={17} />
                          <div>
                            <strong>Compare the related consent clause</strong>
                            <p>{state.documents.N1.sections[1].text}</p>
                            {sourceButton("N1")}
                          </div>
                        </div>
                      )}
                      {issue.pendingChange && (
                        <div className="desk-change">
                          <div className="desk-eyebrow">
                            SOURCE CHANGED / REVIEW REOPENED
                          </div>
                          <h4>
                            Inspect what changed before relying on this finding
                          </h4>
                          <div className="desk-diff">
                            {[
                              ["Previous", issue.pendingChange.previous],
                              ["Current", issue.pendingChange.next],
                            ].map(([label, d]) => (
                              <div key={label}>
                                <span>
                                  {label} · v{d.version}
                                </span>
                                {d.sections.map((s) => (
                                  <p key={s.anchor}>
                                    {s.anchor} — {s.text}
                                  </p>
                                ))}
                              </div>
                            ))}
                          </div>
                          {issue.pendingChange.previousReview && (
                            <p>
                              Earlier review by{" "}
                              {issue.pendingChange.previousReview.reviewer} is
                              no longer current. Decision history is retained.
                            </p>
                          )}
                          <button
                            className="desk-button"
                            onClick={() =>
                              dispatch(
                                { type: "acceptChange" },
                                "Source comparison inspected. Record a fresh review; any contradiction still blocks reliance.",
                              )
                            }
                          >
                            I inspected the source change
                          </button>
                        </div>
                      )}
                      <div className="desk-working-statement">
                        <span className="desk-eyebrow">
                          WORKING STATEMENT / MEMORANDUM
                        </span>
                        <p>
                          {issue.excluded
                            ? "Excluded from reliance pending further evidence or research."
                            : (matter.draftEdits[issue.id] ?? issue.statement)}
                        </p>
                        <button
                          className="desk-text-button"
                          onClick={() => navigate("drafts")}
                        >
                          Edit the connected draft <ArrowRight size={13} />
                        </button>
                      </div>
                      <div className="desk-next">
                        <span>NEXT STEP / {issue.assignee}</span>
                        <p>{issue.next}</p>
                      </div>
                      {issue.review && (
                        <div className="desk-recorded">
                          <Check size={20} />
                          <div>
                            <strong>
                              Review recorded by {issue.review.reviewer}
                            </strong>
                            <p>{issue.review.note}</p>
                            <small>{time(issue.review.at)}</small>
                            <button
                              onClick={() =>
                                dispatch(
                                  { type: "reopen" },
                                  "Issue reopened. Internal approval revoked and readiness recalculated.",
                                )
                              }
                            >
                              Reopen review
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="desk-review-form">
                        <div className="desk-form-heading">
                          <h4>Move this issue forward</h4>
                          <span>Draft saves automatically</span>
                        </div>
                        <label>
                          Review note
                          <textarea
                            value={issue.draftNote}
                            maxLength={4000}
                            placeholder="Record your judgment, escalation, or evidence request…"
                            onChange={(e) =>
                              dispatch({
                                type: "noteDraft",
                                value: e.target.value,
                              })
                            }
                          />
                        </label>
                        <div className="desk-task-fields">
                          <label>
                            Next owner
                            <select
                              value={issue.assignee}
                              onChange={(e) =>
                                dispatch({
                                  type: "taskField",
                                  field: "assignee",
                                  value: e.target.value,
                                })
                              }
                            >
                              {actors
                                .map((a) => a.split(" · ")[0])
                                .map((a) => (
                                  <option key={a}>{a}</option>
                                ))}
                            </select>
                          </label>
                          <label>
                            Task due date
                            <input
                              type="date"
                              value={issue.taskDue}
                              onChange={(e) =>
                                dispatch({
                                  type: "taskField",
                                  field: "taskDue",
                                  value: e.target.value,
                                })
                              }
                            />
                          </label>
                        </div>
                        <div className="desk-action-row">
                          {[
                            ["Note saved", "Save note"],
                            ["Assigned", "Assign"],
                            ["Escalated", "Escalate"],
                            ["Deferred", "Defer"],
                            ["Resolved", "Resolve task"],
                          ].map(([value, label]) => (
                            <button
                              key={value}
                              className="desk-button secondary"
                              disabled={issue.draftNote.trim().length < 15}
                              onClick={() =>
                                dispatch(
                                  { type: "decision", value },
                                  `${label} recorded. Evidence status unchanged; no external notification sent.`,
                                )
                              }
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <div className="desk-review-actions">
                          <button
                            className="desk-button"
                            disabled={
                              Boolean(issue.review) ||
                              Boolean(issue.pendingChange) ||
                              (!issue.excluded &&
                                issue.evidenceState !== "supported") ||
                              issue.draftNote.trim().length < 15
                            }
                            onClick={() =>
                              dispatch(
                                { type: "review" },
                                "Review recorded in this browser. Partner approval is a separate step.",
                              )
                            }
                          >
                            <Check size={16} />
                            Record review
                          </button>
                          <button
                            className="desk-text-button"
                            disabled={
                              issue.draftNote.trim().length < 15 ||
                              Boolean(issue.pendingChange)
                            }
                            onClick={() =>
                              dispatch(
                                { type: "exclude" },
                                "Scope decision recorded. Qualification retained; fresh review required.",
                              )
                            }
                          >
                            {issue.excluded
                              ? "Restore proposition to scope"
                              : "Exclude proposition from reliance"}
                          </button>
                        </div>
                        <p className="desk-form-hint">
                          Explain substantive decisions. Exclusion records an
                          unresolved limitation; it does not validate evidence.
                        </p>
                      </div>
                      {!!issue.notes.length && (
                        <div className="desk-note-history">
                          <h4>Issue activity</h4>
                          {[...issue.notes].reverse().map((n, index) => (
                            <div key={index}>
                              <span>
                                {n.state} · {n.by} · {time(n.at)}
                              </span>
                              <p>{n.text}</p>
                              {n.due && (
                                <small>
                                  Next owner: {n.assignee} · Due {n.due}
                                </small>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  </div>
                )}

                {view === "drafts" && (
                  <div className="desk-drafts">
                    <div className="desk-panel-intro">
                      <div>
                        <span className="desk-eyebrow">
                          CONNECTED WORK PRODUCT
                        </span>
                        <h3>Follow each statement to its source.</h3>
                        <p>
                          Edits and sample source changes reopen affected
                          reviews and revoke internal approval.
                        </p>
                      </div>
                      <button
                        className="desk-button"
                        onClick={() =>
                          dispatch(
                            { type: "revision" },
                            "New sample source loaded. Inspect the reopened comparisons in Issues & evidence.",
                          )
                        }
                      >
                        <GitBranch size={16} />
                        Load next sample revision
                      </button>
                    </div>
                    <div className="desk-draft-layout">
                      <div className="desk-draft-paper">
                        <div className="desk-document-toolbar">
                          <FileText size={16} />
                          INTERNAL WORKING DRAFT<span>Demo editor</span>
                        </div>
                        <h3>{matter.name}</h3>
                        <p className="desk-document-subtitle">
                          Review memorandum · Working statements
                        </p>
                        {matter.issues.map((i) => (
                          <div className="desk-draft-statement" key={i.id}>
                            <div>
                              <span>{i.id}</span>
                              <span
                                className={
                                  i.review ? "desk-checked" : "desk-amber"
                                }
                              >
                                {i.pendingChange
                                  ? "Source changed"
                                  : i.excluded
                                    ? "Excluded from reliance"
                                    : i.review
                                      ? "Reviewed"
                                      : "Review needed"}
                              </span>
                            </div>
                            {i.excluded ? (
                              <p className="desk-alert">
                                {i.title}: excluded pending further evidence or
                                research. The original proposition is omitted.
                              </p>
                            ) : (
                              <textarea
                                aria-label={`Draft statement ${i.id}`}
                                value={matter.draftEdits[i.id] ?? i.statement}
                                maxLength={5000}
                                onChange={(e) =>
                                  dispatch({
                                    type: "draft",
                                    issueId: i.id,
                                    value: e.target.value,
                                  })
                                }
                                onBlur={() => {
                                  if (Object.hasOwn(matter.draftEdits, i.id))
                                    dispatch({
                                      type: "recordDraft",
                                      issueId: i.id,
                                    });
                                }}
                              />
                            )}
                            <button
                              className="desk-text-button"
                              onClick={() => openIssue(i.id)}
                            >
                              Review {i.id} and linked evidence{" "}
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <aside className="desk-dependencies">
                        <GitBranch size={23} />
                        <h3>Evidence dependencies</h3>
                        <p>
                          Source → finding → working statement → internal
                          approval
                        </p>
                        {matter.issues.map((i) => (
                          <div key={i.id}>
                            <strong>
                              {i.id} / {i.category}
                            </strong>
                            {i.sources.length ? (
                              i.sources.map(sourceButton)
                            ) : (
                              <span className="desk-amber">
                                No linked source
                              </span>
                            )}
                            <small>
                              {i.pendingChange
                                ? "Source changed · Review reopened"
                                : i.review
                                  ? "Review recorded"
                                  : "Awaiting review"}
                            </small>
                          </div>
                        ))}
                        <p className="desk-form-hint">
                          Links and comparisons are scripted for fictional
                          matters. No AI extraction runs.
                        </p>
                      </aside>
                    </div>
                    <section className="desk-import">
                      <span className="desk-eyebrow">
                        INDEPENDENT DRAFT INTAKE
                      </span>
                      <h3>Bring work from another tool.</h3>
                      <p>
                        Paste fictional text with references such as [N1 v3].
                        Inspection matches identifiers and versions in this
                        matter; it does not verify legal support or treatment.
                      </p>
                      <div className="desk-task-fields">
                        <label>
                          Draft origin
                          <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                          >
                            <option>External AI tool</option>
                            <option>Firm research team</option>
                            <option>Other drafting tool</option>
                          </select>
                        </label>
                        <label>
                          Import sample text file
                          <input
                            type="file"
                            accept=".txt,.md,text/plain"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              if (file.size > 100000) {
                                setNotice(
                                  "Use a fictional text file smaller than 100 KB.",
                                );
                                return;
                              }
                              try {
                                setImportText(await file.text());
                              } catch {
                                setNotice(
                                  "Could not read file. Paste sample text instead.",
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                      <label>
                        External draft
                        <textarea
                          value={importText}
                          maxLength={100000}
                          onChange={(e) => setImportText(e.target.value)}
                          placeholder="The agreement requires consent [N1 v3]. All consents are complete [N2 v2]."
                        />
                      </label>
                      <button
                        className="desk-button"
                        onClick={() =>
                          dispatch(
                            { type: "import", text: importText, provider },
                            "Draft inspected locally. Reference matches do not verify assertions.",
                          )
                        }
                      >
                        Inspect source references
                      </button>
                      {matter.imported && (
                        <div className="desk-import-results">
                          <h4>
                            Reference inspection · {matter.imported.provider}
                          </h4>
                          {matter.imported.outdated && (
                            <p className="desk-alert">
                              Sources changed after inspection. Inspect this
                              draft again.
                            </p>
                          )}
                          {matter.imported.references.length ? (
                            matter.imported.references.map((r, index) => (
                              <p key={index}>
                                <b>{r.reference}</b>
                                <span>{r.result}</span>
                              </p>
                            ))
                          ) : (
                            <p>
                              No recognized references. Assertions remain
                              unverified.
                            </p>
                          )}
                          <details>
                            <summary>View imported text</summary>
                            <pre>{matter.imported.text}</pre>
                          </details>
                          <small>
                            No assertions are automatically approved or added to
                            the working memorandum.
                          </small>
                        </div>
                      )}
                    </section>
                  </div>
                )}

                {view === "handoff" && (
                  <div className="desk-handoff">
                    <div className="desk-readiness-banner">
                      <ShieldCheck size={30} />
                      <div>
                        <h3>
                          {matter.approval
                            ? "Internal demo memorandum approved"
                            : assessment.ready
                              ? "Ready for supervising lawyer review"
                              : "Handoff is blocked"}
                        </h3>
                        <p>
                          {assessment.qualified
                            ? "Qualified scope: excluded propositions remain visible in the memorandum."
                            : matter.restrictions}
                        </p>
                      </div>
                      <span
                        className={`desk-status ${assessment.ready ? "ready" : ""}`}
                      >
                        {assessment.ready ? "Review complete" : "Action needed"}
                      </span>
                    </div>
                    <div className="desk-handoff-columns">
                      <div>
                        <h3>The path to readiness</h3>
                        {[
                          [
                            "Evidence scope",
                            assessment.gaps.length,
                            "Unresolved evidence records",
                          ],
                          [
                            "Attorney review",
                            assessment.open.length,
                            "Open or invalidated reviews",
                          ],
                          [
                            "Team handoff",
                            assessment.tasks.length,
                            "Assigned, escalated, or deferred work",
                          ],
                          [
                            "Prerequisites",
                            assessment.controls.length,
                            "Outstanding policy checks",
                          ],
                          [
                            "Internal target",
                            assessment.validTarget ? 0 : 1,
                            "Invalid review target",
                          ],
                        ].map(([label, n, sub]) => (
                          <div className="desk-readiness-step" key={label}>
                            <span className={n ? "pending" : "complete"}>
                              {n || <Check size={16} />}
                            </span>
                            <div>
                              <strong>{label}</strong>
                              <p>
                                {n
                                  ? `${n} · ${sub}`
                                  : "Completed for this demo scope"}
                              </p>
                            </div>
                          </div>
                        ))}
                        {assessment.open.map((i) => (
                          <button
                            className="desk-blocker-link"
                            key={i.id}
                            onClick={() => openIssue(i.id)}
                          >
                            {i.id} · {i.title}
                            <ArrowRight size={14} />
                          </button>
                        ))}
                      </div>
                      <div className="desk-prerequisites">
                        <h3>Record the prerequisite checks</h3>
                        <p>
                          Actions record the simulated participant and time.
                          They do not grant access or obtain client consent.
                        </p>
                        {matter.controls.map((c) => (
                          <div key={c.id}>
                            <label>
                              <input
                                type="checkbox"
                                checked={c.checked}
                                onChange={() =>
                                  dispatch(
                                    { type: "control", id: c.id },
                                    "Prerequisite updated with participant and timestamp.",
                                  )
                                }
                              />
                              {c.label}
                            </label>
                            {c.by && (
                              <small>
                                {c.checked ? "Recorded" : "Reopened"} by {c.by}{" "}
                                · {time(c.at)}
                              </small>
                            )}
                          </div>
                        ))}
                        <button
                          className="desk-button"
                          disabled={
                            !assessment.ready ||
                            !state.actor.endsWith("Partner") ||
                            Boolean(matter.approval)
                          }
                          onClick={() =>
                            dispatch(
                              { type: "approve" },
                              "Internal demo approval recorded. Nothing was sent or filed.",
                            )
                          }
                        >
                          <ShieldCheck size={16} />
                          Approve internal memorandum
                        </button>
                        {!state.actor.endsWith("Partner") && (
                          <small>
                            Switch to the simulated partner to approve.
                          </small>
                        )}
                        {matter.approval && (
                          <p className="desk-checked">
                            {matter.approval.by} · {time(matter.approval.at)}
                          </p>
                        )}
                        <button
                          className="desk-button secondary"
                          onClick={memo}
                        >
                          <ArrowDownToLine size={16} />
                          Download review memorandum
                        </button>
                        <small>
                          HTML document · Open to print or save as PDF. Includes
                          unresolved work and qualifications.
                        </small>
                      </div>
                    </div>
                    <section className="desk-deadline">
                      <span className="desk-eyebrow">
                        DEPENDENCIES & TIMING
                      </span>
                      <h3>Make the review target explainable.</h3>
                      <p>{matter.deadline.basis}</p>
                      <div className="desk-deadline-fields">
                        <label>
                          Complete packet received
                          <input
                            type="date"
                            value={matter.deadline.trigger}
                            onChange={(e) =>
                              dispatch({
                                type: "deadline",
                                field: "trigger",
                                value: e.target.value,
                              })
                            }
                          />
                        </label>
                        <label>
                          Calendar days after receipt
                          <input
                            type="number"
                            min="0"
                            max="365"
                            step="1"
                            value={matter.deadline.days}
                            onChange={(e) =>
                              dispatch({
                                type: "deadline",
                                field: "days",
                                value: e.target.value,
                              })
                            }
                          />
                        </label>
                        <div>
                          <span>INTERNAL TARGET</span>
                          <strong>
                            {targetDate(matter.deadline) || "Incomplete"}
                          </strong>
                        </div>
                      </div>
                      <p>{matter.deadline.assumption}</p>
                      <p>
                        <b>Dependencies:</b> complete packet → resolve
                        exceptions → attorney review → partner approval. A
                        target date does not clear outstanding dependencies.
                      </p>
                      <button
                        className="desk-button secondary"
                        onClick={() =>
                          dispatch(
                            { type: "recordDeadline" },
                            "Target and calculation assumptions recorded in history.",
                          )
                        }
                      >
                        Record target and assumptions
                      </button>
                    </section>
                  </div>
                )}
                {view === "activity" && (
                  <div className="desk-history">
                    <div className="desk-panel-intro">
                      <div>
                        <span className="desk-eyebrow">
                          THE REASONING BEHIND THE WORK
                        </span>
                        <h3>Decision history</h3>
                        <p>
                          Local, editable history with simulated participants.
                          No external notifications or immutable audit service.
                        </p>
                      </div>
                      <span className="desk-count">{events.length} events</span>
                    </div>
                    {!events.length ? (
                      <p className="desk-empty">
                        No decisions recorded for this matter yet.
                      </p>
                    ) : (
                      <ol>
                        {[...events].reverse().map((e) => (
                          <li key={e.id}>
                            <span className="desk-event-icon">
                              <Activity size={15} />
                            </span>
                            <div>
                              <span>
                                {e.actor} <time>{time(e.at)}</time>
                              </span>
                              <p>{e.action}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
                {view === "value" && (
                  <div className="desk-value">
                    <div>
                      <span className="desk-eyebrow">
                        MAKE YOUR ASSUMPTIONS VISIBLE
                      </span>
                      <h3>What would better review be worth?</h3>
                      <p>
                        Compare estimated manual effort with assisted work
                        including attorney review. Editable assumptions, not
                        measured savings or a billing recommendation.
                      </p>
                      <div className="desk-value-inputs">
                        {[
                          ["Manual baseline (hours)", baseline, setBaseline],
                          ["Assisted work + review (hours)", hours, setHours],
                          ["Internal cost per hour ($)", rate, setRate],
                        ].map(([label, value, setter]) => (
                          <label key={label}>
                            {label}
                            <input
                              type="number"
                              min="0"
                              max="100000"
                              value={value}
                              onChange={(e) =>
                                setter(
                                  Math.max(
                                    0,
                                    Math.min(
                                      100000,
                                      Number(e.target.value) || 0,
                                    ),
                                  ),
                                )
                              }
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="desk-value-result">
                      <span>ILLUSTRATIVE CAPACITY VALUE</span>
                      <strong>{money((baseline - hours) * rate)}</strong>
                      <p>
                        {baseline - hours} hours × {money(rate)}/hour
                      </p>
                      <small>
                        Excludes software and implementation costs. Negative
                        results mean assisted work requires more effort.
                      </small>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
        <footer className="desk-footer">
          <strong>
            <Scale size={15} />
            Law Suite
          </strong>
          <span>
            {storageError
              ? "Browser storage unavailable — progress lasts only while this page is open."
              : "Demo saved in this browser · Fictional data only"}
          </span>
          <span>Evidence. Judgment. Forward.</span>
        </footer>
      </div>
      {modal?.type === "source" && (
        <Dialog
          title={`${state.documents[modal.id].title} · v${state.documents[modal.id].version}`}
          close={() => setModal(null)}
        >
          <p className="desk-alert">
            Complete fictional sample document. These short samples are not real
            agreements, evidence, or legal authority.
          </p>
          <div className="desk-source-document">
            <span>
              DOCUMENT {modal.id} / VERSION {state.documents[modal.id].version}
            </span>
            {state.documents[modal.id].sections.map((s) => (
              <section key={s.anchor}>
                <h3>{s.anchor}</h3>
                <p>{s.text}</p>
              </section>
            ))}
          </div>
        </Dialog>
      )}
      {modal?.type === "help" && (
        <Dialog
          title="Try the complete review journey"
          close={() => setModal(null)}
        >
          <ol className="desk-guide">
            <li>
              <b>Record judgment.</b> Save, assign, or escalate a blocked
              finding. Notes survive navigation and refresh.
            </li>
            <li>
              <b>Change evidence.</b> In Draft & sources, load a sample
              revision. Compare versions on each affected issue.
            </li>
            <li>
              <b>Define scope.</b> Review supported findings or explicitly
              exclude unsupported propositions with a reason.
            </li>
            <li>
              <b>Approve with context.</b> Complete prerequisite checks and
              switch to the simulated partner. Download the memorandum.
            </li>
            <li>
              <b>Challenge approval.</b> Load another revision or edit a
              reviewed statement. Affected reviews and approval reopen.
            </li>
          </ol>
          <p>
            Comparisons are scripted. Imports match identifiers only. No live
            AI, research, database, identity enforcement, messages, or external
            delivery runs. Browser data is editable; reset clears this demo’s
            progress.
          </p>
        </Dialog>
      )}
      {modal?.type === "reset" && (
        <Dialog
          title="Start a fresh demonstration?"
          close={() => setModal(null)}
        >
          <p>
            This clears saved demo notes, decisions, imports, revisions, and
            approvals in this browser. Export a packet first to keep a copy.
          </p>
          <div className="desk-action-row">
            <button
              className="desk-button secondary"
              onClick={() => setModal(null)}
            >
              Keep my progress
            </button>
            <button
              className="desk-button"
              onClick={() => {
                setState(initialWorkspace());
                onNavigate("/dashboard");
                setSelectedIssue(null);
                setView("issues");
                setNotice("Demo reset to the original fictional matters.");
                setModal(null);
              }}
            >
              Reset saved demo
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
