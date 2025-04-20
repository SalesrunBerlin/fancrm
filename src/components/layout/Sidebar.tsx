
import {
  Home,
  LayoutDashboard,
  Users,
  Building,
  Briefcase,
  Settings,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex h-screen fixed left-0 top-0 w-64 border-r bg-background p-6 flex-col gap-6">
      <Link to="/" className="flex items-center gap-2 font-bold">
        <LayoutDashboard className="h-6 w-6" />
        <span>CRM</span>
      </Link>

      <nav className="flex flex-col gap-1">
        <Button
          variant={location.pathname === "/dashboard" ? "secondary" : "ghost"}
          className="w-full justify-start"
          asChild
        >
          <Link to="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <Button
          variant={location.pathname === "/contacts" ? "secondary" : "ghost"}
          className="w-full justify-start"
          asChild
        >
          <Link to="/contacts">
            <Users className="mr-2 h-4 w-4" />
            Kontakte
          </Link>
        </Button>
        <Button
          variant={location.pathname === "/accounts" ? "secondary" : "ghost"}
          className="w-full justify-start"
          asChild
        >
          <Link to="/accounts">
            <Building className="mr-2 h-4 w-4" />
            Accounts
          </Link>
        </Button>
        <Button
          variant={location.pathname === "/deals" ? "secondary" : "ghost"}
          className="w-full justify-start"
          asChild
        >
          <Link to="/deals">
            <Briefcase className="mr-2 h-4 w-4" />
            Deals
          </Link>
        </Button>
      </nav>

      <div className="mt-auto">
        <Button
          variant={location.pathname === "/settings" ? "secondary" : "ghost"}
          className="w-full justify-start"
          asChild
        >
          <Link to="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Einstellungen
          </Link>
        </Button>
      </div>
    </aside>
  );
}
