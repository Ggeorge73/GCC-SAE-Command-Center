import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import RecoveryBoundary from "@/components/vision/RecoveryBoundary";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <RecoveryBoundary>
      <App />
    </RecoveryBoundary>
  </React.StrictMode>,
);
