
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useInitializeObjects } from "@/hooks/useInitializeObjects";
import { Loader2, Plus } from "lucide-react";
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
              <div
                key={objectType.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-medium">{objectType.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {objectType.description}
                  </p>
                </div>
                {objectType.is_system && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    System
                  </span>
                )}
              </div>
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
