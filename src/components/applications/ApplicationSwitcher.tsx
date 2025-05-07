
import { useState } from "react";
import { useApplications, Application } from "@/hooks/useApplications";
import { Button } from "@/components/ui/button";
import { AppWindow, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
  
  const handleSwitchApplication = async () => {
    if (!applications || applications.length <= 1 || switching) return;
    
    setSwitching(true);
    try {
      // Find the current default app index
      const currentIndex = applications.findIndex(app => app.is_default);
      
      // Get the next app in the list (or first if at the end)
      const nextIndex = (currentIndex + 1) % applications.length;
      const nextApp = applications[nextIndex];
      
      // Set this app as the default
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

  if (!defaultApp) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSwitchApplication}
      disabled={switching || applications?.length <= 1}
      className={cn("gap-2", className)}
    >
      {showIcon && <AppWindow className="h-4 w-4" />}
      {defaultApp.name}
      {applications && applications.length > 1 && (
        <ChevronRight className={cn("h-4 w-4", switching && "animate-pulse")} />
      )}
    </Button>
  );
}
