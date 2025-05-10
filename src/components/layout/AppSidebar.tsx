
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Box, 
  BarChart3, 
  Settings, 
  Archive, 
  Users, 
  HelpCircle, 
  Shield, 
  Activity 
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useApplications } from "@/hooks/useApplications";
import { useApplicationObjects } from "@/hooks/useApplicationObjects";
import { useEffect, useState, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Menu item component separated for optimization
const SidebarMenuItemComponent = memo(({ 
  path, 
  icon: Icon, 
  label, 
  isActive, 
  onClick 
}: { 
  path: string; 
  icon: React.ElementType; 
  label: string; 
  isActive: boolean;
  onClick: () => void;
}) => (
  <SidebarMenuItem>
    <SidebarMenuButton
      asChild
      isActive={isActive}
      tooltip={label}
    >
      <Link to={path} onClick={onClick}>
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
));

SidebarMenuItemComponent.displayName = 'SidebarMenuItemComponent';

// Navigation group separated as component
const NavigationGroup = memo(({ pathname, handleNavClick }: { pathname: string; handleNavClick: () => void }) => (
  <SidebarGroup>
    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
    <SidebarGroupContent className="space-y-0.5">
      <SidebarMenu>
        <SidebarMenuItemComponent
          path="/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          isActive={pathname === "/dashboard"}
          onClick={handleNavClick}
        />
        
        <SidebarMenuItemComponent
          path="/reports"
          icon={BarChart3}
          label="Reports"
          isActive={pathname === "/reports"}
          onClick={handleNavClick}
        />
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
));

NavigationGroup.displayName = 'NavigationGroup';

// Objects group component
const ObjectsGroup = memo(({ 
  objects, 
  pathname, 
  handleNavClick 
}: { 
  objects: any[]; 
  pathname: string; 
  handleNavClick: () => void 
}) => {
  if (!objects.length) return null;
  
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Objects</SidebarGroupLabel>
      <SidebarGroupContent className="space-y-0.5">
        <SidebarMenu>
          {objects.map((object) => (
            <SidebarMenuItemComponent
              key={object.id}
              path={`/objects/${object.id}`}
              icon={Box}
              label={object.name}
              isActive={pathname.includes(`/objects/${object.id}`)}
              onClick={handleNavClick}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
});

ObjectsGroup.displayName = 'ObjectsGroup';

// Settings group component
const SettingsGroup = memo(({ 
  pathname, 
  handleNavClick, 
  isSuperAdmin 
}: { 
  pathname: string; 
  handleNavClick: () => void;
  isSuperAdmin: boolean;
}) => (
  <SidebarGroup>
    <SidebarGroupLabel>Settings</SidebarGroupLabel>
    <SidebarGroupContent className="space-y-0.5">
      <SidebarMenu>
        <SidebarMenuItemComponent
          path="/settings"
          icon={Settings}
          label="Settings"
          isActive={pathname === "/settings"}
          onClick={handleNavClick}
        />
        
        <SidebarMenuItemComponent
          path="/settings/object-manager"
          icon={Archive}
          label="Object Manager"
          isActive={pathname === "/settings/object-manager"}
          onClick={handleNavClick}
        />

        <SidebarMenuItemComponent
          path="/help"
          icon={HelpCircle}
          label="Help"
          isActive={pathname === "/help"}
          onClick={handleNavClick}
        />
        
        {isSuperAdmin && (
          <>
            <SidebarMenuItemComponent
              path="/admin"
              icon={Shield}
              label="Admin"
              isActive={pathname.startsWith("/admin")}
              onClick={handleNavClick}
            />
            
            <SidebarMenuItemComponent
              path="/admin/help-content"
              icon={HelpCircle}
              label="Help Content"
              isActive={pathname === "/admin/help-content"}
              onClick={handleNavClick}
            />
            
            <SidebarMenuItemComponent
              path="/admin/users"
              icon={Users}
              label="User Management"
              isActive={pathname === "/admin/users"}
              onClick={handleNavClick}
            />
            
            <SidebarMenuItemComponent
              path="/admin/analytics"
              icon={Activity}
              label="Benutzeranalysen"
              isActive={pathname === "/admin/analytics"}
              onClick={handleNavClick}
            />
          </>
        )}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
));

SettingsGroup.displayName = 'SettingsGroup';

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

  // Find the default application - with memoization to avoid unnecessary work
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

  return (
    <Sidebar variant="floating">
      <SidebarContent>
        <NavigationGroup pathname={pathname} handleNavClick={handleNavClick} />
        
        {assignedObjects.length > 0 && (
          <ObjectsGroup 
            objects={assignedObjects} 
            pathname={pathname} 
            handleNavClick={handleNavClick} 
          />
        )}

        <SettingsGroup 
          pathname={pathname} 
          handleNavClick={handleNavClick}
          isSuperAdmin={isSuperAdmin}
        />
      </SidebarContent>
    </Sidebar>
  );
}
