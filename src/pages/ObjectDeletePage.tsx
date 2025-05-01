
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ObjectDeletePage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const { archivedObjects, deleteObjectType } = useObjectTypes();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const objectType = archivedObjects?.find(obj => obj.id === objectTypeId);

  const handleDelete = async () => {
    if (!objectTypeId) return;
    
    setIsDeleting(true);
    try {
      await deleteObjectType.mutateAsync(objectTypeId);
      toast("Object deleted", {
        description: "The object has been permanently deleted."
      });
      navigate("/settings/object-manager");
    } catch (error: any) {
      toast("Deletion failed", {
        description: error.message || "There was an error deleting the object.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
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
          <CardTitle>Delete {objectType.name}</CardTitle>
          <CardDescription>
            This will permanently delete this object type and all its records. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Warning: This is a permanent action. All data associated with this object will be lost forever.
            </AlertDescription>
          </Alert>
          
          <p>
            You are about to delete the <strong>{objectType.name}</strong> object type. 
            This includes:
          </p>
          <ul className="list-disc pl-5 my-4 space-y-2">
            <li>All fields and field configurations</li>
            <li>All records stored in this object</li>
            <li>All relationships to other objects</li>
          </ul>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate(`/settings/objects/${objectTypeId}`)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Permanently Delete'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
