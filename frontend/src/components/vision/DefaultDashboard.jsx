import {
  FileCheck2,
  GitBranch,
  Layers3,
  ShieldCheck,
  Users,
  FileText,
  Search,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { Panel, Metric, DemoNotice } from "./Glass";
import { Bars, TrendChart } from "./VisionCharts";
import { lazy, Suspense } from "react";
const GlobeScene = lazy(() => import("./GlobeScene"));
import { readiness } from "@/lib/matterWorkspace";
import { navigateTo, directoryPath } from "@/lib/workspaceNavigation";
export default function DefaultDashboard({ state }) {
  const findings = state.matters.flatMap((m) => m.issues);
  const reviewed = findings.filter((i) => i.review).length;
  const gaps = state.matters.reduce((n, m) => n + readiness(m).gaps.length, 0);
  const groups = Object.values(
    state.matters.reduce((acc, m) => {
      const g = (acc[m.practice] ||= {
        name: m.practice,
        count: 0,
        reviews: 0,
        gaps: 0,
      });
      g.count++;
      g.reviews += m.issues.filter((i) => i.review).length;
      g.gaps += readiness(m).gaps.length;
      return acc;
    }, {}),
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
  return (
    <div className="v-default">
      <h1>General Statistics</h1>
      <section className="v-default-hero" aria-label="Firm portfolio summary">
        <Suspense
          fallback={
            <div
              className="v-globe v-globe-loading"
              aria-label="Loading globe"
            />
          }
        >
          <GlobeScene />
        </Suspense>
        <div className="v-default-left">
          <div className="v-kpis">
            <Metric
              label="Active matters"
              value={state.matters.length}
              Icon={Layers3}
              detail="In portfolio"
              onClick={() => navigateTo("/matters")}
            />
            <Metric
              label="Evidence exceptions"
              value={gaps}
              Icon={GitBranch}
              detail="Need resolution"
              onClick={() =>
                navigateTo(directoryPath({ status: "Evidence exceptions" }))
              }
            />
            <Metric
              label="Recorded reviews"
              value={reviewed}
              Icon={FileCheck2}
              detail={`of ${findings.length} findings`}
              onClick={() =>
                navigateTo(directoryPath({ status: "Recorded reviews" }))
              }
            />
            <Metric
              label="Partner review ready"
              value={state.matters.filter((m) => readiness(m).ready).length}
              Icon={ShieldCheck}
              detail="Prerequisites met"
              onClick={() =>
                navigateTo(directoryPath({ status: "Partner review ready" }))
              }
            />
          </div>
          <Panel
            title="Matters by practice"
            className="v-practice-table"
            action={
              <button
                className="v-icon-link"
                aria-label="Browse all matters"
                onClick={() => navigateTo("/matters")}
              >
                <ArrowUpRight size={18} />
              </button>
            }
          >
            <div>
              {groups.map((g, i) => (
                <button
                  key={g.name}
                  onClick={() =>
                    navigateTo(directoryPath({ practice: g.name }))
                  }
                  aria-label={`Browse ${g.name}: ${g.count} matters`}
                >
                  <span className="v-practice-symbol">
                    {["⚖", "§", "◈", "¶"][i]}
                  </span>
                  <span>
                    <small>Practice</small>
                    <b>{g.name}</b>
                  </span>
                  <span>
                    <small>Matters</small>
                    <b>{g.count}</b>
                  </span>
                  <span>
                    <small>Reviewed</small>
                    <b>{g.reviews}</b>
                  </span>
                  <span>
                    <small>Exceptions</small>
                    <b>{g.gaps}</b>
                  </span>
                </button>
              ))}
            </div>
            <p>
              Current browser portfolio · source status remains separate from
              review
            </p>
          </Panel>
        </div>
      </section>
      <div className="v-dashboard-charts">
        <Panel className="v-active-users">
          <Bars />
          <h2>Active reviewers</h2>
          <p>
            <span className="v-positive">Sample activity</span> · illustrative
            firm usage
          </p>
          <div className="v-mini-metrics">
            {[
              [Users, "Reviewers", "23", 70],
              [Search, "Research", "342", 60],
              [FileText, "Drafts", "128", 80],
              [Check, "Handoffs", "18", 50],
            ].map(([Icon, label, value, percent]) => (
              <div key={label}>
                <p>
                  <span className="v-icon">
                    <Icon size={12} />
                  </span>
                  {label}
                </p>
                <b>{value}</b>
                <progress
                  value={percent}
                  max="100"
                  aria-label={`${label} sample activity`}
                />
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="Research & review overview"
          subtitle="Illustrative monthly activity · sample sessions"
          className="v-sales-overview"
        >
          <TrendChart height={300} />
        </Panel>
      </div>
      <DemoNotice />
    </div>
  );
}
