
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Loader2, Building, User, Briefcase, Calendar, Box } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ObjectType } from "@/hooks/useObjectTypes";

export default function ObjectManager() {
  const { objectTypes, isLoading } = useObjectTypes();

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
    <div className="space-y-6">
      <PageHeader
        title="Object Manager"
        description="Manage all your custom and standard objects"
        actions={
          <Button asChild>
            <Link to="/settings/object-manager/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Object
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>All Objects</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : objectTypes && objectTypes.length > 0 ? (
            <div className="space-y-4">
              {objectTypes.map((objectType: ObjectType) => (
                <Link 
                  to={`/settings/objects/${objectType.id}`} 
                  key={objectType.id}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                    <div className="flex items-center gap-3">
                      {getIconComponent(objectType.icon)}
                      <div>
                        <h3 className="font-medium">{objectType.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {objectType.description || `API Name: ${objectType.api_name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {objectType.is_system && (
                        <Badge variant="secondary">System</Badge>
                      )}
                      {objectType.is_published && (
                        <Badge variant="outline">Published</Badge>
                      )}
                      {objectType.is_template && (
                        <Badge variant="outline" className="bg-purple-100">Imported</Badge>
                      )}
                      {!objectType.is_active && (
                        <Badge variant="outline" className="bg-red-50 text-red-700">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No object types found. Create your first custom object to get started.
              </p>
              <Button asChild>
                <Link to="/settings/object-manager/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Object
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
