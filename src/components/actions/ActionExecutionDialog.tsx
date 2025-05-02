
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Action } from "@/hooks/useActions";
import { useActionFields } from "@/hooks/useActionFields";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { CreateRecordForm } from "@/components/actions/CreateRecordForm";
import { Loader2 } from "lucide-react";

interface ActionExecutionDialogProps {
  action: Action;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActionExecutionDialog({
  action,
  open,
  onOpenChange,
}: ActionExecutionDialogProps) {
  const { fields: actionFields, isLoading: loadingActionFields } = useActionFields(action.id);
  const { objectTypes } = useObjectTypes();
  const { fields: objectFields } = useObjectFields(action.target_object_id);
  const [loading, setLoading] = useState(true);

  const targetObject = objectTypes?.find(obj => obj.id === action.target_object_id);

  // Prepare the form data with pre-selected fields and default values
  useEffect(() => {
    if (!loadingActionFields && actionFields && objectFields) {
      setLoading(false);
    }
  }, [actionFields, objectFields, loadingActionFields]);

  const getActionTypeTitle = () => {
    switch (action.action_type) {
      case "new_record":
        return "Create New Record";
      default:
        return "Execute Action";
    }
  };

  if (loading || !objectFields) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{getActionTypeTitle()}</DialogTitle>
          <DialogDescription>
            {targetObject ? `Create a new ${targetObject.name} record` : "Create a new record"}
          </DialogDescription>
        </DialogHeader>
        
        {action.action_type === "new_record" && (
          <CreateRecordForm
            objectTypeId={action.target_object_id}
            objectFields={objectFields}
            actionFields={actionFields || []}
            onSuccess={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
