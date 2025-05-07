
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserAccess } from "@/contexts/UserAccessContext";
import { Loader2 } from "lucide-react";

export function DataAccessRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { hasDataAccess, isLoading: accessLoading } = useUserAccess();

  const isLoading = authLoading || accessLoading;

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

  if (!hasDataAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
