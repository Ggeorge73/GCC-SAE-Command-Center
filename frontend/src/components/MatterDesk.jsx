import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  FileCheck2,
  Fingerprint,
  Layers3,
  Search,
  ShieldCheck,
  Scale,
  X,
} from "lucide-react";
import {
  sampleMatters,
  assessMatter,
  reviewIssue,
  createReviewPacket,
} from "@/lib/matterReview";
import "./MatterDesk.css";

const evidenceLabels = {
  supported: "Source available",
  contradicted: "Conflicting evidence",
  missing: "Source missing",
  stale: "Outdated version",
};

export default function MatterDesk() {
  const [matters, setMatters] = useState(() => structuredClone(sampleMatters));
  const [selectedId, setSelectedId] = useState(sampleMatters[0].id);
  const [query, setQuery] = useState("");
  const [practice, setPractice] = useState("All practices");
  const [selectedIssue, setSelectedIssue] = useState("N1");
  const [reviewer, setReviewer] = useState("");
  const [note, setNote] = useState("");
  const [events, setEvents] = useState([]);
  const [notice, setNotice] = useState("");
  const [view, setView] = useState("issues");
  const [showHelp, setShowHelp] = useState(false);
  const [baseline, setBaseline] = useState(40);
  const [reviewHours, setReviewHours] = useState(18);
  const [rate, setRate] = useState(350);
  const matter = matters.find((item) => item.id === selectedId);
  const issue = matter.issues.find((item) => item.id === selectedIssue);
  const assessment = assessMatter(matter);
  const visibleMatters = useMemo(
    () =>
      matters.filter(
        (item) =>
          (practice === "All practices" || item.practice === practice) &&
          `${item.name} ${item.client} ${item.id}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [matters, practice, query],
  );
  const totalGaps = matters.reduce(
    (sum, item) => sum + assessMatter(item).evidenceGaps.length,
    0,
  );
  const reviewed = matters
    .flatMap((item) => item.issues)
    .filter((item) => item.status === "reviewed").length;

  function record(action) {
    setEvents((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        matterId: matter.id,
        at: new Date().toISOString(),
        action,
      },
    ]);
  }
  function updateMatter(update) {
    setMatters((current) =>
      current.map((item) => (item.id === matter.id ? update(item) : item)),
    );
  }
  function selectMatter(item) {
    setSelectedId(item.id);
    setSelectedIssue(item.issues[0].id);
    setNote("");
    setNotice("");
  }
  function completeReview(event) {
    event.preventDefault();
    try {
      const updated = reviewIssue(issue, reviewer, note);
      updateMatter((item) => ({
        ...item,
        issues: item.issues.map((entry) =>
          entry.id === issue.id ? updated : entry,
        ),
      }));
      record(
        `${reviewer.trim()} recorded review of ${issue.id}: ${note.trim()}`,
      );
      setNotice(
        "Review recorded for this session. Supervising lawyer review is still required.",
      );
      setNote("");
    } catch (error) {
      setNotice(error.message);
    }
  }
  function exportPacket() {
    const blob = new Blob(
      [JSON.stringify(createReviewPacket(matter, events), null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `law-suite-${matter.id.toLowerCase()}-demo-review.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(
      "Demo review packet exported with evidence, decisions, open gaps, and handoff status.",
    );
  }

  return (
    <div className="matter-desk" data-testid="matter-desk">
      <aside className="desk-rail" aria-label="Workspace overview">
        <div className="desk-monogram">
          <Scale size={22} />
          <span>LS</span>
        </div>
        <span className="desk-rail-label">THE PRACTICE</span>
        <div className="desk-rail-active">
          <Layers3 size={17} /> Matter Review
        </div>
        <p>
          Evidence.
          <br />
          Judgment.
          <br />
          Accountability.
        </p>
        <div className="desk-rail-bottom">
          <Fingerprint size={22} />
          <span>
            Built around the
            <br />
            work behind the advice.
          </span>
        </div>
      </aside>
      <div className="desk-page">
        <div className="desk-topline">
          <span>LAW SUITE / MATTER REVIEW</span>
          <span className="desk-demo">
            <i /> Interactive demonstration
          </span>
        </div>
        <section className="desk-intro">
          <div>
            <div className="desk-eyebrow">FROM COMPLEXITY TO CLARITY</div>
            <h1>
              Know what stands
              <br />
              behind your work.
            </h1>
            <p>
              A review workspace for consequential matters. Connect the
              evidence, surface the exceptions, and make the next decision
              clear.
            </p>
          </div>
          <div className="desk-intro-aside">
            <span className="desk-edition">01 / THE REVIEW DESK</span>
            <div className="desk-line" />
            <p>
              For the questions that need
              <br />
              more than a confident answer.
            </p>
            <button
              onClick={() => setShowHelp(!showHelp)}
              aria-expanded={showHelp}
            >
              <CircleHelp size={15} /> How this demo works
            </button>
          </div>
        </section>
        {showHelp && (
          <section className="desk-help">
            <button
              aria-label="Close demo explanation"
              onClick={() => setShowHelp(false)}
            >
              <X size={16} />
            </button>
            <strong>Try the full review loop</strong>
            <p>
              Select a matter, inspect a source, and record a reviewer decision.
              Missing, conflicting, or outdated evidence blocks completion. The
              Meridian example can reach supervising-lawyer review after both
              issues are reviewed. All names, excerpts, and amounts are
              fictional. Changes last for this page session; export a packet to
              keep them. No AI, source verification, access enforcement, or
              external sharing runs in this demo.
            </p>
          </section>
        )}
        <section className="desk-stats" aria-label="Sample portfolio metrics">
          <div>
            <span>Active sample matters</span>
            <strong>{matters.length.toString().padStart(2, "0")}</strong>
            <small>Across three US practice areas</small>
          </div>
          <div>
            <span>Evidence exceptions</span>
            <strong className="desk-amber">
              {totalGaps.toString().padStart(2, "0")}
            </strong>
            <small>Require source-level resolution</small>
          </div>
          <div>
            <span>Recorded reviews</span>
            <strong>
              {reviewed.toString().padStart(2, "0")}
              <em> / 7</em>
            </strong>
            <small>Human decisions in this session</small>
          </div>
          <div>
            <span>Ready for partner review</span>
            <strong>
              {matters
                .filter((item) => assessMatter(item).ready)
                .length.toString()
                .padStart(2, "0")}
            </strong>
            <small>All demo requirements met</small>
          </div>
        </section>
        <div className="desk-section-title">
          <h2>Your matters</h2>
          <span>Fictional dataset · September 6, 2026</span>
        </div>
        <div className="desk-filters">
          <label>
            <Search size={16} />
            <input
              aria-label="Search matters"
              placeholder="Search matter, client, or ID"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select
            aria-label="Filter matters by practice"
            value={practice}
            onChange={(event) => setPractice(event.target.value)}
          >
            {["All practices", "Corporate", "Litigation", "Regulatory"].map(
              (item) => (
                <option key={item}>{item}</option>
              ),
            )}
          </select>
        </div>
        <div className="desk-matters">
          {visibleMatters.map((item) => (
            <button
              key={item.id}
              className={`desk-matter-card ${item.id === matter.id ? "selected" : ""}`}
              onClick={() => selectMatter(item)}
              aria-pressed={item.id === matter.id}
            >
              <span className="desk-card-meta">
                {item.id} <span>{item.practice}</span>
              </span>
              <strong>{item.name}</strong>
              <span>{item.client}</span>
              <div>
                <span
                  className={`desk-status ${assessMatter(item).ready ? "ready" : ""}`}
                >
                  {assessMatter(item).ready
                    ? "Partner review ready"
                    : `${assessMatter(item).unresolved.length} open reviews`}
                </span>
                <ArrowUpRight size={17} />
              </div>
            </button>
          ))}
        </div>
        {!visibleMatters.length && (
          <p className="desk-empty">
            No matters match your search. Change the search or practice filter.
          </p>
        )}
        <section className="desk-workbench" aria-label="Selected matter review">
          <div className="desk-matter-heading">
            <div>
              <div className="desk-eyebrow">
                {matter.id} / {matter.jurisdiction}
              </div>
              <h2>{matter.name}</h2>
              <p>{matter.summary}</p>
            </div>
            <button className="desk-button secondary" onClick={exportPacket}>
              <ArrowDownToLine size={15} /> Export demo packet
            </button>
          </div>
          <div className="desk-matter-details">
            <span>
              Lead <b>{matter.owner}</b>
            </span>
            <span>
              Review target <b>{matter.due}</b>
            </span>
            <span>
              Sample spend{" "}
              <b>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }).format(matter.spent)}
              </b>{" "}
              / ${matter.budget.toLocaleString()}
            </span>
          </div>
          <div
            className="desk-tabs"
            role="tablist"
            aria-label="Matter sections"
          >
            {[
              ["issues", "Issues & evidence"],
              ["handoff", "Handoff requirements"],
              ["activity", "Decision history"],
              ["value", "Value estimate"],
            ].map(([id, label]) => (
              <button
                key={id}
                role="tab"
                id={`desk-tab-${id}`}
                aria-selected={view === id}
                aria-controls="desk-panel"
                onClick={() => {
                  setView(id);
                  setNotice("");
                }}
              >
                {label}
                {id === "issues" && <span>{matter.issues.length}</span>}
              </button>
            ))}
          </div>
          <div
            id="desk-panel"
            role="tabpanel"
            aria-labelledby={`desk-tab-${view}`}
          >
            {view === "issues" && (
              <div className="desk-review-layout">
                <div className="desk-issue-list">
                  {matter.issues.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedIssue(item.id);
                        setNote("");
                        setNotice("");
                      }}
                      aria-pressed={item.id === selectedIssue}
                      className={item.id === selectedIssue ? "selected" : ""}
                    >
                      <span className="desk-issue-meta">
                        {item.category}
                        <span
                          className={
                            item.severity === "Critical" ? "critical" : ""
                          }
                        >
                          {item.severity}
                        </span>
                      </span>
                      <strong>{item.title}</strong>
                      <span className="desk-issue-footer">
                        {item.status === "reviewed" ? (
                          <span className="desk-checked">
                            <Check size={13} /> Review recorded
                          </span>
                        ) : (
                          evidenceLabels[item.evidenceState]
                        )}
                        <ChevronRight size={15} />
                      </span>
                    </button>
                  ))}
                </div>
                <article className="desk-evidence" key={issue.id}>
                  <div className="desk-evidence-top">
                    <span className="desk-eyebrow">
                      EVIDENCE RECORD / {issue.id}
                    </span>
                    <span
                      className={`desk-source-state ${issue.evidenceState}`}
                    >
                      {evidenceLabels[issue.evidenceState]}
                    </span>
                  </div>
                  <h3>{issue.title}</h3>
                  <p>{issue.finding}</p>
                  {issue.quote ? (
                    <div className="desk-source">
                      <span>{issue.source}</span>
                      <blockquote>“{issue.quote}”</blockquote>
                      <small>
                        Fictional excerpt · Fixture checked {issue.checkedOn} ·
                        Not independently verified
                      </small>
                    </div>
                  ) : (
                    <div className="desk-source missing">
                      <FileCheck2 size={22} />
                      <strong>No source attached</strong>
                      <p>
                        This finding cannot be marked reviewed until supporting
                        evidence is available.
                      </p>
                    </div>
                  )}
                  <div className="desk-next">
                    <span>NEXT STEP / {issue.owner}</span>
                    <p>{issue.next}</p>
                  </div>
                  {issue.status === "reviewed" ? (
                    <div className="desk-recorded">
                      <Check size={18} />
                      <div>
                        <strong>
                          Review recorded by {issue.review.reviewer}
                        </strong>
                        <p>{issue.review.note}</p>
                        <button
                          onClick={() => {
                            updateMatter((item) => ({
                              ...item,
                              issues: item.issues.map((entry) =>
                                entry.id === issue.id
                                  ? { ...entry, status: "open", review: null }
                                  : entry,
                              ),
                            }));
                            record(`Reopened ${issue.id}`);
                            setNotice(
                              "Issue reopened. Handoff readiness has been recalculated.",
                            );
                          }}
                        >
                          Reopen review
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form
                      onSubmit={completeReview}
                      className="desk-review-form"
                    >
                      <label>
                        Reviewer name
                        <input
                          value={reviewer}
                          onChange={(event) => setReviewer(event.target.value)}
                          placeholder="Enter your name for this demo"
                          maxLength={100}
                        />
                      </label>
                      <label>
                        Review note
                        <textarea
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          placeholder="What did you check, and what remains qualified?"
                          maxLength={2000}
                        />
                      </label>
                      <button
                        className="desk-button"
                        disabled={
                          issue.evidenceState !== "supported" ||
                          !reviewer.trim() ||
                          note.trim().length < 15
                        }
                      >
                        <Check size={16} /> Record review
                      </button>
                      {issue.evidenceState !== "supported" && (
                        <small className="desk-blocked-note">
                          Completion blocked:{" "}
                          {evidenceLabels[issue.evidenceState].toLowerCase()}.
                          This demo cannot retrieve or reconcile new sources.
                        </small>
                      )}
                    </form>
                  )}
                </article>
              </div>
            )}
            {view === "handoff" && (
              <div className="desk-handoff">
                <div>
                  <ShieldCheck size={26} />
                  <h3>
                    {assessment.ready
                      ? "Ready for supervising lawyer review"
                      : "Handoff is blocked"}
                  </h3>
                  <p>{matter.restrictions}</p>
                  <ul>
                    <li>
                      {assessment.unresolved.length} unresolved issue reviews
                    </li>
                    <li>
                      {assessment.evidenceGaps.length} missing, conflicting, or
                      outdated evidence records
                    </li>
                    <li>
                      {assessment.policyGaps.length} incomplete policy checks
                    </li>
                  </ul>
                </div>
                <div>
                  <h3>Record the prerequisite checks</h3>
                  <p>
                    These checkboxes model a review process. They do not grant
                    access, obtain client consent, or enforce a policy.
                  </p>
                  {matter.controls.map((control) => (
                    <label key={control.id}>
                      <input
                        type="checkbox"
                        checked={control.checked}
                        onChange={() => {
                          updateMatter((item) => ({
                            ...item,
                            controls: item.controls.map((entry) =>
                              entry.id === control.id
                                ? { ...entry, checked: !entry.checked }
                                : entry,
                            ),
                          }));
                          record(
                            `${control.label}: ${control.checked ? "reopened" : "recorded"}`,
                          );
                        }}
                      />
                      {control.label}
                    </label>
                  ))}
                  <p className="desk-blocked-note">
                    A completed demo is still a draft. Nothing is filed or
                    shared externally.
                  </p>
                </div>
              </div>
            )}
            {view === "activity" && (
              <div className="desk-history">
                <h3>Decisions in this session</h3>
                <p>Exportable review history. Not an immutable audit log.</p>
                {events.filter((event) => event.matterId === matter.id)
                  .length === 0 ? (
                  <p className="desk-empty">
                    No decisions recorded for this matter yet.
                  </p>
                ) : (
                  <ol>
                    {events
                      .filter((event) => event.matterId === matter.id)
                      .map((event) => (
                        <li key={event.id}>
                          <time>{new Date(event.at).toLocaleTimeString()}</time>
                          <span>{event.action}</span>
                        </li>
                      ))}
                  </ol>
                )}
              </div>
            )}
            {view === "value" && (
              <div className="desk-value">
                <div>
                  <h3>Make the value assumptions visible.</h3>
                  <p>
                    Compare estimated manual effort with assisted work including
                    human review. This scenario is independent of the sample
                    matter spend above; it is not measured savings or a billing
                    recommendation.
                  </p>
                  <div className="desk-value-inputs">
                    {[
                      ["Manual baseline (hours)", baseline, setBaseline],
                      [
                        "Assisted work + review (hours)",
                        reviewHours,
                        setReviewHours,
                      ],
                      ["Internal cost per hour ($)", rate, setRate],
                    ].map(([label, value, setter]) => (
                      <label key={label}>
                        {label}
                        <input
                          type="number"
                          min="0"
                          max="100000"
                          value={value}
                          onChange={(event) =>
                            setter(
                              Math.max(
                                0,
                                Math.min(
                                  100000,
                                  Number(event.target.value) || 0,
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
                  <strong>
                    $
                    {((baseline - reviewHours) * rate).toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </strong>
                  <p>
                    {baseline - reviewHours} hours × ${rate}/hour
                  </p>
                  <small>
                    Excludes software and implementation costs. Negative results
                    mean assisted work requires more effort.
                  </small>
                </div>
              </div>
            )}
          </div>
          {notice && (
            <p className="desk-notice" role="status">
              {notice}
            </p>
          )}
        </section>
        <footer className="desk-footer">
          <strong>Law Suite</strong>
          <span>
            Synthetic data only · Session-based demonstration · No confidential
            uploads
          </span>
          <span>Evidence before delivery.</span>
        </footer>
      </div>
    </div>
  );
}
