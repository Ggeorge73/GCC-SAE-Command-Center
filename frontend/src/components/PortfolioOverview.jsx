import {
  ArrowUpRight,
  FileCheck2,
  GitBranch,
  Layers3,
  ShieldCheck,
} from "lucide-react";
import { readiness } from "@/lib/matterWorkspace";

// All numbers derive from the same local records as the attorney workbench.
export default function PortfolioOverview({ state, navigate, selectMatter }) {
  const issues = state.matters.flatMap((matter) => matter.issues);
  const reviewed = issues.filter((issue) => issue.review).length;
  const gaps = state.matters.reduce(
    (n, matter) => n + readiness(matter).gaps.length,
    0,
  );
  const percent = issues.length
    ? Math.round((reviewed / issues.length) * 100)
    : 0;
  const statuses = [
    ["Source available", "supported", "steel"],
    ["Conflicting evidence", "contradicted", "warm"],
    ["Source missing", "missing", "soft"],
    ["Outdated version", "stale", "muted"],
  ];
  return (
    <section className="portfolio-board" aria-label="Portfolio readiness">
      <div className="portfolio-metrics" aria-label="Sample portfolio metrics">
        {[
          [
            "Active matters",
            state.matters.length,
            "Across three US practices",
            Layers3,
          ],
          [
            "Evidence exceptions",
            gaps,
            "Questions requiring resolution",
            GitBranch,
          ],
          [
            "Recorded reviews",
            reviewed,
            `of ${issues.length} findings`,
            FileCheck2,
          ],
          [
            "Partner review ready",
            state.matters.filter((m) => readiness(m).ready).length,
            "All prerequisites completed",
            ShieldCheck,
          ],
        ].map(([label, value, detail, Icon], index) => (
          <article className={`portfolio-metric metric-${index}`} key={label}>
            <div>
              <span>{label}</span>
              <Icon size={17} />
            </div>
            <strong>{String(value).padStart(2, "0")}</strong>
            <small>{detail}</small>
            <div className="metric-rule" aria-hidden="true" />
          </article>
        ))}
      </div>
      <div className="portfolio-analytics">
        <article className="analytics-panel review-gauge">
          <div className="panel-caption">
            <h2>Review completion</h2>
            <span>LOCAL ACTIVITY</span>
          </div>
          <div className="gauge-body">
            <div
              className="portfolio-ring"
              style={{ "--progress": `${percent}%` }}
              role="img"
              aria-label={`${percent}% of findings have a recorded review`}
            >
              <div>
                <strong>
                  {percent}
                  <small>%</small>
                </strong>
                <span>reviewed</span>
              </div>
            </div>
            <div className="gauge-detail">
              <strong>{issues.length - reviewed}</strong>
              <span>awaiting judgment</span>
              <small>{reviewed} reviews recorded</small>
            </div>
          </div>
          <button className="analytics-link" onClick={() => navigate("issues")}>
            Continue matter review <ArrowUpRight size={15} />
          </button>
        </article>
        <article className="analytics-panel evidence-profile">
          <div className="panel-caption">
            <h2>Evidence profile</h2>
            <span>{issues.length} FINDINGS</span>
          </div>
          <div className="evidence-bars">
            {statuses.map(([label, status, tone]) => {
              const n = issues.filter(
                (issue) => issue.evidenceState === status,
              ).length;
              return (
                <div className="evidence-bar" key={status}>
                  <div>
                    <span>{label}</span>
                    <b>{n}</b>
                  </div>
                  <div className="chart-track">
                    <i
                      className={tone}
                      style={{
                        width: `${issues.length ? (n / issues.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p>Source status and attorney review are tracked separately.</p>
        </article>
        <article className="analytics-panel practice-chart">
          <div className="panel-caption">
            <h2>Review by practice</h2>
            <span>FICTIONAL PORTFOLIO</span>
          </div>
          <div className="practice-columns">
            {state.matters.map((matter) => {
              const n = matter.issues.filter((i) => i.review).length;
              return (
                <button
                  key={matter.id}
                  onClick={() => selectMatter(matter)}
                  aria-label={`Open ${matter.practice} matter: ${n} of ${matter.issues.length} reviews recorded`}
                >
                  <span className="column-value">
                    {n}
                    <small> / {matter.issues.length}</small>
                  </span>
                  <div
                    className="practice-column"
                    style={{ height: `${matter.issues.length * 30}px` }}
                  >
                    <i
                      style={{ height: `${(n / matter.issues.length) * 100}%` }}
                    />
                  </div>
                  <span>{matter.practice}</span>
                </button>
              );
            })}
          </div>
          <div className="chart-legend">
            <span>
              <i />
              Recorded
            </span>
            <span>
              <i />
              Awaiting review
            </span>
          </div>
        </article>
      </div>
    </section>
  );
}
