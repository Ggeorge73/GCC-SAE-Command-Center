import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  KeyRound,
  Lightbulb,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

const adoptionTrend = [
  { week: "01 Jul", weeklyActive: 58, governed: 91 },
  { week: "08 Jul", weeklyActive: 61, governed: 92 },
  { week: "15 Jul", weeklyActive: 63, governed: 93 },
  { week: "22 Jul", weeklyActive: 66, governed: 94 },
  { week: "29 Jul", weeklyActive: 65, governed: 94 },
  { week: "05 Aug", weeklyActive: 69, governed: 96 },
  { week: "12 Aug", weeklyActive: 72, governed: 97 },
];

const practiceGroups = [
  { name: "Corporate", adoption: 91, depth: 78, users: 286 },
  { name: "Litigation", adoption: 82, depth: 71, users: 244 },
  { name: "Regulatory", adoption: 77, depth: 64, users: 168 },
  { name: "Finance", adoption: 74, depth: 61, users: 151 },
  { name: "Employment", adoption: 63, depth: 48, users: 112 },
  { name: "Tax", adoption: 54, depth: 39, users: 88 },
];

const accessRows = [
  {
    name: "Amara Okafor",
    initials: "AO",
    group: "Corporate",
    role: "Partner",
    status: "Active",
    lastActive: "12 min ago",
    risk: "Low",
  },
  {
    name: "Daniel Foster",
    initials: "DF",
    group: "Litigation",
    role: "Associate",
    status: "Active",
    lastActive: "41 min ago",
    risk: "Low",
  },
  {
    name: "Priya Raman",
    initials: "PR",
    group: "Regulatory",
    role: "Knowledge",
    status: "Active",
    lastActive: "2 hours ago",
    risk: "Low",
  },
  {
    name: "Marcus Chen",
    initials: "MC",
    group: "Finance",
    role: "Partner",
    status: "Review",
    lastActive: "8 days ago",
    risk: "Review",
  },
  {
    name: "Nadia Williams",
    initials: "NW",
    group: "Employment",
    role: "Associate",
    status: "Active",
    lastActive: "Yesterday",
    risk: "Low",
  },
  {
    name: "Emeka Balogun",
    initials: "EB",
    group: "Corporate",
    role: "Contractor",
    status: "Review",
    lastActive: "13 days ago",
    risk: "Review",
  },
  {
    name: "Sophie Laurent",
    initials: "SL",
    group: "Tax",
    role: "Associate",
    status: "Inactive",
    lastActive: "31 days ago",
    risk: "Inactive",
  },
  {
    name: "James Wright",
    initials: "JW",
    group: "Litigation",
    role: "Contractor",
    status: "Review",
    lastActive: "17 days ago",
    risk: "Review",
  },
];

const governanceControls = [
  {
    name: "Single sign-on",
    detail: "Enforced for all workforce identities",
    value: "100%",
    status: "healthy",
    icon: KeyRound,
  },
  {
    name: "SCIM profile sync",
    detail: "1,226 of 1,248 identities current",
    value: "98.2%",
    status: "healthy",
    icon: UserCheck,
  },
  {
    name: "Role coverage",
    detail: "Principle-of-least-privilege policies",
    value: "94%",
    status: "healthy",
    icon: ShieldCheck,
  },
  {
    name: "Access review",
    detail: "12 identities require administrator review",
    value: "12 open",
    status: "attention",
    icon: AlertTriangle,
  },
];

const insights = {
  "Where is adoption lagging?": {
    title: "Tax and Employment need targeted activation",
    body: "Tax trails firm-wide weekly adoption by 18 points. New-user drop-off occurs after the first session, suggesting a workflow discovery problem rather than an access problem.",
    evidence:
      "54% Tax adoption · 39% advanced-workflow depth · 23 dormant seats",
  },
  "Which teams are creating value?": {
    title: "Corporate is the strongest expansion signal",
    body: "Corporate combines the highest weekly adoption with repeat use of document analysis and cross-border research. Its power-user cohort can anchor a peer-led enablement program.",
    evidence:
      "91% adoption · 78% workflow depth · 642 hours returned this month",
  },
  "Where is governance exposed?": {
    title: "Contractor access is the immediate control gap",
    body: "Eight contractor identities have not been reviewed in the current cycle. Four retain access to confidential deal rooms despite more than 14 days of inactivity.",
    evidence:
      "12 open reviews · 4 high-sensitivity workspaces · review due in 3 days",
  },
};

const recommendations = [
  {
    id: "tax-activation",
    priority: "High impact",
    title: "Launch a Tax workflow clinic",
    description:
      "Use three proven Corporate prompts to shorten Tax's path from first use to repeat value.",
    impact: "+9–14 pts weekly adoption",
    owner: "Enablement",
  },
  {
    id: "access-review",
    priority: "Governance",
    title: "Complete contractor access review",
    description:
      "Route 12 stale identities to workspace owners before the quarterly certification closes.",
    impact: "Closes 4 sensitive exceptions",
    owner: "Security",
  },
  {
    id: "records-activation",
    priority: "Expansion",
    title: "Activate underused document workflows",
    description:
      "Forty-seven active users have not used the Document Records in 30 days despite matter access.",
    impact: "~310 hours/month opportunity",
    owner: "Legal Ops",
  },
];

const metricCards = [
  {
    label: "Weekly active users",
    value: "72%",
    delta: "+8 pts",
    context: "vs. prior 30 days",
    icon: Activity,
  },
  {
    label: "Adopted seats",
    value: "1,049",
    delta: "84%",
    context: "of 1,248 licensed",
    icon: Users,
  },
  {
    label: "Governed interactions",
    value: "96.8%",
    delta: "+2.4 pts",
    context: "policy-covered",
    icon: ShieldCheck,
  },
  {
    label: "Estimated time returned",
    value: "3,840h",
    delta: "+18%",
    context: "this month",
    icon: Clock3,
  },
];

const MetricCard = ({ metric }) => {
  const Icon = metric.icon;
  return (
    <article className="rounded-lg border border-[var(--border-color)] bg-[var(--panel)] p-4 shadow-[0_4px_16px_#060c1330]">
      <div className="mb-4 flex items-start justify-between">
        <div className="rounded-md border border-[var(--steel-bright)] bg-[var(--panel-raised)] p-2 text-[var(--steel-bright)]">
          <Icon className="h-4 w-4" />
        </div>
        <span className="rounded-full bg-[var(--panel-raised)] px-2 py-1 text-[10px] font-semibold text-[var(--steel-soft)]">
          {metric.delta}
        </span>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--mist)]">
        {metric.label}
      </p>
      <div className="mt-1 flex items-end gap-2">
        <strong className="font-sans text-4xl font-medium text-[var(--ice)]">
          {metric.value}
        </strong>
        <span className="pb-1 text-xs text-[var(--mist)]">
          {metric.context}
        </span>
      </div>
    </article>
  );
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-[var(--steel-bright)] bg-[var(--navy)] p-3 text-xs shadow-xl">
      <p className="mb-2 font-semibold text-[var(--ice)]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {entry.value}%
        </p>
      ))}
    </div>
  );
};

const FirmOperations = () => {
  const [timeframe, setTimeframe] = useState("90 days");
  const [practiceGroup, setPracticeGroup] = useState("All practices");
  const [userQuery, setUserQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [selectedQuestion, setSelectedQuestion] = useState(
    "Where is adoption lagging?",
  );
  const [startedActions, setStartedActions] = useState([]);
  const [reviewedUsers, setReviewedUsers] = useState([]);

  const visiblePracticeGroups = useMemo(
    () =>
      practiceGroup === "All practices"
        ? practiceGroups
        : practiceGroups.filter((group) => group.name === practiceGroup),
    [practiceGroup],
  );

  const visibleUsers = useMemo(() => {
    const normalizedQuery = userQuery.trim().toLowerCase();
    return accessRows.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        [user.name, user.group, user.role].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      const matchesRole =
        roleFilter === "All roles" || user.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [roleFilter, userQuery]);

  const startAction = (recommendation) => {
    setStartedActions((current) =>
      current.includes(recommendation.id)
        ? current
        : [...current, recommendation.id],
    );
    toast.success(`Action plan started: ${recommendation.title}`);
  };

  const exportReport = () => {
    const rows = [
      ["Practice group", "Adoption", "Advanced workflow depth", "Users"],
      ...visiblePracticeGroups.map((group) => [
        group.name,
        `${group.adoption}%`,
        `${group.depth}%`,
        group.users,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${value}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "law-suite-firm-operations-adoption-report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Adoption report exported");
  };

  const selectedInsight = insights[selectedQuestion];
  const visibleTrend =
    timeframe === "30 days" ? adoptionTrend.slice(-4) : adoptionTrend;

  return (
    <div
      className="firm-operations h-full overflow-y-auto bg-[var(--navy)] text-[var(--ice)]"
      data-testid="firm-operations"
    >
      <div className="mx-auto max-w-[1600px] px-4 py-5 md:px-7 lg:px-9">
        <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full border border-[var(--steel-bright)] bg-[var(--panel-raised)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--steel-bright)]">
                Firm operations demo
              </span>
              <span className="rounded-full border border-[var(--steel)] bg-[var(--panel-raised)] px-2.5 py-1 text-[10px] font-semibold text-[var(--steel-soft)]">
                Sample portfolio data
              </span>
            </div>
            <h1 className="font-sans text-3xl font-semibold tracking-tight text-[var(--ice)] md:text-4xl">
              Law Suite Firm Operations
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--mist)]">
              Explore sample adoption patterns and access-review decisions. All
              metrics are illustrative; no identity provider or policy engine is
              connected. Practice filters affect the practice chart and CSV
              only; summary cards and insights stay firm-wide.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={practiceGroup}
              onChange={(event) => setPracticeGroup(event.target.value)}
              className="h-9 rounded-md border border-[var(--border-color)] bg-[var(--panel)] px-3 text-xs text-[var(--ice)] outline-none focus:border-[var(--steel-bright)]"
              aria-label="Practice group filter"
            >
              <option>All practices</option>
              {practiceGroups.map((group) => (
                <option key={group.name}>{group.name}</option>
              ))}
            </select>
            <select
              value={timeframe}
              onChange={(event) => setTimeframe(event.target.value)}
              className="h-9 rounded-md border border-[var(--border-color)] bg-[var(--panel)] px-3 text-xs text-[var(--ice)] outline-none focus:border-[var(--steel-bright)]"
              aria-label="Reporting timeframe"
            >
              <option>30 days</option>
              <option>90 days</option>
              <option>180 days</option>
            </select>
            <button
              type="button"
              onClick={exportReport}
              className="flex h-9 items-center gap-2 rounded-md border border-[var(--steel-bright)] bg-[var(--panel-raised)] px-3 text-xs font-semibold text-[var(--steel-bright)] transition hover:bg-[var(--panel-raised)]"
              data-testid="export-adoption-report"
            >
              <Download className="h-3.5 w-3.5" /> Export report
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <section className="rounded-lg border border-[var(--border-color)] bg-[var(--panel)] p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--steel-bright)]">
                  Adoption trajectory
                </p>
                <h2 className="mt-1 font-sans text-xl font-semibold">
                  From access to repeat value
                </h2>
                <p className="mt-1 text-xs text-[var(--mist)]">
                  Weekly active use and policy coverage · {timeframe} requested
                  window · sample data ends Aug 12, 2026; longer history
                  unavailable
                </p>
              </div>
              <BarChart3 className="h-5 w-5 text-[var(--mist)]" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={visibleTrend}
                  margin={{ top: 8, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="adoptionFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--steel-bright)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--steel-bright)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="var(--border-color)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: "var(--mist)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[40, 100]}
                    tick={{ fill: "var(--mist)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="weeklyActive"
                    name="Weekly active"
                    stroke="var(--steel-bright)"
                    strokeWidth={2.5}
                    fill="url(#adoptionFill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="governed"
                    name="Policy covered"
                    stroke="var(--steel-soft)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--border-color)] bg-[var(--panel)] p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--steel-bright)]">
                  Governance coverage
                </p>
                <h2 className="mt-1 font-sans text-xl font-semibold">
                  Controls at a glance
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-[var(--steel)] text-sm font-bold text-[var(--steel-soft)]">
                92
              </div>
            </div>
            <div className="space-y-2.5">
              {governanceControls.map((control) => {
                const Icon = control.icon;
                return (
                  <div
                    key={control.name}
                    className="flex items-center gap-3 rounded-md border border-[var(--border-color)] bg-[var(--navy)] p-3"
                  >
                    <div
                      className={`rounded-md p-2 ${control.status === "healthy" ? "bg-[var(--panel-raised)] text-[var(--steel-soft)]" : "bg-[#d6a56d0c] text-[var(--status-warning)]"}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--ice)]">
                        {control.name}
                      </p>
                      <p className="truncate text-[10px] text-[var(--mist)]">
                        {control.detail}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold ${control.status === "healthy" ? "text-[var(--steel-soft)]" : "text-[var(--status-warning)]"}`}
                    >
                      {control.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_1fr]">
          <section className="rounded-lg border border-[var(--border-color)] bg-[var(--panel)] p-5">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--steel-bright)]">
                  Adoption by practice
                </p>
                <h2 className="mt-1 font-sans text-xl font-semibold">
                  Find the activation gap
                </h2>
                <p className="mt-1 text-xs text-[var(--mist)]">
                  Adoption measures repeat weekly use; depth measures advanced
                  workflow use.
                </p>
              </div>
              <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-[var(--mist)]">
                {practiceGroup}
              </span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={visiblePracticeGroups}
                  layout="vertical"
                  margin={{ top: 0, right: 14, left: 5, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="var(--border-color)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fill: "var(--mist)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={78}
                    tick={{ fill: "var(--mist)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="adoption"
                    name="Adoption"
                    fill="var(--steel-bright)"
                    radius={[0, 3, 3, 0]}
                    barSize={10}
                  />
                  <Bar
                    dataKey="depth"
                    name="Workflow depth"
                    fill="var(--steel-soft)"
                    radius={[0, 3, 3, 0]}
                    barSize={10}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--steel-bright)] bg-[var(--panel-raised)] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-md bg-[var(--panel-raised)] p-2 text-[var(--steel-bright)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--steel-bright)]">
                  Deployment intelligence
                </p>
                <h2 className="font-sans text-xl font-semibold">
                  Ask about your rollout
                </h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(insights).map((question) => (
                <button
                  type="button"
                  key={question}
                  onClick={() => setSelectedQuestion(question)}
                  className={`rounded-full border px-3 py-1.5 text-[10px] transition ${selectedQuestion === question ? "border-[var(--steel-bright)] bg-[var(--panel-raised)] text-[var(--steel-bright)]" : "border-[var(--border-color)] bg-white/[0.02] text-[var(--mist)] hover:border-white/20"}`}
                >
                  {question}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-[var(--border-color)] bg-[var(--navy)] p-4">
              <div className="mb-2 flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-4 w-4 flex-none text-[var(--steel-bright)]" />
                <h3 className="text-sm font-semibold text-[var(--ice)]">
                  {selectedInsight.title}
                </h3>
              </div>
              <p className="text-xs leading-5 text-[var(--mist)]">
                {selectedInsight.body}
              </p>
              <div className="mt-3 border-t border-[var(--border-color)] pt-3 text-[10px] font-medium text-[var(--mist)]">
                Evidence: {selectedInsight.evidence}
              </div>
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-lg border border-[var(--border-color)] bg-[var(--panel)] p-5">
          <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--steel-bright)]">
                Identity and access
              </p>
              <h2 className="mt-1 font-sans text-xl font-semibold">
                Review access before it becomes risk
              </h2>
              <p className="mt-1 text-xs text-[var(--mist)]">
                Profile attributes are sample SCIM data. Record a review below;
                no account permissions change.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex h-9 min-w-[220px] items-center gap-2 rounded-md border border-[var(--border-color)] bg-[var(--navy)] px-3 text-[var(--mist)] focus-within:border-[var(--steel-bright)]">
                <Search className="h-3.5 w-3.5" />
                <input
                  value={userQuery}
                  onChange={(event) => setUserQuery(event.target.value)}
                  placeholder="Search people or practices"
                  className="w-full bg-transparent text-xs text-[var(--ice)] outline-none placeholder:text-[var(--mist)]"
                />
              </label>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="h-9 rounded-md border border-[var(--border-color)] bg-[var(--navy)] px-3 text-xs text-[var(--ice)] outline-none focus:border-[var(--steel-bright)]"
                aria-label="Role filter"
              >
                <option>All roles</option>
                <option>Partner</option>
                <option>Associate</option>
                <option>Knowledge</option>
                <option>Contractor</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.14em] text-[var(--mist)]">
                  <th className="border-b border-[var(--border-color)] px-3 py-3 font-semibold">
                    User
                  </th>
                  <th className="border-b border-[var(--border-color)] px-3 py-3 font-semibold">
                    Practice
                  </th>
                  <th className="border-b border-[var(--border-color)] px-3 py-3 font-semibold">
                    Role
                  </th>
                  <th className="border-b border-[var(--border-color)] px-3 py-3 font-semibold">
                    Last active
                  </th>
                  <th className="border-b border-[var(--border-color)] px-3 py-3 font-semibold">
                    Access posture
                  </th>
                  <th className="border-b border-[var(--border-color)] px-3 py-3 font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr
                    key={user.name}
                    className="group text-xs text-[var(--mist)]"
                  >
                    <td className="border-b border-[var(--border-color)] px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--panel-raised)] text-[10px] font-bold text-[var(--mist)]">
                          {user.initials}
                        </span>
                        <div>
                          <p className="font-semibold text-[var(--ice)]">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-[var(--mist)]">
                            {user.status}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-[var(--border-color)] px-3 py-3 text-[var(--mist)]">
                      {user.group}
                    </td>
                    <td className="border-b border-[var(--border-color)] px-3 py-3 text-[var(--mist)]">
                      {user.role}
                    </td>
                    <td className="border-b border-[var(--border-color)] px-3 py-3 text-[var(--mist)]">
                      {user.lastActive}
                    </td>
                    <td className="border-b border-[var(--border-color)] px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${user.risk === "Low" ? "bg-[var(--panel-raised)] text-[var(--steel-soft)]" : user.risk === "Review" ? "bg-[#d6a56d0c] text-[var(--status-warning)]" : "bg-[#d6a56d0c] text-[var(--status-warning)]"}`}
                      >
                        {user.risk}
                      </span>
                    </td>
                    <td className="border-b border-[var(--border-color)] px-3 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setReviewedUsers((current) => [
                            ...new Set([...current, user.name]),
                          ]);
                          toast.info(
                            "Sample review recorded. No account access was changed.",
                          );
                        }}
                        disabled={reviewedUsers.includes(user.name)}
                        className="text-[10px] font-semibold text-[var(--steel-bright)] opacity-70 transition hover:opacity-100"
                      >
                        {reviewedUsers.includes(user.name)
                          ? "Review noted (demo)"
                          : "Record sample review"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visibleUsers.length === 0 && (
            <p className="py-8 text-center text-xs text-[var(--mist)]">
              No identities match these filters.
            </p>
          )}
        </section>

        <section className="mt-4 rounded-lg border border-[var(--border-color)] bg-[var(--panel)] p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--steel-bright)]">
                Recommended next actions
              </p>
              <h2 className="mt-1 font-sans text-xl font-semibold">
                Move from insight to intervention
              </h2>
            </div>
            <ArrowUpRight className="h-5 w-5 text-[var(--mist)]" />
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {recommendations.map((recommendation) => {
              const started = startedActions.includes(recommendation.id);
              return (
                <article
                  key={recommendation.id}
                  className="flex min-h-[190px] flex-col rounded-md border border-[var(--border-color)] bg-[var(--navy)] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[var(--panel-raised)] px-2 py-1 text-[10px] font-semibold text-[var(--steel-bright)]">
                      {recommendation.priority}
                    </span>
                    <span className="text-[10px] text-[var(--mist)]">
                      Owner · {recommendation.owner}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-[var(--ice)]">
                    {recommendation.title}
                  </h3>
                  <p className="mt-2 flex-1 text-xs leading-5 text-[var(--mist)]">
                    {recommendation.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-[var(--border-color)] pt-3">
                    <span className="text-[10px] font-medium text-[var(--steel-soft)]">
                      {recommendation.impact}
                    </span>
                    <button
                      type="button"
                      onClick={() => startAction(recommendation)}
                      disabled={started}
                      className={`flex items-center gap-1 text-[10px] font-semibold transition ${started ? "text-[var(--steel-soft)]" : "text-[var(--steel-bright)] hover:text-[var(--steel-soft)]"}`}
                    >
                      {started ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Plan started
                        </>
                      ) : (
                        <>
                          Start plan <ArrowUpRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="mt-5 flex flex-col justify-between gap-2 border-t border-[var(--border-color)] py-4 text-[10px] text-[var(--mist)] sm:flex-row">
          <span>Portfolio concept · Law Suite enterprise administration</span>
          <span>
            Metrics are synthetic and explicitly labeled; no live access
            controls or telemetry are connected.
          </span>
        </footer>
      </div>
    </div>
  );
};

export default FirmOperations;
