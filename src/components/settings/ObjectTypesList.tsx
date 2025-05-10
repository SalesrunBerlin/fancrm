
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Building, User, Briefcase, Calendar, Box } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ObjectTypeForm } from "./ObjectTypeForm";
import { Badge } from "@/components/ui/badge";
import { ObjectType } from "@/hooks/useObjectTypes";
import { ThemedButton } from "@/components/ui/themed-button";
import { useAuth } from "@/contexts/AuthContext";
import { ActionColor } from "@/hooks/useActions";
import { ObjectCountBadge } from "@/components/dashboard/ObjectCountBadge";

export function ObjectTypesList() {
  const { objectTypes, isLoading } = useObjectTypes();
  const { favoriteColor } = useAuth();

  const getIconComponent = (iconName: string | null) => {
    switch(iconName) {
      case 'user': return <User className="h-5 w-5" />;
      case 'building': return <Building className="h-5 w-5" />;
      case 'briefcase': return <Briefcase className="h-5 w-5" />;
      case 'calendar': return <Calendar className="h-5 w-5" />;
      default: return <Box className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const hasObjects = objectTypes && objectTypes.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl">Object Types</CardTitle>
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <ThemedButton>
                <Plus className="mr-2 h-4 w-4" />
                Create Object
              </ThemedButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Object Type</DialogTitle>
              </DialogHeader>
              <ObjectTypeForm />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {hasObjects ? (
          <div className="space-y-4">
            {objectTypes.map((objectType: ObjectType) => (
              <Link 
                to={`/settings/objects/${objectType.id}`} 
                key={objectType.id}
                className="block"
              >
                <div
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors relative"
                >
                  <div className="flex items-center gap-3">
                    {getIconComponent(objectType.icon)}
                    <div>
                      <h3 className="font-medium">{objectType.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {objectType.description || `API Name: ${objectType.api_name}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    {/* Add total record count badge */}
                    <ObjectCountBadge objectTypeId={objectType.id} className="mr-2" />
                    
                    {objectType.is_system && (
                      <Badge variant="secondary">System</Badge>
                    )}
                    {objectType.is_published && (
                      <Badge variant="outline">Published</Badge>
                    )}
                    {objectType.is_template && (
                      <Badge variant="outline" className="bg-purple-100">Imported</Badge>
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
            <Dialog>
              <DialogTrigger asChild>
                <ThemedButton>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Object
                </ThemedButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Object Type</DialogTitle>
                </DialogHeader>
                <ObjectTypeForm />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
