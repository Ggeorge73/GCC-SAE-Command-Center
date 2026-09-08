import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  FileText,
  FolderOpen,
  GitBranch,
  Library,
  Search,
  ShieldCheck,
} from "lucide-react";
import { loadWorkspace } from "@/lib/matterWorkspace";

export default function ResearchWorkspace({ onOpenReview }) {
  const [workspace] = useState(loadWorkspace);
  const [matterId, setMatterId] = useState(workspace.selectedId);
  const [query, setQuery] = useState("");
  const [sourceId, setSourceId] = useState(null);
  const matter = workspace.matters.find((m) => m.id === matterId);
  const sources = useMemo(() => {
    const ids = new Set(matter.issues.flatMap((issue) => issue.sources));
    const search = query.trim().toLowerCase();
    return Object.values(workspace.documents).filter(
      (doc) =>
        ids.has(doc.id) &&
        (!search ||
          [doc.title, doc.id, ...doc.sections.map((section) => section.text)]
            .join(" ")
            .toLowerCase()
            .includes(search)),
    );
  }, [matter, query, workspace]);
  const source = sources.find((doc) => doc.id === sourceId) || sources[0];
  const open = (section) => onOpenReview({ matterId, section });
  return (
    <section
      className="research-workspace"
      aria-label="Research and document workspace"
    >
      <div className="research-page">
        <span className="research-kicker">
          KNOWLEDGE WORKSPACE / SOURCE LIBRARY
        </span>
        <div className="research-heading">
          <div>
            <h1>Research & Documents</h1>
            <p>
              The source, the context, and the next question. Together in one
              workspace.
            </p>
          </div>
          <span className="research-badge">
            <Library size={14} /> Fictional sources · Local search
          </span>
        </div>
        <div className="research-paths">
          {[
            [
              BookOpen,
              "Review evidence",
              "Trace findings to their source",
              "issues",
            ],
            [
              FileText,
              "Draft with context",
              "Work beside linked documents",
              "drafts",
            ],
            [
              GitBranch,
              "Prepare a handoff",
              "Resolve gaps before approval",
              "handoff",
            ],
          ].map(([Icon, title, detail, section]) => (
            <button key={section} onClick={() => open(section)}>
              <Icon size={18} />
              <span>
                <strong>{title}</strong>
                <small>{detail}</small>
              </span>
              <ArrowUpRight size={16} />
            </button>
          ))}
        </div>
        <div className="research-library">
          <aside aria-label="Source library matters">
            <h2>Matter collections</h2>
            <p>Separate context for every engagement</p>
            {workspace.matters.map((m) => (
              <button
                key={m.id}
                aria-pressed={matterId === m.id}
                onClick={() => {
                  setMatterId(m.id);
                  setSourceId(null);
                  setQuery("");
                }}
              >
                <FolderOpen size={17} />
                <span>
                  {m.name}
                  <small>
                    {m.id} · {m.practice}
                  </small>
                </span>
              </button>
            ))}
            <div className="research-service-note">
              <Search size={19} />
              <strong>Legal research connection</strong>
              <p>
                Live case law, citation treatment, uploads, and AI research are
                not connected in this public demo. Search the fictional source
                excerpts here, or review outstanding authority questions in
                Matter Review.
              </p>
            </div>
          </aside>
          <div className="research-source-area">
            <div className="research-library-tools">
              <div>
                <h2>{matter.name}</h2>
                <span className="research-kicker">
                  {sources.length} SOURCE{sources.length === 1 ? "" : "S"} IN
                  VIEW
                </span>
              </div>
              <label className="research-search">
                <Search size={16} />
                <input
                  aria-label="Search sample sources"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search titles or excerpt text…"
                />
              </label>
            </div>
            <div className="research-sources">
              {sources.map((doc) => (
                <button
                  key={doc.id}
                  aria-pressed={source?.id === doc.id}
                  onClick={() => setSourceId(doc.id)}
                >
                  <FileText size={22} />
                  <span>
                    <strong>{doc.title}</strong>
                    <small>
                      {doc.sections.length} sample sections · {doc.id}
                    </small>
                  </span>
                  <span>v{doc.version}</span>
                </button>
              ))}
            </div>
            {source ? (
              <article
                className="research-reader"
                aria-label="Sample source reader"
              >
                <header>
                  <span>
                    <FileText size={14} /> SOURCE PREVIEW
                  </span>
                  <span>
                    {source.id} / VERSION {source.version} / FICTIONAL
                  </span>
                </header>
                <div>
                  <h3>{source.title}</h3>
                  <p className="source-caption">
                    {matter.client} · {matter.jurisdiction} · Sample excerpts
                    only
                  </p>
                  {source.sections.map((section, index) => (
                    <section key={index}>
                      <h4>{section.anchor}</h4>
                      <p>{section.text}</p>
                    </section>
                  ))}
                </div>
                <footer>
                  <span>Source presence does not establish legal support.</span>
                  <button
                    className="desk-text-button"
                    onClick={() => open("issues")}
                  >
                    Open linked matter review <ArrowUpRight size={14} />
                  </button>
                </footer>
              </article>
            ) : (
              <div className="desk-empty">
                <Search size={24} style={{ margin: "0 auto 12px" }} />
                <h3>No sample sources match</h3>
                <p>Try another title or word from the excerpt.</p>
                <button
                  className="desk-button secondary"
                  onClick={() => setQuery("")}
                >
                  Clear source search
                </button>
              </div>
            )}
          </div>
        </div>
        <footer>
          <ShieldCheck size={14} /> Browser demonstration · Fictional documents
          · No live legal research or document service
        </footer>
      </div>
    </section>
  );
}
