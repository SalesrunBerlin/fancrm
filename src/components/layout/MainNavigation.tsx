
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
} from "lucide-react";
import { ActiveObjectsMenu } from "./ActiveObjectsMenu";

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

export function MainNavigation() {
  const { pathname } = useLocation();
  
  return (
    <div className="bg-background border-b border-border flex items-center h-14 px-4">
      <div className="flex items-center space-x-4">
        <h1 className="font-semibold hidden md:block">CRMbeauty</h1>
        
        <nav className="flex items-center space-x-1">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center h-10 px-3 py-2 text-sm rounded-md transition-colors",
                pathname === item.path || pathname.startsWith(item.path + "/")
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.title}
            </Link>
          ))}
          
          <div className="ml-2">
            <ActiveObjectsMenu />
          </div>
        </nav>
      </div>
    </div>
  );
}
