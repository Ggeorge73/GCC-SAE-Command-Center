const sections = ["issues", "drafts", "handoff", "activity", "value"];

export function readRoute() {
  const [path, query = ""] = window.location.hash.slice(1).split("?");
  const parts = (path || "/dashboard").split("/").filter(Boolean);
  if (parts[0] === "research")
    return { workspace: "workspace", page: "research" };
  if (parts[0] === "operations")
    return { workspace: "control", page: "operations" };
  if (parts[0] === "matters" && parts[1]) {
    return {
      workspace: "review",
      page: "detail",
      matterId: parts[1],
      section: sections.includes(parts[2]) ? parts[2] : "issues",
    };
  }
  if (parts[0] === "matters") {
    const params = new URLSearchParams(query);
    return {
      workspace: "review",
      page: "matters",
      practice: params.get("practice") || "All practices",
      status: params.get("status") || "All statuses",
    };
  }
  return { workspace: "review", page: "dashboard" };
}

export function navigateTo(path) {
  window.location.hash = path;
}

export function directoryPath({
  practice = "All practices",
  status = "All statuses",
} = {}) {
  const params = new URLSearchParams();
  if (practice !== "All practices") params.set("practice", practice);
  if (status !== "All statuses") params.set("status", status);
  return `/matters${params.size ? `?${params}` : ""}`;
}
