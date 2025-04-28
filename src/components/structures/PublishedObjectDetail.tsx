
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
import { ArrowLeft, Box, Download, Loader2 } from "lucide-react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { ObjectField } from "@/hooks/useObjectTypes";

export function PublishedObjectDetail() {
  const { objectId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("details");
  const { importObjectType } = useObjectTypes();
  const [isImporting, setIsImporting] = useState(false);

  // Fetch object type details
  const { 
    data: objectType, 
    isLoading: isObjectLoading 
  } = useQuery({
    queryKey: ["published-object-detail", objectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("object_types")
        .select("*")
        .eq("id", objectId)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!objectId,
  });

  // Fetch object fields with publishing info
  const { 
    data: fields, 
    isLoading: isFieldsLoading 
  } = useQuery({
    queryKey: ["published-object-fields", objectId],
    queryFn: async () => {
      const { data: objectFields, error: fieldsError } = await supabase
        .from("object_fields")
        .select("*")
        .eq("object_type_id", objectId)
        .order("display_order");

      if (fieldsError) throw fieldsError;

      const { data: publishingSettings, error: publishingError } = await supabase
        .from("object_field_publishing")
        .select("*")
        .eq("object_type_id", objectId);

      if (publishingError) throw publishingError;

      // Map publishing settings to fields
      const publishingMap = new Map();
      publishingSettings?.forEach(setting => {
        publishingMap.set(setting.field_id, setting.is_included);
      });

      // Filter fields by publishing settings
      return objectFields
        .filter(field => publishingMap.has(field.id) ? publishingMap.get(field.id) : true)
        .map(field => ({ 
          ...field, 
          isPublished: publishingMap.has(field.id) ? publishingMap.get(field.id) : true
        }));
    },
    enabled: !!objectId,
  });

  const handleImport = async () => {
    if (!objectId) return;
    
    setIsImporting(true);
    try {
      await importObjectType.mutateAsync(objectId);
      navigate("/structures", { replace: true });
    } catch (error) {
      console.error("Error importing object:", error);
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
        <Button 
          className="flex items-center gap-2" 
          onClick={handleImport}
          disabled={isImporting}
        >
          {isImporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Import Object
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {getIconComponent(objectType.icon)}
        <h1 className="text-3xl font-bold tracking-tight">{objectType.name}</h1>
        <Badge variant="outline" className="ml-2">Published</Badge>
      </div>

      {objectType.description && (
        <p className="text-muted-foreground">{objectType.description}</p>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="fields">Fields</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Object Type Details</CardTitle>
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
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Fields</CardTitle>
              <CardDescription>
                Fields that will be imported with this object type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isFieldsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
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
                    {fields?.length ? (
                      fields.filter(f => f.isPublished).map(field => (
                        <TableRow key={field.id}>
                          <TableCell>{field.name}</TableCell>
                          <TableCell>{field.api_name}</TableCell>
                          <TableCell>{field.data_type}</TableCell>
                          <TableCell>{field.is_required ? 'Yes' : 'No'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          No fields available for this object
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
