
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    console.log("User does not have admin access", { user });
    return <Navigate to="/dashboard" replace />;
  }

  console.log("User has admin access", { user, isAdmin });
  return <>{children || <Outlet />}</>;
}

// Export as default as well for compatibility with existing imports
export default AdminRoute;
