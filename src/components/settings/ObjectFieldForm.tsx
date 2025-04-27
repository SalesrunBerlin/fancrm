
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ObjectField } from "@/hooks/useObjectTypes";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ObjectFieldFormProps {
  objectTypeId: string;
  field?: ObjectField;
  onComplete: () => void;
}

export function ObjectFieldForm({ objectTypeId, field, onComplete }: ObjectFieldFormProps) {
  const { createField, updateField } = useObjectFields(objectTypeId);
  const { toast } = useToast();
  const [name, setName] = useState(field?.name || "");
  const [apiName, setApiName] = useState(field?.api_name || "");
  const [dataType, setDataType] = useState(field?.data_type || "text");
  const [isRequired, setIsRequired] = useState(field?.is_required || false);
  
  const isEditing = !!field;
  const isPending = createField.isPending || (updateField?.isPending || false);

  const handleSubmit = async () => {
    if (!name.trim() || !apiName.trim()) {
      toast({
        title: "Error",
        description: "Name and API Name are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const fieldData = {
        name: name.trim(),
        api_name: apiName.trim().toLowerCase(),
        data_type: dataType,
        is_required: isRequired,
        object_type_id: objectTypeId,
      };

      if (isEditing && field) {
        await updateField!.mutateAsync({
          id: field.id,
          ...fieldData,
        });
        toast({
          title: "Success",
          description: "Field updated successfully",
        });
      } else {
        await createField.mutateAsync(fieldData);
        toast({
          title: "Success",
          description: "Field created successfully",
        });
      }

      setName("");
      setApiName("");
      setDataType("text");
      setIsRequired(false);
      onComplete();
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "creating"} field:`, error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} field`,
        variant: "destructive",
      });
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Only auto-generate API name if it's a new field or if the API name hasn't been manually edited
    if (!isEditing) {
      setApiName(value.toLowerCase().replace(/\s+/g, '_'));
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{isEditing ? "Edit Field" : "Add New Field"}</h3>
      <div className="space-y-2">
        <Label htmlFor="field-name">Field Name</Label>
        <Input
          id="field-name"
          placeholder="Enter field name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="api-name">API Name</Label>
        <Input
          id="api-name"
          placeholder="Enter API name"
          value={apiName}
          onChange={(e) => setApiName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="data-type">Data Type</Label>
        <Select value={dataType} onValueChange={setDataType}>
          <SelectTrigger id="data-type">
            <SelectValue placeholder="Select a data type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="datetime">Date & Time</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="url">URL</SelectItem>
            <SelectItem value="picklist">Picklist</SelectItem>
            <SelectItem value="currency">Currency</SelectItem>
            <SelectItem value="textarea">Text Area</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Switch
          id="is-required"
          checked={isRequired}
          onCheckedChange={setIsRequired}
        />
        <Label htmlFor="is-required">Required Field</Label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Field" : "Create Field"}
        </Button>
        <Button variant="outline" onClick={onComplete} type="button">
          Cancel
        </Button>
      </div>
    </div>
  );
}
