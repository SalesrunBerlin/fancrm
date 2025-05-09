
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { usePublishedApplications } from "@/hooks/usePublishedApplications";
import { useApplicationImport } from "@/hooks/useApplicationImport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, ArrowLeft, Download, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ApplicationImportPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { usePublishedApplicationDetails } = usePublishedApplications();
  const { data: application, isLoading } = usePublishedApplicationDetails(applicationId);
  const { importApplication, importProgress } = useApplicationImport();
  
  const [loading, setLoading] = useState(false);
  const [selectedObjects, setSelectedObjects] = useState<Record<string, boolean>>({});
  const [selectedActions, setSelectedActions] = useState<Record<string, boolean>>({});
  const [applicationName, setApplicationName] = useState("");

  // Set initial selections when data is loaded
  useEffect(() => {
    if (application?.objects) {
      const initialObjectSelections = application.objects.reduce((acc, obj) => {
        acc[obj.object_type_id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setSelectedObjects(initialObjectSelections);
    }
    
    if (application?.actions) {
      const initialActionSelections = application.actions.reduce((acc, action) => {
        acc[action.action_id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setSelectedActions(initialActionSelections);
    }

    if (application?.name) {
      setApplicationName(`${application.name} (Imported)`);
    }
  }, [application]);

  const handleImport = async () => {
    if (!applicationId) return;
    
    try {
      setLoading(true);
      
      // Get arrays of selected IDs
      const selectedObjectIds = Object.entries(selectedObjects)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id);
      
      const selectedActionIds = Object.entries(selectedActions)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id);

      if (selectedObjectIds.length === 0 && selectedActionIds.length === 0) {
        toast.error("Please select at least one object or action to import");
        setLoading(false);
        return;
      }
      
      await importApplication.mutateAsync({
        publishedApplicationId: applicationId,
        selectedObjectIds,
        selectedActionIds,
        applicationName
      });
      
      // Navigate to applications page after successful import
      navigate("/applications");
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import application");
    } finally {
      setLoading(false);
    }
  };

  const toggleObjectSelection = (id: string, isChecked: boolean) => {
    setSelectedObjects(prev => ({ ...prev, [id]: isChecked }));
  };

  const toggleActionSelection = (id: string, isChecked: boolean) => {
    setSelectedActions(prev => ({ ...prev, [id]: isChecked }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." description="Loading application details" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="space-y-6">
        <PageHeader title="Application Not Found" description="The requested application could not be found" />
        <Button onClick={() => navigate("/applications")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Applications
        </Button>
      </div>
    );
  }

  const isImportInProgress = importProgress.totalSteps > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate("/applications")} 
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader 
          title={`Import ${application.name}`}
          description="Select components to import from this application"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{application.name}</CardTitle>
              <CardDescription className="mt-1">
                {application.description || "No description provided"}
              </CardDescription>
            </div>
            <Badge 
              variant={application.is_public ? "success" : "outline"} 
              className="flex items-center gap-1"
            >
              {application.is_public ? (
                <>
                  <Globe className="h-3 w-3" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  <span>Private</span>
                </>
              )}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Publisher:</span>{" "}
              {application.publisher?.user_metadata?.full_name || application.publisher?.email || "Unknown"}
            </div>
            {application.version && (
              <div>
                <span className="font-medium">Version:</span> {application.version}
              </div>
            )}
          </div>
        </CardHeader>

        {!application.is_public && !applicationId && (
          <CardContent>
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>This is a private application</AlertTitle>
              <AlertDescription>
                This application is set to private and is only visible to you because you are the publisher.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}

        <CardContent>
          {isImportInProgress && (
            <div className="mb-6 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{importProgress.currentStep}</span>
                <span>{importProgress.currentStepNumber} of {importProgress.totalSteps}</span>
              </div>
              <Progress 
                value={(importProgress.currentStepNumber / importProgress.totalSteps) * 100} 
                className="h-2" 
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="applicationName" className="block text-sm font-medium mb-1">
                Application Name
              </label>
              <Input
                id="applicationName"
                value={applicationName}
                onChange={(e) => setApplicationName(e.target.value)}
                placeholder="Enter application name"
                disabled={loading || isImportInProgress}
                className="max-w-md"
              />
            </div>

            <Tabs defaultValue="objects" className="space-y-4">
              <TabsList>
                <TabsTrigger value="objects">Objects ({application.objects?.length || 0})</TabsTrigger>
                <TabsTrigger value="actions">Actions ({application.actions?.length || 0})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="objects">
                {application.objects && application.objects.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-end mb-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const newSelection = {} as Record<string, boolean>;
                          application.objects?.forEach(obj => {
                            newSelection[obj.object_type_id] = true;
                          });
                          setSelectedObjects(newSelection);
                        }}
                        disabled={loading || isImportInProgress}
                      >
                        Select All
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedObjects({})}
                        className="ml-2"
                        disabled={loading || isImportInProgress}
                      >
                        Deselect All
                      </Button>
                    </div>
                    {application.objects.map(obj => (
                      <div key={obj.object_type_id} className="flex items-center space-x-2 p-3 border rounded hover:bg-muted/50">
                        <Checkbox
                          id={`object-${obj.object_type_id}`}
                          checked={selectedObjects[obj.object_type_id] || false}
                          onCheckedChange={(checked) => toggleObjectSelection(obj.object_type_id, !!checked)}
                          disabled={loading || isImportInProgress}
                        />
                        <div className="flex flex-col">
                          <label
                            htmlFor={`object-${obj.object_type_id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {obj.object_type?.name || "Unnamed Object"}
                          </label>
                          {obj.object_type?.api_name && (
                            <span className="text-xs text-muted-foreground mt-1">
                              API Name: {obj.object_type.api_name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded">
                    <p className="text-muted-foreground">No objects available in this application</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="actions">
                {application.actions && application.actions.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-end mb-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const newSelection = {} as Record<string, boolean>;
                          application.actions?.forEach(action => {
                            newSelection[action.action_id] = true;
                          });
                          setSelectedActions(newSelection);
                        }}
                        disabled={loading || isImportInProgress}
                      >
                        Select All
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedActions({})}
                        className="ml-2"
                        disabled={loading || isImportInProgress}
                      >
                        Deselect All
                      </Button>
                    </div>
                    {application.actions.map(action => (
                      <div key={action.action_id} className="flex items-center space-x-2 p-3 border rounded hover:bg-muted/50">
                        <Checkbox
                          id={`action-${action.action_id}`}
                          checked={selectedActions[action.action_id] || false}
                          onCheckedChange={(checked) => toggleActionSelection(action.action_id, !!checked)}
                          disabled={loading || isImportInProgress}
                        />
                        <div className="flex flex-col">
                          <label
                            htmlFor={`action-${action.action_id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {action.action?.name || "Unnamed Action"}
                          </label>
                          {action.action?.description && (
                            <span className="text-xs text-muted-foreground mt-1">
                              {action.action.description}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded">
                    <p className="text-muted-foreground">No actions available in this application</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={handleImport} 
            disabled={loading || isImportInProgress}
            className="ml-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            {loading || isImportInProgress ? "Importing..." : "Import Selected"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
