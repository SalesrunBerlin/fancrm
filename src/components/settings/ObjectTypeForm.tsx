
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export function ObjectTypeForm() {
  const { createObjectType } = useObjectTypes();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [apiName, setApiName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("building");
  const [defaultFieldApiName, setDefaultFieldApiName] = useState("name");

  // Function to generate API name from name
  const generateApiName = () => {
    if (!apiName && name) {
      const generatedApiName = name
        .toLowerCase()
        .replace(/\s+/g, '_')      // Replace spaces with underscores
        .replace(/[^a-z0-9_]/g, '') // Remove special characters
        .replace(/^[0-9]/, 'x$&');  // Prefix with 'x' if starts with number
      setApiName(generatedApiName);
    }
  };

  const createDefaultField = async (objectTypeId: string, fieldApiName: string) => {
    try {
      // Create the default field (text field)
      const { data: field, error: fieldError } = await supabase
        .from("object_fields")
        .insert({
          object_type_id: objectTypeId,
          name: fieldApiName === "name" ? "Name" : fieldApiName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          api_name: fieldApiName,
          data_type: "text",
          is_required: true,
          is_system: false,
          display_order: 1,
        })
        .select();

      if (fieldError) {
        console.error("Error creating default field:", fieldError);
        throw fieldError;
      }
      
      return field;
    } catch (error) {
      console.error("Failed to create default field:", error);
      throw error;
    }
  };

  const handleCreateObjectType = async () => {
    if (!name.trim() || !apiName.trim() || !defaultFieldApiName.trim()) {
      toast({
        title: "Error",
        description: "Name, API Name and Default Field are required",
        variant: "destructive",
      });
      return;
    }

    try {
      // First create the object type
      const result = await createObjectType.mutateAsync({
        name: name.trim(),
        api_name: apiName.trim().toLowerCase(),
        description: description.trim() || null,
        icon: icon,
        default_field_api_name: defaultFieldApiName.trim(),
        is_system: false,
        is_active: true,
        show_in_navigation: true,
        is_published: false,
        is_template: false,
        source_object_id: null
      });
      
      if (result && result.id) {
        // Then create the default field
        await createDefaultField(result.id, defaultFieldApiName.trim());
      }

      setName("");
      setApiName("");
      setDescription("");
      setIcon("building");
      setDefaultFieldApiName("name");

      toast({
        title: "Success",
        description: "Object type and default field were created successfully",
      });
    } catch (error) {
      console.error("Error creating object type:", error);
      toast({
        title: "Error",
        description: "Object type could not be created",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="object-name">Name*</Label>
        <Input
          id="object-name"
          placeholder="Enter object name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="api-name">API Name*</Label>
        <Input
          id="api-name"
          placeholder="Click here to generate API name"
          value={apiName}
          onChange={(e) => setApiName(e.target.value)}
          onClick={generateApiName}
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
        <Label htmlFor="default-field">Default Field*</Label>
        <Input
          id="default-field"
          placeholder="Name of default field"
          value={defaultFieldApiName}
          onChange={(e) => setDefaultFieldApiName(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          This field will be used as title in the detail view and will be created automatically
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter a description"
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
