
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePublishedApplications } from "@/hooks/usePublishedApplications";
import { useApplicationImport } from "@/hooks/useApplicationImport";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ApplicationImportPage() {
  const navigate = useNavigate();
  const { 
    publishedApplications, 
    isLoadingPublishedApps,
    getPublishedObjects,
    getPublishedActions 
  } = usePublishedApplications();
  const { importApplication } = useApplicationImport();
  
  const [selectedPublicationId, setSelectedPublicationId] = useState<string | null>(null);
  const [selectedPublication, setSelectedPublication] = useState<any>(null);
  const [publishedObjects, setPublishedObjects] = useState<any[]>([]);
  const [publishedActions, setPublishedActions] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load objects and actions when a publication is selected
  useEffect(() => {
    const loadPublicationDetails = async () => {
      if (!selectedPublicationId) return;
      
      setIsLoadingDetails(true);
      try {
        // Find selected publication
        const publication = publishedApplications?.find(p => p.id === selectedPublicationId);
        setSelectedPublication(publication);
        
        // Get objects and actions
        const objects = await getPublishedObjects(selectedPublicationId);
        const actions = await getPublishedActions(selectedPublicationId);
        
        setPublishedObjects(objects);
        setPublishedActions(actions);
        
        // Pre-select all objects and actions
        setSelectedObjectIds(objects.map(obj => obj.object_type_id));
        setSelectedActionIds(actions.map(action => action.action_id));
      } catch (error) {
        console.error("Error loading publication details:", error);
      } finally {
        setIsLoadingDetails(false);
      }
    };
    
    loadPublicationDetails();
  }, [selectedPublicationId, publishedApplications, getPublishedObjects, getPublishedActions]);
  
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
    if (checked) {
      setSelectedObjectIds(publishedObjects.map(obj => obj.object_type_id));
    } else {
      setSelectedObjectIds([]);
    }
  };
  
  const handleSelectAllActions = (checked: boolean) => {
    if (checked) {
      setSelectedActionIds(publishedActions.map(action => action.action_id));
    } else {
      setSelectedActionIds([]);
    }
  };
  
  const handleImport = async () => {
    if (!selectedPublicationId) return;
    
    setIsSubmitting(true);
    try {
      await importApplication.mutateAsync({
        publishedApplicationId: selectedPublicationId,
        selectedObjectIds: selectedObjectIds,
        selectedActionIds: selectedActionIds
      });
      
      navigate("/applications");
    } catch (error) {
      console.error("Error importing application:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
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
            title="Import Application"
            description="Browse and import published applications"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Available Applications</CardTitle>
              <CardDescription>
                Select an application to view details and import
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPublishedApps ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                  <div className="space-y-3">
                    {publishedApplications?.filter(app => app.is_active && app.is_public).length ? (
                      publishedApplications?.filter(app => app.is_active && app.is_public).map(publication => (
                        <div 
                          key={publication.id}
                          className={`p-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors
                            ${selectedPublicationId === publication.id ? "bg-muted/50 border-primary" : ""}`}
                          onClick={() => setSelectedPublicationId(publication.id)}
                        >
                          <div className="font-medium">{publication.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {publication.description || "No description"}
                          </div>
                          <div className="flex items-center mt-2 gap-2">
                            {publication.version && (
                              <Badge variant="outline" className="text-xs">v{publication.version}</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No published applications available.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-8">
          {!selectedPublicationId ? (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center p-8">
                <h3 className="text-lg font-medium mb-2">No Application Selected</h3>
                <p className="text-muted-foreground">
                  Select an application from the list to view details and configure import options.
                </p>
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{selectedPublication?.name}</CardTitle>
                <CardDescription>
                  {selectedPublication?.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDetails ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Tabs defaultValue="objects" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="objects">Objects</TabsTrigger>
                      <TabsTrigger value="actions">Actions</TabsTrigger>
                      <TabsTrigger value="review">Review & Import</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="objects">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium">Select Objects to Import</h3>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="select-all-objects"
                              checked={publishedObjects.length > 0 && selectedObjectIds.length === publishedObjects.length}
                              onCheckedChange={handleSelectAllObjects}
                            />
                            <label htmlFor="select-all-objects" className="text-sm font-normal">
                              Select All
                            </label>
                          </div>
                        </div>
                        
                        <ScrollArea className="h-[calc(100vh-400px)] pr-4">
                          <div className="space-y-3">
                            {publishedObjects.length > 0 ? (
                              publishedObjects.map(obj => (
                                <div key={obj.id} className="flex items-center space-x-3 p-3 border rounded-md">
                                  <Checkbox 
                                    id={`object-${obj.object_type_id}`}
                                    checked={selectedObjectIds.includes(obj.object_type_id)}
                                    onCheckedChange={() => handleToggleObject(obj.object_type_id)}
                                  />
                                  <div className="flex-1">
                                    <label 
                                      htmlFor={`object-${obj.object_type_id}`} 
                                      className="text-sm font-medium cursor-pointer flex flex-col"
                                    >
                                      <span>{obj.object_type?.name}</span>
                                      <span className="text-xs text-muted-foreground">{obj.object_type?.api_name}</span>
                                    </label>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                No objects found in this application.
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="actions">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium">Select Actions to Import</h3>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="select-all-actions"
                              checked={publishedActions.length > 0 && selectedActionIds.length === publishedActions.length}
                              onCheckedChange={handleSelectAllActions}
                            />
                            <label htmlFor="select-all-actions" className="text-sm font-normal">
                              Select All
                            </label>
                          </div>
                        </div>
                        
                        <ScrollArea className="h-[calc(100vh-400px)] pr-4">
                          <div className="space-y-3">
                            {publishedActions.length > 0 ? (
                              publishedActions.map(actionItem => (
                                <div key={actionItem.id} className="flex items-center space-x-3 p-3 border rounded-md">
                                  <Checkbox 
                                    id={`action-${actionItem.action_id}`}
                                    checked={selectedActionIds.includes(actionItem.action_id)}
                                    onCheckedChange={() => handleToggleAction(actionItem.action_id)}
                                  />
                                  <div className="flex-1">
                                    <label 
                                      htmlFor={`action-${actionItem.action_id}`} 
                                      className="text-sm font-medium cursor-pointer flex flex-col"
                                    >
                                      <span>{actionItem.action?.name}</span>
                                      <span className="text-xs text-muted-foreground">{actionItem.action?.description || "No description"}</span>
                                    </label>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                No actions available for import.
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="review">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Selected Objects ({selectedObjectIds.length})</h3>
                          <div className="bg-muted/50 p-3 rounded-md">
                            {selectedObjectIds.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {publishedObjects
                                  .filter(obj => selectedObjectIds.includes(obj.object_type_id))
                                  .map(obj => (
                                    <Badge key={obj.id} variant="outline" className="text-xs">
                                      {obj.object_type?.name}
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
                                {publishedActions
                                  .filter(action => selectedActionIds.includes(action.action_id))
                                  .map(action => (
                                    <Badge key={action.id} variant="outline" className="text-xs">
                                      {action.action?.name}
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
                            onClick={() => navigate("/applications")}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleImport}
                            disabled={isSubmitting || (selectedObjectIds.length === 0 && selectedActionIds.length === 0)}
                          >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Download className="mr-2 h-4 w-4" />
                            Import Application
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
