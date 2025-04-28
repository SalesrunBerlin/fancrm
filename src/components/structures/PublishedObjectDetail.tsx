
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
import { AlertCircle, ArrowLeft, Box, Download, Loader2 } from "lucide-react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { ObjectField } from "@/hooks/useObjectTypes";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function PublishedObjectDetail() {
  const { objectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const { importObjectType } = useObjectTypes();
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

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
    setImportError(null);
    
    try {
      await importObjectType.mutateAsync(objectId);
      toast({
        title: "Objekt importiert",
        description: "Das Objekt wurde erfolgreich importiert."
      });
      navigate("/structures", { replace: true });
    } catch (error: any) {
      console.error("Error importing object:", error);
      setImportError(error.message || "Fehler beim Importieren des Objekts");
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
          Zurück zur Übersicht
        </Button>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Veröffentlichtes Objekt nicht gefunden oder Sie haben keinen Zugriff darauf.
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
          Zurück zur Übersicht
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
          Objekt importieren
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {getIconComponent(objectType.icon)}
        <h1 className="text-3xl font-bold tracking-tight">{objectType.name}</h1>
        <Badge variant="outline" className="ml-2">Veröffentlicht</Badge>
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
          <TabsTrigger value="fields">Felder</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Objekt-Details</CardTitle>
              <CardDescription>Grundlegende Informationen zu diesem Objekttyp</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4 divide-y">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 first:pt-0">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">API-Name</dt>
                    <dd className="mt-1 text-sm">{objectType.api_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Standard-Anzeigefeld</dt>
                    <dd className="mt-1 text-sm">{objectType.default_field_api_name || 'Nicht festgelegt'}</dd>
                  </div>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Felder</CardTitle>
              <CardDescription>
                Felder, die mit diesem Objekttyp importiert werden
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
                      <TableHead>Feldname</TableHead>
                      <TableHead>API-Name</TableHead>
                      <TableHead>Datentyp</TableHead>
                      <TableHead>Erforderlich</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields?.length ? (
                      fields.filter(f => f.isPublished).map(field => (
                        <TableRow key={field.id}>
                          <TableCell>{field.name}</TableCell>
                          <TableCell>{field.api_name}</TableCell>
                          <TableCell>{field.data_type}</TableCell>
                          <TableCell>{field.is_required ? 'Ja' : 'Nein'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          Keine Felder für dieses Objekt verfügbar
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
