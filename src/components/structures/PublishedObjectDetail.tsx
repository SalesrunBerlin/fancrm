
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, Box, Download, Loader2, RefreshCw } from "lucide-react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function PublishedObjectDetail() {
  const { objectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const { importObjectType, refreshPublishedObjects } = useObjectTypes();
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch object type details with additional logging
  const { 
    data: objectType, 
    isLoading: isObjectLoading,
    refetch: refetchObject
  } = useQuery({
    queryKey: ["published-object-detail", objectId],
    queryFn: async () => {
      console.log("Fetching published object detail:", objectId);
      
      try {
        const { data, error } = await supabase
          .from("object_types")
          .select("*")
          .eq("id", objectId)
          .eq("is_published", true)
          .single();

        if (error) {
          console.error("Error fetching published object:", error);
          throw error;
        }
        
        console.log("Published object fetched:", data?.name);
        return data;
      } catch (error) {
        console.error("Exception in published object detail fetch:", error);
        throw error;
      }
    },
    enabled: !!objectId,
  });

  // Fetch object fields with publishing info - improved to better handle empty publishing settings
  const { 
    data: fields, 
    isLoading: isFieldsLoading,
    refetch: refetchFields,
    error: fieldsError 
  } = useQuery({
    queryKey: ["published-object-fields", objectId],
    queryFn: async () => {
      console.log("Fetching fields for published object:", objectId);
      
      try {
        // First, check if the object is published
        const { data: objCheck, error: objError } = await supabase
          .from("object_types")
          .select("is_published, owner_id")
          .eq("id", objectId)
          .single();
  
        if (objError || !objCheck?.is_published) {
          console.error("Object is not published or error:", objError);
          throw new Error(objError?.message || "Object not found or not published");
        }
        
        console.log("Object owner_id:", objCheck.owner_id);
        
        // Get all fields for the object
        const { data: objectFields, error: fieldsError } = await supabase
          .from("object_fields")
          .select("*")
          .eq("object_type_id", objectId)
          .order("display_order");
  
        if (fieldsError) {
          console.error("Error fetching fields:", fieldsError);
          throw fieldsError;
        }
        
        console.log("Published object fields fetched:", objectFields?.length || 0);
  
        // Get publishing settings to filter fields
        const { data: publishingSettings, error: publishingError } = await supabase
          .from("object_field_publishing")
          .select("*")
          .eq("object_type_id", objectId);
  
        if (publishingError) {
          console.error("Error fetching publishing settings:", publishingError);
          console.warn("Proceeding without publishing settings");
        } else {
          console.log("Publishing settings fetched:", publishingSettings?.length || 0);
        }
        
        // Map publishing settings to fields
        const publishingMap = new Map();
        publishingSettings?.forEach(setting => {
          publishingMap.set(setting.field_id, setting.is_included);
        });
  
        // If we have specific publishingSettings and it's not empty, use them to filter
        // Otherwise, show all fields for a published object
        let finalFields = objectFields;
        
        if (publishingSettings && publishingSettings.length > 0) {
          finalFields = objectFields
            .filter(field => {
              const isIncluded = publishingMap.has(field.id) ? publishingMap.get(field.id) : true;
              return isIncluded;
            })
            .map(field => ({ 
              ...field, 
              isPublished: publishingMap.has(field.id) ? publishingMap.get(field.id) : true
            }));
          
          console.log("Filtered fields by publishing settings:", finalFields.length);
        } else {
          console.log("No publishing settings found, showing all fields");
        }
        
        return finalFields;
      } catch (error) {
        console.error("Error in published object fields query:", error);
        throw error;
      }
    },
    enabled: !!objectId,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // First refresh the published objects view
      await refreshPublishedObjects();
      
      // Then refetch this specific object and its fields
      await refetchObject();
      await refetchFields();
      
      toast({
        title: "Refreshed",
        description: "Object details have been refreshed"
      });
    } catch (error) {
      console.error("Error refreshing object details:", error);
      toast({
        title: "Error",
        description: "Failed to refresh object details",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleImport = async () => {
    if (!objectId) return;
    
    setIsImporting(true);
    setImportError(null);
    
    try {
      await importObjectType.mutateAsync(objectId);
      toast({
        title: "Object imported",
        description: "The object was successfully imported."
      });
      navigate("/structures", { replace: true });
    } catch (error: any) {
      console.error("Error importing object:", error);
      setImportError(error.message || "Error importing the object");
    } finally {
      setIsImporting(false);
    }
  };

  // Get icon component for the object
  const getIconComponent = (iconName: string | null) => {
    switch(iconName) {
      default: return <Box className="h-5 w-5" />;
    }
  };

  if (isObjectLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!objectType) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/structures")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Structures
        </Button>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Published object not found or you don't have access to it.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/structures")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Structures
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button 
            onClick={handleImport}
            disabled={isImporting}
          >
            {isImporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Import Object
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {getIconComponent(objectType.icon)}
        <h1 className="text-3xl font-bold tracking-tight">{objectType.name}</h1>
        <Badge variant="outline" className="ml-2">Published</Badge>
      </div>

      {objectType.description && (
        <p className="text-muted-foreground">{objectType.description}</p>
      )}

      {importError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{importError}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="fields">Fields</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Object Details</CardTitle>
              <CardDescription>Basic information about this object type</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4 divide-y">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 first:pt-0">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">API Name</dt>
                    <dd className="mt-1 text-sm">{objectType.api_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Default Display Field</dt>
                    <dd className="mt-1 text-sm">{objectType.default_field_api_name || 'Not set'}</dd>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Owner ID</dt>
                    <dd className="mt-1 text-sm">{objectType.owner_id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Created At</dt>
                    <dd className="mt-1 text-sm">{new Date(objectType.created_at).toLocaleString()}</dd>
                  </div>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fields</CardTitle>
                <CardDescription>
                  Fields that will be imported with this object type
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {isFieldsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : fieldsError ? (
                <Alert variant="destructive" className="my-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error loading fields: {fieldsError.message}
                  </AlertDescription>
                </Alert>
              ) : fields && fields.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field Name</TableHead>
                        <TableHead>API Name</TableHead>
                        <TableHead>Data Type</TableHead>
                        <TableHead>Required</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map(field => (
                        <TableRow key={field.id}>
                          <TableCell>{field.name}</TableCell>
                          <TableCell>{field.api_name}</TableCell>
                          <TableCell>{field.data_type}</TableCell>
                          <TableCell>{field.is_required ? 'Yes' : 'No'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">
                    No fields available or published for this object.
                  </p>
                  <Alert variant="default" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      The object owner must publish fields for them to be visible here.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
