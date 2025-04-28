
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Building, User, Briefcase, Calendar, Box } from "lucide-react";
import { Link } from "react-router-dom";
import { ObjectType } from "@/hooks/useObjectTypes";
import { useSidebar } from "@/components/ui/sidebar";
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function ActiveObjectsMenu() {
  const { objectTypes } = useObjectTypes();
  const { setOpenMobile } = useSidebar();
  const visibleObjects = objectTypes?.filter(obj => obj.is_active) || [];

  const getIcon = (iconName: string | null) => {
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
    <>
      {visibleObjects.map((object: ObjectType) => (
        <SidebarMenuItem key={object.id}>
          <SidebarMenuButton
            asChild
            tooltip={object.name}
          >
            <Link 
              to={`/objects/${object.id}`}
              onClick={() => setOpenMobile(false)}
            >
              {getIcon(object.icon)}
              <span>{object.name}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
}
