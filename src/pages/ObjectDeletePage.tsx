
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useObjectApplicationAssignments } from "@/hooks/useObjectApplicationAssignments";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ObjectDeletePage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const { archivedObjects, objectTypes, deleteObjectType } = useObjectTypes();
  const { records, isLoading: isLoadingRecords } = useObjectRecords(objectTypeId);
  const { assignments, isLoading: isLoadingAssignments } = useObjectApplicationAssignments(objectTypeId);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const objectType = [...(archivedObjects || []), ...(objectTypes || [])].find(obj => obj.id === objectTypeId);
  const recordCount = records?.length || 0;

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
      toast.error("Deletion failed", {
        description: error.message || "There was an error deleting the object."
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
        
        <CardContent className="space-y-6">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Warning: This is a permanent action. All data associated with this object will be lost forever.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <h3 className="font-medium text-lg">Deletion Impact</h3>
            
            <div className="border rounded-md p-4 space-y-4">
              <div>
                <h4 className="font-medium">Object Information</h4>
                <p className="text-sm text-muted-foreground">
                  You are deleting the <strong>{objectType.name}</strong> object ({objectType.api_name})
                </p>
                {objectType.description && (
                  <p className="text-sm text-muted-foreground mt-1">{objectType.description}</p>
                )}
              </div>
              
              <div>
                <h4 className="font-medium">Records</h4>
                {isLoadingRecords ? (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Loading records...
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {recordCount === 0 ? (
                      "No records will be affected."
                    ) : (
                      <span className="text-destructive font-medium">
                        {recordCount} record{recordCount !== 1 ? 's' : ''} will be permanently deleted.
                      </span>
                    )}
                  </p>
                )}
              </div>
              
              <div>
                <h4 className="font-medium">Application Assignments</h4>
                {isLoadingAssignments ? (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Loading application assignments...
                  </div>
                ) : assignments && assignments.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-destructive font-medium">
                      This object is assigned to {assignments.length} application{assignments.length !== 1 ? 's' : ''}.
                      All assignments will be deleted.
                    </p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      {assignments.map(assignment => (
                        <li key={assignment.id}>
                          {assignment.application?.name || "Unknown Application"}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This object is not assigned to any applications.
                  </p>
                )}
              </div>
              
              <div>
                <h4 className="font-medium">Relationships</h4>
                <p className="text-sm text-destructive">
                  All relationships to and from this object will be deleted.
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-2">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-medium">
                Are you absolutely sure? This action cannot be undone.
              </AlertDescription>
            </Alert>
          </div>
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
