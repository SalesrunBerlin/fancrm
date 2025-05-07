
import { useState } from "react";
import { useApplications } from "@/hooks/useApplications";
import { Button } from "@/components/ui/button";
import { AppWindow, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ApplicationSwitcherProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function ApplicationSwitcher({
  variant = "outline",
  size = "default",
  showIcon = true,
  className
}: ApplicationSwitcherProps) {
  const { applications, isLoading, setDefaultApplication } = useApplications();
  const [switching, setSwitching] = useState(false);
  
  // Find the default application
  const defaultApp = applications?.find(app => app.is_default);
  
  // Function to truncate application name if it's longer than 12 characters
  const truncateAppName = (name: string) => {
    if (name?.length > 12) {
      return name.substring(0, 12) + "...";
    }
    return name;
  };

  const handleSwitchApplication = async (appId: string) => {
    if (!applications || switching) return;
    
    setSwitching(true);
    try {
      // Set the selected app as the default
      const nextApp = applications.find(app => app.id === appId);
      if (!nextApp) {
        throw new Error("Application not found");
      }
      
      await setDefaultApplication.mutateAsync(nextApp.id);
      toast.success(`Switched to ${nextApp.name}`);
    } catch (error) {
      console.error("Error switching application:", error);
      toast.error("Failed to switch application");
    } finally {
      setSwitching(false);
    }
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (!defaultApp || !applications?.length) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("gap-2", className)}
          disabled={switching || applications?.length <= 1}
        >
          {showIcon && <AppWindow className="h-4 w-4" />}
          {truncateAppName(defaultApp.name)}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Switch Application</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {applications.map((app) => (
          <DropdownMenuItem 
            key={app.id}
            className={cn(
              "cursor-pointer flex items-center gap-2",
              app.is_default && "font-medium bg-muted"
            )}
            onClick={() => handleSwitchApplication(app.id)}
          >
            {app.is_default && <AppWindow className="h-4 w-4" />}
            {app.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
