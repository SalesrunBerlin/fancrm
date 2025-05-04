
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Loader2, LayoutDashboard, Settings, Shapes, AppWindow, Play, Share2 } from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: JSX.Element;
};

export function AppNavigation() {
  const { objectTypes, isLoading } = useObjectTypes();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["default"]));

  // Toggle a group open/closed
  const toggleGroup = (group: string) => {
    const newOpenGroups = new Set(openGroups);
    if (newOpenGroups.has(group)) {
      newOpenGroups.delete(group);
    } else {
      newOpenGroups.add(group);
    }
    setOpenGroups(newOpenGroups);
  };

  const defaultNavItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ];
  
  // Define navigation items for data management
  const dataNavItems: NavItem[] = [
    {
      label: "Applications",
      href: "/applications",
      icon: <AppWindow className="h-4 w-4" />,
    },
    {
      label: "Structures",
      href: "/structures",
      icon: <Shapes className="h-4 w-4" />,
    },
    {
      label: "Actions",
      href: "/actions",
      icon: <Play className="h-4 w-4" />,
    },
    {
      label: "Freigaben",
      href: "/shared-records",
      icon: <Share2 className="h-4 w-4" />,
    },
  ];

  // Filter just the active object types that should appear in navigation
  const navigationObjects = objectTypes?.filter(
    (obj) => obj.show_in_navigation && obj.is_active && !obj.is_archived
  );

  // Grouped by Application objects
  return (
    <nav className="grid items-start px-4 py-2 md:px-2">
      {/* Default Navigation Items */}
      <NavGroup
        title="General"
        groupId="default"
        isOpen={openGroups.has("default")}
        toggleOpen={() => toggleGroup("default")}
      >
        {defaultNavItems.map((item, index) => (
          <NavItem key={index} {...item} />
        ))}
      </NavGroup>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        <>
          {/* Data Management */}
          <NavGroup
            title="Data Management"
            groupId="data"
            isOpen={openGroups.has("data")}
            toggleOpen={() => toggleGroup("data")}
          >
            {dataNavItems.map((item, index) => (
              <NavItem key={index} {...item} />
            ))}
          </NavGroup>

          {/* Object Types Navigation */}
          <NavGroup
            title="Records"
            groupId="objects"
            isOpen={openGroups.has("objects")}
            toggleOpen={() => toggleGroup("objects")}
          >
            {navigationObjects?.map((obj) => (
              <NavItem
                key={obj.id}
                label={obj.name}
                href={`/objects/${obj.id}`}
                icon={getIconForObjectType(obj.icon)}
              />
            ))}
          </NavGroup>
        </>
      )}
    </nav>
  );
}

interface NavGroupProps {
  title: string;
  children: React.ReactNode;
  groupId: string;
  isOpen: boolean;
  toggleOpen: () => void;
}

function NavGroup({
  title,
  children,
  groupId,
  isOpen,
  toggleOpen,
}: NavGroupProps) {
  return (
    <div className="grid gap-1">
      <div
        className="flex h-8 items-center justify-between text-sm font-medium text-muted-foreground cursor-pointer py-4"
        onClick={toggleOpen}
        data-group-id={groupId}
      >
        <span>{title}</span>
        <span className="text-xs">{isOpen ? "−" : "+"}</span>
      </div>
      {isOpen && <div className="grid gap-1">{children}</div>}
    </div>
  );
}

interface NavItemProps extends NavItem {}

function NavItem({ label, href, icon }: NavItemProps) {
  return (
    <NavLink
      to={href}
      className={({ isActive }) =>
        cn(
          "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground"
        )
      }
    >
      {icon}
      <span className="ml-3">{label}</span>
    </NavLink>
  );
}

function getIconForObjectType(icon?: string | null) {
  // Map icon string to Lucide icon
  // For now, just return a placeholder
  return <div className="h-4 w-4" />;
}
