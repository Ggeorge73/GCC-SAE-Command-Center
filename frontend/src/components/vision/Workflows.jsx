import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import { loadWorkspace, targetDate } from "@/lib/matterWorkspace";
import { navigateTo } from "@/lib/workspaceNavigation";
import { useServices } from "./serviceRecords";
import { usePractice } from "./PracticeDesk";
import { practiceChange } from "@/lib/practiceRecords";
import {
  Panel,
  Button,
  Field,
  Badge,
  Avatar,
  Avatars,
  useLocal,
  StatusMessage,
} from "./Glass";

export function Register({ requests = false }) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(false);
  const [status, setStatus] = useState("All statuses");
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");
  const records = useMemo(
    () =>
      loadWorkspace().matters.map((m, i) => ({
        ...m,
        status: ["In review", "Awaiting evidence", "Intake"][i % 3],
      })),
    [],
  );
  const rows = records
    .filter(
      (m) =>
        (status === "All statuses" || m.status === status) &&
        `${m.id} ${m.name} ${m.client} ${m.owner}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name),
    );
  const pages = Math.max(1, Math.ceil(rows.length / limit));
  const current = Math.min(page, pages);
  function exportRows() {
    const quote = (v) => '"' + String(v).replaceAll('"', '""') + '"';
    const csv = [
      ["Matter", "Client", "Lead", "Status"],
      ...rows.map((m) => [m.name, m.client, m.owner, m.status]),
    ]
      .map((r) => r.map(quote).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "law-suite-sample-register.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(`Exported ${rows.length} matching fictional records.`);
  }
  return (
    <Panel
      title={requests ? "Engagement requests" : "Matter register"}
      subtitle="A clear view of the work moving through your firm."
      action={
        <Button onClick={() => navigateTo("/applications/wizard")}>
          <Plus size={14} />
          New intake
        </Button>
      }
    >
      <div className="v-table-tools">
        <label>
          Show{" "}
          <select
            aria-label="Entries per page"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            {[5, 10, 25].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>{" "}
          entries
        </label>
        <select
          aria-label="Filter register by status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          {["All statuses", "In review", "Awaiting evidence", "Intake"].map(
            (v) => (
              <option key={v}>{v}</option>
            ),
          )}
        </select>
        <label className="v-table-search">
          <Search size={15} />
          <input
            aria-label="Search register"
            placeholder="Search…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <Button secondary onClick={exportRows}>
          <Download size={14} />
          Export
        </Button>
      </div>
      <div className="v-table-scroll">
        <table className="v-table">
          <thead>
            <tr>
              {requests && <th>Select</th>}
              <th>
                <button onClick={() => setSort(!sort)}>
                  Matter {sort ? "↓" : "↑"}
                </button>
              </th>
              <th>Client</th>
              <th>Lead</th>
              <th>Review target</th>
              <th>Status</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice((current - 1) * limit, current * limit).map((m) => (
              <tr key={m.id}>
                {requests && (
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${m.id}`}
                      checked={selected.includes(m.id)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, m.id]
                            : selected.filter((id) => id !== m.id),
                        )
                      }
                    />
                  </td>
                )}
                <td>
                  <b>{m.name}</b>
                  <small>{m.id}</small>
                </td>
                <td>{m.client}</td>
                <td>
                  <span className="v-inline">
                    <Avatar name={m.owner} />
                    {m.owner}
                  </span>
                </td>
                <td>{targetDate(m.deadline)}</td>
                <td>
                  <Badge tone={m.status === "In review" ? "green" : "blue"}>
                    {m.status}
                  </Badge>
                </td>
                <td>
                  <button
                    className="v-text-link"
                    onClick={() =>
                      navigateTo(
                        requests
                          ? `/ecommerce/orders/order-details?request=${encodeURIComponent(m.id)}`
                          : `/matters/${m.id}/issues`,
                      )
                    }
                  >
                    Open →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <div className="v-empty">
          <h3>No matching matters</h3>
          <p>Try another client, matter, or status.</p>
          <Button
            secondary
            onClick={() => {
              setQuery("");
              setStatus("All statuses");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
      <footer className="v-pagination">
        <span>
          {rows.length} matching records
          {selected.length ? ` · ${selected.length} selected` : ""}
        </span>
        <button
          disabled={current === 1}
          aria-label="Previous register page"
          onClick={() => setPage(current - 1)}
        >
          <ChevronLeft size={15} />
        </button>
        <span>
          {current} / {pages}
        </span>
        <button
          disabled={current === pages}
          aria-label="Next register page"
          onClick={() => setPage(current + 1)}
        >
          <ChevronRight size={15} />
        </button>
      </footer>
      <StatusMessage>{message}</StatusMessage>
    </Panel>
  );
}
const initialEvents = [
  {
    id: "one",
    date: "2026-09-10",
    time: "09:00",
    title: "Northstar internal review",
    practice: "Corporate",
  },
  {
    id: "two",
    date: "2026-09-14",
    time: "14:30",
    title: "Meridian evidence meeting",
    practice: "Litigation",
  },
  {
    id: "three",
    date: "2026-09-18",
    time: "11:00",
    title: "Evergreen policy workshop",
    practice: "Regulatory",
  },
];
export function LegalCalendar({ compact = false }) {
  const [events, setEvents, error, recover] = useLocal(
    "calendar",
    initialEvents,
  );
  const [editing, setEditing] = useState(null);
  const [eventQuery, setEventQuery] = useState("");
  const [eventGroup, setEventGroup] = useState("All events");
  const [month, setMonth] = useState(new Date(2026, 8, 1));
  const [chosen, setChosen] = useState("");
  const [message, setMessage] = useState("");
  const [start, setStart] = useState("09:00");
  const [title, setTitle] = useState("");
  const [practice, setPractice] = useState("Corporate");
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = month.getDay();
  const key = (day) =>
    `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return (
    <div className={compact ? "" : "v-calendar-layout"}>
      <Panel
        title={month.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}
        subtitle="Internal planning only · no court deadline calculation"
        action={
          <div className="v-inline">
            <button
              aria-label="Previous month"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
            >
              <ChevronLeft size={19} />
            </button>
            <button
              aria-label="Next month"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
            >
              <ChevronRight size={19} />
            </button>
          </div>
        }
      >
        <div className="v-calendar-scroll">
          <div className="v-calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <b key={d}>{d}</b>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <div key={"empty" + i} />
            ))}
            {Array.from({ length: days }, (_, i) => (
              <button
                className={chosen === key(i + 1) ? "selected" : ""}
                aria-label={`Plan ${key(i + 1)}`}
                key={i}
                onClick={() => {
                  setChosen(key(i + 1));
                  setMessage("");
                }}
              >
                <span>{i + 1}</span>
                {events
                  .filter((e) => e.date === key(i + 1))
                  .map((e) => (
                    <small
                      key={e.id}
                      className={e.practice === "Litigation" ? "violet" : ""}
                    >
                      {e.time} {e.title}
                    </small>
                  ))}
              </button>
            ))}
          </div>
        </div>
        {chosen && (
          <form
            className="v-event-form"
            onSubmit={(e) => {
              e.preventDefault();
              setEvents((current) => [
                ...current.filter((item) => item.id !== editing),
                {
                  id: editing || crypto.randomUUID(),
                  date: chosen,
                  time: start,
                  title: title.trim(),
                  practice,
                },
              ]);
              setEditing(null);
              setTitle("");
              setMessage("Planning event saved in this browser.");
            }}
          >
            <h3>
              {editing ? "Edit event" : "Plan"} {chosen}
            </h3>
            <Field
              label="Event date"
              type="date"
              required
              value={chosen}
              onChange={(e) => setChosen(e.target.value)}
            />
            <div className="v-form-grid">
              <Field
                label="Event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
              />
              <Field
                label="Time"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
              <label className="v-field">
                <span>Practice</span>
                <select
                  value={practice}
                  onChange={(e) => setPractice(e.target.value)}
                >
                  <option>Corporate</option>
                  <option>Litigation</option>
                  <option>Regulatory</option>
                </select>
              </label>
            </div>
            <Button disabled={!title.trim()}>Save planning event</Button>
          </form>
        )}
        <StatusMessage>{error || message}</StatusMessage>
        {error && (
          <Button secondary onClick={recover}>
            Download recovery copy
          </Button>
        )}
      </Panel>
      {!compact && (
        <Panel
          title="Planning events"
          subtitle="All events remain manageable. Times are local planning times; no reminders are delivered."
        >
          <Avatars />
          <Field
            label="Search events"
            value={eventQuery}
            onChange={(e) => setEventQuery(e.target.value)}
          />
          <label className="v-field">
            <span>Event period</span>
            <select
              value={eventGroup}
              onChange={(e) => setEventGroup(e.target.value)}
            >
              {["All events", "Upcoming", "Past"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          {[...events]
            .filter((e) =>
              e.title.toLowerCase().includes(eventQuery.toLowerCase()),
            )
            .filter(
              (e) =>
                eventGroup === "All events" ||
                (eventGroup === "Past"
                  ? new Date(`${e.date}T${e.time}`) < new Date()
                  : new Date(`${e.date}T${e.time}`) >= new Date()),
            )
            .sort((a, b) =>
              `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
            )
            .map((e) => (
              <div className="v-event" key={e.id}>
                <span className="v-icon">
                  <CalendarDays size={17} />
                </span>
                <div>
                  <b>{e.title}</b>
                  <p>
                    {e.date} · {e.time}
                  </p>
                  <small>{e.practice}</small>
                </div>
                <button
                  aria-label={`Edit ${e.title}`}
                  onClick={() => {
                    setEditing(e.id);
                    setChosen(e.date);
                    setStart(e.time);
                    setTitle(e.title);
                    setPractice(e.practice);
                  }}
                >
                  Edit
                </button>
                <button
                  aria-label={`Remove ${e.title}`}
                  onClick={() =>
                    setEvents(events.filter((item) => item.id !== e.id))
                  }
                >
                  ×
                </button>
              </div>
            ))}
        </Panel>
      )}
    </div>
  );
}
export function ReviewBoard() {
  const [cards, setCards, error] = useLocal("kanban", [
    {
      id: "a",
      title: "Inspect consent language",
      status: "To review",
      practice: "Corporate",
    },
    {
      id: "b",
      title: "Reconcile disclosure schedule",
      status: "In progress",
      practice: "Corporate",
    },
    {
      id: "c",
      title: "Confirm receipt evidence",
      status: "In progress",
      practice: "Litigation",
    },
    {
      id: "d",
      title: "Policy version comparison",
      status: "Waiting",
      practice: "Regulatory",
    },
    {
      id: "e",
      title: "Prepare review checklist",
      status: "Complete",
      practice: "Firm",
    },
  ]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const columns = ["To review", "In progress", "Waiting", "Complete"];
  const move = (id, status) => {
    setCards(cards.map((c) => (c.id === id ? { ...c, status } : c)));
    setMessage(
      "Board task moved. Evidence reviews and approvals are unchanged.",
    );
  };
  return (
    <>
      <form
        className="v-board-tools"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          setCards([
            ...cards,
            {
              id: crypto.randomUUID(),
              title: title.trim(),
              practice: "Firm",
              status: columns[0],
            },
          ]);
          setTitle("");
        }}
      >
        <Field
          label="New coordination task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
        />
        <Button>
          <Plus size={16} />
          Add task
        </Button>
        <Avatars />
      </form>
      <div className="v-kanban">
        {columns.map((column, i) => (
          <Panel
            key={column}
            title={column}
            subtitle={`${cards.filter((c) => c.status === column).length} tasks`}
          >
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                move(e.dataTransfer.getData("text/plain"), column);
              }}
              className="v-kanban-drop"
            >
              {cards
                .filter((c) => c.status === column)
                .map((c) => (
                  <article
                    className="v-task"
                    key={c.id}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", c.id)
                    }
                  >
                    <Badge
                      tone={i === 3 ? "green" : i === 2 ? "amber" : "blue"}
                    >
                      {c.practice}
                    </Badge>
                    <h3>{c.title}</h3>
                    <p>Internal coordination · sample task</p>
                    <Avatars />
                    <label className="v-field">
                      <span>Move task</span>
                      <select
                        aria-label={`Move ${c.title}`}
                        value={c.status}
                        onChange={(e) => move(c.id, e.target.value)}
                      >
                        {columns.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                  </article>
                ))}
            </div>
          </Panel>
        ))}
      </div>
      <StatusMessage>{error || message}</StatusMessage>
    </>
  );
}
export function IntakeWizard({ kind = "wizard" }) {
  const services = useServices();
  const [, setWorkspace, workspaceError] = usePractice();
  const isUser = kind === "new-user",
    isService = kind === "new-product";
  const steps = isUser
    ? ["Colleague", "Practice", "Contact", "Review"]
    : isService
      ? ["Service info", "Materials", "Delivery", "Pricing"]
      : ["Matter", "Engagement", "Review"];
  const [step, setStep] = useState(0);
  const [data, setData, error] = useLocal("intake-" + kind, {});
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const update = (key) => (e) => setData({ ...data, [key]: e.target.value });
  const fields = isUser
    ? [
        [
          ["name", "Full name"],
          ["email", "Work email", "email"],
        ],
        [
          ["practice", "Practice group"],
          ["role", "Role"],
        ],
        [
          ["office", "Office"],
          ["phone", "Phone", "tel"],
        ],
      ]
    : isService
      ? [
          [
            ["name", "Service name"],
            ["practice", "Practice area"],
          ],
          [
            ["materials", "Required documents"],
            ["scope", "Scope and exclusions"],
          ],
          [
            ["lead", "Service lead"],
            ["delivery", "Delivery format"],
          ],
          [
            ["fee", "Illustrative fee (USD)", "number"],
            ["terms", "Fee assumptions"],
          ],
        ]
      : [
          [
            ["name", "Matter name"],
            ["client", "Client organization"],
          ],
          [
            ["lead", "Responsible attorney"],
            ["jurisdiction", "Jurisdiction"],
            ["scope", "Engagement scope"],
          ],
        ];
  const review = step >= fields.length;
  function next(e) {
    e.preventDefault();
    if (
      !review &&
      fields[step].some(([key]) => !String(data[key] || "").trim())
    ) {
      setMessage("Enter a meaningful value for each required field.");
      return;
    }
    if (step < steps.length - 1) setStep(step + 1);
    else {
      if (!isUser && !isService) {
        const record = { ...data, id: data.id || crypto.randomUUID() };
        try {
          setWorkspace((current) =>
            practiceChange(current, { type: "intake", record }),
          );
          setData(record);
        } catch (failure) {
          setMessage(failure.message);
          return;
        }
      }
      if (isService) {
        const proposal = {
          ...data,
          id: data.id || crypto.randomUUID(),
          status: "Draft",
        };
        services.setProposals((all) => [
          ...all.filter((p) => p.id !== proposal.id),
          proposal,
        ]);
        services.setSelected(proposal.id);
        setData(proposal);
      }
      setDone(true);
      setMessage(
        isUser
          ? "Invitation draft saved locally. No invitation was sent."
          : isService
            ? "Service proposal saved locally. Nothing was published."
            : "Intake draft saved locally. Conflicts and engagement approval still require firm review.",
      );
    }
  }
  return (
    <div className="v-wizard">
      <div className="v-page-intro">
        <h1>
          {isUser
            ? "Welcome a colleague."
            : isService
              ? "Define a legal service."
              : "Start with the right context."}
        </h1>
        <p>
          {isUser
            ? "Prepare a colleague invitation for review."
            : isService
              ? "Bring scope, materials, and delivery together."
              : "Capture the essentials before work begins."}
        </p>
      </div>
      <ol className="v-stepper">
        {steps.map((s, i) => (
          <li key={s} className={i <= step ? "active" : ""}>
            <span>{i < step ? <Check size={16} /> : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <Panel
        title={done ? "Draft prepared" : steps[step]}
        subtitle="Fictional information only · saves in this browser"
      >
        <form onSubmit={next}>
          {!done &&
            (review ? (
              <dl className="v-review-fields">
                {Object.entries(data).map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="v-form-grid">
                {fields[step].map(([key, label, type = "text"]) => (
                  <Field
                    key={key}
                    label={label}
                    type={type}
                    min={type === "number" ? 0 : undefined}
                    value={data[key] || ""}
                    onChange={update(key)}
                    required
                    maxLength={240}
                  />
                ))}
              </div>
            ))}
          {!done && (
            <div className="v-wizard-actions">
              <Button
                type="button"
                secondary
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft size={14} />
                Back
              </Button>
              <Button>
                {step === steps.length - 1 ? "Save local draft" : "Next"}
                <ArrowRight size={14} />
              </Button>
            </div>
          )}
        </form>
        <StatusMessage>{error || workspaceError || message}</StatusMessage>
        <Button secondary type="button" onClick={() => { setData({}); setDone(false); setStep(0); setMessage("A new draft is ready. Previously saved intake and service records remain in their lists."); }}>Start another draft</Button>
        {done && !isUser && (
          <Button
            secondary
            onClick={() =>
              navigateTo(
                isService
                  ? "/ecommerce/products/product-page"
                  : "/applications/practice-desk",
              )
            }
          >
            {isService ? "Open saved service proposal" : "Review saved intake"}
          </Button>
        )}
        {done && (
          <Button
            secondary
            onClick={() => {
              setDone(false);
              setStep(0);
              setMessage("");
            }}
          >
            Edit draft
          </Button>
        )}
      </Panel>
    </div>
  );
}
