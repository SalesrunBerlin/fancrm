
import { useState, useEffect } from "react";
import { useActionFields } from "@/hooks/useActionFields";
import { useObjectFields } from "@/hooks/useObjectFields";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, ArrowUp, ArrowDown, X } from "lucide-react";
import { ActionFieldWithDetails } from "@/hooks/useActionFields";

interface ActionFieldsManagerProps {
  actionId: string;
  objectTypeId: string;
}

export function ActionFieldsManager({
  actionId,
  objectTypeId,
}: ActionFieldsManagerProps) {
  const { fields, addField, updateField, removeField, updateFieldsOrder, isLoading } = useActionFields(actionId);
  const { fields: objectFields } = useObjectFields(objectTypeId);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [defaultValue, setDefaultValue] = useState<string>("");

  // Reset when fields change
  useEffect(() => {
    setSelectedFieldId("");
    setDefaultValue("");
  }, [fields]);

  const handleAddField = async () => {
    if (!selectedFieldId) return;
    
    try {
      await addField.mutateAsync({
        action_id: actionId,
        field_id: selectedFieldId,
        default_value: defaultValue || null,
        display_order: fields?.length || 0,
      });
      setSelectedFieldId("");
      setDefaultValue("");
    } catch (error) {
      console.error("Failed to add field:", error);
    }
  };

  const handleUpdatePreselection = async (field: ActionFieldWithDetails, isPreselected: boolean) => {
    try {
      await updateField.mutateAsync({
        id: field.id,
        is_preselected: isPreselected,
      });
    } catch (error) {
      console.error("Failed to update field:", error);
    }
  };

  const handleUpdateDefaultValue = async (field: ActionFieldWithDetails, value: string) => {
    try {
      await updateField.mutateAsync({
        id: field.id,
        default_value: value,
      });
    } catch (error) {
      console.error("Failed to update field:", error);
    }
  };

  const handleMoveField = async (index: number, direction: "up" | "down") => {
    if (!fields) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const newFields = [...fields];
    const temp = newFields[index];
    newFields[index] = newFields[newIndex];
    newFields[newIndex] = temp;

    const updates = [
      {
        id: newFields[index].id,
        display_order: index,
      },
      {
        id: newFields[newIndex].id,
        display_order: newIndex,
      },
    ];

    try {
      await updateFieldsOrder.mutateAsync(updates);
    } catch (error) {
      console.error("Failed to reorder fields:", error);
    }
  };

  // Filter out object fields that are already selected
  const availableFields = objectFields?.filter(
    (field) => !fields?.some((f) => f.field_id === field.id)
  ) || [];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Configure Fields</CardTitle>
        <CardDescription>
          Select fields to include in this action and configure their behavior
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Field selector */}
          <div className="flex items-end gap-3">
            <div className="flex-grow">
              <Label htmlFor="field-select">Add Field</Label>
              <Select
                value={selectedFieldId}
                onValueChange={setSelectedFieldId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-grow">
              <Label htmlFor="default-value">Default Value (Optional)</Label>
              <Input
                id="default-value"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                placeholder="Default value"
                disabled={!selectedFieldId}
              />
            </div>
            <Button
              onClick={handleAddField}
              disabled={!selectedFieldId || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Add
            </Button>
          </div>

          {/* Fields list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : fields?.length ? (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-muted-foreground pb-2 border-b">
                <div className="col-span-4">Field</div>
                <div className="col-span-3">Pre-selected</div>
                <div className="col-span-3">Default Value</div>
                <div className="col-span-2">Actions</div>
              </div>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-4 items-center py-3 border-b"
                >
                  <div className="col-span-4">
                    <div className="font-medium">{field.field_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {field.api_name}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <Switch
                      checked={field.is_preselected}
                      onCheckedChange={(checked) =>
                        handleUpdatePreselection(field, checked)
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      value={field.default_value || ""}
                      onChange={(e) =>
                        handleUpdateDefaultValue(field, e.target.value)
                      }
                      placeholder="No default"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => handleMoveField(index, "up")}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === fields.length - 1}
                        onClick={() => handleMoveField(index, "down")}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => removeField.mutate(field.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No fields added yet. Select fields to include in this action.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
