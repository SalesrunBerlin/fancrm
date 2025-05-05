
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ThemedButton } from "@/components/ui/themed-button";
import { UserSummary } from "../../pages/admin/UserManagementPage";

interface UserDetailHeaderProps {
  user: UserSummary;
}

export function UserDetailHeader({ user }: UserDetailHeaderProps) {
  const userName = user.profile?.first_name && user.profile?.last_name
    ? `${user.profile.first_name} ${user.profile.last_name}`
    : user.email;

  return (
    <>
      <ThemedButton variant="outline" asChild>
        <Link to="/admin/users">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Link>
      </ThemedButton>
      
      <PageHeader 
        title={userName} 
        description={`User details and statistics for ${user.email}`}
      />
    </>
  );
}
