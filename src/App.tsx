import React from 'react';
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
import Settings from './pages/Settings';
import ObjectManager from './pages/ObjectManager';
import ApplicationsPage from './pages/ApplicationsPage';
import ReportsPage from './pages/ReportsPage';
import Structures from './pages/Structures';
import ProfilePage from './pages/ProfilePage';
import HelpPage from './pages/HelpPage';
import ObjectRecordsList from './pages/ObjectRecordsList';

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
        
        {/* Settings related routes */}
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/object-manager" element={<ObjectManager />} />
        <Route path="/settings/object-manager/new" element={<ObjectManager />} />
        
        {/* Application routes */}
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/applications/:applicationId" element={<ApplicationsPage />} />
        
        {/* Object records routes */}
        <Route path="/objects/:objectTypeId" element={<ObjectRecordsList />} />
        <Route path="/objects/:objectTypeId/import" element={<ObjectRecordsList />} />
        <Route path="/objects/:objectTypeId/new" element={<ObjectRecordsList />} />
        
        {/* Other main routes */}
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/structures" element={<Structures />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/help" element={<HelpPage />} />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
