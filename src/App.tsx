
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner"; 
import { Layout } from "@/components/layout/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SuperAdminRoute } from "@/components/auth/SuperAdminRoute";
import { lazy, Suspense } from "react";

// Import frequently used pages directly
import Auth from "@/pages/Auth";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import Dashboard from "@/pages/Dashboard";

// Lazy load less frequently used pages
const Settings = lazy(() => import("@/pages/Settings"));
const ObjectManager = lazy(() => import("@/pages/ObjectManager"));
const Structures = lazy(() => import("@/pages/Structures"));
const ObjectRecordsList = lazy(() => import("@/pages/ObjectRecordsList"));
const ObjectRecordDetail = lazy(() => import("@/pages/ObjectRecordDetail"));
const ObjectTypeDetail = lazy(() => import("@/pages/ObjectTypeDetail"));
const ObjectFieldEditPage = lazy(() => import("@/pages/ObjectFieldEditPage"));
const CreateRecordPage = lazy(() => import("@/pages/CreateRecordPage"));
const EditRecordPage = lazy(() => import("@/pages/EditRecordPage"));
const CreateObjectPage = lazy(() => import("@/pages/CreateObjectPage"));
const ImportRecordsPage = lazy(() => import("@/pages/ImportRecordsPage"));
const CreateFieldPage = lazy(() => import("@/pages/CreateFieldPage"));
const ImportCreateFieldPage = lazy(() => import("@/pages/ImportCreateFieldPage"));
const ObjectDeletePage = lazy(() => import("@/pages/ObjectDeletePage"));
const ObjectArchivePage = lazy(() => import("@/pages/ObjectArchivePage"));
const ObjectRestorePage = lazy(() => import("@/pages/ObjectRestorePage"));
const ApplicationsPage = lazy(() => import("@/pages/ApplicationsPage"));
const ApplicationDetailPage = lazy(() => import("@/pages/ApplicationDetailPage"));
const ApplicationObjectsPage = lazy(() => import("@/pages/ApplicationObjectsPage"));
const ApplicationPublishSettingsPage = lazy(() => import("@/pages/ApplicationPublishSettingsPage"));
const ApplicationPublishPage = lazy(() => import("@/pages/ApplicationPublishPage"));
const ApplicationImportPage = lazy(() => import("@/pages/ApplicationImportPage"));
const CreateObjectFromFieldValuesPage = lazy(() => import("@/pages/CreateObjectFromFieldValuesPage"));
const ActionsPage = lazy(() => import("./pages/ActionsPage"));
const ActionCreatePage = lazy(() => import("./pages/ActionCreatePage"));
const ActionDetailPage = lazy(() => import("./pages/ActionDetailPage"));
const ActionExecutePage = lazy(() => import("./pages/ActionExecutePage"));
const MassActionPage = lazy(() => import("./pages/MassActionPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const HelpContentEditor = lazy(() => import("./pages/admin/HelpContentEditor"));
const HelpTabsManager = lazy(() => import("./pages/admin/HelpTabsManager"));
const HelpTabContentEditor = lazy(() => import("./pages/admin/HelpTabContentEditor"));
const UserManagementPage = lazy(() => import("./pages/admin/UserManagementPage"));
const UserDetailPage = lazy(() => import("./pages/admin/UserDetailPage"));
const UserAnalyticsPage = lazy(() => import("./pages/admin/UserAnalyticsPage"));
const SessionActivitiesPage = lazy(() => import("./pages/admin/SessionActivitiesPage"));
const UserSessionsPage = lazy(() => import("./pages/admin/UserSessionsPage"));
const PublicActionPage = lazy(() => import("./pages/PublicActionPage"));
const PublicRecordPage = lazy(() => import("./pages/PublicRecordPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const ReportViewPage = lazy(() => import("./pages/ReportViewPage"));
const IconUploadPage = lazy(() => import("./pages/IconUploadPage"));
const IconEditPage = lazy(() => import("./pages/IconEditPage"));
const IconEditorPage = lazy(() => import("./pages/IconEditorPage"));
const AdminWorkspacePage = lazy(() => import("./pages/admin/AdminWorkspacePage"));
const SettingsUserManagementPage = lazy(() => import("./pages/UserManagementPage"));
const TicketQueuePage = lazy(() => import("./pages/TicketQueuePage"));
const TicketProcessorPage = lazy(() => import("./pages/TicketProcessorPage"));
const AutoTicketProcessorPage = lazy(() => import("./pages/AutoTicketProcessorPage"));
const TicketAnalysisPage = lazy(() => import("./pages/TicketAnalysisPage"));

// Create a client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
      cacheTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppContent />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { isLoggedIn, isSuperAdmin, isLoading } = useAuth();
  const location = useLocation();

  // Function to determine if the current route requires authentication
  const requiresAuth = (pathname) => {
    const publicRoutes = [
      '/',
      '/landing',
      '/auth',
      '/public-action/:token',
      '/public-record/:token/:recordId'
    ];

    // Check if the current pathname matches exactly any public route
    if (publicRoutes.includes(pathname)) {
      return false;
    }

    // Check if the current pathname starts with any of the public routes
    const isPublic = publicRoutes.some((route) => {
      const regex = new RegExp(`^${route.replace(/:\w+/g, '[^/]+')}$`);
      return regex.test(pathname);
    });

    return !isPublic;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const currentPathRequiresAuth = requiresAuth(location.pathname);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/auth" element={!isLoggedIn ? <Auth /> : <Navigate to="/" />} />
      <Route path="/auth/:workspaceId" element={!isLoggedIn ? <Auth /> : <Navigate to="/" />} />
      
      {/* Public routes for accessing shared content */}
      <Route path="/public-action/:token" element={<PublicActionPage />} />
      <Route path="/public-record/:token/:recordId" element={<PublicRecordPage />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={
          <Suspense fallback={<PageLoader />}>
            <Settings />
          </Suspense>
        } />
        <Route path="/profile" element={
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        } />
        <Route path="/help" element={
          <Suspense fallback={<PageLoader />}>
            <HelpPage />
          </Suspense>
        } />
        <Route path="/settings/object-manager" element={
          <Suspense fallback={<PageLoader />}>
            <ObjectManager />
          </Suspense>
        } />
        <Route path="/settings/object-manager/new" element={
          <Suspense fallback={<PageLoader />}>
            <CreateObjectPage />
          </Suspense>
        } />
        <Route path="/settings/user-management" element={
          <Suspense fallback={<PageLoader />}>
            <SettingsUserManagementPage />
          </Suspense>
        } />
        <Route path="/settings/objects/:objectTypeId" element={
          <Suspense fallback={<PageLoader />}>
            <ObjectTypeDetail />
          </Suspense>
        } />
        <Route path="/settings/objects/:objectTypeId/archive" element={
          <Suspense fallback={<PageLoader />}>
            <ObjectArchivePage />
          </Suspense>
        } />
        <Route path="/settings/objects/:objectTypeId/restore" element={
          <Suspense fallback={<PageLoader />}>
            <ObjectRestorePage />
          </Suspense>
        } />
        <Route path="/settings/objects/:objectTypeId/fields/new" element={
          <Suspense fallback={<PageLoader />}>
            <CreateFieldPage />
          </Suspense>
        } />
        <Route path="/settings/objects/:objectTypeId/fields/:fieldId/edit" element={
          <Suspense fallback={<PageLoader />}>
            <ObjectFieldEditPage />
          </Suspense>
        } />
        <Route path="/structures/*" element={
          <Suspense fallback={<PageLoader />}>
            <Structures />
          </Suspense>
        } />
        <Route path="/applications" element={
          <Suspense fallback={<PageLoader />}>
            <ApplicationsPage />
          </Suspense>
        } />
        <Route path="/applications/:applicationId" element={
          <Suspense fallback={<PageLoader />}>
            <ApplicationDetailPage />
          </Suspense>
        } />
        <Route path="/applications/:applicationId/objects" element={
          <Suspense fallback={<PageLoader />}>
            <ApplicationObjectsPage />
          </Suspense>
        } />
        <Route path="/applications/:applicationId/publish-settings" element={
          <Suspense fallback={<PageLoader />}>
            <ApplicationPublishSettingsPage />
          </Suspense>
        } />
        <Route path="/applications/:applicationId/publish" element={
          <Suspense fallback={<PageLoader />}>
            <ApplicationPublishPage />
          </Suspense>
        } />
        <Route path="/applications/import" element={
          <Suspense fallback={<PageLoader />}>
            <ApplicationImportPage />
          </Suspense>
        } />
        <Route path="/objects/:objectTypeId" element={
          <Suspense fallback={<PageLoader />}>
            <ObjectRecordsList />
          </Suspense>
        } />
        <Route path="/objects/:objectTypeId/import" element={
          <Suspense fallback={<PageLoader />}>
            <ImportRecordsPage />
          </Suspense>
        } />
        <Route path="/objects/:objectTypeId/import/create-field/:columnName" element={
          <Suspense fallback={<PageLoader />}>
            <ImportCreateFieldPage />
          </Suspense>
        } />
        <Route path="/objects/:objectTypeId/create-object-from-field/:fieldApiName/:fieldName" element={
          <Suspense fallback={<PageLoader />}>
            <CreateObjectFromFieldValuesPage />
          </Suspense>
        } />
        <Route path="/objects/:objectTypeId/new" element={
          <Suspense fallback={<PageLoader />}>
            <CreateRecordPage />
          </Suspense>
        } />
        <Route path="/objects/:objectTypeId/:recordId" element={
          <Suspense fallback={<PageLoader />}>
            <ObjectRecordDetail />
          </Suspense>
        } />
        <Route path="/objects/:objectTypeId/:recordId/edit" element={
          <Suspense fallback={<PageLoader />}>
            <EditRecordPage />
          </Suspense>
        } />
        
        {/* Ticket Queue routes */}
        <Route path="/ticket-queue" element={
          <Suspense fallback={<PageLoader />}>
            <TicketQueuePage />
          </Suspense>
        } />
        <Route path="/process-ticket" element={
          <Suspense fallback={<PageLoader />}>
            <TicketProcessorPage />
          </Suspense>
        } />
        <Route path="/auto-process-ticket" element={
          <Suspense fallback={<PageLoader />}>
            <AutoTicketProcessorPage />
          </Suspense>
        } />
        <Route path="/ticket-analysis" element={
          <Suspense fallback={<PageLoader />}>
            <TicketAnalysisPage />
          </Suspense>
        } />
        <Route path="/ticket-analysis/:ticketCount" element={
          <Suspense fallback={<PageLoader />}>
            <TicketAnalysisPage />
          </Suspense>
        } />
        
        {/* Report routes */}
        <Route path="/reports" element={
          <Suspense fallback={<PageLoader />}>
            <ReportsPage />
          </Suspense>
        } />
        <Route path="/reports/:reportId" element={
          <Suspense fallback={<PageLoader />}>
            <ReportViewPage />
          </Suspense>
        } />
        
        {/* Actions routes */}
        <Route path="/actions" element={
          <Suspense fallback={<PageLoader />}>
            <ActionsPage />
          </Suspense>
        } />
        <Route path="/actions/new" element={
          <Suspense fallback={<PageLoader />}>
            <ActionCreatePage />
          </Suspense>
        } />
        <Route path="/actions/:actionId" element={
          <Suspense fallback={<PageLoader />}>
            <ActionDetailPage />
          </Suspense>
        } />
        <Route path="/actions/execute/:actionId" element={
          <Suspense fallback={<PageLoader />}>
            <ActionExecutePage />
          </Suspense>
        } />
        <Route path="/actions/execute/:actionId/from/:sourceRecordId" element={
          <Suspense fallback={<PageLoader />}>
            <ActionExecutePage />
          </Suspense>
        } />
        <Route path="/actions/mass/:actionId" element={
          <Suspense fallback={<PageLoader />}>
            <MassActionPage />
          </Suspense>
        } />
        
        {/* Admin routes - only accessible to SuperAdmin users */}
        <Route path="/admin" element={
          <Suspense fallback={<PageLoader />}>
            <SuperAdminRoute>
              <AdminDashboard />
            </SuperAdminRoute>
          </Suspense>
        } />
        <Route path="/admin/help-content" element={
          <Suspense fallback={<PageLoader />}>
            <SuperAdminRoute>
              <HelpContentEditor />
            </SuperAdminRoute>
          </Suspense>
        } />
        <Route path="/admin/help-tabs" element={
          <Suspense fallback={<PageLoader />}>
            <SuperAdminRoute>
              <HelpTabsManager />
            </SuperAdminRoute>
          </Suspense>
        } />
        <Route path="/admin/help-content/:tabId" element={
          <Suspense fallback={<PageLoader />}>
            <SuperAdminRoute>
              <HelpTabContentEditor />
            </SuperAdminRoute>
          </Suspense>
        } />
        <Route path="/admin/users" element={
          <Suspense fallback={<PageLoader />}>
            <SuperAdminRoute>
              <UserManagementPage />
            </SuperAdminRoute>
          </Suspense>
        } />
        <Route path="/admin/users/:userId" element={
          <Suspense fallback={<PageLoader />}>
            <SuperAdminRoute>
              <UserDetailPage />
            </SuperAdminRoute>
          </Suspense>
        } />
        <Route path="/admin/analytics" element={
          <Suspense fallback={<PageLoader />}>
            <SuperAdminRoute>
              <UserAnalyticsPage />
            </SuperAdminRoute>
          </Suspense>
        } />
        <Route path="/admin/users/sessions/:userId" element={
          <Suspense fallback={<PageLoader />}>
            <SuperAdminRoute>
              <UserSessionsPage />
            </SuperAdminRoute>
          </Suspense>
        } />
        <Route path="/admin/sessions/:sessionId/activities" element={
          <Suspense fallback={<PageLoader />}>
            <SuperAdminRoute>
              <SessionActivitiesPage />
            </SuperAdminRoute>
          </Suspense>
        } />
        <Route path="/admin/workspace" element={
          <Suspense fallback={<PageLoader />}>
            <SuperAdminRoute>
              <AdminWorkspacePage />
            </SuperAdminRoute>
          </Suspense>
        } />
        <Route path="/admin/workspace/:workspaceId" element={
          <Suspense fallback={<PageLoader />}>
            <SuperAdminRoute>
              <AdminWorkspacePage />
            </SuperAdminRoute>
          </Suspense>
        } />
      </Route>
      
      {/* Catch-all route for non-existent pages */}
      <Route path="*" element={
        currentPathRequiresAuth ? 
          <Navigate to="/auth" state={{ from: location }} /> : 
          <div className="flex items-center justify-center h-screen">Page not found</div>
      } />
    </Routes>
  );
}

export default App;
