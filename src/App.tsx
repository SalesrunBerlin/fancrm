
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthGuard from "@/components/auth/AuthGuard";
import { SuperAdminRoute } from "@/components/auth/SuperAdminRoute";
import Layout from "@/components/layout/Layout";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "@/pages/Index";

// Lazy-loaded pages to improve initial load time
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const EmailConfirmPage = lazy(() => import('@/pages/auth/EmailConfirmPage'));
const InvitePage = lazy(() => import('@/pages/auth/InvitePage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const VisualizationPage = lazy(() => import('@/pages/VisualizationPage'));

// Admin pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const UserManagementPage = lazy(() => import('@/pages/admin/UserManagementPage'));
const UserDetailPage = lazy(() => import('@/pages/admin/UserDetailPage'));
const SessionsPage = lazy(() => import('@/pages/admin/SessionsPage'));
const SessionActivitiesPage = lazy(() => import('@/pages/admin/SessionActivitiesPage'));

// Object pages
const ObjectTypesListPage = lazy(() => import('@/pages/ObjectTypesListPage'));
const ObjectTypeDetailPage = lazy(() => import('@/pages/ObjectTypeDetailPage'));
const ObjectFieldsPage = lazy(() => import('@/pages/ObjectFieldsPage'));
const ObjectRecordsList = lazy(() => import('@/pages/ObjectRecordsList'));
const ObjectRecordDetailPage = lazy(() => import('@/pages/ObjectRecordDetailPage'));

// Action pages
const ActionsListPage = lazy(() => import('@/pages/ActionsListPage'));
const ActionDetailPage = lazy(() => import('@/pages/ActionDetailPage'));
const ActionNewPage = lazy(() => import('@/pages/ActionNewPage'));
const ActionExecutePage = lazy(() => import('@/pages/ActionExecutePage'));
const MassActionPage = lazy(() => import('@/pages/MassActionPage'));

// Report pages
const ReportsListPage = lazy(() => import('@/pages/reports/ReportsListPage'));
const ReportDetailPage = lazy(() => import('@/pages/reports/ReportDetailPage'));
const ReportNewPage = lazy(() => import('@/pages/reports/ReportNewPage'));

// Help pages
const HelpCenterPage = lazy(() => import('@/pages/HelpCenterPage'));
const HelpEditorPage = lazy(() => import('@/pages/admin/HelpEditorPage'));

// Public pages
const PublicFormPage = lazy(() => import('@/pages/public/PublicFormPage'));
const PublicRecordPage = lazy(() => import('@/pages/public/PublicRecordPage'));

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
                <Route path="/" element={<Index />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/auth">
                  <Route index element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="reset-password" element={<ResetPasswordPage />} />
                  <Route path="confirm" element={<EmailConfirmPage />} />
                </Route>
                <Route path="/invite/:token" element={<InvitePage />} />

                {/* Protected Routes */}
                <Route element={<AuthGuard />}>
                  <Route element={<Layout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/visualize" element={<VisualizationPage />} />
                    
                    {/* Object types routes */}
                    <Route path="/object-types">
                      <Route index element={<ObjectTypesListPage />} />
                      <Route path=":objectTypeId" element={<ObjectTypeDetailPage />} />
                      <Route path=":objectTypeId/fields" element={<ObjectFieldsPage />} />
                    </Route>
                    
                    {/* Objects routes */}
                    <Route path="/objects/:objectTypeId">
                      <Route index element={<MainLayout><ObjectRecordsList /></MainLayout>} />
                      <Route path=":recordId" element={<MainLayout><ObjectRecordDetailPage /></MainLayout>} />
                    </Route>
                    
                    {/* Actions routes */}
                    <Route path="/actions">
                      <Route index element={<MainLayout><ActionsListPage /></MainLayout>} />
                      <Route path="new" element={<MainLayout><ActionNewPage /></MainLayout>} />
                      <Route path=":actionId" element={<MainLayout><ActionDetailPage /></MainLayout>} />
                      <Route path="execute/:actionId" element={<MainLayout><ActionExecutePage /></MainLayout>} />
                      <Route path="execute/:actionId/from/:sourceRecordId" element={<MainLayout><ActionExecutePage /></MainLayout>} />
                      <Route path="mass/:actionId" element={<MainLayout><MassActionPage /></MainLayout>} />
                    </Route>
                    
                    {/* Reports routes */}
                    <Route path="/reports">
                      <Route index element={<MainLayout><ReportsListPage /></MainLayout>} />
                      <Route path="new" element={<MainLayout><ReportNewPage /></MainLayout>} />
                      <Route path=":reportId" element={<MainLayout><ReportDetailPage /></MainLayout>} />
                    </Route>
                    
                    {/* Help routes */}
                    <Route path="/help">
                      <Route index element={<HelpCenterPage />} />
                      <Route path=":tabId" element={<HelpCenterPage />} />
                      <Route path=":tabId/:sectionId" element={<HelpCenterPage />} />
                    </Route>
                    
                    {/* Admin routes */}
                    <Route path="/admin" element={<SuperAdminRoute><AdminDashboardPage /></SuperAdminRoute>} />
                    <Route path="/admin/users" element={<SuperAdminRoute><UserManagementPage /></SuperAdminRoute>} />
                    <Route path="/admin/users/:userId" element={<SuperAdminRoute><UserDetailPage /></SuperAdminRoute>} />
                    <Route path="/admin/sessions" element={<SuperAdminRoute><SessionsPage /></SuperAdminRoute>} />
                    <Route path="/admin/sessions/:sessionId" element={<SuperAdminRoute><SessionActivitiesPage /></SuperAdminRoute>} />
                    <Route path="/admin/help-editor" element={<SuperAdminRoute><HelpEditorPage /></SuperAdminRoute>} />
                  </Route>
                </Route>

                {/* Public routes */}
                <Route path="/public">
                  <Route path="form/:token" element={<PublicFormPage />} />
                  <Route path="record/:token" element={<PublicRecordPage />} />
                </Route>
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
