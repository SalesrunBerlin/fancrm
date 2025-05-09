
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  FileText,
  PlusCircle
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const SidebarLink = ({ to, icon, label, active }: SidebarLinkProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
      active && "bg-accent text-accent-foreground"
    )}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export function Sidebar() {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();

  if (isMobile) return null;

  return (
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
            />
            <SidebarLink
              to="/structures"
              icon={<FileText className="h-4 w-4" />}
              label="Structures"
              active={pathname.startsWith("/structures")}
            />
            <SidebarLink
              to="/settings"
              icon={<Settings className="h-4 w-4" />}
              label="Settings"
              active={pathname === "/settings" || pathname.startsWith("/settings/")}
            />
            <SidebarLink
              to="/quick-create"
              icon={<PlusCircle className="h-4 w-4" />}
              label="Quick Create"
              active={pathname === "/quick-create"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
