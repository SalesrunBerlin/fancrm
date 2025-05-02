
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/actions/ActionForm";
import { useActions } from "@/hooks/useActions";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { ActionFieldsManager } from "@/components/actions/ActionFieldsManager";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { getAlertVariantClass } from "@/patches/FixAlertVariants";
import { supabase } from "@/integrations/supabase/client";

export default function ActionDetailPage() {
  const { actionId } = useParams<{ actionId: string }>();
  const navigate = useNavigate();
  const { updateAction, deleteAction, isLoading } = useActions();
  const { objectTypes } = useObjectTypes();
  
  const [action, setAction] = useState<any>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchAction = async () => {
      if (!actionId) return;

      try {
        const { data, error } = await supabase
          .from("actions")
          .select("*")
          .eq("id", actionId)
          .single();

        if (error) throw error;
        setAction(data);
      } catch (err: any) {
        console.error("Error fetching action:", err);
        setError(err.message || "Failed to load action");
      } finally {
        setIsLoadingAction(false);
      }
    };

    fetchAction();
  }, [actionId]);

  const activeObjectOptions = objectTypes
    ?.filter((obj) => obj.is_active && !obj.is_archived)
    .map((obj) => ({
      id: obj.id,
      name: obj.name,
    })) || [];

  const handleSubmit = async (data: any) => {
    if (!actionId) return;

    try {
      setError(null);
      await updateAction.mutateAsync({
        id: actionId,
        ...data,
      });
    } catch (err: any) {
      setError(err.message || "Failed to update action");
    }
  };

  const handleDelete = async () => {
    if (!actionId) return;

    try {
      await deleteAction.mutateAsync(actionId);
      navigate("/actions");
    } catch (err: any) {
      setError(err.message || "Failed to delete action");
    }
  };

  if (isLoadingAction || !objectTypes) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!action && !isLoadingAction) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Action not found"
          description="The requested action could not be found"
          backTo="/actions"
        />
        <Alert className={getAlertVariantClass("destructive")}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The action you are looking for might have been deleted or does not exist.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Action"
        description={`Update configuration for: ${action.name}`}
        backTo="/actions"
        actions={
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        }
      />

      {error && (
        <Alert className={getAlertVariantClass("destructive")}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <ActionForm
            defaultValues={action}
            objects={activeObjectOptions}
            onSubmit={handleSubmit}
            isSubmitting={isLoading}
          />
        </CardContent>
      </Card>

      {action && (
        <ActionFieldsManager 
          actionId={actionId as string} 
          objectTypeId={action.target_object_id}
        />
      )}

      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={`Delete Action: ${action?.name}`}
        description="Are you sure you want to delete this action? This action cannot be undone."
        onConfirm={handleDelete}
        deleteButtonText="Delete Action"
      />
    </div>
  );
}
