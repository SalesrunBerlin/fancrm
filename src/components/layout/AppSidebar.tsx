import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Settings, Package, Search, Users, 
  FileText, Blocks, FileCode, Bot, PlugZap, BrainCircuit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';

interface NavItemProps {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export function AppSidebar() {
  const location = useLocation();

  const mainNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
    },
    {
      title: "Objects",
      href: "/settings/object-manager",
      icon: <Package className="h-4 w-4 mr-2" />,
    },
    {
      title: "Applications",
      href: "/applications",
      icon: <Blocks className="h-4 w-4 mr-2" />,
    },
    {
      title: "Actions",
      href: "/actions",
      icon: <FileCode className="h-4 w-4 mr-2" />,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: <FileText className="h-4 w-4 mr-2" />,
    },
    {
      title: "Tickets",
      href: "/ticket-queue",
      icon: <Search className="h-4 w-4 mr-2" />,
    },
    {
      title: "AI Assistant",
      href: "/openai/assistant",
      icon: <Bot className="h-4 w-4 mr-2" />,
    },
    {
      title: "Connections",
      href: "/connections",
      icon: <PlugZap className="h-4 w-4 mr-2" />,
    },
    {
      title: "User Management",
      href: "/settings/user-management",
      icon: <Users className="h-4 w-4 mr-2" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-4 w-4 mr-2" />,
    }
  ];

  return (
    <div className="flex flex-col h-full bg-secondary border-r border-muted/50">
      <div className="px-4 py-6">
        <Button variant="ghost" asChild>
          <NavLink to="/" className="text-lg font-semibold">
            AI Copilot
          </NavLink>
        </Button>
      </div>
      <div className="flex-grow p-4">
        <ul className="space-y-1">
          {mainNavItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-md text-sm font-medium transition-colors hover:bg-secondary/80 hover:text-foreground",
                    isActive
                      ? "bg-secondary/80 text-foreground font-bold"
                      : "text-muted-foreground"
                  )
                }
              >
                {item.icon}
                {item.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4">
        <Button variant="outline" asChild>
          <NavLink to="/profile">
            Profile
          </NavLink>
        </Button>
      </div>
    </div>
  );
}
