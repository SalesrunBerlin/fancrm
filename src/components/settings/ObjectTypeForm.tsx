
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useObjectFields } from "@/hooks/useObjectFields";

export function ObjectTypeForm() {
  const { createObjectType } = useObjectTypes();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [apiName, setApiName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("building");
  const [defaultFieldApiName, setDefaultFieldApiName] = useState("name");
  const [objectTypeId, setObjectTypeId] = useState<string | null>(null);
  const { fields } = useObjectFields(objectTypeId);

  // Auto-generate API name from name
  useEffect(() => {
    if (name && !apiName) {
      setApiName(name.toLowerCase().replace(/[^a-z0-9]/g, "_"));
    }
  }, [name, apiName]);

  const handleCreateObjectType = async () => {
    if (!name.trim() || !apiName.trim()) {
      toast({
        title: "Error",
        description: "Name and API Name are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createObjectType.mutateAsync({
        name: name.trim(),
        api_name: apiName.trim().toLowerCase(),
        description: description.trim() || null,
        icon: icon,
        default_field_api_name: defaultFieldApiName,
        is_system: false,
        is_active: false,
        show_in_navigation: false,
        is_published: false,
        is_template: false,
        source_object_id: null
      });

      setObjectTypeId(result.id);
      setName("");
      setApiName("");
      setDescription("");
      setIcon("building");
      setDefaultFieldApiName("name");

      toast({
        title: "Success",
        description: "Object type created successfully",
      });
    } catch (error) {
      console.error("Error creating object type:", error);
      toast({
        title: "Error",
        description: "Failed to create object type",
        variant: "destructive",
      });
    }
  };

  // Default fields for new object types
  const defaultFields = [
    { api_name: "name", label: "Name" },
    { api_name: "record_id", label: "Record ID" },
  ];

  // Determine which fields to show in the dropdown
  const availableFields = objectTypeId && fields?.length 
    ? fields.map(field => ({ api_name: field.api_name, label: field.name })) 
    : defaultFields;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="object-name">Name</Label>
        <Input
          id="object-name"
          placeholder="Enter object name"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
        <Label htmlFor="icon">Icon</Label>
        <Select value={icon} onValueChange={setIcon}>
          <SelectTrigger id="icon">
            <SelectValue placeholder="Select an icon" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="building">Building</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="briefcase">Briefcase</SelectItem>
            <SelectItem value="calendar">Calendar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="default-field">Default Display Field</Label>
        <Select value={defaultFieldApiName} onValueChange={setDefaultFieldApiName}>
          <SelectTrigger id="default-field">
            <SelectValue placeholder="Select default display field" />
          </SelectTrigger>
          <SelectContent>
            {availableFields.map(field => (
              <SelectItem key={field.api_name} value={field.api_name}>
                {field.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Field to use as the record title in detail views
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <Button 
        onClick={handleCreateObjectType} 
        disabled={createObjectType.isPending}
        className="w-full"
      >
        {createObjectType.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Create Object Type
      </Button>
    </div>
  );
}
