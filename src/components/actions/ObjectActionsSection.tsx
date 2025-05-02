
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle } from "lucide-react";
import { Action, useActions } from "@/hooks/useActions";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getAlertVariantClass } from "@/patches/FixAlertVariants";

interface ObjectActionsSectionProps {
  objectTypeId: string;
  objectTypeName?: string;
}

export function ObjectActionsSection({ objectTypeId, objectTypeName }: ObjectActionsSectionProps) {
  const navigate = useNavigate();
  const { getActionsByObjectId } = useActions();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    console.log(`ObjectActionsSection: Effect running for objectTypeId: ${objectTypeId}`);
    console.log(`ObjectActionsSection: Current initialized state: ${initialized}`);
    
    // Prevent fetch if no objectTypeId is provided
    if (!objectTypeId) {
      console.log("ObjectActionsSection: No objectTypeId provided, skipping fetch");
      setLoading(false);
      return;
    }
    
    // Prevent multiple fetches for the same objectTypeId
    if (initialized) {
      console.log("ObjectActionsSection: Already initialized, skipping fetch");
      return;
    }
    
    const fetchActions = async () => {
      console.log(`ObjectActionsSection: Starting fetch for objectTypeId: ${objectTypeId}`);
      setLoading(true);
      setError(null);
      
      try {
        console.log(`ObjectActionsSection: Calling getActionsByObjectId for ${objectTypeId}`);
        const objectActions = await getActionsByObjectId(objectTypeId);
        
        // Log the actual response for debugging
        console.log(`ObjectActionsSection: Raw response:`, objectActions);
        
        if (!objectActions || objectActions.length === 0) {
          console.log(`ObjectActionsSection: No actions found for objectTypeId: ${objectTypeId}`);
          setActions([]);
        } else {
          console.log(`ObjectActionsSection: Found ${objectActions.length} actions for objectTypeId: ${objectTypeId}`);
          setActions(objectActions);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to fetch actions");
        console.error("Error fetching actions in ObjectActionsSection:", error);
        setError(error);
        toast.error("Failed to load actions", {
          description: error.message
        });
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    fetchActions();
  }, [objectTypeId, getActionsByObjectId]);

  const handleExecuteAction = (actionId: string) => {
    navigate(`/actions/execute/${actionId}`);
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Loading available actions...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Don't render anything if there are no actions and we're not loading
  if (!actions || actions.length === 0) {
    console.log(`ObjectActionsSection: No actions to display for objectTypeId: ${objectTypeId}`);
    return null;
  }

  if (error) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription className="text-destructive">Failed to load actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className={getAlertVariantClass("destructive")}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || "There was a problem loading actions. Please try refreshing the page."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <CardDescription>
          Actions available for this {objectTypeName || "object"}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {actions.map((action) => (
          <Card key={action.id} className="overflow-hidden">
            <CardHeader className="p-4">
              <CardTitle className="text-base">{action.name}</CardTitle>
              {action.description && (
                <CardDescription className="text-xs line-clamp-2">
                  {action.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xs text-muted-foreground">
                Type: {formatActionType(action.action_type)}
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="p-3 flex justify-end gap-2">
              <Button 
                size="sm" 
                onClick={() => handleExecuteAction(action.id)}
                className="h-8"
              >
                <PlayCircle className="mr-1.5 h-4 w-4" />
                Execute
              </Button>
            </CardFooter>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}

function formatActionType(type: string): string {
  switch (type) {
    case 'new_record':
      return 'Create Record';
    default:
      return type.replace(/_/g, ' ');
  }
}
