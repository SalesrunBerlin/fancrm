
import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useMobile } from "@/hooks/useMobile";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Box, BarChart3, ListChecks, Settings, Plus, Archive, Users, HelpCircle, LayoutList, UsersRound } from "lucide-react";
import { ApplicationSwitcher } from "@/components/applications/ApplicationSwitcher";
import { useCurrentApplicationData } from "@/hooks/useCurrentApplicationData";
import { useAuth } from "@/contexts/AuthContext";
import { useObjectTypes } from "@/hooks/useObjectTypes";

// Navigation items that will appear in the sidebar
const navigationItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard"
  },
  {
    title: "Reports",
    icon: BarChart3,
    path: "/reports"
  }
];

export function AppSidebar() {
  const [open, setOpen] = useState(true);
  const isMobile = useMobile();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { applications, currentApplication } = useCurrentApplicationData();
  const { objectTypes } = useObjectTypes();
  
  // Get admin status
  const { isSuperAdmin } = useAuth();
  const isAdmin = isSuperAdmin; // For compatibility with existing code
  
  const isOpen = isMobile ? open : true;
  
  // Filter objects to show in navigation - only show non-archived objects
  const navigationObjects = objectTypes?.filter(obj => obj.show_in_navigation && !obj.is_archived) || [];

  return (
    <Sheet open={isMobile ? isOpen : undefined} onOpenChange={setOpen}>
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
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Navigation</h2>
              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <Button
                    key={item.path}
                    variant={pathname === item.path ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => navigate(item.path)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Button>
                ))}
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

            {/* Custom Objects Section */}
            {navigationObjects && navigationObjects.length > 0 && (
              <div>
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Objects</h2>
                <div className="space-y-1">
                  {navigationObjects.map(type => (
                    <Button
                      key={type.id}
                      variant={pathname.startsWith(`/objects/${type.id}`) ? "secondary" : "ghost"}
                      className="w-full justify-start gap-2"
                      onClick={() => navigate(`/objects/${type.id}`)}
                    >
                      <span className="mr-2">{type.icon || "📋"}</span>
                      {type.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {currentApplication && (
              <div>
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">{currentApplication.name}</h2>
                <div className="space-y-1">
                  <Button
                    variant={pathname.startsWith("/objects") ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => navigate(`/objects/${currentApplication.id}`)}
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
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Settings</h2>
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
                  variant={pathname === "/settings/object-manager" ? "secondary" : "ghost"}
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

            {(isAdmin || isSuperAdmin) && (
              <div className="py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Administration</h2>
                <div className="space-y-1">
                  <Button
                    variant={pathname.startsWith('/admin/workspace') ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-2"
                    onClick={() => navigate('/admin/workspace')}
                  >
                    <Users className="h-4 w-4" />
                    <span>User Management</span>
                  </Button>
                  
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
  );
}
