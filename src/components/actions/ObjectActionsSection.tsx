
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

  useEffect(() => {
    const fetchActions = async () => {
      if (objectTypeId) {
        setLoading(true);
        setError(null);
        try {
          console.log(`Fetching actions for objectTypeId: ${objectTypeId}`);
          const objectActions = await getActionsByObjectId(objectTypeId);
          console.log(`Fetched actions:`, objectActions);
          setActions(objectActions);
        } catch (err) {
          console.error("Error fetching actions:", err);
          setError(err instanceof Error ? err : new Error("Failed to fetch actions"));
        } finally {
          setLoading(false);
        }
      }
    };

    fetchActions();
  }, [objectTypeId, getActionsByObjectId]);

  const handleExecuteAction = (actionId: string) => {
    navigate(`/actions/execute/${actionId}`);
  };

  // Don't render anything if there are no actions and we're not loading
  if (!loading && actions.length === 0) {
    return null;
  }

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

  if (error) {
    console.error("Error loading actions:", error);
    return null; // Hide completely on error
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
