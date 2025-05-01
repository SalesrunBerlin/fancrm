import { useEffect, useState } from "react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  FileText, 
  Download, 
  Loader2, 
  Box, 
  User, 
  Building, 
  Briefcase, 
  Calendar, 
  Eye,
  RefreshCw,
  AlertTriangle,
  Check,
  Info,
  Apps
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
import { PublishingConfigDialog } from "@/components/settings/PublishingConfigDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { toast } from "sonner";
import { ApplicationSelector } from "@/components/import/ApplicationSelector";
import { useImportObjectType } from "@/hooks/useImportObjectType";
import { ObjectCard } from "@/components/structures/ObjectCard";

export default function Structures() {
  const { user } = useAuth();
  const { 
    objectTypes, 
    isLoading, 
    publishedObjects, 
    isLoadingPublished, 
    deleteSystemObjects,
    refreshPublishedObjects
  } = useObjectTypes();
  const importObjectType = useImportObjectType();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedObjectName, setSelectedObjectName] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cleanupStatus, setCleanupStatus] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importInProgress, setImportInProgress] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Current user:", user?.id);
    console.log("Published objects count:", publishedObjects?.length);
  }, [user, publishedObjects]);

  const getIconComponent = (iconName: string | null) => {
    switch(iconName) {
      case 'user': return <User className="h-5 w-5" />;
      case 'building': return <Building className="h-5 w-5" />;
      case 'briefcase': return <Briefcase className="h-5 w-5" />;
      case 'calendar': return <Calendar className="h-5 w-5" />;
      default: return <Box className="h-5 w-5" />;
    }
  };

  const handleRefreshPublishedObjects = async () => {
    setIsRefreshing(true);
    try {
      await refreshPublishedObjects();
      toast.success("Published objects refreshed successfully");
    } catch (error) {
      console.error("Error refreshing published objects:", error);
      toast.error("Failed to refresh published objects");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleImport = async () => {
    if (!selectedObjectId) return;
    
    // Reset import states
    setImportSuccess(false);
    setImportError(null);
    setImportInProgress(true);
    
    try {
      const newObjectId = await importObjectType.mutateAsync({ 
        sourceObjectId: selectedObjectId,
        applicationId: selectedApplicationId
      });
      
      console.log("Import successful, new object ID:", newObjectId);
      
      // Set success state to show success message
      setImportSuccess(true);
      
      // Navigate to the new object after a short delay
      setTimeout(() => {
        setShowImportDialog(false);
        setSelectedObjectId(null);
        setSelectedObjectName(null);
        setSelectedApplicationId(null);
        setImportInProgress(false);
        
        // Navigate to the newly imported object
        if (newObjectId) {
          navigate(`/settings/objects/${newObjectId}`);
        }
      }, 2000);
    } catch (error) {
      console.error("Error importing object:", error);
      setImportError(error instanceof Error ? error.message : "Failed to import object structure");
      setImportInProgress(false);
      // Don't close dialog on error so user can see the error
    }
  };

  const handleCleanup = async () => {
    try {
      setCleanupStatus("Removing system objects...");
      await deleteSystemObjects.mutateAsync();
      setCleanupStatus("System objects successfully removed");
      setTimeout(() => {
        setCleanupStatus(null);
        setShowCleanupDialog(false);
      }, 2000);
    } catch (error) {
      setCleanupStatus("Error removing system objects");
      console.error("Error cleaning up system objects:", error);
    }
  };

  const handlePublish = (objectId: string) => {
    setSelectedObjectId(objectId);
    setShowPublishDialog(true);
  };
  
  const hasSystemObjects = objectTypes?.some(obj => obj.is_system) || false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">Structures</h1>
        </div>
        <div className="flex gap-2">
          {hasSystemObjects && (
            <Button variant="destructive" onClick={() => setShowCleanupDialog(true)}>
              Remove System Objects
            </Button>
          )}
        </div>
      </div>

      {cleanupStatus && (
        <Alert className={cleanupStatus.includes("Error") ? "bg-red-50" : "bg-green-50"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{cleanupStatus}</AlertDescription>
        </Alert>
      )}

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
                <ObjectCard 
                  key={objectType.id} 
                  objectType={objectType}
                  onPublish={handlePublish}
                  showPublishButton={true}
                />
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
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-medium">Objects published by others</h2>
            <Button 
              variant="outline" 
              onClick={handleRefreshPublishedObjects} 
              disabled={isRefreshing}
              size="sm"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>

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
                  <CardFooter className="pt-2 mt-auto flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex gap-2 w-full"
                      onClick={() => navigate(`/settings/objects/${objectType.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex gap-2 w-full"
                      onClick={() => {
                        setSelectedObjectId(objectType.id);
                        setSelectedObjectName(objectType.name);
                        setImportError(null);
                        setImportSuccess(false);
                        setSelectedApplicationId(null);
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
                  <div className="mt-4">
                    <Button variant="outline" onClick={handleRefreshPublishedObjects} disabled={isRefreshing}>
                      {isRefreshing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showImportDialog} onOpenChange={(open) => {
        // Only allow closing if not currently importing
        if (!importInProgress) {
          setShowImportDialog(open);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Object Structure</DialogTitle>
            <DialogDescription>
              {importSuccess ? (
                <div className="flex items-center text-green-600 mt-2">
                  <Check className="h-4 w-4 mr-2" />
                  Object structure imported successfully!
                </div>
              ) : importError ? (
                <div className="flex items-center text-destructive mt-2">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {importError}
                </div>
              ) : (
                <>
                  This will create a copy of {selectedObjectName ? <strong>{selectedObjectName}</strong> : 'the object structure'} in your account.
                  All included fields and picklist values will be imported.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {importError && (
            <Alert variant="destructive" className="my-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center gap-2">
                <Info className="h-4 w-4" /> Please try refreshing the page and try again.
              </AlertDescription>
            </Alert>
          )}
          
          {!importSuccess && !importError && selectedObjectId && (
            <ApplicationSelector 
              objectTypeId={selectedObjectId}
              onSelect={setSelectedApplicationId}
            />
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowImportDialog(false);
                setSelectedObjectId(null);
                setSelectedObjectName(null);
                setSelectedApplicationId(null);
                setImportSuccess(false);
                setImportError(null);
              }} 
              disabled={importInProgress}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={importInProgress || importSuccess}
            >
              {importInProgress ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showPublishDialog && selectedObjectId && (
        <PublishingConfigDialog
          objectTypeId={selectedObjectId}
          open={showPublishDialog}
          onOpenChange={setShowPublishDialog}
          onComplete={() => setSelectedObjectId(null)}
        />
      )}

      <DeleteDialog
        isOpen={showCleanupDialog}
        onClose={() => {
          if (!cleanupStatus) {
            setShowCleanupDialog(false);
          }
        }}
        onConfirm={handleCleanup}
        title="Remove System Objects"
        description="This will delete all system objects (Accounts, Contacts, Deals, Activities) and their related data. This action cannot be undone."
        deleteButtonText="Remove System Objects"
      />
    </div>
  );
}
