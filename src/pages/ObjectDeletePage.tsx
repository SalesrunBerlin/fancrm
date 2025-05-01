
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useObjectRelationships } from "@/hooks/useObjectRelationships";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertTriangle, ArrowLeft, Trash2 } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { useToast } from "@/hooks/use-toast";

export default function ObjectDeletePage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { objectTypes, deleteObjectType } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useObjectFields(objectTypeId);
  const { records, isLoading: isLoadingRecords } = useObjectRecords(objectTypeId || "");
  const { data: relationships, isLoading: isLoadingRelationships } = useObjectRelationships(objectTypeId);

  const objectType = objectTypes?.find(type => type.id === objectTypeId);

  const handleDelete = async () => {
    if (!objectTypeId) return;
    
    setIsDeleting(true);
    try {
      await deleteObjectType.mutateAsync(objectTypeId);
      toast({
        title: "Objekt gelöscht",
        description: `Das Objekt "${objectType?.name}" wurde erfolgreich gelöscht.`,
      });
      navigate("/settings/object-manager");
    } catch (error) {
      console.error("Error deleting object:", error);
      toast({
        title: "Fehler",
        description: "Das Objekt konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!objectType) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${objectType.name} löschen`}
        description="Löschen Sie dieses Objekt und alle zugehörigen Daten"
        actions={
          <Button variant="outline" onClick={() => navigate(`/settings/objects/${objectTypeId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>
        }
      />

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Achtung: Diese Aktion kann nicht rückgängig gemacht werden</AlertTitle>
        <AlertDescription>
          Das Löschen dieses Objekts wird alle zugehörigen Felder, Datensätze und Konfigurationen permanent entfernen.
          Stellen Sie sicher, dass Sie keine wichtigen Daten mehr benötigen.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Objektübersicht</CardTitle>
          <CardDescription>Details zum Objekt, das gelöscht werden soll</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Name:</p>
              <p>{objectType.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">API Name:</p>
              <p>{objectType.api_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Beschreibung:</p>
              <p>{objectType.description || "Keine Beschreibung"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">System Objekt:</p>
              <p>{objectType.is_system ? "Ja" : "Nein"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verknüpfte Objekte ({isLoadingRelationships ? "..." : relationships?.length || 0})</CardTitle>
          <CardDescription>
            Alle Beziehungen zu diesen Objekten werden gelöscht
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRelationships ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : relationships && relationships.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beziehungsname</TableHead>
                    <TableHead>Verknüpftes Objekt</TableHead>
                    <TableHead>Beziehungstyp</TableHead>
                    <TableHead>Richtung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relationships.map(relationship => (
                    <TableRow key={relationship.id}>
                      <TableCell>{relationship.name}</TableCell>
                      <TableCell>
                        {relationship.relatedObject.name}
                        {relationship.relatedObject.is_system && 
                          <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">System</span>
                        }
                      </TableCell>
                      <TableCell>{relationship.relationship_type}</TableCell>
                      <TableCell>
                        {relationship.direction === 'from' ? 'Von diesem zu anderem' : 'Von anderem zu diesem'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Keine verknüpften Objekte gefunden</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Felder ({isLoadingFields ? "..." : fields?.length || 0})</CardTitle>
          <CardDescription>
            Alle Felder dieses Objekts werden gelöscht
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingFields ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : fields && fields.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>API Name</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>System</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map(field => (
                    <TableRow key={field.id}>
                      <TableCell>{field.name}</TableCell>
                      <TableCell>{field.api_name}</TableCell>
                      <TableCell>{field.data_type}</TableCell>
                      <TableCell>{field.is_system ? "Ja" : "Nein"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Keine Felder gefunden</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datensätze ({isLoadingRecords ? "..." : records?.length || 0})</CardTitle>
          <CardDescription>
            Alle Datensätze dieses Objekts werden gelöscht
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRecords ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : records && records.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Erstellt am</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.slice(0, 5).map(record => (
                    <TableRow key={record.id}>
                      <TableCell>{record.record_id || record.id.substring(0, 8)}</TableCell>
                      <TableCell>{new Date(record.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {records.length > 5 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        Und {records.length - 5} weitere Datensätze...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Keine Datensätze gefunden</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          variant="destructive" 
          size="lg"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Objekt unwiderruflich löschen
        </Button>
      </div>

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Objekt wirklich löschen?"
        description={`Sind Sie sicher, dass Sie das Objekt "${objectType.name}" mit allen ${records?.length || 0} Datensätzen, ${fields?.length || 0} Feldern und ${relationships?.length || 0} Verknüpfungen löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`}
        deleteButtonText="Endgültig löschen"
      />
    </div>
  );
}
