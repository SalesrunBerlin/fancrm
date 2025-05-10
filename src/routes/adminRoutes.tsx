
import { SuperAdminRoute } from "@/components/auth/SuperAdminRoute";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import UserManagementPage from "@/pages/admin/UserManagementPage";
import UserDetailPage from "@/pages/admin/UserDetailPage";
import UserAnalyticsPage from "@/pages/admin/UserAnalyticsPage";
import UserSessionsPage from "@/pages/admin/UserSessionsPage";
import SessionActivitiesPage from "@/pages/admin/SessionActivitiesPage";

export const adminRoutes = [
  {
    path: "/admin",
    element: (
      <SuperAdminRoute>
        <AdminDashboard />
      </SuperAdminRoute>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <SuperAdminRoute>
        <UserManagementPage />
      </SuperAdminRoute>
    ),
  },
  {
    path: "/admin/users/:userId",
    element: (
      <SuperAdminRoute>
        <UserDetailPage />
      </SuperAdminRoute>
    ),
  },
  {
    path: "/admin/analytics",
    element: (
      <SuperAdminRoute>
        <UserAnalyticsPage />
      </SuperAdminRoute>
    ),
  },
  {
    path: "/admin/users/sessions/:userId",
    element: (
      <SuperAdminRoute>
        <UserSessionsPage />
      </SuperAdminRoute>
    ),
  },
  {
    path: "/admin/sessions/:sessionId/activities",
    element: (
      <SuperAdminRoute>
        <SessionActivitiesPage />
      </SuperAdminRoute>
    ),
  }
];
