
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  FileText,
  PlusCircle
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";
import { AppNavigation } from "./AppNavigation";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function Sidebar() {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const { openMobile, setOpenMobile } = useSidebar();
  
  // Don't render directly if on mobile and not open
  if (isMobile && !openMobile) return null;

  const sidebarContent = (
    <div className="pb-12 min-h-screen">
      <AppNavigation />
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-background border-r shadow-lg transform transition-transform duration-300 ease-in-out"
           style={{ transform: openMobile ? 'translateX(0)' : 'translateX(-100%)' }}>
        {sidebarContent}
      </div>
    );
  }

  return sidebarContent;
}
