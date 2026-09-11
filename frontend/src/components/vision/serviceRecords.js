import { useLocal } from "./Glass";
export const defaultService = {
  id: "LS-S001",
  status: "Draft",
  name: "Acquisition diligence review",
  practice: "Corporate",
  fee: "4800",
  lead: "Maya Chen",
  scope:
    "Evidence mapping, consent exceptions, and a qualified internal memorandum.",
  materials: "Supply agreements, disclosure schedules, and closing checklist.",
};
export function useServices() {
  const [legacy, setLegacy, legacyError] = useLocal("service", defaultService);
  const [proposals, setProposals, error] = useLocal("proposals", []);
  const [selected, setSelected] = useLocal("selected-service", "LS-S001");
  const id =
    new URLSearchParams(window.location.hash.split("?")[1]).get("service") ||
    selected;
  const data = id === "LS-S001" ? legacy : proposals.find((p) => p.id === id);
  const update = (next) =>
    id === "LS-S001"
      ? setLegacy(next)
      : setProposals((all) => all.map((p) => (p.id === id ? next : p)));
  return {
    data,
    update,
    error: error || legacyError,
    proposals: [legacy, ...proposals],
    setProposals,
    setSelected,
  };
}
