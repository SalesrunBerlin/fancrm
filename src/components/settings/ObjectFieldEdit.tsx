
import { ObjectField } from "@/hooks/useObjectTypes";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useObjectFieldEdit } from "@/hooks/useObjectFieldEdit";
import { ObjectFieldEditFields } from "./ObjectFieldEditFields";

interface ObjectFieldEditProps {
  field: ObjectField;
  isOpen: boolean;
  onClose: () => void;
}

export function ObjectFieldEdit({ field, isOpen, onClose }: ObjectFieldEditProps) {
  const { objectTypes } = useObjectTypes();
  const targetObjectTypeId = field.options?.target_object_type_id;
  const { fields: targetFields } = useObjectFields(targetObjectTypeId);
  const { form, isSubmitting, onSubmit } = useObjectFieldEdit({ field, onClose });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Field</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <ObjectFieldEditFields 
              form={form}
              field={field}
              targetFields={targetFields}
            />
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
