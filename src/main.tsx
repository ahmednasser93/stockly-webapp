import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./state/AuthContext";
import { SettingsProvider } from "./state/SettingsContext";
import { ThemeProvider } from "./state/ThemeContext";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
