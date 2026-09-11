import { Component } from "react";
export default class RecoveryBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main
        style={{
          padding: 32,
          color: "#fff",
          background: "#111738",
          minHeight: "100vh",
        }}
      >
        <h1>This view could not open</h1>
        <p>
          Your browser records have not been deleted. Export them for recovery
          before resetting any feature.
        </p>
        <button
          onClick={() => {
            const records = {};
            for (const key of Object.keys(localStorage))
              if (key.startsWith("law-suite-"))
                records[key] = localStorage.getItem(key);
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(records, null, 2)], {
                type: "application/json",
              }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = "law-suite-recovery.json";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          Export recovery records
        </button>{" "}
        <a href="./" style={{ color: "#8ddcff" }}>
          Return to firm overview
        </a>
      </main>
    );
  }
}
