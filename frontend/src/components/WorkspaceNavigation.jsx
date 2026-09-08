import {
  ArrowUpRight,
  Building2,
  Briefcase,
  LayoutDashboard,
  Menu,
  Scale,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { navigateTo } from "@/lib/workspaceNavigation";

export default function WorkspaceNavigation({ route }) {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [route]);
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);
  const go = (path) => {
    setOpen(false);
    navigateTo(path);
  };
  return (
    <>
      <button
        className="workspace-menu-button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="workspace-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <button
          className="workspace-nav-backdrop"
          aria-label="Close navigation overlay"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        id="workspace-navigation"
        className={`workspace-navigation ${open ? "is-open" : ""}`}
      >
        <button
          className="workspace-brand"
          onClick={() => go("/dashboard")}
          aria-label="Law Suite dashboard"
        >
          <Scale size={25} />
          <span>
            LAW SUITE<small>LEGAL INTELLIGENCE</small>
          </span>
        </button>
        <div className="workspace-nav-label">YOUR WORKSPACE</div>
        <nav aria-label="Law Suite sections">
          {[
            ["dashboard", "Dashboard", "/dashboard", LayoutDashboard],
            ["matters", "Matter Review", "/matters", Briefcase],
            ["research", "Research & Documents", "/research", Search],
          ].map(([page, label, path, Icon], index) => (
            <button
              key={page}
              aria-current={
                route.page === page ||
                (page === "matters" && route.page === "detail")
                  ? "page"
                  : undefined
              }
              onClick={() => go(path)}
            >
              <Icon size={17} />
              <span>{label}</span>
              <small aria-hidden="true">0{index + 1}</small>
            </button>
          ))}
          <div className="workspace-nav-label">FIRM MANAGEMENT</div>
          <details
            className="workspace-administration"
            open={route.page === "operations" || undefined}
          >
            <summary>
              <Building2 size={17} />
              Administration
            </summary>
            <button
              aria-current={route.page === "operations" ? "page" : undefined}
              onClick={() => go("/operations")}
            >
              Firm Operations <ArrowUpRight size={14} />
            </button>
          </details>
        </nav>
        <div className="workspace-nav-footer">
          <ShieldCheck size={19} />
          <strong>
            Evidence. Judgment.
            <br />
            Forward.
          </strong>
          <p>
            Demo workspace
            <br />
            Fictional matters · Local progress
          </p>
        </div>
      </aside>
    </>
  );
}
