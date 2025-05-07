
import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useMobile } from "@/hooks/use-mobile";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ListChecks,
  Settings,
  Plus,
  Archive,
  Users,
  HelpCircle,
  LayoutList,
  UsersRound,
  Menu
} from "lucide-react";
import { ApplicationSwitcher } from "./ApplicationSwitcher";
import { useCurrentApplicationData } from "@/hooks/useCurrentApplicationData";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  const isMobile = useMobile();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { applications, currentApplication } = useCurrentApplicationData();
  
  // Add this line to get admin status
  const { isAdmin, isSuperAdmin } = useAuth();

  const toggleSidebar = () => {
    setOpen(!open);
  };

  // Show mobile menu toggle button
  const MobileMenuToggle = () => {
    if (!isMobile) return null;
    
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>
    );
  };

  return (
    <>
      <MobileMenuToggle />
      <Sheet open={isMobile ? open : true} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 pr-0 sm:max-w-xs">
          <div className="h-full p-4 pt-0">
            <div className="flex h-14 items-center px-1">
              <Link to="/" className="flex items-center gap-2">
                <span className="font-bold">CRMBeauty</span>
              </Link>
              <div className="ml-auto">
                <ApplicationSwitcher />
              </div>
            </div>
            <div className="space-y-4 pt-4">
              <div>
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                  Navigation
                </h2>
                <div className="space-y-1">
                  <Button
                    variant={pathname === "/dashboard" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => navigate("/dashboard")}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Button>
                  <Button
                    variant={pathname === "/" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => navigate("/")}
                  >
                    <ListChecks className="h-4 w-4" />
                    <span>Tasks</span>
                  </Button>
                </div>
              </div>
              {currentApplication && (
                <div>
                  <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                    {currentApplication.name}
                  </h2>
                  <div className="space-y-1">
                    <Button
                      variant={
                        pathname.startsWith("/objects") ? "secondary" : "ghost"
                      }
                      className="w-full justify-start gap-2"
                      onClick={() =>
                        navigate(`/objects/${currentApplication.id}`)
                      }
                    >
                      <LayoutList className="h-4 w-4" />
                      <span>Objects</span>
                    </Button>
                    <Button
                      variant={pathname.startsWith("/actions") ? "secondary" : "ghost"}
                      className="w-full justify-start gap-2"
                      onClick={() => navigate("/actions")}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Actions</span>
                    </Button>
                  </div>
                </div>
              )}
              <div>
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                  Settings
                </h2>
                <div className="space-y-1">
                  <Button
                    variant={pathname === "/settings" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => navigate("/settings")}
                  >
                    <Settings className="h-4 w-4" />
                    <span>General</span>
                  </Button>
                  <Button
                    variant={
                      pathname === "/settings/object-manager" ? "secondary" : "ghost"
                    }
                    className="w-full justify-start gap-2"
                    onClick={() => navigate("/settings/object-manager")}
                  >
                    <Archive className="h-4 w-4" />
                    <span>Object Manager</span>
                  </Button>
                  <Button
                    variant={pathname === "/profile" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => navigate("/profile")}
                  >
                    <Users className="h-4 w-4" />
                    <span>Profile</span>
                  </Button>
                  <Button
                    variant={pathname === "/help" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => navigate("/help")}
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Help</span>
                  </Button>
                </div>
              </div>
              
              {/* Admin Section - Only show for admin and superadmin */}
              {(isAdmin || isSuperAdmin) && (
                <div className="py-2">
                  <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                    Administration
                  </h2>
                  <div className="space-y-1">
                    {/* Admin workspace management */}
                    <Button 
                      variant={pathname.startsWith('/admin/workspace') ? 'secondary' : 'ghost'} 
                      className="w-full justify-start gap-2" 
                      onClick={() => navigate('/admin/workspace')}
                    >
                      <Users className="h-4 w-4" />
                      <span>User Management</span>
                    </Button>
                    
                    {/* Only show superadmin links to superadmin users */}
                    {isSuperAdmin && (
                      <>
                        <Button 
                          variant={pathname === '/admin' ? 'secondary' : 'ghost'} 
                          className="w-full justify-start gap-2" 
                          onClick={() => navigate('/admin')}
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Button>
                        <Button 
                          variant={pathname.startsWith('/admin/users') ? 'secondary' : 'ghost'} 
                          className="w-full justify-start gap-2" 
                          onClick={() => navigate('/admin/users')}
                        >
                          <UsersRound className="h-4 w-4" />
                          <span>All Users</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
