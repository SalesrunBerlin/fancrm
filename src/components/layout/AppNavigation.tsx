
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, LayoutDashboard, AppWindow, FileText, List, Play, BarChart3 } from "lucide-react";
import { useObjectTypes } from "@/hooks/useObjectTypes";

export function AppNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { objectTypes } = useObjectTypes();

  const isActive = (path: string) => {
    return location.pathname === path;
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
              Applications
            </Button>

            <Button
              variant={isActive("/actions") ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => navigate("/actions")}
            >
              <Play className="mr-2 h-4 w-4" />
              Actions
            </Button>

            <Button
              variant={isActive("/reports") ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => navigate("/reports")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Reports
            </Button>

            <Button
              variant={isActive("/structures") ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => navigate("/structures")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Structures
            </Button>

            <Button
              variant={isActive("/settings") ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => navigate("/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {objectTypes && objectTypes.length > 0 && (
          <div className="px-4 py-2">
            <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
              Custom Objects
            </h2>
            <div className="space-y-1">
              {objectTypes
                .filter(type => type.show_in_navigation && !type.is_archived)
                .map(type => (
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
