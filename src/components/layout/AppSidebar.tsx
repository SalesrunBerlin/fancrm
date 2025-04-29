
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
import { LayoutDashboard, Settings, FileText, Box, Database } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useEffect } from "react";

const navigationItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard"
  },
  {
    title: "Object Manager",
    icon: Database,
    path: "/settings/object-manager"
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
  const { objectTypes } = useObjectTypes();
  const isAuthPage = pathname.startsWith("/auth");
  
  // Close sidebar on route change
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);
  
  if (isAuthPage) return null;
  
  const activeObjects = objectTypes?.filter(obj => obj.is_active) || [];

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
                    <Link to={item.path} onClick={() => setOpenMobile(false)}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {activeObjects.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Objects</SidebarGroupLabel>
            <SidebarGroupContent className="space-y-0.5">
              <SidebarMenu>
                {activeObjects.map((object) => (
                  <SidebarMenuItem key={object.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.includes(`/objects/${object.id}`)}
                      tooltip={object.name}
                    >
                      <Link to={`/objects/${object.id}`} onClick={() => setOpenMobile(false)}>
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
