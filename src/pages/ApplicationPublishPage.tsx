
import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useApplications } from "@/hooks/useApplications";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useApplicationObjects } from "@/hooks/useApplicationObjects";
import { useActions } from "@/hooks/useActions";
import { usePublishedApplications, PublishedField } from "@/hooks/usePublishedApplications";
import { ArrowLeft, Check, Loader2, Share, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface PublishingParams {
  name: string;
  description: string;
  isPublic: boolean;
  version: string;
}

export default function ApplicationPublishPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { applications, isLoading: isLoadingApplications } = useApplications();
  const { applicationObjects, isLoading: isLoadingObjects } = useApplicationObjects(applicationId);
  const { actions, isLoading: isLoadingActions } = useActions();
  const { publishApplication, updatePublishedApplication, getObjectFields } = usePublishedApplications();
  
  const [currentApplication, setCurrentApplication] = useState<any>(null);
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [publishingParams, setPublishingParams] = useState<PublishingParams | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdate] = useState(location.state?.isUpdate || false);
  const [publishedAppId] = useState(location.state?.publishedAppId || null);
  const [objectFields, setObjectFields] = useState<Record<string, PublishedField[]>>({});
  const [fieldSelections, setFieldSelections] = useState<Record<string, Record<string, boolean>>>({});
  const [loadingFields, setLoadingFields] = useState<Record<string, boolean>>({});
  
  // Find the current application and available objects
  useEffect(() => {
    if (applications && applicationId) {
      const app = applications.find(a => a.id === applicationId);
      if (app) {
        setCurrentApplication(app);
        
        // Get publishing params from state
        const params = location.state?.publishingParams;
        if (params) {
          setPublishingParams(params);
        } else {
          // If no params found, redirect to settings page
          navigate(`/applications/${applicationId}/publish-settings`);
          toast.error("Publication settings required");
        }
      } else {
        // Application not found, redirect to applications list
        navigate("/applications");
        toast.error("Application not found");
      }
    }
  }, [applications, applicationId, navigate, location.state]);
  
  // Pre-select all objects when they load
  useEffect(() => {
    if (applicationObjects && applicationObjects.length > 0) {
      setSelectedObjectIds(applicationObjects.map(obj => obj.id));
      
      // Load fields for each object
      applicationObjects.forEach(obj => {
        loadObjectFields(obj.id);
      });
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
  
  // Load fields for a specific object
  const loadObjectFields = async (objectId: string) => {
    try {
      setLoadingFields(prev => ({ ...prev, [objectId]: true }));
      
      // Load publishing configuration for this object's fields
      const { data: existingConfig, error: configError } = await supabase
        .from("object_field_publishing")
        .select("*")
        .eq("object_type_id", objectId);
      
      if (configError) {
        throw configError;
      }
      
      // Create map of field_id to publishing status
      const fieldPublishingMap = existingConfig.reduce((acc: Record<string, boolean>, item: any) => {
        acc[item.field_id] = item.is_included;
        return acc;
      }, {});
      
      // Get the fields for this object
      const fields = await getObjectFields(objectId);
      setObjectFields(prev => ({ ...prev, [objectId]: fields }));
      
      // Initialize field selections based on current publishing config
      const selectionsForObject = fields.reduce((acc: Record<string, boolean>, field) => {
        // Use existing publishing status if available, otherwise default to true
        acc[field.field_id] = fieldPublishingMap[field.field_id] !== undefined 
          ? fieldPublishingMap[field.field_id] 
          : true;
        return acc;
      }, {});
      
      setFieldSelections(prev => ({ 
        ...prev, 
        [objectId]: selectionsForObject 
      }));
    } catch (error) {
      console.error("Error loading object fields:", error);
      toast.error("Failed to load object fields");
    } finally {
      setLoadingFields(prev => ({ ...prev, [objectId]: false }));
    }
  };
  
  if (isLoadingApplications || !currentApplication || !publishingParams) {
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
        // When adding an object, load its fields if not loaded yet
        if (!objectFields[objectId]) {
          loadObjectFields(objectId);
        }
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

  const handleToggleField = (objectId: string, fieldId: string) => {
    setFieldSelections(prev => ({
      ...prev,
      [objectId]: {
        ...prev[objectId],
        [fieldId]: !prev[objectId]?.[fieldId]
      }
    }));
  };
  
  const handleSelectAllObjects = (checked: boolean) => {
    if (checked && applicationObjects) {
      const newSelectedIds = applicationObjects.map(obj => obj.id);
      setSelectedObjectIds(newSelectedIds);
      
      // Load fields for each newly selected object if not loaded yet
      newSelectedIds.forEach(objId => {
        if (!objectFields[objId]) {
          loadObjectFields(objId);
        }
      });
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

  const handleSelectAllFields = (objectId: string, checked: boolean) => {
    if (!objectFields[objectId]) return;
    
    const updatedSelections = { ...fieldSelections };
    objectFields[objectId].forEach(field => {
      updatedSelections[objectId] = updatedSelections[objectId] || {};
      updatedSelections[objectId][field.field_id] = checked;
    });
    
    setFieldSelections(updatedSelections);
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
      if (isUpdate && publishedAppId) {
        // Update existing published application
        await updatePublishedApplication.mutateAsync({
          id: publishedAppId,
          name: publishingParams.name,
          description: publishingParams.description,
          isPublic: publishingParams.isPublic,
          objectTypeIds: selectedObjectIds,
          actionIds: selectedActionIds,
          fieldSettings: fieldSelections,
          version: publishingParams.version
        });
      } else {
        // Publish new application
        await publishApplication.mutateAsync({
          name: publishingParams.name,
          description: publishingParams.description,
          isPublic: publishingParams.isPublic,
          objectTypeIds: selectedObjectIds,
          actionIds: selectedActionIds,
          fieldSettings: fieldSelections,
          version: publishingParams.version,
          applicationId: applicationId
        });
      }
      
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

  // Get fields for a specific object
  const getSelectedFieldsCount = (objectId: string) => {
    if (!fieldSelections[objectId]) return 0;
    return Object.values(fieldSelections[objectId]).filter(Boolean).length;
  };

  const getTotalFieldsCount = (objectId: string) => {
    return objectFields[objectId]?.length || 0;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate(`/applications/${applicationId}/publish-settings`)} 
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader 
            title={isUpdate 
              ? `Update Published Application: ${currentApplication.name}`
              : `Publish Application: ${currentApplication.name}`
            }
            description={isUpdate
              ? "Select which objects, fields, and actions to include in this update"
              : "Select which objects, fields, and actions to include in this publication"
            }
          />
        </div>
      </div>

      <Tabs defaultValue="objects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="objects">Objects</TabsTrigger>
          <TabsTrigger value="fields">Fields</TabsTrigger>
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
                Select the objects you want to include in this {isUpdate ? "update" : "publication"}. The fields for these objects will also be included.
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
                          <div className="text-xs text-muted-foreground">
                            {selectedObjectIds.includes(obj.id) ? (
                              <span>{getSelectedFieldsCount(obj.id)}/{getTotalFieldsCount(obj.id)} Fields</span>
                            ) : (
                              <span>Not selected</span>
                            )}
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
        
        <TabsContent value="fields">
          <Card>
            <CardHeader>
              <CardTitle>Configure Fields</CardTitle>
              <CardDescription>
                Select which fields to include for each selected object.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedObjectIds.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <h3 className="text-lg font-medium text-gray-600">No objects selected</h3>
                  <p className="text-gray-500 mt-2">
                    Please select at least one object in the Objects tab to configure fields.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-400px)] pr-4">
                  <div className="space-y-8">
                    {selectedObjectIds.map(objectId => {
                      const object = applicationObjects?.find(obj => obj.id === objectId);
                      const fields = objectFields[objectId];
                      const isLoading = loadingFields[objectId];
                      
                      return (
                        <div key={objectId} className="border rounded-md p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="font-medium">{object?.name}</h3>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id={`select-all-fields-${objectId}`}
                                checked={
                                  fields?.length > 0 && 
                                  fieldSelections[objectId] && 
                                  fields?.every(field => fieldSelections[objectId]?.[field.field_id])
                                }
                                onCheckedChange={(checked) => handleSelectAllFields(objectId, !!checked)}
                              />
                              <label htmlFor={`select-all-fields-${objectId}`} className="text-xs font-normal">
                                Select All
                              </label>
                            </div>
                          </div>
                          
                          {isLoading ? (
                            <div className="flex justify-center p-4">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                          ) : !fields || fields.length === 0 ? (
                            <div className="text-center py-4 text-sm text-muted-foreground">
                              No fields found for this object.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {fields.map(field => (
                                <div key={field.field_id} className="flex items-center space-x-2 p-2 border rounded">
                                  <Checkbox 
                                    id={`field-${field.field_id}`}
                                    checked={fieldSelections[objectId]?.[field.field_id] ?? true}
                                    onCheckedChange={() => handleToggleField(objectId, field.field_id)}
                                  />
                                  <div className="flex-1">
                                    <label 
                                      htmlFor={`field-${field.field_id}`} 
                                      className="text-sm cursor-pointer"
                                    >
                                      {field.field?.name || field.field_api_name}
                                    </label>
                                    <div className="flex items-center">
                                      <span className="text-xs text-muted-foreground mr-2">
                                        {field.field_api_name}
                                      </span>
                                      <Badge variant="outline" className="text-[10px]">
                                        {field.field?.data_type}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
                Select the actions related to your chosen objects that you want to include in this {isUpdate ? "update" : "publication"}.
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
              <CardTitle>Review & {isUpdate ? "Update" : "Publish"}</CardTitle>
              <CardDescription>
                Review your selections and {isUpdate ? "update" : "publish"} your application.
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
                              <span className="ml-1 text-muted-foreground">
                                ({getSelectedFieldsCount(obj.id)}/{getTotalFieldsCount(obj.id)} fields)
                              </span>
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
                    {isUpdate ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Update Application
                      </>
                    ) : (
                      <>
                        <Share className="mr-2 h-4 w-4" />
                        Publish Application
                      </>
                    )}
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
