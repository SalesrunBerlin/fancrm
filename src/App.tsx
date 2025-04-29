
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
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
              <Route path="/settings/objects/:objectTypeId" element={<ObjectTypeDetail />} />
              <Route path="/settings/objects/:objectTypeId/fields/:fieldId/edit" element={<ObjectFieldEditPage />} />
              <Route path="/structures/*" element={<Structures />} />
              <Route path="/objects/:objectTypeId" element={<ObjectRecordsList />} />
              <Route path="/objects/:objectTypeId/new" element={<CreateRecordPage />} />
              <Route path="/objects/:objectTypeId/:recordId" element={<ObjectRecordDetail />} />
              <Route path="/objects/:objectTypeId/:recordId/edit" element={<EditRecordPage />} />
            </Route>
          </Routes>
          <Toaster />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
