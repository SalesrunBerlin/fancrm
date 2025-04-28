
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import Settings from "./pages/Settings";
import ObjectTypeDetail from "./pages/ObjectTypeDetail";
import ObjectRecordsList from "./pages/ObjectRecordsList";
import ObjectRecordDetail from "./pages/ObjectRecordDetail";
import Structures from "./pages/Structures";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/objects/:objectTypeId" element={<ObjectTypeDetail />} />
              <Route path="/objects/:objectTypeId" element={<ObjectRecordsList />} />
              <Route path="/objects/:objectTypeId/:recordId" element={<ObjectRecordDetail />} />
              <Route path="/structures" element={<Structures />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
