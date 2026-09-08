import {
  ArrowUpRight,
  FileCheck2,
  GitBranch,
  Layers3,
  ShieldCheck,
} from "lucide-react";
import { readiness } from "@/lib/matterWorkspace";

// All numbers derive from the same local records as the attorney workbench.
export default function PortfolioOverview({ state, browse }) {
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
  const practiceTotals = Object.values(
    state.matters.reduce((groups, matter) => {
      const group = (groups[matter.practice] ||= {
        name: matter.practice,
        total: 0,
        reviewed: 0,
      });
      group.total += matter.issues.length;
      group.reviewed += matter.issues.filter((issue) => issue.review).length;
      return groups;
    }, {}),
  ).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  const maxTotal = Math.max(1, ...practiceTotals.map((group) => group.total));
  const metricStatuses = [
    "All statuses",
    "Evidence exceptions",
    "Recorded reviews",
    "Partner review ready",
  ];
  return (
    <section className="portfolio-board" aria-label="Portfolio readiness">
      <div className="portfolio-metrics" aria-label="Sample portfolio metrics">
        {[
          [
            "Active matters",
            state.matters.length,
            `Across ${practiceTotals.length} US practices`,
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
            <button
              className="metric-action"
              aria-label={`View ${label}`}
              onClick={() => browse({ status: metricStatuses[index] })}
            >
              <div>
                <span>{label}</span>
                <Icon size={17} />
              </div>
              <strong>{String(value).padStart(2, "0")}</strong>
              <small>{detail}</small>
              <div className="metric-rule" aria-hidden="true" />
            </button>
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
          <button
            className="analytics-link"
            onClick={() => browse({ status: "Awaiting review" })}
          >
            Explore open reviews <ArrowUpRight size={15} />
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
            <span>
              {practiceTotals.length > 6
                ? "TOP 6 BY FINDING COUNT"
                : "PORTFOLIO TOTALS"}
            </span>
          </div>
          <div className="practice-columns">
            {practiceTotals.slice(0, 6).map((group) => {
              const n = group.reviewed;
              return (
                <button
                  key={group.name}
                  onClick={() => browse({ practice: group.name })}
                  aria-label={`Browse ${group.name}: ${n} of ${group.total} reviews recorded`}
                >
                  <span className="column-value">
                    {n}
                    <small> / {group.total}</small>
                  </span>
                  <div
                    className="practice-column"
                    style={{ height: `${(group.total / maxTotal) * 90}px` }}
                  >
                    <i
                      style={{
                        height: `${group.total ? (n / group.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span>{group.name}</span>
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
