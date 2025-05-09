
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, LayoutDashboard, AppWindow, FileText, List, Play, BarChart3 } from "lucide-react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useCurrentApplicationData } from "@/hooks/useCurrentApplicationData";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { objectTypes } = useObjectTypes();
  const { currentAppId, appObjects, isLoading } = useCurrentApplicationData();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  
  // Filter to show only objects in the current application, or fall back to all navigation objects
  const navigationObjects = !isLoading && currentAppId && appObjects?.length 
    ? appObjects.filter(obj => obj.show_in_navigation && !obj.is_archived)
    : objectTypes?.filter(obj => obj.show_in_navigation && !obj.is_archived) || [];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      setOpenMobile(false); // Close mobile sidebar when navigating
    }
  };

  return (
    <ScrollArea className="h-full py-6">
      <div className="space-y-4 px-3">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            General
          </h2>
          <div className="space-y-1">
            <Button
              variant={isActive("/dashboard") ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleNavigate("/dashboard")}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>

            <Button
              variant={isActive("/applications") ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleNavigate("/applications")}
            >
              <AppWindow className="mr-2 h-4 w-4" />
              Applications
            </Button>

            <Button
              variant={isActive("/actions") ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleNavigate("/actions")}
            >
              <Play className="mr-2 h-4 w-4" />
              Actions
            </Button>

            <Button
              variant={isActive("/reports") ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleNavigate("/reports")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Reports
            </Button>

            <Button
              variant={isActive("/structures") ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleNavigate("/structures")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Structures
            </Button>
            
            <Button
              variant={isActive("/quick-create") ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleNavigate("/quick-create")}
            >
              <List className="mr-2 h-4 w-4" />
              Quick Create
            </Button>

            <Button
              variant={isActive("/settings") ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleNavigate("/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {navigationObjects && navigationObjects.length > 0 && (
          <div className="px-4 py-2">
            <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
              Objects
            </h2>
            <div className="space-y-1">
              {navigationObjects.map(type => (
                <Button
                  key={type.id}
                  variant={isActive(`/objects/${type.id}`) ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigate(`/objects/${type.id}`)}
                >
                  <span className="mr-2">{type.icon || "📋"}</span>
                  {type.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
