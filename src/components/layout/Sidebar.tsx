
import React from "react";
import {
  Home,
  LayoutDashboard,
  Users,
  Building,
  Briefcase,
  Settings,
  LogOut
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  ref?: React.RefObject<HTMLDivElement>;
  onClose?: () => void;
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ isOpen = false, onClose }, ref) => {
    const location = useLocation();
    const { logout } = useAuth();
    
    const handleLinkClick = () => {
      if (onClose) {
        onClose();
      }
    };
    
    const sidebarClass = cn(
      "h-screen fixed left-0 top-0 w-64 border-r bg-background p-6 flex-col gap-6 z-40 transition-all duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full",
      "lg:translate-x-[-256px] lg:hover:translate-x-0"
    );

    return (
      <aside className={sidebarClass} ref={ref}>
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Home className="h-5 w-5 text-beauty" />
          <span>CRMbeauty</span>
        </div>

        <div className="flex flex-col gap-1">
          <Link to="/dashboard" onClick={handleLinkClick}>
            <Button
              variant={location.pathname === "/dashboard" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link to="/contacts" onClick={handleLinkClick}>
            <Button
              variant={location.pathname.includes("/contacts") ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Users className="mr-2 h-4 w-4" />
              Contacts
            </Button>
          </Link>
          <Link to="/accounts" onClick={handleLinkClick}>
            <Button
              variant={location.pathname.includes("/accounts") ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Building className="mr-2 h-4 w-4" />
              Accounts
            </Button>
          </Link>
          <Link to="/deals" onClick={handleLinkClick}>
            <Button
              variant={location.pathname.includes("/deals") ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Deals
            </Button>
          </Link>
          <Link to="/settings" onClick={handleLinkClick}>
            <Button
              variant={location.pathname === "/settings" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
        
        <div className="mt-auto">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
    );
  }
);

Sidebar.displayName = "Sidebar";
