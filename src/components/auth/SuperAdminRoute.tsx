
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isSuperAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if the user is marked as a SuperAdmin
  if (!isSuperAdmin) {
    console.log("Access denied: User is not a SuperAdmin");
    return <Navigate to="/dashboard" replace />;
  }
  
  // User is authenticated and is a SuperAdmin, render the children
  return <>{children || <Outlet />}</>;
}
