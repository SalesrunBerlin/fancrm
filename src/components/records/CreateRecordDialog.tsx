
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { RecordField } from "./RecordField";
import { useRecordFields } from "@/hooks/useRecordFields";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import type { RecordFormData } from "@/lib/types/records";
import { Loader2 } from "lucide-react";

interface CreateRecordDialogProps {
  objectTypeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRecordDialog({ objectTypeId, open, onOpenChange }: CreateRecordDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { objectTypes } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useRecordFields(objectTypeId);
  const { createRecord } = useObjectRecords(objectTypeId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  const form = useForm<RecordFormData>();

  const onSubmit = async (data: RecordFormData) => {
    try {
      setIsSubmitting(true);
      await createRecord.mutateAsync({
        object_type_id: objectTypeId,
        ...data
      });
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!objectType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New {objectType.name}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isLoadingFields ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              fields.map((field) => (
                <RecordField
                  key={field.id}
                  field={field}
                  form={form}
                />
              ))
            )}
            
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
