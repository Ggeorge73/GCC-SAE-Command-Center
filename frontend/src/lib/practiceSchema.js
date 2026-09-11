const text = (value) => typeof value === "string";
const fields = (record, keys) => keys.every((key) => text(record[key]));
export function validPractice(practice, matters) {
  if (practice === undefined) return true;
  if (!practice || typeof practice !== "object" || Array.isArray(practice)) return false;
  const schemas = {
    intakes: (r) => fields(r, ["id", "name", "client", "lead", "scope", "jurisdiction", "status", "parties", "conflictNote", "engagementNote"]),
    time: (r) => fields(r, ["matterId", "attorney", "narrative", "date", "status"]) && Number.isInteger(r.minutes) && Number.isInteger(r.rateCents),
    invoices: (r) => fields(r, ["matterId", "status", "reviewNote"]) && Number.isInteger(r.totalCents) && Array.isArray(r.lines) && r.lines.every((t) => fields(t, ["attorney", "narrative"]) && Number.isInteger(t.minutes) && Number.isInteger(t.rateCents)),
    communications: (r) => fields(r, ["matterId", "kind", "body", "status", "delivery"]),
    closings: (r) => fields(r, ["matterId", "residual", "retention", "distribution", "status"]),
    measurements: (r) => fields(r, ["matterId", "phase", "category", "note"]) && Number.isFinite(r.minutes),
    research: (r) => fields(r, ["matterId", "question", "jurisdiction", "status", "owner"]),
  };
  return Object.entries(schemas).every(([key, validate]) => Array.isArray(practice[key]) && new Set(practice[key].map((r) => r?.id)).size === practice[key].length && practice[key].every((r) => r && text(r.id) && validate(r) && (!r.matterId || matters.some((m) => m.id === r.matterId))));
}
