import { initialWorkspace, validWorkspace } from "./matterWorkspace";
import { practiceChange, timeAmount } from "./practiceRecords";
import { editProjection, mergeRecords, validateFeature } from "./localRecords";
global.structuredClone = (value) => JSON.parse(JSON.stringify(value));
global.crypto = { randomUUID: () => `${Date.now()}-${Math.random()}` };

test("durable edit projections retain untouched records and replay inserts and deletes", () => {
  const base = {
    matters: [
      { id: "a", note: "" },
      { id: "b", note: "" },
    ],
    events: [{ id: "old" }],
  };
  const next = {
    ...base,
    matters: [{ id: "a", note: "Saved before refresh" }, base.matters[1]],
    events: [{ id: "new" }],
  };
  const [before, after] = editProjection(base, next);
  expect(before.matters).toHaveLength(1);
  expect(mergeRecords(before, after, base)).toEqual(next);
  expect(mergeRecords(before, after, next)).toEqual(next);
});

test("independent records merge, same field conflicts and related matter decisions stay atomic", () => {
  const base = {
    matters: [
      { id: "a", note: "", approval: null },
      { id: "b", note: "" },
    ],
  };
  const first = structuredClone(base),
    second = structuredClone(base);
  first.matters[0].note = "first";
  second.matters[1].note = "second";
  expect(mergeRecords(base, first, second).matters.map((m) => m.note)).toEqual([
    "first",
    "second",
  ]);
  second.matters[0].approval = { by: "reviewer" };
  expect(() => mergeRecords(base, first, second)).toThrow("Competing edits");
  expect(() =>
    mergeRecords({ note: "" }, { note: "a" }, { note: "b" }),
  ).toThrow();
  expect(
    mergeRecords(
      [{ id: "a" }],
      [{ id: "a" }, { id: "b" }],
      [{ id: "a" }, { id: "c" }],
    ),
  ).toHaveLength(3);
});
test("calendar schemas reject invalid dates, missing fields and duplicate identities", () => {
  const sample = [
    {
      id: "a",
      date: "2026-09-10",
      time: "09:00",
      title: "Event",
      practice: "Corporate",
    },
  ];
  expect(validateFeature("calendar", sample, sample)).toBe(true);
  for (const records of [
    { unexpected: true },
    [{ id: "x" }],
    [{ ...sample[0], date: "2026-02-30" }],
    [sample[0], sample[0]],
  ])
    expect(validateFeature("calendar", records, sample)).toBe(false);
});
test("intake keeps one identity and requires documented decisions before opening an unreviewed matter", () => {
  let s = initialWorkspace();
  const record = {
    id: "intake-1",
    name: "New matter",
    client: "Synthetic client",
    lead: "Maya",
    jurisdiction: "NY",
    scope: "Scope",
  };
  s = practiceChange(s, { type: "intake", record });
  expect(s.matters).toHaveLength(3);
  const review = {
    type: "intakeReview",
    id: record.id,
    parties: "Synthetic related parties",
    note: "Documented review of synthetic parties and terms",
  };
  expect(() =>
    practiceChange(s, { ...review, decision: "Open matter" }),
  ).toThrow("conflicts");
  s = practiceChange(s, { ...review, decision: "Conflicts reviewed" });
  s = practiceChange(s, { ...review, decision: "Open matter" });
  expect(s.matters).toHaveLength(4);
  expect(validWorkspace(s)).toBe(true);
  expect(s.matters[3].approval).toBeNull();
  expect(s.matters[3].issues[0].evidenceState).toBe("missing");
  expect(() =>
    practiceChange(s, { ...review, decision: "Open matter" }),
  ).toThrow("unopened");
});
test("billing rounds once to cents and cannot double bill time or mix matters", () => {
  let s = initialWorkspace();
  const record = {
    matterId: "LS-2401",
    attorney: "Maya",
    narrative: "Synthetic review",
    minutes: 7,
    rateCents: 35000,
    date: "2026-09-10",
  };
  expect(timeAmount(record)).toBe(4083);
  s = practiceChange(s, { type: "time", record });
  expect(() =>
    practiceChange(s, { type: "bill", matterId: "LS-2402" }),
  ).toThrow();
  s = practiceChange(s, { type: "bill", matterId: "LS-2401" });
  expect(s.practice.invoices[0].totalCents).toBe(4083);
  expect(() =>
    practiceChange(s, { type: "bill", matterId: "LS-2401" }),
  ).toThrow();
  s.practice.time[0].narrative = "Later edit";
  expect(s.practice.invoices[0].lines[0].narrative).toBe("Synthetic review");
});
test("client release and closing require supervision", () => {
  let s = initialWorkspace();
  s = practiceChange(s, {
    type: "communication",
    record: {
      matterId: "LS-2401",
      kind: "Proposed update",
      body: "Client-safe draft",
    },
  });
  s.actor = "Daniel Foster · Associate";
  expect(() =>
    practiceChange(s, {
      type: "approveUpdate",
      id: s.practice.communications[0].id,
      note: "Reviewed the client disclosure scope",
    }),
  ).toThrow("partner");
  expect(() =>
    practiceChange(s, {
      type: "close",
      record: {
        matterId: "LS-2401",
        residual: "None",
        retention: "Hold",
        distribution: "Not sent",
      },
    }),
  ).toThrow("approval");
});
