
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, LayoutDashboard, AppWindow, FileText, List, Play, BarChart3, Shield, Activity } from "lucide-react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useCurrentApplicationData } from "@/hooks/useCurrentApplicationData";
import { useAuth } from "@/contexts/AuthContext";

export function AppNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { objectTypes } = useObjectTypes();
  const { currentAppId, appObjects } = useCurrentApplicationData();
  const { isSuperAdmin } = useAuth();
  
  // Filter to show only objects in the current application
  const navigationObjects = currentAppId && appObjects?.length 
    ? appObjects.filter(obj => obj.show_in_navigation && !obj.is_archived)
    : objectTypes?.filter(obj => obj.show_in_navigation && !obj.is_archived) || [];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <ScrollArea className="h-full py-6">
      <div className="space-y-4 px-3">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Allgemein
          </h2>
          <div className="space-y-1">
            <Button
              variant={isActive("/dashboard") ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => navigate("/dashboard")}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>

            <Button
              variant={isActive("/applications") ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => navigate("/applications")}
            >
              <AppWindow className="mr-2 h-4 w-4" />
              Anwendungen
            </Button>

            <Button
              variant={isActive("/actions") ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => navigate("/actions")}
            >
              <Play className="mr-2 h-4 w-4" />
              Aktionen
            </Button>

            <Button
              variant={isActive("/reports") ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => navigate("/reports")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Berichte
            </Button>

            <Button
              variant={isActive("/structures") ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => navigate("/structures")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Strukturen
            </Button>

            {isSuperAdmin && (
              <>
                <Button
                  variant={isActive("/admin") ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => navigate("/admin")}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Admin-Bereich
                </Button>
                
                <Button
                  variant={isActive("/admin/analytics") ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => navigate("/admin/analytics")}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Benutzeranalysen
                </Button>
              </>
            )}

            <Button
              variant={isActive("/settings") ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => navigate("/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Einstellungen
            </Button>
          </div>
        </div>

        {navigationObjects && navigationObjects.length > 0 && (
          <div className="px-4 py-2">
            <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
              Benutzerdefinierte Objekte
            </h2>
            <div className="space-y-1">
              {navigationObjects.map(type => (
                <Button
                  key={type.id}
                  variant={isActive(`/objects/${type.id}`) ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => navigate(`/objects/${type.id}`)}
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
