
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useApplications } from "@/hooks/useApplications";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useApplicationObjects } from "@/hooks/useApplicationObjects";
import { useActions } from "@/hooks/useActions";
import { usePublishedApplications } from "@/hooks/usePublishedApplications";
import { ArrowLeft, Check, Loader2, Share } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function ApplicationPublishPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { applications, isLoading: isLoadingApplications } = useApplications();
  const { applicationObjects, isLoading: isLoadingObjects } = useApplicationObjects(applicationId);
  const { actions, isLoading: isLoadingActions } = useActions();
  const { publishApplication } = usePublishedApplications();
  
  const [currentApplication, setCurrentApplication] = useState<any>(null);
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [publishingParams, setPublishingParams] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Find the current application and available objects
  useEffect(() => {
    if (applications && applicationId) {
      const app = applications.find(a => a.id === applicationId);
      if (app) {
        setCurrentApplication(app);
        
        // Get any publishing params from state
        const params = history.state?.publishingParams;
        if (params) {
          setPublishingParams(params);
        }
      } else {
        // Application not found, redirect to applications list
        navigate("/applications");
        toast.error("Application not found");
      }
    }
  }, [applications, applicationId, navigate]);
  
  // Pre-select all objects when they load
  useEffect(() => {
    if (applicationObjects && applicationObjects.length > 0) {
      setSelectedObjectIds(applicationObjects.map(obj => obj.id));
    }
  }, [applicationObjects]);
  
  // Get all actions related to the selected objects
  useEffect(() => {
    if (actions && applicationObjects && selectedObjectIds.length > 0) {
      // Find actions that target any of the selected objects
      const relevantActions = actions.filter(action => 
        selectedObjectIds.includes(action.target_object_id)
      );
      
      setSelectedActionIds(relevantActions.map(action => action.id));
    }
  }, [actions, applicationObjects, selectedObjectIds]);
  
  if (isLoadingApplications || !currentApplication) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  const handleToggleObject = (objectId: string) => {
    setSelectedObjectIds(prev => {
      if (prev.includes(objectId)) {
        return prev.filter(id => id !== objectId);
      } else {
        return [...prev, objectId];
      }
    });
  };
  
  const handleToggleAction = (actionId: string) => {
    setSelectedActionIds(prev => {
      if (prev.includes(actionId)) {
        return prev.filter(id => id !== actionId);
      } else {
        return [...prev, actionId];
      }
    });
  };
  
  const handleSelectAllObjects = (checked: boolean) => {
    if (checked && applicationObjects) {
      setSelectedObjectIds(applicationObjects.map(obj => obj.id));
    } else {
      setSelectedObjectIds([]);
    }
  };
  
  const handleSelectAllActions = (checked: boolean) => {
    if (checked && actions) {
      const relevantActions = actions.filter(action => 
        selectedObjectIds.includes(action.target_object_id)
      );
      setSelectedActionIds(relevantActions.map(action => action.id));
    } else {
      setSelectedActionIds([]);
    }
  };
  
  const handlePublish = async () => {
    if (!publishingParams) {
      toast.error("Missing publication details");
      return;
    }
    
    if (selectedObjectIds.length === 0) {
      toast.error("Please select at least one object to publish");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await publishApplication.mutateAsync({
        applicationId: applicationId!,
        name: publishingParams.name,
        description: publishingParams.description,
        isPublic: publishingParams.isPublic,
        version: publishingParams.version,
        includedObjectIds: selectedObjectIds,
        includedActionIds: selectedActionIds
      });
      
      navigate(`/applications/${applicationId}`);
    } catch (error) {
      console.error("Error publishing application:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Filter actions to only show those targeting selected objects
  const filteredActions = actions?.filter(action => 
    selectedObjectIds.includes(action.target_object_id)
  ) || [];
  
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate(`/applications/${applicationId}`)} 
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader 
            title={`Publish Application: ${currentApplication.name}`}
            description="Select which objects and actions to include in this publication"
          />
        </div>
      </div>

      <Tabs defaultValue="objects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="objects">Objects</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="review">Review & Publish</TabsTrigger>
        </TabsList>
        
        <TabsContent value="objects">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Select Objects to Include</span>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="select-all-objects"
                    checked={applicationObjects?.length > 0 && selectedObjectIds.length === applicationObjects?.length}
                    onCheckedChange={handleSelectAllObjects}
                  />
                  <label htmlFor="select-all-objects" className="text-sm font-normal">
                    Select All
                  </label>
                </div>
              </CardTitle>
              <CardDescription>
                Select the objects you want to include in this publication. The fields for these objects will also be included.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingObjects ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-400px)] pr-4">
                  <div className="space-y-4">
                    {applicationObjects?.length ? (
                      applicationObjects.map(obj => (
                        <div key={obj.id} className="flex items-center space-x-3 p-3 border rounded-md">
                          <Checkbox 
                            id={`object-${obj.id}`}
                            checked={selectedObjectIds.includes(obj.id)}
                            onCheckedChange={() => handleToggleObject(obj.id)}
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={`object-${obj.id}`} 
                              className="text-sm font-medium cursor-pointer flex flex-col"
                            >
                              <span>{obj.name}</span>
                              <span className="text-xs text-muted-foreground">{obj.api_name}</span>
                            </label>
                          </div>
                          {obj.is_system && <Badge variant="outline">System</Badge>}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No objects found in this application.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Select Actions to Include</span>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="select-all-actions"
                    checked={filteredActions.length > 0 && selectedActionIds.length === filteredActions.length}
                    onCheckedChange={handleSelectAllActions}
                  />
                  <label htmlFor="select-all-actions" className="text-sm font-normal">
                    Select All
                  </label>
                </div>
              </CardTitle>
              <CardDescription>
                Select the actions related to your chosen objects that you want to include in this publication.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingActions ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-400px)] pr-4">
                  <div className="space-y-4">
                    {filteredActions.length > 0 ? (
                      filteredActions.map(action => (
                        <div key={action.id} className="flex items-center space-x-3 p-3 border rounded-md">
                          <Checkbox 
                            id={`action-${action.id}`}
                            checked={selectedActionIds.includes(action.id)}
                            onCheckedChange={() => handleToggleAction(action.id)}
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={`action-${action.id}`} 
                              className="text-sm font-medium cursor-pointer flex flex-col"
                            >
                              <span>{action.name}</span>
                              <span className="text-xs text-muted-foreground">{action.description || "No description"}</span>
                            </label>
                          </div>
                          <Badge variant={action.color as any || "default"} className="capitalize">
                            {action.action_type}
                          </Badge>
                        </div>
                      ))
                    ) : selectedObjectIds.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Please select some objects first to see related actions.
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No actions found for the selected objects.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle>Review & Publish</CardTitle>
              <CardDescription>
                Review your selections and publish your application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Publication Details</h3>
                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Name:</div>
                      <div>{publishingParams?.name || currentApplication.name}</div>
                      
                      <div className="text-muted-foreground">Description:</div>
                      <div>{publishingParams?.description || "No description"}</div>
                      
                      <div className="text-muted-foreground">Version:</div>
                      <div>{publishingParams?.version || "1.0"}</div>
                      
                      <div className="text-muted-foreground">Visibility:</div>
                      <div>{publishingParams?.isPublic ? "Public" : "Private"}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Selected Objects ({selectedObjectIds.length})</h3>
                  <div className="bg-muted/50 p-3 rounded-md">
                    {selectedObjectIds.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {applicationObjects?.filter(obj => selectedObjectIds.includes(obj.id))
                          .map(obj => (
                            <Badge key={obj.id} variant="outline" className="text-xs">
                              {obj.name}
                            </Badge>
                          ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No objects selected</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Selected Actions ({selectedActionIds.length})</h3>
                  <div className="bg-muted/50 p-3 rounded-md">
                    {selectedActionIds.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {filteredActions.filter(action => selectedActionIds.includes(action.id))
                          .map(action => (
                            <Badge key={action.id} variant="outline" className="text-xs">
                              {action.name}
                            </Badge>
                          ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No actions selected</div>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/applications/${applicationId}`)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePublish}
                    disabled={isSubmitting || selectedObjectIds.length === 0}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Share className="mr-2 h-4 w-4" />
                    Publish Application
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
