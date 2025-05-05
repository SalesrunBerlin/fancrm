
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemedButton } from "@/components/ui/themed-button";
import { UserObjectsList } from "@/components/admin/UserObjectsList";
import { UserDetailHeader } from "@/components/admin/UserDetailHeader";
import { UserDetailCards } from "@/components/admin/UserDetailCards";
import { UserLoginHistoryCard } from "@/components/admin/UserLoginHistoryCard";
import { useUserDetails } from "@/hooks/useUserDetails";

export default function UserDetailPage() {
  const { userId } = useParams();
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  
  const { user, loginHistory, userObjects, isLoading } = useUserDetails(userId);

  // Redirect if not a Super Admin
  if (!isSuperAdmin) {
    navigate("/dashboard");
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">User Not Found</h1>
        <p>The requested user could not be found</p>
        <ThemedButton asChild>
          <Link to="/admin/users">Back to Users</Link>
        </ThemedButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserDetailHeader user={user} />
      
      <UserDetailCards user={user} />
      
      <UserObjectsList userObjects={userObjects} />
      
      <UserLoginHistoryCard loginHistory={loginHistory} />
    </div>
  );
}
