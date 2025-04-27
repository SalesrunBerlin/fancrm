
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ObjectField } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Loader2 } from "lucide-react";

interface ObjectFieldEditProps {
  field: ObjectField;
  isOpen: boolean;
  onClose: () => void;
}

const fieldEditSchema = z.object({
  name: z.string().min(2),
  api_name: z.string().min(2),
  display_field_api_name: z.string().optional(),
});

export function ObjectFieldEdit({ field, isOpen, onClose }: ObjectFieldEditProps) {
  const { updateField } = useObjectFields(field.object_type_id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { objectTypes } = useObjectTypes();
  const targetObjectTypeId = field.options?.target_object_type_id;
  const { fields: targetFields } = useObjectFields(targetObjectTypeId);

  const form = useForm<z.infer<typeof fieldEditSchema>>({
    resolver: zodResolver(fieldEditSchema),
    defaultValues: {
      name: field.name,
      api_name: field.api_name,
      display_field_api_name: field.options?.display_field_api_name,
    },
  });

  const onSubmit = async (values: z.infer<typeof fieldEditSchema>) => {
    try {
      setIsSubmitting(true);

      // Preserve existing options while updating display_field_api_name
      const updatedOptions = {
        ...field.options,
        display_field_api_name: values.display_field_api_name,
      };

      // For system fields, only update the options
      if (field.is_system) {
        await updateField.mutateAsync({
          id: field.id,
          options: updatedOptions,
        });
      } else {
        // For non-system fields, update all editable fields
        await updateField.mutateAsync({
          id: field.id,
          name: values.name,
          api_name: values.api_name,
          options: updatedOptions,
        });
      }
      
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Field</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={field.is_system} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="api_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {field.data_type === "lookup" && targetFields && (
              <FormField
                control={form.control}
                name="display_field_api_name"
                render={({ field: displayField }) => (
                  <FormItem>
                    <FormLabel>Display Field</FormLabel>
                    <Select
                      value={displayField.value || ""}
                      onValueChange={displayField.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select display field" />
                      </SelectTrigger>
                      <SelectContent>
                        {targetFields.map((targetField) => (
                          <SelectItem
                            key={targetField.api_name}
                            value={targetField.api_name}
                          >
                            {targetField.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
