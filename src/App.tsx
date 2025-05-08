
import React, { useEffect } from 'react';
import {
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
import CreateWorkspacePage from './pages/admin/CreateWorkspacePage';
import { AppLayout } from './components/layout/AppLayout';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/public/record/:token/:recordId" element={<PublicRecordPage />} />
      
      {/* Protected Routes with AppLayout */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/workspace/create" element={<CreateWorkspacePage />} />
        <Route path="/admin/workspace/:workspaceId" element={<AdminWorkspacePage />} />
        <Route path="/admin/workspace" element={<AdminWorkspacePage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
