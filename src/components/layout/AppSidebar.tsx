
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
import { LayoutDashboard, Settings, FileText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ActiveObjectsMenu } from "./ActiveObjectsMenu";
import { useEffect } from "react";

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
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
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

        <SidebarGroup>
          <SidebarGroupLabel>Objects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <ActiveObjectsMenu />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
