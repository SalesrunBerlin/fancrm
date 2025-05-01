
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ObjectRestorePage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const { archivedObjects, restoreObjectType } = useObjectTypes();
  const [isRestoring, setIsRestoring] = useState(false);
  
  const objectType = archivedObjects?.find(obj => obj.id === objectTypeId);

  const handleRestore = async () => {
    if (!objectTypeId) return;
    
    setIsRestoring(true);
    try {
      await restoreObjectType.mutateAsync(objectTypeId);
      toast("Object restored", {
        description: "The object has been restored successfully."
      });
      navigate("/settings/object-manager");
    } catch (error: any) {
      toast("Restore failed", {
        description: error.message || "There was an error restoring the object.",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
    }
  };

  if (!objectType) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Button variant="outline" asChild className="mb-6">
          <Link to="/settings/object-manager">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Object Manager
          </Link>
        </Button>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Object not found. It may have been deleted or you don't have access to it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Button variant="outline" asChild className="mb-6">
        <Link to={`/settings/objects/${objectTypeId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {objectType.name}
        </Link>
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Restore {objectType.name}</CardTitle>
          <CardDescription>
            This will restore this archived object type and make it available for use again.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Restoring this object will make it visible in object lists again. 
              All existing records will become accessible.
            </AlertDescription>
          </Alert>
          
          <p>
            You are about to restore the <strong>{objectType.name}</strong> object type.
            After restoration, you'll be able to create and manage records for this object again.
          </p>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate(`/settings/objects/${objectTypeId}`)}>
            Cancel
          </Button>
          <Button 
            variant="default" 
            onClick={handleRestore}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restoring...
              </>
            ) : (
              'Restore Object'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
