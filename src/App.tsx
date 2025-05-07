
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
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
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SuperAdminRoute } from "./components/auth/SuperAdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagementPage from "./pages/admin/UserManagementPage";
import UserDetailPage from "./pages/admin/UserDetailPage";
import HelpContentEditor from "./pages/admin/HelpContentEditor";
import HelpPage from "./pages/HelpPage";
import NotFound from "./pages/NotFound";
import { Toaster } from "./components/ui/toaster";

function AppRouter() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth routes - outside of layout */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/register" element={<Navigate to="/auth" replace />} />
          <Route path="/forgot-password" element={<Navigate to="/auth" replace />} />
          <Route path="/reset-password/:token" element={<Auth />} />
          
          {/* Default route - redirect to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected routes - inside layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard and settings */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/profile" element={<div>Profile Page (Coming Soon)</div>} />
            
            {/* Object Types routes */}
            <Route path="/objects" element={<ObjectTypesPage />} />
            <Route path="/objects/:objectTypeId" element={<ObjectTypeViewPage />} />
            <Route path="/objects/:objectTypeId/edit" element={<ObjectTypeEditPage />} />
            
            {/* Object Records routes */}
            <Route path="/objects/:objectTypeId/records" element={<ObjectRecordsPage />} />
            <Route path="/objects/:objectTypeId/records/:recordId" element={<ObjectRecordViewPage />} />
            <Route path="/objects/:objectTypeId/records/:recordId/edit" element={<ObjectRecordEditPage />} />
            
            {/* Reports routes */}
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/example" element={<ReportExamplePage />} />
            <Route path="/reports/:reportId" element={<ReportViewPage />} />
            
            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <SuperAdminRoute>
                  <AdminDashboard />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <SuperAdminRoute>
                  <UserManagementPage />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/admin/users/:userId"
              element={
                <SuperAdminRoute>
                  <UserDetailPage />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/admin/help"
              element={
                <SuperAdminRoute>
                  <HelpContentEditor />
                </SuperAdminRoute>
              }
            />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default AppRouter;
