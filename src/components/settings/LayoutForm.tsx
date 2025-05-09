
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { ObjectLayout } from "@/hooks/useObjectLayouts";

const layoutFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  is_default: z.boolean().default(false),
});

type LayoutFormValues = z.infer<typeof layoutFormSchema>;

interface LayoutFormProps {
  objectTypeId: string;
  layout?: ObjectLayout;
  onSubmit: (values: LayoutFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function LayoutForm({ 
  objectTypeId, 
  layout, 
  onSubmit, 
  isSubmitting 
}: LayoutFormProps) {
  const form = useForm<LayoutFormValues>({
    resolver: zodResolver(layoutFormSchema),
    defaultValues: {
      name: layout?.name || "",
      description: layout?.description || "",
      is_default: layout?.is_default || false,
    },
  });

  const handleSubmit = async (values: LayoutFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Layout Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Default Layout" {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the purpose of this layout"
                  className="resize-none"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Optional description to explain the purpose of this layout
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="is_default"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <FormLabel>Default Layout</FormLabel>
                <FormDescription>
                  Make this the default layout for this object type
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {layout ? "Update Layout" : "Create Layout"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
