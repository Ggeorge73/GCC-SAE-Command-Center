import {
  initialWorkspace,
  changeWorkspace,
  readiness,
  targetDate,
  loadWorkspace,
  STORAGE_KEY,
} from "./matterWorkspace";
import { exportMemorandum } from "./reviewMemorandum";

beforeAll(() => {
  global.crypto = { randomUUID: () => `event-${Math.random()}` };
  global.structuredClone = (value) => JSON.parse(JSON.stringify(value));
});
const act = (state, type, fields = {}) =>
  changeWorkspace(state, {
    matterId: "LS-2401",
    issueId: "N1",
    type,
    ...fields,
  });
const note = "Compared the source and recorded the outstanding conditions.";
function reviewedState() {
  let s = initialWorkspace();
  for (const i of s.matters[0].issues) {
    s = act(s, "noteDraft", { issueId: i.id, value: note });
    if (i.evidenceState !== "supported") {
      s = act(s, "exclude", { issueId: i.id });
      s = act(s, "noteDraft", { issueId: i.id, value: note });
    }
    s = act(s, "review", { issueId: i.id });
  }
  for (const c of s.matters[0].controls) s = act(s, "control", { id: c.id });
  return s;
}

test("all prerequisite controls start unchecked and notes on gaps remain independent of evidence", () => {
  let s = initialWorkspace();
  expect(s.matters.flatMap((m) => m.controls).every((c) => !c.checked)).toBe(
    true,
  );
  s = act(s, "noteDraft", { issueId: "N2", value: note });
  s = act(s, "decision", { issueId: "N2", value: "Escalated" });
  expect(s.matters[0].issues[1]).toMatchObject({
    evidenceState: "contradicted",
    workState: "Escalated",
    review: null,
  });
  expect(s.matters[0].issues[1].notes[0]).toMatchObject({
    text: note,
    by: s.actor,
  });
  const revised = act(s, "revision");
  expect(revised.matters[0].issues[1].workState).toBe("Escalated");
  expect(() => act(s, "review", { issueId: "N2" })).toThrow(/Resolve/);
});
test("source revisions invalidate every affected approval but preserve unrelated reviews and decision history", () => {
  let s = reviewedState();
  s = act(s, "approve");
  expect(s.matters[0].approval).not.toBeNull();
  const original = s;
  s = act(s, "revision");
  expect(original.matters[0].approval).not.toBeNull();
  expect(s.matters[0].approval).toBeNull();
  expect(
    s.matters[0].issues.slice(0, 2).every((i) => !i.review && i.pendingChange),
  ).toBe(true);
  expect(s.matters[0].issues[2].review).not.toBeNull();
  expect(s.events.some((e) => e.action.includes("Approved the internal"))).toBe(
    true,
  );
  expect(readiness(s.matters[0]).ready).toBe(false);
  expect(s.matters[1]).toEqual(original.matters[1]);
});
test("acknowledging a changed source does not itself complete review or erase a new contradiction", () => {
  let s = act(initialWorkspace(), "revision");
  s = act(s, "acceptChange", { issueId: "N2" });
  expect(s.matters[0].issues[1]).toMatchObject({
    evidenceState: "supported",
    review: null,
    pendingChange: null,
  });
  s = act(s, "revision");
  s = act(s, "acceptChange", { issueId: "N2" });
  expect(s.matters[0].issues[1].evidenceState).toBe("contradicted");
});
test("review does not silently close an assignment and only the demo partner may approve", () => {
  let s = reviewedState();
  s = act(s, "noteDraft", { value: note });
  s = act(s, "decision", { value: "Assigned" });
  s = act(s, "noteDraft", { value: note });
  s = act(s, "review");
  expect(readiness(s.matters[0]).tasks).toHaveLength(1);
  expect(() => act(s, "approve")).toThrow();
  s = act(s, "noteDraft", {
    value: "Task closed after the sample evidence request was answered.",
  });
  s = act(s, "decision", { value: "Resolved" });
  expect(readiness(s.matters[0]).ready).toBe(true);
  s = act(s, "actor", { value: "Daniel Foster · Associate" });
  expect(() => act(s, "approve")).toThrow();
});
test("draft changes and prerequisite revocation remove approval", () => {
  const approved = act(reviewedState(), "approve");
  const edited = act(approved, "draft", {
    value: "Changed working assertion.",
  });
  expect(edited.matters[0].approval).toBeNull();
  expect(edited.matters[0].issues[0].review).toBeNull();
  expect(
    act(approved, "control", { id: "policy" }).matters[0].approval,
  ).toBeNull();
});
test("imports distinguish unavailable, unspecified, stale, and matched references without legal verification", () => {
  const s = act(initialWorkspace(), "import", {
    provider: "Firm research team",
    text: "[N1 v3] [N2 v1] [N1] [M1 v1] [Z9 v1]",
  });
  expect(s.matters[0].imported.references.map((r) => r.result)).toEqual([
    "Reference matched · support not verified",
    "Outdated reference · current v2",
    "Version unspecified",
    "Source unavailable in this matter",
    "Source unavailable in this matter",
  ]);
  expect(s.matters[0].issues.every((i) => !i.review)).toBe(true);
  expect(act(s, "revision").matters[0].imported.outdated).toBe(true);
});
test("calendar target handles month boundaries, leap days, invalid dates and noninteger intervals", () => {
  expect(targetDate({ trigger: "2026-12-30", days: 3 })).toBe("2027-01-02");
  expect(targetDate({ trigger: "2028-02-28", days: 1 })).toBe("2028-02-29");
  expect(targetDate({ trigger: "2026-02-30", days: 1 })).toBeNull();
  expect(targetDate({ trigger: "2026-09-07", days: 1.5 })).toBeNull();
  const s = act(reviewedState(), "deadline", { field: "trigger", value: "" });
  expect(readiness(s.matters[0]).ready).toBe(false);
});
test("memo keeps qualifications and safely escapes user text", () => {
  const s = reviewedState();
  s.matters[0].draftEdits.N1 = '<script>alert("x")</script>';
  const html = exportMemorandum(s, s.matters[0]);
  expect(html).toContain("QUALIFIED SCOPE");
  expect(html).toContain("Excluded from reliance");
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>");
  expect(html).toContain("Partner approval outstanding");
});
test("local progress is restorable and malformed JSON falls back to fixtures", () => {
  const s = act(initialWorkspace(), "noteDraft", { value: note });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  expect(loadWorkspace().matters[0].issues[0].draftNote).toBe(note);
  localStorage.setItem(STORAGE_KEY, "invalid");
  expect(loadWorkspace().matters[0].issues[0].draftNote).toBe("");
  const broken = initialWorkspace();
  broken.matters[0].issues[0].notes = null;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(broken));
  expect(loadWorkspace().matters[0].issues[0].notes).toEqual([]);
});
