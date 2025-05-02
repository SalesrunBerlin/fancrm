
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ObjectArchivePage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const { objectTypes, archiveObjectType } = useObjectTypes();
  const [isArchiving, setIsArchiving] = useState(false);
  
  const objectType = objectTypes?.find(obj => obj.id === objectTypeId);

  const handleArchive = async () => {
    if (!objectTypeId) return;
    
    setIsArchiving(true);
    try {
      await archiveObjectType.mutateAsync(objectTypeId);
      toast("Object archived", {
        description: "The object has been archived successfully."
      });
      navigate("/settings/object-manager");
    } catch (error: any) {
      toast.error("Archive failed", {
        description: error.message || "There was an error archiving the object."
      });
    } finally {
      setIsArchiving(false);
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
          <CardTitle>Archive {objectType.name}</CardTitle>
          <CardDescription>
            This will archive this object type and make it unavailable for use. You can restore it later.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Archiving this object will hide it from object lists and prevent new records from being created. 
              Existing records will remain intact but inaccessible until the object is restored.
            </AlertDescription>
          </Alert>
          
          <p>
            You are about to archive the <strong>{objectType.name}</strong> object type. 
            This action can be undone later by restoring the object from the archived objects section.
          </p>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate(`/settings/objects/${objectTypeId}`)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleArchive}
            disabled={isArchiving}
          >
            {isArchiving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Archiving...
              </>
            ) : (
              'Archive Object'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
