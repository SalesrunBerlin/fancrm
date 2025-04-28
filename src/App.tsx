
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/layout/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import Objects from "@/pages/Objects";
import ObjectDetail from "@/pages/ObjectDetail";
import ObjectTypeForm from "@/pages/ObjectTypeForm";
import ObjectRecordDetail from "@/pages/ObjectRecordDetail";
import ObjectRecords from "@/pages/ObjectRecords";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import PublishedObjects from "@/pages/PublishedObjects";
import PublishedObjectDetail from "@/pages/PublishedObjectDetail";

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
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />

            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              
              {/* Object management routes */}
              <Route path="/objects" element={<Objects />} />
              <Route path="/objects/new" element={<ObjectTypeForm />} />
              <Route path="/objects/:id" element={<ObjectDetail />} />
              <Route path="/objects/:id/edit" element={<ObjectTypeForm />} />
              <Route path="/objects/:objectId/records" element={<ObjectRecords />} />
              <Route path="/objects/:objectId/records/:recordId" element={<ObjectRecordDetail />} />
              
              {/* Published objects routes */}
              <Route path="/published" element={<PublishedObjects />} />
              <Route path="/published/:id" element={<PublishedObjectDetail />} />
            </Route>
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
