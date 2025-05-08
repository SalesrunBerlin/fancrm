import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import PublicRecordPage from './pages/PublicRecordPage';
import AdminWorkspacePage from './pages/admin/AdminWorkspacePage';
import CreateWorkspacePage from './pages/admin/CreateWorkspacePage'; // Import the new page

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const { isLoggedIn, isSuperAdmin, isLoading } = useAuth();
  const location = useLocation();

  // Function to determine if the current route requires authentication
  const requiresAuth = (pathname: string) => {
    const publicRoutes = ['/login', '/public/record/:token/:recordId'];
    if (publicRoutes.includes(pathname)) {
      return false;
    }

    // Check if the current pathname starts with any of the public routes
    const isPublic = publicRoutes.some(route => {
      const regex = new RegExp(`^${route.replace(/:\w+/g, '[^/]+')}$`);
      return regex.test(pathname);
    });

    return !isPublic;
  };

  useEffect(() => {
    // Log the current route for debugging purposes
    console.log('Current Route:', location.pathname);
  }, [location]);

  if (isLoading) {
    return <div>Loading...</div>; // Show a loading indicator while checking authentication
  }

  const currentPathRequiresAuth = requiresAuth(location.pathname);

  return (
    <Routes>
      <Route path="/login" element={!isLoggedIn ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/public/record/:token/:recordId" element={<PublicRecordPage />} />
      
      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={isLoggedIn ? <DashboardPage /> : <Navigate to="/login" state={{ from: location }} />}
      />
      <Route
        path="/admin"
        element={isLoggedIn && isSuperAdmin ? <AdminPage /> : (
          isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" state={{ from: location }} />
        )}
      />
      <Route
        path="/admin/workspace"
        element={isLoggedIn && isSuperAdmin ? <AdminWorkspacePage /> : (
          isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" state={{ from: location }} />
        )}
      />
      <Route
        path="/admin/workspace/:workspaceId"
        element={isLoggedIn && isSuperAdmin ? <AdminWorkspacePage /> : (
          isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" state={{ from: location }} />
        )}
      />
      {/* New route for creating a workspace */}
      <Route
        path="/admin/workspace/create"
        element={isLoggedIn && isSuperAdmin ? <CreateWorkspacePage /> : (
          isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" state={{ from: location }} />
        )}
      />
      
      {/* Fallback route */}
      <Route path="*" element={currentPathRequiresAuth ? <Navigate to="/login" state={{ from: location }} /> : <div>Page not found</div>} />
    </Routes>
  );
}

export default App;
