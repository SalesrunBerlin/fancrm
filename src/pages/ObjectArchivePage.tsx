
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useObjectRelationships } from "@/hooks/useObjectRelationships";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertTriangle, ArrowLeft, Archive } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { useToast } from "@/hooks/use-toast";

export default function ObjectArchivePage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const { objectTypes, archiveObjectType } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useObjectFields(objectTypeId);
  const { records, isLoading: isLoadingRecords } = useObjectRecords(objectTypeId || "");
  const { data: relationships, isLoading: isLoadingRelationships } = useObjectRelationships(objectTypeId);

  const objectType = objectTypes?.find(type => type.id === objectTypeId);

  const handleArchive = async () => {
    if (!objectTypeId) return;
    
    setIsArchiving(true);
    try {
      await archiveObjectType.mutateAsync(objectTypeId);
      toast({
        title: "Objekt archiviert",
        description: `Das Objekt "${objectType?.name}" wurde erfolgreich archiviert.`,
      });
      navigate("/settings/object-manager");
    } catch (error) {
      console.error("Error archiving object:", error);
      toast({
        title: "Fehler",
        description: "Das Objekt konnte nicht archiviert werden.",
        variant: "destructive",
      });
    } finally {
      setIsArchiving(false);
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
        title={`${objectType.name} archivieren`}
        description="Archivieren Sie dieses Objekt"
        actions={
          <Button variant="outline" onClick={() => navigate(`/settings/objects/${objectTypeId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>
        }
      />

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Archivierungs-Information</AlertTitle>
        <AlertDescription>
          Das Archivieren dieses Objekts entfernt es aus der Hauptnavigation und aus den Listen. Es kann später wiederhergestellt werden.
          Alle Datensätze und Felder werden beibehalten.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Objektübersicht</CardTitle>
          <CardDescription>Details zum Objekt, das archiviert werden soll</CardDescription>
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
            Beziehungen zu anderen Objekten werden beibehalten, könnten aber in der Benutzeroberfläche ausgeblendet werden
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
            Alle Felder dieses Objekts werden beibehalten
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
            Alle Datensätze dieses Objekts werden beibehalten
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
          variant="warning" 
          size="lg"
          onClick={() => setIsArchiveDialogOpen(true)}
          disabled={isArchiving}
        >
          {isArchiving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Archive className="mr-2 h-4 w-4" />
          )}
          Objekt archivieren
        </Button>
      </div>

      <DeleteDialog
        isOpen={isArchiveDialogOpen}
        onClose={() => setIsArchiveDialogOpen(false)}
        onConfirm={handleArchive}
        title="Objekt wirklich archivieren?"
        description={`Sind Sie sicher, dass Sie das Objekt "${objectType.name}" archivieren möchten? Es wird aus der Navigation und den Listen verschwinden, kann aber später wiederhergestellt werden.`}
        deleteButtonText="Archivieren"
      />
    </div>
  );
}
