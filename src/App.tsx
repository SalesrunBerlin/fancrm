
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
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
                  <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                  <Route path="/settings" element={<Layout><Settings /></Layout>} />
                  
                  {/* Object routes */}
                  <Route path="/objects/:objectTypeId" element={<Layout><ObjectRecordsList /></Layout>} />
                  <Route path="/objects/:objectTypeId/records/:recordId" element={<Layout><div>Record Detail</div></Layout>} />
                  <Route path="/objects/:objectTypeId/new" element={<Layout><div>Create Record</div></Layout>} />
                  <Route path="/objects/:objectTypeId/import" element={<Layout><div>Import Records</div></Layout>} />
                  
                  {/* Action routes */}
                  <Route path="/actions/execute/:actionId" element={<Layout><div>Execute Action</div></Layout>} />
                  <Route path="/actions/execute/:actionId/from/:recordId" element={<Layout><div>Execute Linked Action</div></Layout>} />
                  <Route path="/actions/mass/:actionId" element={<Layout><div>Execute Mass Action</div></Layout>} />
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
