
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export function NavigationToggle() {
  const { toggleSidebar, openMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith("/auth");
  const isMobile = useIsMobile();
  
  // Don't show on auth pages
  if (isAuthPage) return null;

  const handleToggle = () => {
    if (isMobile) {
      setOpenMobile(!openMobile);
    } else {
      toggleSidebar();
    }
  };

  return (
    <Button 
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="h-9 w-9 shrink-0"
      aria-label="Toggle navigation"
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
}
