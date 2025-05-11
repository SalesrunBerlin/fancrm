import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Box, BarChart3, Settings, Archive, Users, HelpCircle, Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useApplications } from "@/hooks/useApplications";
import { useApplicationObjects } from "@/hooks/useApplicationObjects";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

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
  const { pathname } = useLocation();
  const { open, setOpen, openMobile, setOpenMobile } = useSidebar();
  const { applications, isLoading: isLoadingApps } = useApplications();
  const [defaultApplicationId, setDefaultApplicationId] = useState<string | null>(null);
  const { applicationObjects, isLoading: isLoadingObjects } = useApplicationObjects(defaultApplicationId || undefined);
  const isAuthPage = pathname.startsWith("/auth");
  const { isSuperAdmin, isAdmin } = useAuth();
  
  // Only close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 768) {
      setOpenMobile(false);
    }
  }, [pathname, setOpenMobile]);

  // Find the default application
  useEffect(() => {
    if (applications) {
      const defaultApp = applications.find(app => app.is_default);
      if (defaultApp) {
        setDefaultApplicationId(defaultApp.id);
      }
    }
  }, [applications]);
  
  if (isAuthPage) return null;
  
  const isLoading = isLoadingApps || isLoadingObjects;
  
  // Show all assigned objects, regardless of their active status
  const assignedObjects = applicationObjects || [];

  // Handler to close sidebar on both mobile and desktop when clicking a navigation item
  const handleNavClick = () => {
    // Close sidebar on both mobile and desktop
    setOpenMobile(false);
    setOpen(false);
  };

  // Debug log to check super admin status
  console.log("AppSidebar - isSuperAdmin:", isSuperAdmin, "isAdmin:", isAdmin);

  return (
    <Sidebar variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-0.5">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  tooltip="Dashboard"
                >
                  <Link to="/dashboard" onClick={handleNavClick}>
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/reports"}
                  tooltip="Reports"
                >
                  <Link to="/reports" onClick={handleNavClick}>
                    <BarChart3 className="h-4 w-4" />
                    <span>Reports</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {assignedObjects.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Objects</SidebarGroupLabel>
            <SidebarGroupContent className="space-y-0.5">
              <SidebarMenu>
                {assignedObjects.map((object) => (
                  <SidebarMenuItem key={object.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.includes(`/objects/${object.id}`)}
                      tooltip={object.name}
                    >
                      <Link to={`/objects/${object.id}`} onClick={handleNavClick}>
                        <Box className="h-4 w-4" />
                        <span>{object.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-0.5">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/settings"}
                  tooltip="Settings"
                >
                  <Link to="/settings" onClick={handleNavClick}>
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/settings/object-manager"}
                  tooltip="Object Manager"
                >
                  <Link to="/settings/object-manager" onClick={handleNavClick}>
                    <Archive className="h-4 w-4" />
                    <span>Object Manager</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/help"}
                  tooltip="Help"
                >
                  <Link to="/help" onClick={handleNavClick}>
                    <HelpCircle className="h-4 w-4" />
                    <span>Help</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {/* Add Admin section for SuperAdmin users */}
              {isSuperAdmin && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith("/admin")}
                      tooltip="Admin"
                    >
                      <Link to="/admin" onClick={handleNavClick}>
                        <Shield className="h-4 w-4" />
                        <span>Admin</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/admin/help-content"}
                      tooltip="Help Content"
                    >
                      <Link to="/admin/help-content" onClick={handleNavClick}>
                        <HelpCircle className="h-4 w-4" />
                        <span>Help Content</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/admin/users"}
                      tooltip="User Management"
                    >
                      <Link to="/admin/users" onClick={handleNavClick}>
                        <Users className="h-4 w-4" />
                        <span>User Management</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
