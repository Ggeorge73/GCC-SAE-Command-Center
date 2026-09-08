import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { readiness, targetDate } from "@/lib/matterWorkspace";
const PAGE_SIZE = 12;

export default function MatterDirectory({ matters, route, openMatter }) {
  const [query, setQuery] = useState("");
  const [practice, setPractice] = useState(route.practice || "All practices");
  const [status, setStatus] = useState(route.status || "All statuses");
  const [sort, setSort] = useState("target");
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPractice(route.practice || "All practices");
    setStatus(route.status || "All statuses");
    setPage(1);
  }, [route.practice, route.status]);
  const practices = [...new Set(matters.map((m) => m.practice))].sort();
  const visible = useMemo(
    () =>
      matters
        .filter((m) => {
          const r = readiness(m);
          return (
            (practice === "All practices" || m.practice === practice) &&
            `${m.name} ${m.client} ${m.id} ${m.owner}`
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            (status === "All statuses" ||
              (status === "Evidence exceptions" && r.gaps.length > 0) ||
              (status === "Awaiting review" && r.open.length > 0) ||
              (status === "Recorded reviews" &&
                m.issues.some((issue) => issue.review)) ||
              (status === "Partner review ready" && r.ready))
          );
        })
        .sort((a, b) =>
          sort === "name"
            ? a.name.localeCompare(b.name)
            : sort === "exceptions"
              ? readiness(b).gaps.length - readiness(a).gaps.length ||
                a.id.localeCompare(b.id)
              : (targetDate(a.deadline) || "9999").localeCompare(
                  targetDate(b.deadline) || "9999",
                ) || a.id.localeCompare(b.id),
        ),
    [matters, practice, query, sort, status],
  );
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const start = (current - 1) * PAGE_SIZE;
  const change = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };
  return (
    <section className="matter-directory" aria-label="Matter directory">
      <header className="directory-heading">
        <span className="desk-eyebrow">02 / MATTER PORTFOLIO</span>
        <h1>
          Every matter.
          <br />
          <em>A clear next step.</em>
        </h1>
        <p>Find the engagement, focus the review, and follow the evidence.</p>
      </header>
      <div className="directory-tools">
        <label className="directory-search">
          <Search size={17} />
          <input
            aria-label="Search matters"
            placeholder="Search matters, clients, owners, or ID…"
            value={query}
            onChange={change(setQuery)}
          />
        </label>
        <label>
          Practice
          <select
            aria-label="Filter matters by practice"
            value={practice}
            onChange={change(setPractice)}
          >
            <option>All practices</option>
            {practices.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            aria-label="Filter matters by status"
            value={status}
            onChange={change(setStatus)}
          >
            {[
              "All statuses",
              "Evidence exceptions",
              "Awaiting review",
              "Recorded reviews",
              "Partner review ready",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Sort by
          <select
            aria-label="Sort matters"
            value={sort}
            onChange={change(setSort)}
          >
            <option value="target">Review target</option>
            <option value="name">Matter name</option>
            <option value="exceptions">Most exceptions</option>
          </select>
        </label>
      </div>
      <div className="directory-count" role="status">
        <span>
          {visible.length
            ? `${start + 1}–${Math.min(start + PAGE_SIZE, visible.length)}`
            : "0"}{" "}
          of {visible.length} matching matters
        </span>
        <span>{matters.length} in portfolio · Fictional records</span>
      </div>
      <div className="directory-table-wrap">
        <table className="directory-table">
          <thead>
            <tr>
              <th>Matter / client</th>
              <th>Practice</th>
              <th>Lead</th>
              <th>Review target</th>
              <th>Review status</th>
              <th>
                <span className="sr-only">Open matter</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.slice(start, start + PAGE_SIZE).map((m) => {
              const r = readiness(m);
              return (
                <tr key={m.id}>
                  <td>
                    <button
                      className="directory-matter-name"
                      onClick={() => openMatter(m)}
                      aria-label={`Open ${m.id} ${m.practice} ${m.name}`}
                    >
                      <strong>{m.name}</strong>
                      <small>
                        {m.id} · {m.client}
                      </small>
                    </button>
                  </td>
                  <td>{m.practice}</td>
                  <td>{m.owner}</td>
                  <td>{targetDate(m.deadline) || "Not set"}</td>
                  <td>
                    <span className={`desk-status ${r.ready ? "ready" : ""}`}>
                      {m.approval
                        ? "Approved internally"
                        : r.ready
                          ? "Partner review ready"
                          : `${r.open.length} open reviews`}
                    </span>
                    <small>{r.gaps.length} evidence exceptions</small>
                  </td>
                  <td>
                    <button
                      className="desk-icon-button"
                      aria-label={`Review ${m.id}`}
                      onClick={() => openMatter(m)}
                    >
                      <ArrowUpRight size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!visible.length && (
        <div className="desk-empty">
          <h2>No matters match your search.</h2>
          <p>Change the search or practice filter.</p>
          <button
            className="desk-button secondary"
            onClick={() => {
              setQuery("");
              setPractice("All practices");
              setStatus("All statuses");
              setPage(1);
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      <nav className="directory-pagination" aria-label="Matter list pages">
        <span>
          Page {current} of {pages}
        </span>
        <button
          className="desk-button secondary"
          onClick={() => setPage(current - 1)}
          disabled={current === 1}
        >
          <ArrowLeft size={14} />
          Previous
        </button>
        <button
          className="desk-button secondary"
          onClick={() => setPage(current + 1)}
          disabled={current === pages}
        >
          Next
          <ArrowRight size={14} />
        </button>
      </nav>
    </section>
  );
}
