
import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Auth from "./pages/Auth";
import DashboardPage from "./pages/Dashboard";
import SettingsPage from "./pages/Settings";
import ObjectTypesPage from "./pages/ObjectManager";
import ObjectTypeViewPage from "./pages/ObjectTypeDetail";
import ObjectTypeEditPage from "./pages/ObjectTypeDetail";
import ObjectRecordsPage from "./pages/ObjectRecordsList";
import ObjectRecordViewPage from "./pages/ObjectRecordDetail";
import ObjectRecordEditPage from "./pages/EditRecordPage";
import ReportsPage from "./pages/ReportsPage";
import ReportViewPage from "./pages/ReportViewPage";
import ReportExamplePage from "./pages/ReportExamplePage";

function AppRouter() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      
      {/* Main app routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Object Types routes */}
      <Route
        path="/objects"
        element={
          <ProtectedRoute>
            <ObjectTypesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/objects/:objectTypeId"
        element={
          <ProtectedRoute>
            <ObjectTypeViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/objects/:objectTypeId/edit"
        element={
          <ProtectedRoute>
            <ObjectTypeEditPage />
          </ProtectedRoute>
        }
      />

      {/* Object Records routes */}
      <Route
        path="/objects/:objectTypeId/records"
        element={
          <ProtectedRoute>
            <ObjectRecordsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/objects/:objectTypeId/records/:recordId"
        element={
          <ProtectedRoute>
            <ObjectRecordViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/objects/:objectTypeId/records/:recordId/edit"
        element={
          <ProtectedRoute>
            <ObjectRecordEditPage />
          </ProtectedRoute>
        }
      />

      {/* Reports routes */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/example"
        element={
          <ProtectedRoute>
            <ReportExamplePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/new"
        element={
          <ProtectedRoute>
            <Navigate to="/reports?create=true" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/:reportId"
        element={
          <ProtectedRoute>
            <ReportViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/:reportId/edit"
        element={
          <ProtectedRoute>
            <ReportEditWrapper />
          </ProtectedRoute>
        }
      />
      
      {/* Redirect from login to auth */}
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/register" element={<Navigate to="/auth" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/auth" replace />} />
      <Route path="/reset-password/:token" element={<Auth />} />
    </Routes>
  );
}

function ReportEditWrapper() {
  const match = useParams();
  return (
    <ProtectedRoute>
      <Navigate to={`/reports?edit=${match.reportId}`} replace />
    </ProtectedRoute>
  );
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!session && !isLoading) {
      console.log("No session, redirecting to login");
    }
  }, [session, isLoading, location]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
}

export default AppRouter;
