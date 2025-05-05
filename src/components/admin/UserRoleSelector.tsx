
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserRoleSelectorProps {
  userId: string;
  currentRole: string;
}

export function UserRoleSelector({ userId, currentRole }: UserRoleSelectorProps) {
  const [role, setRole] = useState(currentRole);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = async (newRole: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      setRole(newRole);
      toast.success("Role updated successfully");
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error("Failed to update user role");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Select
      disabled={isLoading}
      value={role}
      onValueChange={handleRoleChange}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="user">User</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="SuperAdmin">Super Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}
