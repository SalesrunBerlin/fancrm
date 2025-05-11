
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
                
                {/* Protected routes with AuthGuard */}
                <Route element={<AuthGuard />}>
                  <Route element={<Layout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/reports" element={<div>Reports Page</div>} />
                    <Route path="/applications" element={<div>Applications Page</div>} />
                    <Route path="/actions" element={<div>Actions Page</div>} />
                    <Route path="/structures" element={<div>Structures Page</div>} />
                    
                    {/* Object routes */}
                    <Route path="/objects/:objectTypeId" element={<ObjectRecordsList />} />
                    <Route path="/objects/:objectTypeId/records/:recordId" element={<div>Record Detail</div>} />
                    <Route path="/objects/:objectTypeId/new" element={<div>Create Record</div>} />
                    <Route path="/objects/:objectTypeId/import" element={<div>Import Records</div>} />
                    
                    {/* Action routes */}
                    <Route path="/actions/execute/:actionId" element={<div>Execute Action</div>} />
                    <Route path="/actions/execute/:actionId/from/:recordId" element={<div>Execute Linked Action</div>} />
                    <Route path="/actions/mass/:actionId" element={<div>Execute Mass Action</div>} />
                    
                    {/* Settings routes */}
                    <Route path="/settings/object-manager" element={<div>Object Manager</div>} />
                    <Route path="/settings/user-management" element={<div>User Management</div>} />
                    
                    {/* Admin routes */}
                    <Route path="/admin" element={<div>Admin Dashboard</div>} />
                    <Route path="/admin/help-content" element={<div>Help Content Editor</div>} />
                    <Route path="/admin/users" element={<div>User Management</div>} />
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
