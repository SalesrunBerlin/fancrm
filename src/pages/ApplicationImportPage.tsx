
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePublishedApplications } from "@/hooks/usePublishedApplications";
import { useApplicationImport } from "@/hooks/useApplicationImport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";

export default function ApplicationImportPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { usePublishedApplicationDetails } = usePublishedApplications();
  const { data: application, isLoading } = usePublishedApplicationDetails(applicationId);
  const { importApplication } = useApplicationImport();
  
  const [loading, setLoading] = useState(false);
  const [selectedObjects, setSelectedObjects] = useState<Record<string, boolean>>({});
  const [selectedActions, setSelectedActions] = useState<Record<string, boolean>>({});

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
      
      await importApplication.mutateAsync({
        publishedApplicationId: applicationId,
        selectedObjectIds,
        selectedActionIds
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

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate("/structures")} 
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
          <CardTitle>Application Details</CardTitle>
          <CardDescription>
            {application.description || "No description provided"}
          </CardDescription>
          <div className="flex gap-2 mt-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Publisher:</span>{" "}
              {application.publisher?.user_metadata?.full_name || application.publisher?.email || "Unknown"}
            </div>
            {application.version && (
              <div className="text-sm">
                <span className="text-muted-foreground">Version:</span> {application.version}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="objects" className="space-y-4">
            <TabsList>
              <TabsTrigger value="objects">Objects ({application.objects?.length || 0})</TabsTrigger>
              <TabsTrigger value="actions">Actions ({application.actions?.length || 0})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="objects">
              {application.objects && application.objects.length > 0 ? (
                <div className="space-y-2">
                  {application.objects.map(obj => (
                    <div key={obj.object_type_id} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox
                        id={`object-${obj.object_type_id}`}
                        checked={selectedObjects[obj.object_type_id] || false}
                        onCheckedChange={(checked) => toggleObjectSelection(obj.object_type_id, !!checked)}
                      />
                      <label
                        htmlFor={`object-${obj.object_type_id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {obj.object_type?.name || obj.object_type_id}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No objects available in this application</p>
              )}
            </TabsContent>
            
            <TabsContent value="actions">
              {application.actions && application.actions.length > 0 ? (
                <div className="space-y-2">
                  {application.actions.map(action => (
                    <div key={action.action_id} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox
                        id={`action-${action.action_id}`}
                        checked={selectedActions[action.action_id] || false}
                        onCheckedChange={(checked) => toggleActionSelection(action.action_id, !!checked)}
                      />
                      <label
                        htmlFor={`action-${action.action_id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {action.action?.name || action.action_id}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No actions available in this application</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={handleImport} 
            disabled={loading}
            className="ml-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Import Selected
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
