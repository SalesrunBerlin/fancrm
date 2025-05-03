
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
import { LayoutDashboard, Settings, FileText, Box } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useApplications } from "@/hooks/useApplications";
import { useApplicationObjects } from "@/hooks/useApplicationObjects";
import { useEffect, useState } from "react";

const navigationItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard"
  },
  {
    title: "Structures",
    icon: FileText,
    path: "/structures"
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/settings"
  }
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const { openMobile, setOpenMobile } = useSidebar();
  const { applications, isLoading: isLoadingApps } = useApplications();
  const [defaultApplicationId, setDefaultApplicationId] = useState<string | null>(null);
  const { applicationObjects, isLoading: isLoadingObjects } = useApplicationObjects(defaultApplicationId || undefined);
  const isAuthPage = pathname.startsWith("/auth");
  
  // Close sidebar on route change
  useEffect(() => {
    setOpenMobile(false);
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

  // Handle link click to close mobile sidebar
  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-0.5">
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.path || pathname.startsWith(item.path + "/")}
                    tooltip={item.title}
                  >
                    <Link to={item.path} onClick={handleLinkClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
                      <Link to={`/objects/${object.id}`} onClick={handleLinkClick}>
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
      </SidebarContent>
    </Sidebar>
  );
}
