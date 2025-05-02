import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner"; // Use sonner's Toaster, not the custom one
import { Layout } from "@/components/layout/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
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
import ObjectFieldEditPage from "@/pages/ObjectFieldEditPage";
import CreateRecordPage from "@/pages/CreateRecordPage";
import EditRecordPage from "@/pages/EditRecordPage";
import CreateObjectPage from "@/pages/CreateObjectPage";
import ImportRecordsPage from "@/pages/ImportRecordsPage";
import CreateFieldPage from "@/pages/CreateFieldPage";
import ImportCreateFieldPage from "./pages/ImportCreateFieldPage";
import ObjectDeletePage from "@/pages/ObjectDeletePage";
import ObjectArchivePage from "@/pages/ObjectArchivePage";
import ObjectRestorePage from "@/pages/ObjectRestorePage";
import ApplicationsPage from "@/pages/ApplicationsPage";
import ApplicationDetailPage from "@/pages/ApplicationDetailPage";
import ApplicationObjectsPage from "@/pages/ApplicationObjectsPage";
import CreateObjectFromFieldValuesPage from "@/pages/CreateObjectFromFieldValuesPage";

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
          <Routes>
            <Route path="/auth" element={<Auth />} />
            
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/object-manager" element={<ObjectManager />} />
              <Route path="/settings/object-manager/new" element={<CreateObjectPage />} />
              <Route path="/settings/objects/:objectTypeId" element={<ObjectTypeDetail />} />
              <Route path="/settings/objects/:objectTypeId/archive" element={<ObjectArchivePage />} />
              <Route path="/settings/objects/:objectTypeId/restore" element={<ObjectRestorePage />} />
              <Route path="/settings/objects/:objectTypeId/fields/new" element={<CreateFieldPage />} />
              <Route path="/settings/objects/:objectTypeId/fields/:fieldId/edit" element={<ObjectFieldEditPage />} />
              <Route path="/structures/*" element={<Structures />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/applications/:applicationId" element={<ApplicationDetailPage />} />
              <Route path="/applications/:applicationId/objects" element={<ApplicationObjectsPage />} />
              <Route path="/objects/:objectTypeId" element={<ObjectRecordsList />} />
              <Route path="/objects/:objectTypeId/import" element={<ImportRecordsPage />} />
              <Route path="/objects/:objectTypeId/import/create-field/:columnName" element={<ImportCreateFieldPage />} />
              <Route path="/objects/:objectTypeId/create-object-from-field/:fieldApiName/:fieldName" element={<CreateObjectFromFieldValuesPage />} />
              <Route path="/objects/:objectTypeId/new" element={<CreateRecordPage />} />
              <Route path="/objects/:objectTypeId/:recordId" element={<ObjectRecordDetail />} />
              <Route path="/objects/:objectTypeId/:recordId/edit" element={<EditRecordPage />} />
            </Route>
          </Routes>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
