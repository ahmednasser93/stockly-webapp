import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import "./styles/modern-theme.css";
import "./styles/modern-components.css";
import App from "./App";
import { AuthProvider } from "./state/AuthContext";
import { SettingsProvider } from "./state/SettingsContext";
import { ThemeProvider } from "./state/ThemeContext";
import { GOOGLE_CLIENT_ID } from "./config/google-oauth";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
    </GoogleOAuthProvider>
  </StrictMode>
);
