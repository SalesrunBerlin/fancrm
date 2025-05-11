import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner"; 
import { Layout } from "@/components/layout/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import ObjectManager from "@/pages/ObjectManager";
import Structures from "@/pages/Structures";
import ObjectRecordsList from "@/pages/ObjectRecordsList";
import ObjectRecordDetail from "@/pages/ObjectRecordDetail";
import ObjectTypeDetail from "@/pages/ObjectTypeDetail";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SuperAdminRoute } from "@/components/auth/SuperAdminRoute";
import ObjectFieldEditPage from "@/pages/ObjectFieldEditPage";
import CreateRecordPage from "@/pages/CreateRecordPage";
import EditRecordPage from "@/pages/EditRecordPage";
import CreateObjectPage from "@/pages/CreateObjectPage";
import ImportRecordsPage from "@/pages/ImportRecordsPage";
import CreateFieldPage from "@/pages/CreateFieldPage";
import ImportCreateFieldPage from "@/pages/ImportCreateFieldPage";
import ObjectDeletePage from "@/pages/ObjectDeletePage";
import ObjectArchivePage from "@/pages/ObjectArchivePage";
import ObjectRestorePage from "@/pages/ObjectRestorePage";
import ApplicationsPage from "@/pages/ApplicationsPage";
import ApplicationDetailPage from "@/pages/ApplicationDetailPage";
import ApplicationObjectsPage from "@/pages/ApplicationObjectsPage";
import ApplicationPublishSettingsPage from "@/pages/ApplicationPublishSettingsPage";
import ApplicationPublishPage from "@/pages/ApplicationPublishPage";
import ApplicationImportPage from "@/pages/ApplicationImportPage";
import CreateObjectFromFieldValuesPage from "@/pages/CreateObjectFromFieldValuesPage";
import ActionsPage from "./pages/ActionsPage";
import ActionCreatePage from "./pages/ActionCreatePage";
import ActionDetailPage from "./pages/ActionDetailPage";
import ActionExecutePage from "./pages/ActionExecutePage";
import MassActionPage from "./pages/MassActionPage";
import ProfilePage from "./pages/ProfilePage";
import HelpPage from "./pages/HelpPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import HelpContentEditor from "./pages/admin/HelpContentEditor";
import HelpTabsManager from "./pages/admin/HelpTabsManager";
import HelpTabContentEditor from "./pages/admin/HelpTabContentEditor";
import UserManagementPage from "./pages/admin/UserManagementPage";
import UserDetailPage from "./pages/admin/UserDetailPage";
import PublicActionPage from "./pages/PublicActionPage";
import PublicRecordPage from "./pages/PublicRecordPage";
import ReportsPage from "./pages/ReportsPage";
import ReportViewPage from "./pages/ReportViewPage";
import IconUploadPage from "./pages/IconUploadPage";
import IconEditPage from "./pages/IconEditPage";
import IconEditorPage from "./pages/IconEditorPage";
import AdminWorkspacePage from "./pages/admin/AdminWorkspacePage";
import SettingsUserManagementPage from "./pages/UserManagementPage";
import TicketQueuePage from "./pages/TicketQueuePage";
import TicketProcessorPage from "./pages/TicketProcessorPage";
import AutoTicketProcessorPage from "./pages/AutoTicketProcessorPage";
import TicketAnalysisPage from "./pages/TicketAnalysisPage";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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

  // Log to help debug SuperAdmin routes
  console.log("Current location:", location.pathname, "isSuperAdmin:", isSuperAdmin);

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
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/settings/object-manager" element={<ObjectManager />} />
        <Route path="/settings/object-manager/new" element={<CreateObjectPage />} />
        <Route path="/settings/user-management" element={<SettingsUserManagementPage />} />
        <Route path="/settings/objects/:objectTypeId" element={<ObjectTypeDetail />} />
        <Route path="/settings/objects/:objectTypeId/archive" element={<ObjectArchivePage />} />
        <Route path="/settings/objects/:objectTypeId/restore" element={<ObjectRestorePage />} />
        <Route path="/settings/objects/:objectTypeId/fields/new" element={<CreateFieldPage />} />
        <Route path="/settings/objects/:objectTypeId/fields/:fieldId/edit" element={<ObjectFieldEditPage />} />
        <Route path="/structures/*" element={<Structures />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/applications/:applicationId" element={<ApplicationDetailPage />} />
        <Route path="/applications/:applicationId/objects" element={<ApplicationObjectsPage />} />
        <Route path="/applications/:applicationId/publish-settings" element={<ApplicationPublishSettingsPage />} />
        <Route path="/applications/:applicationId/publish" element={<ApplicationPublishPage />} />
        <Route path="/applications/import" element={<ApplicationImportPage />} />
        <Route path="/objects/:objectTypeId" element={<ObjectRecordsList />} />
        <Route path="/objects/:objectTypeId/import" element={<ImportRecordsPage />} />
        <Route path="/objects/:objectTypeId/import/create-field/:columnName" element={<ImportCreateFieldPage />} />
        <Route path="/objects/:objectTypeId/create-object-from-field/:fieldApiName/:fieldName" element={<CreateObjectFromFieldValuesPage />} />
        <Route path="/objects/:objectTypeId/new" element={<CreateRecordPage />} />
        <Route path="/objects/:objectTypeId/:recordId" element={<ObjectRecordDetail />} />
        <Route path="/objects/:objectTypeId/:recordId/edit" element={<EditRecordPage />} />
        
        {/* Ticket Queue routes */}
        <Route path="/ticket-queue" element={<TicketQueuePage />} />
        <Route path="/process-ticket" element={<TicketProcessorPage />} />
        <Route path="/auto-process-ticket" element={<AutoTicketProcessorPage />} />
        <Route path="/ticket-analysis" element={<TicketAnalysisPage />} />
        <Route path="/ticket-analysis/:ticketCount" element={<TicketAnalysisPage />} />
        
        {/* Report routes */}
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:reportId" element={<ReportViewPage />} />
        
        {/* Actions routes */}
        <Route path="/actions" element={<ActionsPage />} />
        <Route path="/actions/new" element={<ActionCreatePage />} />
        <Route path="/actions/:actionId" element={<ActionDetailPage />} />
        <Route path="/actions/execute/:actionId" element={<ActionExecutePage />} />
        <Route path="/actions/execute/:actionId/from/:sourceRecordId" element={<ActionExecutePage />} />
        <Route path="/actions/mass/:actionId" element={<MassActionPage />} />
        
        {/* Admin routes - only accessible to SuperAdmin users */}
        <Route path="/admin" element={<SuperAdminRoute><AdminDashboard /></SuperAdminRoute>} />
        <Route path="/admin/help-content" element={<SuperAdminRoute><HelpContentEditor /></SuperAdminRoute>} />
        <Route path="/admin/help-tabs" element={<SuperAdminRoute><HelpTabsManager /></SuperAdminRoute>} />
        <Route path="/admin/help-content/:tabId" element={<SuperAdminRoute><HelpTabContentEditor /></SuperAdminRoute>} />
        <Route path="/admin/users" element={<SuperAdminRoute><UserManagementPage /></SuperAdminRoute>} />
        <Route path="/admin/users/:userId" element={<SuperAdminRoute><UserDetailPage /></SuperAdminRoute>} />
        <Route path="/admin/workspace" element={<SuperAdminRoute><AdminWorkspacePage /></SuperAdminRoute>} />
        <Route path="/admin/workspace/:workspaceId" element={<SuperAdminRoute><AdminWorkspacePage /></SuperAdminRoute>} />
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
