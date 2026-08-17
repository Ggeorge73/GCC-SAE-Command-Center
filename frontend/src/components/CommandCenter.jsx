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
  { name: "Amara Okafor", initials: "AO", group: "Corporate", role: "Partner", status: "Active", lastActive: "12 min ago", risk: "Low" },
  { name: "Daniel Foster", initials: "DF", group: "Litigation", role: "Associate", status: "Active", lastActive: "41 min ago", risk: "Low" },
  { name: "Priya Raman", initials: "PR", group: "Regulatory", role: "Knowledge", status: "Active", lastActive: "2 hours ago", risk: "Low" },
  { name: "Marcus Chen", initials: "MC", group: "Finance", role: "Partner", status: "Review", lastActive: "8 days ago", risk: "Review" },
  { name: "Nadia Williams", initials: "NW", group: "Employment", role: "Associate", status: "Active", lastActive: "Yesterday", risk: "Low" },
  { name: "Emeka Balogun", initials: "EB", group: "Corporate", role: "Contractor", status: "Review", lastActive: "13 days ago", risk: "Review" },
  { name: "Sophie Laurent", initials: "SL", group: "Tax", role: "Associate", status: "Inactive", lastActive: "31 days ago", risk: "Inactive" },
  { name: "James Wright", initials: "JW", group: "Litigation", role: "Contractor", status: "Review", lastActive: "17 days ago", risk: "Review" },
];

const governanceControls = [
  { name: "Single sign-on", detail: "Enforced for all workforce identities", value: "100%", status: "healthy", icon: KeyRound },
  { name: "SCIM profile sync", detail: "1,226 of 1,248 identities current", value: "98.2%", status: "healthy", icon: UserCheck },
  { name: "Role coverage", detail: "Principle-of-least-privilege policies", value: "94%", status: "healthy", icon: ShieldCheck },
  { name: "Access review", detail: "12 identities require administrator review", value: "12 open", status: "attention", icon: AlertTriangle },
];

const insights = {
  "Where is adoption lagging?": {
    title: "Tax and Employment need targeted activation",
    body: "Tax trails firm-wide weekly adoption by 18 points. New-user drop-off occurs after the first session, suggesting a workflow discovery problem rather than an access problem.",
    evidence: "54% Tax adoption · 39% advanced-workflow depth · 23 dormant seats",
  },
  "Which teams are creating value?": {
    title: "Corporate is the strongest expansion signal",
    body: "Corporate combines the highest weekly adoption with repeat use of document analysis and cross-border research. Its power-user cohort can anchor a peer-led enablement program.",
    evidence: "91% adoption · 78% workflow depth · 642 hours returned this month",
  },
  "Where is governance exposed?": {
    title: "Contractor access is the immediate control gap",
    body: "Eight contractor identities have not been reviewed in the current cycle. Four retain access to confidential deal rooms despite more than 14 days of inactivity.",
    evidence: "12 open reviews · 4 high-sensitivity workspaces · review due in 3 days",
  },
};

const recommendations = [
  {
    id: "tax-activation",
    priority: "High impact",
    title: "Launch a Tax workflow clinic",
    description: "Use three proven Corporate prompts to shorten Tax's path from first use to repeat value.",
    impact: "+9–14 pts weekly adoption",
    owner: "Enablement",
  },
  {
    id: "access-review",
    priority: "Governance",
    title: "Complete contractor access review",
    description: "Route 12 stale identities to workspace owners before the quarterly certification closes.",
    impact: "Closes 4 sensitive exceptions",
    owner: "Security",
  },
  {
    id: "vault-activation",
    priority: "Expansion",
    title: "Activate underused document workflows",
    description: "Forty-seven active users have not used the Vault in 30 days despite matter access.",
    impact: "~310 hours/month opportunity",
    owner: "Legal Ops",
  },
];

const metricCards = [
  { label: "Weekly active users", value: "72%", delta: "+8 pts", context: "vs. prior 30 days", icon: Activity },
  { label: "Adopted seats", value: "1,049", delta: "84%", context: "of 1,248 licensed", icon: Users },
  { label: "Governed interactions", value: "96.8%", delta: "+2.4 pts", context: "policy-covered", icon: ShieldCheck },
  { label: "Estimated time returned", value: "3,840h", delta: "+18%", context: "this month", icon: Clock3 },
];

const MetricCard = ({ metric }) => {
  const Icon = metric.icon;
  return (
    <article className="rounded-lg border border-white/5 bg-[#0f1f38] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
      <div className="mb-4 flex items-start justify-between">
        <div className="rounded-md border border-[#c9a227]/20 bg-[#c9a227]/10 p-2 text-[#d9b94d]">
          <Icon className="h-4 w-4" />
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400">
          {metric.delta}
        </span>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
      <div className="mt-1 flex items-end gap-2">
        <strong className="font-serif text-3xl font-semibold text-slate-100">{metric.value}</strong>
        <span className="pb-1 text-xs text-slate-500">{metric.context}</span>
      </div>
    </article>
  );
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-[#c9a227]/20 bg-[#081321]/95 p-3 text-xs shadow-xl">
      <p className="mb-2 font-semibold text-slate-200">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {entry.value}%
        </p>
      ))}
    </div>
  );
};

const CommandCenter = () => {
  const [timeframe, setTimeframe] = useState("90 days");
  const [practiceGroup, setPracticeGroup] = useState("All practices");
  const [userQuery, setUserQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [selectedQuestion, setSelectedQuestion] = useState("Where is adoption lagging?");
  const [startedActions, setStartedActions] = useState([]);

  const visiblePracticeGroups = useMemo(
    () => practiceGroup === "All practices" ? practiceGroups : practiceGroups.filter((group) => group.name === practiceGroup),
    [practiceGroup],
  );

  const visibleUsers = useMemo(() => {
    const normalizedQuery = userQuery.trim().toLowerCase();
    return accessRows.filter((user) => {
      const matchesQuery = !normalizedQuery || [user.name, user.group, user.role].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesRole = roleFilter === "All roles" || user.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [roleFilter, userQuery]);

  const startAction = (recommendation) => {
    setStartedActions((current) => current.includes(recommendation.id) ? current : [...current, recommendation.id]);
    toast.success(`Action plan started: ${recommendation.title}`);
  };

  const exportReport = () => {
    const rows = [
      ["Practice group", "Adoption", "Advanced workflow depth", "Users"],
      ...practiceGroups.map((group) => [group.name, `${group.adoption}%`, `${group.depth}%`, group.users]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "gcc-control-center-adoption-report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Adoption report exported");
  };

  const selectedInsight = insights[selectedQuestion];

  return (
    <div className="h-full overflow-y-auto bg-[#081321] text-slate-100" data-testid="command-center">
      <div className="mx-auto max-w-[1600px] px-4 py-5 md:px-7 lg:px-9">
        <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full border border-[#c9a227]/25 bg-[#c9a227]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d9b94d]">
                Executive control surface
              </span>
              <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-[10px] font-semibold text-blue-300">
                Sample portfolio data
              </span>
            </div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-white md:text-4xl">GCC Control Center</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Turn legal-AI usage into an operating system for adoption, governance, and measurable value—not another static analytics dashboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={practiceGroup}
              onChange={(event) => setPracticeGroup(event.target.value)}
              className="h-9 rounded-md border border-white/10 bg-[#0f1f38] px-3 text-xs text-slate-200 outline-none focus:border-[#c9a227]/60"
              aria-label="Practice group filter"
            >
              <option>All practices</option>
              {practiceGroups.map((group) => <option key={group.name}>{group.name}</option>)}
            </select>
            <select
              value={timeframe}
              onChange={(event) => setTimeframe(event.target.value)}
              className="h-9 rounded-md border border-white/10 bg-[#0f1f38] px-3 text-xs text-slate-200 outline-none focus:border-[#c9a227]/60"
              aria-label="Reporting timeframe"
            >
              <option>30 days</option>
              <option>90 days</option>
              <option>180 days</option>
            </select>
            <button
              type="button"
              onClick={exportReport}
              className="flex h-9 items-center gap-2 rounded-md border border-[#c9a227]/30 bg-[#c9a227]/10 px-3 text-xs font-semibold text-[#e1c56a] transition hover:bg-[#c9a227]/20"
              data-testid="export-adoption-report"
            >
              <Download className="h-3.5 w-3.5" /> Export report
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <section className="rounded-lg border border-white/5 bg-[#0f1f38] p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d9b94d]">Adoption trajectory</p>
                <h2 className="mt-1 font-serif text-xl font-semibold">From access to repeat value</h2>
                <p className="mt-1 text-xs text-slate-500">Weekly active use and policy coverage · {timeframe}</p>
              </div>
              <BarChart3 className="h-5 w-5 text-slate-600" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={adoptionTrend} margin={{ top: 8, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adoptionFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c9a227" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#c9a227" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="weeklyActive" name="Weekly active" stroke="#d9b94d" strokeWidth={2.5} fill="url(#adoptionFill)" />
                  <Area type="monotone" dataKey="governed" name="Policy covered" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-lg border border-white/5 bg-[#0f1f38] p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d9b94d]">Governance coverage</p>
                <h2 className="mt-1 font-serif text-xl font-semibold">Controls at a glance</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-emerald-500/20 text-sm font-bold text-emerald-400">92</div>
            </div>
            <div className="space-y-2.5">
              {governanceControls.map((control) => {
                const Icon = control.icon;
                return (
                  <div key={control.name} className="flex items-center gap-3 rounded-md border border-white/5 bg-[#081321]/55 p-3">
                    <div className={`rounded-md p-2 ${control.status === "healthy" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-200">{control.name}</p>
                      <p className="truncate text-[10px] text-slate-500">{control.detail}</p>
                    </div>
                    <span className={`text-xs font-bold ${control.status === "healthy" ? "text-emerald-400" : "text-amber-400"}`}>{control.value}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_1fr]">
          <section className="rounded-lg border border-white/5 bg-[#0f1f38] p-5">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d9b94d]">Adoption by practice</p>
                <h2 className="mt-1 font-serif text-xl font-semibold">Find the activation gap</h2>
                <p className="mt-1 text-xs text-slate-500">Adoption measures repeat weekly use; depth measures advanced workflow use.</p>
              </div>
              <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-slate-400">{practiceGroup}</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visiblePracticeGroups} layout="vertical" margin={{ top: 0, right: 14, left: 5, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.08)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={78} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="adoption" name="Adoption" fill="#c9a227" radius={[0, 3, 3, 0]} barSize={10} />
                  <Bar dataKey="depth" name="Workflow depth" fill="#38bdf8" radius={[0, 3, 3, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-lg border border-[#c9a227]/15 bg-[linear-gradient(145deg,#111f35,#0b1728)] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-md bg-[#c9a227]/10 p-2 text-[#d9b94d]"><Sparkles className="h-4 w-4" /></div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d9b94d]">Deployment intelligence</p>
                <h2 className="font-serif text-xl font-semibold">Ask about your rollout</h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(insights).map((question) => (
                <button
                  type="button"
                  key={question}
                  onClick={() => setSelectedQuestion(question)}
                  className={`rounded-full border px-3 py-1.5 text-[10px] transition ${selectedQuestion === question ? "border-[#c9a227]/40 bg-[#c9a227]/15 text-[#e1c56a]" : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20"}`}
                >
                  {question}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-white/5 bg-[#081321]/70 p-4">
              <div className="mb-2 flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-4 w-4 flex-none text-[#d9b94d]" />
                <h3 className="text-sm font-semibold text-slate-100">{selectedInsight.title}</h3>
              </div>
              <p className="text-xs leading-5 text-slate-400">{selectedInsight.body}</p>
              <div className="mt-3 border-t border-white/5 pt-3 text-[10px] font-medium text-slate-500">Evidence: {selectedInsight.evidence}</div>
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-lg border border-white/5 bg-[#0f1f38] p-5">
          <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d9b94d]">Identity and access</p>
              <h2 className="mt-1 font-serif text-xl font-semibold">Review access before it becomes risk</h2>
              <p className="mt-1 text-xs text-slate-500">Profile attributes are sample SCIM data for the portfolio demonstration.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex h-9 min-w-[220px] items-center gap-2 rounded-md border border-white/10 bg-[#081321] px-3 text-slate-500 focus-within:border-[#c9a227]/50">
                <Search className="h-3.5 w-3.5" />
                <input
                  value={userQuery}
                  onChange={(event) => setUserQuery(event.target.value)}
                  placeholder="Search people or practices"
                  className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600"
                />
              </label>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="h-9 rounded-md border border-white/10 bg-[#081321] px-3 text-xs text-slate-200 outline-none focus:border-[#c9a227]/60"
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
                <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-600">
                  <th className="border-b border-white/5 px-3 py-3 font-semibold">User</th>
                  <th className="border-b border-white/5 px-3 py-3 font-semibold">Practice</th>
                  <th className="border-b border-white/5 px-3 py-3 font-semibold">Role</th>
                  <th className="border-b border-white/5 px-3 py-3 font-semibold">Last active</th>
                  <th className="border-b border-white/5 px-3 py-3 font-semibold">Access posture</th>
                  <th className="border-b border-white/5 px-3 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.name} className="group text-xs text-slate-300">
                    <td className="border-b border-white/[0.04] px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#152a4a] text-[10px] font-bold text-slate-300">{user.initials}</span>
                        <div><p className="font-semibold text-slate-200">{user.name}</p><p className="text-[10px] text-slate-600">{user.status}</p></div>
                      </div>
                    </td>
                    <td className="border-b border-white/[0.04] px-3 py-3 text-slate-400">{user.group}</td>
                    <td className="border-b border-white/[0.04] px-3 py-3 text-slate-400">{user.role}</td>
                    <td className="border-b border-white/[0.04] px-3 py-3 text-slate-500">{user.lastActive}</td>
                    <td className="border-b border-white/[0.04] px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${user.risk === "Low" ? "bg-emerald-500/10 text-emerald-400" : user.risk === "Review" ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"}`}>
                        {user.risk}
                      </span>
                    </td>
                    <td className="border-b border-white/[0.04] px-3 py-3">
                      <button type="button" className="text-[10px] font-semibold text-[#d9b94d] opacity-70 transition hover:opacity-100">Review access</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visibleUsers.length === 0 && <p className="py-8 text-center text-xs text-slate-500">No identities match these filters.</p>}
        </section>

        <section className="mt-4 rounded-lg border border-white/5 bg-[#0f1f38] p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d9b94d]">Recommended next actions</p>
              <h2 className="mt-1 font-serif text-xl font-semibold">Move from insight to intervention</h2>
            </div>
            <ArrowUpRight className="h-5 w-5 text-slate-600" />
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {recommendations.map((recommendation) => {
              const started = startedActions.includes(recommendation.id);
              return (
                <article key={recommendation.id} className="flex min-h-[190px] flex-col rounded-md border border-white/5 bg-[#081321]/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#c9a227]/10 px-2 py-1 text-[10px] font-semibold text-[#d9b94d]">{recommendation.priority}</span>
                    <span className="text-[10px] text-slate-600">Owner · {recommendation.owner}</span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-100">{recommendation.title}</h3>
                  <p className="mt-2 flex-1 text-xs leading-5 text-slate-500">{recommendation.description}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-[10px] font-medium text-emerald-400">{recommendation.impact}</span>
                    <button
                      type="button"
                      onClick={() => startAction(recommendation)}
                      disabled={started}
                      className={`flex items-center gap-1 text-[10px] font-semibold transition ${started ? "text-emerald-400" : "text-[#d9b94d] hover:text-[#f0d986]"}`}
                    >
                      {started ? <><CheckCircle2 className="h-3.5 w-3.5" /> Plan started</> : <>Start plan <ArrowUpRight className="h-3.5 w-3.5" /></>}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="mt-5 flex flex-col justify-between gap-2 border-t border-white/5 py-4 text-[10px] text-slate-600 sm:flex-row">
          <span>Portfolio concept · GCC-SAE enterprise administration</span>
          <span>Metrics are synthetic and explicitly labeled; product decisions and workflows are original.</span>
        </footer>
      </div>
    </div>
  );
};

export default CommandCenter;
