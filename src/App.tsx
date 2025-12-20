import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { SettingsPage } from "./pages/SettingsPage";
import { LoginPage } from "./pages/LoginPage";
import { UsernameSelectionPage } from "./pages/UsernameSelectionPage";
import { DocsPage } from "./pages/DocsPage";
import { StockDetailsPage } from "./pages/StockDetailsPage";
import { MonitoringPage } from "./pages/MonitoringPage";
import { UserDetailPage } from "./pages/UserDetailPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/username-selection" element={<UsernameSelectionPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/monitoring" element={<MonitoringPage />} />
        <Route path="/monitoring/users/:username" element={<UserDetailPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/stocks/:symbol" element={<StockDetailsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
