
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function NavigationToggle() {
  const { toggleSidebar } = useSidebar();
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith("/auth");
  
  // Don't show on auth pages
  if (isAuthPage) return null;

  return (
    <Button 
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="h-9 w-9 shrink-0"
      aria-label="Toggle navigation"
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
}
