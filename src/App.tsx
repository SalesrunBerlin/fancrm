
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Routes, Route, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import AuthGuard from "@/components/auth/AuthGuard";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import LandingPage from "@/pages/LandingPage";
import Auth from "@/pages/Auth";
import Settings from "@/pages/Settings";
import ObjectRecordsList from "@/pages/ObjectRecordsList";
import NotFound from "@/pages/NotFound";
import ObjectManager from "@/pages/ObjectManager";
import ActionExecutePage from "@/pages/ActionExecutePage";
import Structures from "@/pages/Structures";
import ReportsPage from "@/pages/ReportsPage";
import HelpPage from "@/pages/HelpPage";
import PublicActionPage from "@/pages/PublicActionPage";
import PublicRecordPage from "@/pages/PublicRecordPage";
import ActionsPage from "@/pages/ActionsPage";
import ApplicationsPage from "@/pages/ApplicationsPage";
import ObjectRecordDetail from "@/pages/ObjectRecordDetail";
import CreateRecordPage from "@/pages/CreateRecordPage";
import ImportRecordsPage from "@/pages/ImportRecordsPage";
import MassActionPage from "@/pages/MassActionPage";
import UserManagementPage from "@/pages/UserManagementPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import HelpContentEditor from "@/pages/admin/HelpContentEditor";
import UserDetailPage from "@/pages/admin/UserDetailPage";
import CreateObjectPage from "@/pages/CreateObjectPage";

// Setup an optimized React Query client with better cache control
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Use staleTime instead of cacheTime for better performance
      staleTime: 1000 * 60 * 5, // 5 minutes before data is considered stale
      gcTime: 1000 * 60 * 30,   // 30 minutes before unused data is garbage collected
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/public/action/:token" element={<PublicActionPage />} />
                <Route path="/public/record/:token/:recordId" element={<PublicRecordPage />} />
                
                {/* Protected routes with AuthGuard */}
                <Route element={<AuthGuard />}>
                  <Route element={<Layout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/applications" element={<ApplicationsPage />} />
                    <Route path="/actions" element={<ActionsPage />} />
                    <Route path="/structures" element={<Structures />} />
                    <Route path="/help" element={<HelpPage />} />
                    
                    {/* Object routes */}
                    <Route path="/objects/:objectTypeId" element={<ObjectRecordsList />} />
                    <Route path="/objects/:objectTypeId/records/:recordId" element={<ObjectRecordDetail />} />
                    {/* Add support for the URL format without 'records' in the path */}
                    <Route path="/objects/:objectTypeId/:recordId" element={<ObjectRecordDetail />} />
                    <Route path="/objects/:objectTypeId/new" element={<CreateRecordPage />} />
                    <Route path="/objects/:objectTypeId/import" element={<ImportRecordsPage />} />
                    
                    {/* Action routes */}
                    <Route path="/actions/execute/:actionId" element={<ActionExecutePage />} />
                    <Route path="/actions/execute/:actionId/from/:recordId" element={<ActionExecutePage />} />
                    <Route path="/actions/mass/:actionId" element={<MassActionPage />} />
                    
                    {/* Settings routes */}
                    <Route path="/settings/object-manager" element={<ObjectManager />} />
                    <Route path="/settings/object-manager/new" element={<CreateObjectPage />} />
                    <Route path="/settings/user-management" element={<UserManagementPage />} />
                    
                    {/* Admin routes */}
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/help-content" element={<HelpContentEditor />} />
                    <Route path="/admin/users" element={<UserDetailPage />} />
                  </Route>
                </Route>

                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </ThemeProvider>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
