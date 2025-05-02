
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionFieldsManager } from "@/components/actions/ActionFieldsManager";
import { ActionType, ActionColor, ActionCreateInput, Action, useActions } from "@/hooks/useActions";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Separator } from "@/components/ui/separator";

// Define form schema with zod
const actionFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  action_type: z.string() as z.ZodType<ActionType>,
  target_object_id: z.string().min(1, "Target object is required"),
  source_field_id: z.string().optional(),
  color: z.string().optional(),
});

type ActionFormValues = z.infer<typeof actionFormSchema>;

interface ActionFormProps {
  action?: Action;
  isCreate?: boolean;
}

export function ActionForm({ action, isCreate = true }: ActionFormProps) {
  const navigate = useNavigate();
  const { objectTypes } = useObjectTypes();
  const { getActionsByObjectId, createAction, updateAction, isLoading } = useActions();
  const [activeTab, setActiveTab] = useState<string>("general");
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [sourceObjectId, setSourceObjectId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const { fields: sourceFields } = useObjectFields(sourceObjectId);

  // Setup form with react-hook-form
  const form = useForm<ActionFormValues>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      name: action?.name || "",
      description: action?.description || "",
      action_type: action?.action_type || "new_record",
      target_object_id: action?.target_object_id || "",
      source_field_id: action?.source_field_id || "",
      color: action?.color || "default",
    },
  });

  const actionType = form.watch("action_type");
  const targetObjectId = form.watch("target_object_id");
  
  // Update selectedObjectId when targetObjectId changes
  useEffect(() => {
    if (targetObjectId) {
      setSelectedObjectId(targetObjectId);
    }
  }, [targetObjectId]);

  // Setup action ID when in edit mode
  useEffect(() => {
    if (!isCreate && action) {
      setActionId(action.id);
    }
  }, [isCreate, action]);

  // Handle form submission
  const onSubmit = async (values: ActionFormValues) => {
    try {
      // Convert values to ActionCreateInput
      const actionData: ActionCreateInput = {
        name: values.name,
        description: values.description,
        action_type: values.action_type as ActionType,
        target_object_id: values.target_object_id,
        color: values.color as ActionColor,
      };

      // Add source_field_id for linked_record actions
      if (values.action_type === "linked_record" && values.source_field_id) {
        actionData.source_field_id = values.source_field_id;
      }

      let result;
      if (isCreate) {
        result = await createAction.mutateAsync(actionData);
      } else if (actionId) {
        result = await updateAction.mutateAsync({ id: actionId, ...actionData });
      }

      if (result) {
        // Navigate to action fields for new actions
        if (isCreate) {
          setActionId(result.id);
          setActiveTab("fields");
          toast.success("Action created successfully. Now configure fields.");
        } else {
          toast.success("Action updated successfully");
          navigate("/actions");
        }
      }
    } catch (error) {
      console.error("Error saving action:", error);
      toast.error("Failed to save action");
    }
  };

  // Handle source object selection for lookup fields
  const handleActionTypeChange = (type: string) => {
    if (type === "linked_record") {
      // For linked record actions, reset source field
      form.setValue("source_field_id", "");
    }
  };

  // Filter lookup fields that can be used as source for linked record actions
  const lookupFields = sourceFields?.filter((field) => field.data_type === "lookup") || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isCreate ? "Create Action" : "Edit Action"}
        description={isCreate ? "Define a new action" : "Update action settings"}
        backTo="/actions"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">
            <span className="flex items-center">
              1. General <ChevronRight className="ml-2 h-4 w-4" />
            </span>
          </TabsTrigger>
          <TabsTrigger value="fields" disabled={!actionId}>
            <span className="flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" /> 2. Fields
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardContent className="space-y-4 pt-6">
                  {/* Action Name */}
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

                  {/* Action Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter a description for this action"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Action Type */}
                  <FormField
                    control={form.control}
                    name="action_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action Type</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleActionTypeChange(value);
                          }}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select action type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new_record">New Record</SelectItem>
                            <SelectItem value="linked_record">
                              Linked Record
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Target Object */}
                  <FormField
                    control={form.control}
                    name="target_object_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Object</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedObjectId(value);
                          }}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select target object" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {objectTypes?.map((obj) => (
                              <SelectItem key={obj.id} value={obj.id}>
                                {obj.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Button Color */}
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Button Color</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || "default"}
                          value={field.value || "default"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select button color" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="default">Default (Blue)</SelectItem>
                            <SelectItem value="secondary">Secondary (Gray)</SelectItem>
                            <SelectItem value="destructive">Destructive (Red)</SelectItem>
                            <SelectItem value="outline">Outline</SelectItem>
                            <SelectItem value="ghost">Ghost</SelectItem>
                            <SelectItem value="warning">Warning (Orange)</SelectItem>
                            <SelectItem value="success">Success (Green)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Source Field for Linked Record Actions */}
                  {actionType === "linked_record" && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium">
                            Source Object (where this action will appear)
                          </h3>
                          <Select
                            onValueChange={(value) => {
                              setSourceObjectId(value);
                              // Reset source field when changing source object
                              form.setValue("source_field_id", "");
                            }}
                            value={sourceObjectId || ""}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select source object" />
                            </SelectTrigger>
                            <SelectContent>
                              {objectTypes?.map((obj) => (
                                <SelectItem key={obj.id} value={obj.id}>
                                  {obj.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            Select the object where this action will be displayed
                          </p>
                        </div>

                        <FormField
                          control={form.control}
                          name="source_field_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relationship Field</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value || ""}
                                value={field.value || ""}
                                disabled={!sourceObjectId || lookupFields.length === 0}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select lookup field" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {lookupFields.map((lookupField) => {
                                    // Check if this lookup field targets our selected object
                                    const fieldOptions = lookupField.options
                                      ? typeof lookupField.options === "string"
                                        ? JSON.parse(lookupField.options)
                                        : lookupField.options
                                      : null;
                                    
                                    if (
                                      fieldOptions &&
                                      fieldOptions.target_object_type_id === targetObjectId
                                    ) {
                                      return (
                                        <SelectItem
                                          key={lookupField.id}
                                          value={lookupField.id}
                                        >
                                          {lookupField.name}
                                        </SelectItem>
                                      );
                                    }
                                    return null;
                                  })}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                              {sourceObjectId && lookupFields.length === 0 && (
                                <p className="text-xs text-yellow-600 mt-1">
                                  No lookup fields found that reference the target object.
                                  Please create a lookup field first.
                                </p>
                              )}
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/actions")}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isCreate ? "Create Action" : "Update Action"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="fields">
          {actionId && selectedObjectId ? (
            <ActionFieldsManager
              actionId={actionId}
              objectTypeId={selectedObjectId}
              onBack={() => setActiveTab("general")}
              onComplete={() => navigate("/actions")}
            />
          ) : (
            <Card>
              <CardContent className="py-6 text-center">
                <p>Please complete the general settings first.</p>
                <Button
                  className="mt-2"
                  onClick={() => setActiveTab("general")}
                  variant="outline"
                >
                  Back to General Settings
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
