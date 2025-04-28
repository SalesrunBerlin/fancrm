
import { useEffect, useState } from "react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { FileText, Download, Loader2, Box, User, Building, Briefcase, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ObjectType } from "@/hooks/useObjectTypes";
import { Badge } from "@/components/ui/badge";

export default function Structures() {
  const { 
    objectTypes, 
    isLoading, 
    publishedObjects, 
    isLoadingPublished, 
    importObjectType, 
    deleteSystemObjects 
  } = useObjectTypes();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);

  const getIconComponent = (iconName: string | null) => {
    switch(iconName) {
      case 'user': return <User className="h-5 w-5" />;
      case 'building': return <Building className="h-5 w-5" />;
      case 'briefcase': return <Briefcase className="h-5 w-5" />;
      case 'calendar': return <Calendar className="h-5 w-5" />;
      default: return <Box className="h-5 w-5" />;
    }
  };

  const handleImport = async () => {
    if (!selectedObjectId) return;
    
    try {
      await importObjectType.mutateAsync(selectedObjectId);
      setShowImportDialog(false);
      setSelectedObjectId(null);
    } catch (error) {
      console.error("Error importing object:", error);
    }
  };

  const handleCleanup = async () => {
    try {
      await deleteSystemObjects.mutateAsync();
      setShowCleanupDialog(false);
    } catch (error) {
      console.error("Error cleaning up system objects:", error);
    }
  };
  
  // Check if there are any system objects
  const hasSystemObjects = objectTypes?.some(obj => obj.is_system) || false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">Structures</h1>
        </div>
        {hasSystemObjects && (
          <Button variant="destructive" onClick={() => setShowCleanupDialog(true)}>
            Remove System Objects
          </Button>
        )}
      </div>

      <Tabs defaultValue="my-objects">
        <TabsList>
          <TabsTrigger value="my-objects">My Objects</TabsTrigger>
          <TabsTrigger value="published">Published Objects</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-objects" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <Card className="col-span-full h-40 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </Card>
            ) : objectTypes && objectTypes.length > 0 ? (
              objectTypes.map((objectType: ObjectType) => (
                <Card key={objectType.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getIconComponent(objectType.icon)}
                        <CardTitle>{objectType.name}</CardTitle>
                      </div>
                      <div className="flex gap-1">
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
                    <CardDescription>
                      {objectType.description || `API Name: ${objectType.api_name}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {objectType.is_active ? "Active" : "Inactive"}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-2 mt-auto">
                    <Link to={`/settings/objects/${objectType.id}`} className="w-full">
                      <Button variant="outline" className="w-full">
                        Manage
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">
                    No objects found. Create custom objects in Settings.
                  </p>
                  <div className="mt-4">
                    <Link to="/settings">
                      <Button>Go to Settings</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="published" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingPublished ? (
              <Card className="col-span-full h-40 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </Card>
            ) : publishedObjects && publishedObjects.length > 0 ? (
              publishedObjects.map((objectType: ObjectType) => (
                <Card key={objectType.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      {getIconComponent(objectType.icon)}
                      <CardTitle>{objectType.name}</CardTitle>
                    </div>
                    <CardDescription>
                      {objectType.description || `API Name: ${objectType.api_name}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Published by another user
                    </p>
                  </CardContent>
                  <CardFooter className="pt-2 mt-auto">
                    <Button 
                      variant="outline" 
                      className="w-full flex gap-2"
                      onClick={() => {
                        setSelectedObjectId(objectType.id);
                        setShowImportDialog(true);
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Import
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">
                    No published objects available for import.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Object Structure</DialogTitle>
            <DialogDescription>
              This will create a copy of the object structure in your account.
              All fields and picklist values will be included.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowImportDialog(false);
              setSelectedObjectId(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={importObjectType.isPending}>
              {importObjectType.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cleanup Dialog */}
      <Dialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove System Objects</DialogTitle>
            <DialogDescription>
              This will delete all system objects (Accounts, Contacts, Deals, Activities) and their related data.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCleanupDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCleanup} 
              disabled={deleteSystemObjects.isPending}
            >
              {deleteSystemObjects.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove System Objects
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
