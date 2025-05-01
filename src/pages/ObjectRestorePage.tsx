
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { useToast } from "@/hooks/use-toast";

export default function ObjectRestorePage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const { objectTypes, restoreObjectType } = useObjectTypes(true); // Include archived objects
  const objectType = objectTypes?.find(type => type.id === objectTypeId);

  const handleRestore = async () => {
    if (!objectTypeId) return;
    
    setIsRestoring(true);
    try {
      await restoreObjectType.mutateAsync(objectTypeId);
      toast({
        title: "Objekt wiederhergestellt",
        description: `Das Objekt "${objectType?.name}" wurde erfolgreich wiederhergestellt.`,
      });
      navigate("/settings/object-manager");
    } catch (error) {
      console.error("Error restoring object:", error);
      toast({
        title: "Fehler",
        description: "Das Objekt konnte nicht wiederhergestellt werden.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
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
        title={`${objectType.name} wiederherstellen`}
        description="Stellen Sie dieses archivierte Objekt wieder her"
        actions={
          <Button variant="outline" onClick={() => navigate(`/settings/objects/${objectTypeId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>
        }
      />

      <Alert>
        <RefreshCw className="h-4 w-4" />
        <AlertTitle>Wiederherstellungs-Information</AlertTitle>
        <AlertDescription>
          Das Wiederherstellen dieses Objekts macht es wieder in der Navigation und Listen sichtbar.
          Alle zugehörigen Datensätze und Felder sind erhalten geblieben.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Objektübersicht</CardTitle>
          <CardDescription>Details zum Objekt, das wiederhergestellt werden soll</CardDescription>
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

      <div className="flex justify-end">
        <Button 
          variant="default" 
          size="lg"
          onClick={() => setIsRestoreDialogOpen(true)}
          disabled={isRestoring}
        >
          {isRestoring ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Objekt wiederherstellen
        </Button>
      </div>

      <DeleteDialog
        isOpen={isRestoreDialogOpen}
        onClose={() => setIsRestoreDialogOpen(false)}
        onConfirm={handleRestore}
        title="Objekt wirklich wiederherstellen?"
        description={`Sind Sie sicher, dass Sie das Objekt "${objectType.name}" wiederherstellen möchten? Es wird wieder in der Navigation und den Listen erscheinen.`}
        deleteButtonText="Wiederherstellen"
      />
    </div>
  );
}
