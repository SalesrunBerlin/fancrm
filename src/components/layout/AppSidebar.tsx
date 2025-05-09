
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentApplicationData } from "@/hooks/useCurrentApplicationData";
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader } from "@/components/ui/sidebar";
import { NavigationToggle } from "./NavigationToggle";
import { AppNavigation } from "./AppNavigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function AppSidebar() {
  const { isLoggedIn, isSuperAdmin } = useAuth();
  const { currentApplication, appObjects, isLoading } = useCurrentApplicationData();
  const isMobile = useIsMobile();

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between px-4">
          {!isMobile && <NavigationToggle />}
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col justify-between h-full">
        <div>
          <SidebarGroup>
            <AppNavigation />
          </SidebarGroup>
          
          <SidebarGroup>
            <Button asChild variant="ghost" className="justify-start w-full px-2">
              <Link to="/quick-create" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Quick Create</span>
              </Link>
            </Button>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
