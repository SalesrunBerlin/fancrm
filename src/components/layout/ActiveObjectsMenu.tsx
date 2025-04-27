
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Building, User, Briefcase, Calendar, Box } from "lucide-react";
import { Link } from "react-router-dom";
import { ObjectType } from "@/hooks/useObjectTypes";

export function ActiveObjectsMenu() {
  const { objectTypes } = useObjectTypes();
  const visibleObjects = objectTypes?.filter(obj => obj.is_active && obj.show_in_navigation) || [];

  const getIconComponent = (iconName: string | null) => {
    switch(iconName) {
      case 'user': return <User className="h-4 w-4" />;
      case 'building': return <Building className="h-4 w-4" />;
      case 'briefcase': return <Briefcase className="h-4 w-4" />;
      case 'calendar': return <Calendar className="h-4 w-4" />;
      default: return <Box className="h-4 w-4" />;
    }
  };

  if (!visibleObjects.length) return null;

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="h-9 px-2">
            <Box className="h-4 w-4 mr-2" />
            Objects
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid gap-1 p-2 w-[200px]">
              {visibleObjects.map((object: ObjectType) => (
                <Link
                  key={object.id}
                  to={`/objects/${object.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent"
                >
                  {getIconComponent(object.icon)}
                  {object.name}
                </Link>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
