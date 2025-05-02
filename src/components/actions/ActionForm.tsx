
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { ActionType } from "@/hooks/useActions";

const actionFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  action_type: z.enum(["new_record"] as const),
  target_object_id: z.string().min(1, "Target object is required"),
});

type ActionFormData = z.infer<typeof actionFormSchema>;

export interface ActionFormProps {
  defaultValues?: Partial<ActionFormData>;
  objects: Array<{ id: string; name: string }>;
  onSubmit: (data: ActionFormData) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function ActionForm({
  defaultValues,
  objects,
  onSubmit,
  isSubmitting = false,
}: ActionFormProps) {
  const navigate = useNavigate();
  const form = useForm<ActionFormData>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      name: "",
      description: "",
      action_type: "new_record" as ActionType,
      target_object_id: "",
      ...defaultValues,
    },
  });

  // Update form when defaultValues change
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name || "",
        description: defaultValues.description || "",
        action_type: defaultValues.action_type || "new_record",
        target_object_id: defaultValues.target_object_id || "",
      });
    }
  }, [defaultValues, form]);

  const handleSubmit = (data: ActionFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter action name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter action description"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="action_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Action Type</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => field.onChange(value as ActionType)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="new_record">New Record</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="target_object_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Object</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target object" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {objects.map((obj) => (
                    <SelectItem key={obj.id} value={obj.id}>{obj.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/actions")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Action
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
