
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useInitializeObjects } from "@/hooks/useInitializeObjects";
import { Loader2, Plus, Building, User, Briefcase, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ObjectTypeForm } from "./ObjectTypeForm";

export function ObjectTypesList() {
  const { objectTypes, isLoading } = useObjectTypes();
  const { initializeObjects } = useInitializeObjects();

  const handleInitialize = async () => {
    await initializeObjects.mutateAsync();
  };

  const getIconComponent = (iconName: string | null) => {
    switch(iconName) {
      case 'user': return <User className="h-5 w-5" />;
      case 'building': return <Building className="h-5 w-5" />;
      case 'briefcase': return <Briefcase className="h-5 w-5" />;
      case 'calendar': return <Calendar className="h-5 w-5" />;
      default: return <Building className="h-5 w-5" />;
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
          {!hasObjects && (
            <Button 
              onClick={handleInitialize}
              disabled={initializeObjects.isPending}
            >
              {initializeObjects.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Initialize Standard Objects
            </Button>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
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
            {objectTypes.map((objectType) => (
              <Link 
                to={`/settings/objects/${objectType.id}`} 
                key={objectType.id}
                className="block"
              >
                <div
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
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
                  {objectType.is_system && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      System
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            No object types found. Initialize standard objects to get started.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
