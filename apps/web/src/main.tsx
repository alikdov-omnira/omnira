import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./app.js";
import "./style.css";
import "./construction-assistant.css";
import "./public-experience.css";
import "./public-controls.css";
import "./omniro-stage.css";
import "./omniro-command-center.css";
import "./omniro-operating-environment.css";
import "./omniro-director-workspace.css";
import "./omniro-accountant-workspace.css";
import "./omniro-project-manager-workspace.css";
import "./omniro-site-manager-workspace.css";
import "./omniro-worker-workspace.css";
import "./omniro-client-workspace.css";
import "./omniro-ai-secretary.css";
import "./omniro-communication-center.css";

const queryClient = new QueryClient();
createRoot(document.getElementById("root")!).render(<StrictMode><QueryClientProvider client={queryClient}><App /></QueryClientProvider></StrictMode>);

if("serviceWorker"in navigator&&import.meta.env.PROD)window.addEventListener("load",()=>void navigator.serviceWorker.register("/sw.js"));
