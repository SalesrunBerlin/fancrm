
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

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarLink = ({ to, icon, label, active, onClick }: SidebarLinkProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
      active && "bg-accent text-accent-foreground"
    )}
    onClick={onClick}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export function Sidebar() {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const { openMobile, setOpenMobile } = useSidebar();
  
  // Close sidebar when clicking on a link in mobile view
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Don't render directly if on mobile - it will be rendered by the Sheet component
  if (isMobile && !openMobile) return null;

  const sidebarContent = (
    <div className="pb-12 min-h-screen">
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Navigation</h2>
          <div className="space-y-1">
            <SidebarLink
              to="/dashboard"
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="Dashboard"
              active={pathname === "/dashboard"}
              onClick={handleLinkClick}
            />
            <SidebarLink
              to="/structures"
              icon={<FileText className="h-4 w-4" />}
              label="Structures"
              active={pathname.startsWith("/structures")}
              onClick={handleLinkClick}
            />
            <SidebarLink
              to="/settings"
              icon={<Settings className="h-4 w-4" />}
              label="Settings"
              active={pathname === "/settings" || pathname.startsWith("/settings/")}
              onClick={handleLinkClick}
            />
            <SidebarLink
              to="/quick-create"
              icon={<PlusCircle className="h-4 w-4" />}
              label="Quick Create"
              active={pathname === "/quick-create"}
              onClick={handleLinkClick}
            />
          </div>
        </div>
      </div>
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
