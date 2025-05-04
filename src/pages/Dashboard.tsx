
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { Box, Building, Briefcase, Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { objectTypes } = useObjectTypes();
  const { user } = useAuth();
  
  // Filter objects to only show those owned by the current user
  const userObjectTypes = objectTypes?.filter(type => 
    // Only show objects that:
    // 1. Are owned by the current user OR
    // 2. Are system objects that are active
    (type.owner_id === user?.id || (type.is_system && type.is_active))
  );
  
  const getIconComponent = (iconName: string | null) => {
    switch(iconName) {
      case 'user': return <User className="h-5 w-5" />;
      case 'building': return <Building className="h-5 w-5" />;
      case 'briefcase': return <Briefcase className="h-5 w-5" />;
      case 'calendar': return <Calendar className="h-5 w-5" />;
      default: return <Box className="h-5 w-5" />;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to your CRM</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your custom CRM solution is ready. You can create and manage your own
              object types and records in the Settings section.
            </p>
          </CardContent>
        </Card>

        {userObjectTypes?.filter(type => type.is_active).map((objectType) => (
          <Link 
            key={objectType.id} 
            to={`/objects/${objectType.id}`}
            className="block"
          >
            <Card className="hover:bg-accent hover:text-accent-foreground transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  {getIconComponent(objectType.icon)}
                  {objectType.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ObjectRecordCount objectTypeId={objectType.id} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ObjectRecordCount({ objectTypeId }: { objectTypeId: string }) {
  const { records } = useObjectRecords(objectTypeId);
  return (
    <p className="text-2xl font-semibold">
      {records?.length || 0} Records
    </p>
  );
}
