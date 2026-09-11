import { useRecords, validateFeature } from "@/lib/localRecords";
import { ArrowUpRight, Check, FileText, Scale, Users } from "lucide-react";
import { navigateTo } from "@/lib/workspaceNavigation";
export const demoPeople = [
  ["Maya Chen", "Partner", "Corporate", "MC"],
  ["Daniel Foster", "Associate", "Litigation", "DF"],
  ["Priya Raman", "Research counsel", "Regulatory", "PR"],
  ["Alex Morgan", "Associate", "Corporate", "AM"],
  ["Jordan Lee", "Operations", "Firm management", "JL"],
];
export function Panel({
  title,
  subtitle,
  children,
  className = "",
  action,
  ...props
}) {
  return (
    <section className={`v-panel ${className}`} {...props}>
      {title && (
        <header className="v-panel-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
export function Button({ children, secondary = false, ...props }) {
  return (
    <button className={`v-button ${secondary ? "secondary" : ""}`} {...props}>
      {children}
    </button>
  );
}
export function LinkButton({ to, children, ...props }) {
  return (
    <Button onClick={() => navigateTo(to)} {...props}>
      {children}
      <ArrowUpRight size={14} />
    </Button>
  );
}
export function Badge({ children, tone = "blue" }) {
  return <span className={`v-badge ${tone}`}>{children}</span>;
}
export function Avatar({ name = "Maya Chen", large = false }) {
  return (
    <span className={`v-avatar ${large ? "large" : ""}`} aria-label={name}>
      {name
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
export function Avatars() {
  return (
    <span className="v-avatars">
      {demoPeople.slice(0, 3).map((p) => (
        <Avatar key={p[0]} name={p[0]} />
      ))}
    </span>
  );
}
export function Field({ label, ...props }) {
  return (
    <label className="v-field">
      <span>{label}</span>
      <input
        pattern={
          props.required &&
          (!props.type || props.type === "text" || props.type === "tel")
            ? ".*\\S.*"
            : undefined
        }
        maxLength={250}
        {...props}
      />
    </label>
  );
}
export function Switch({ label, checked, onChange }) {
  return (
    <label className="v-switch-label">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
export function Metric({ label, value, detail, Icon = FileText, onClick }) {
  const content = (
    <>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {detail && <small>{detail}</small>}
      </div>
      <span className="v-icon">
        <Icon size={21} />
      </span>
    </>
  );
  return onClick ? (
    <button
      className="v-panel v-metric"
      aria-label={`View ${label}`}
      onClick={onClick}
    >
      {content}
    </button>
  ) : (
    <article className="v-panel v-metric">{content}</article>
  );
}
export function ProfileStrip({ active = "profile" }) {
  return (
    <Panel className="v-profile-strip">
      <Avatar large />
      <div>
        <h1>Maya Chen</h1>
        <p>Partner · Corporate practice</p>
      </div>
      <nav aria-label="Profile pages">
        {[
          ["profile", "Overview", "/pages/profile/profile-overview"],
          ["teams", "Teams", "/pages/profile/teams"],
          ["projects", "Portfolios", "/pages/profile/all-projects"],
        ].map(([id, label, path]) => (
          <button
            key={id}
            aria-current={active === id ? "page" : undefined}
            onClick={() => navigateTo(path)}
          >
            {id === "profile" ? (
              <Scale size={16} />
            ) : id === "teams" ? (
              <Users size={16} />
            ) : (
              <FileText size={16} />
            )}{" "}
            {label}
          </button>
        ))}
      </nav>
    </Panel>
  );
}
export function DemoNotice() {
  return (
    <p className="v-demo-note">
      Fictional firm data · Browser-local demonstration
    </p>
  );
}
export function useLocal(key, initial) {
  return useRecords("law-suite-vision-" + key, initial, (value) =>
    validateFeature(key, value, initial),
  );
}
export function StatusMessage({ children }) {
  return children ? (
    <p className="v-status-message" role="status">
      <Check size={16} />
      {children}
    </p>
  ) : null;
}
