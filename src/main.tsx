import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { startSimulation } from "./store";

// Arranca la simulación de telemetría del brazalete (ritmo cardíaco, batería, etc.)
startSimulation();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
