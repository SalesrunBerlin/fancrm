
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function ObjectTypeForm() {
  const { createObjectType } = useObjectTypes();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [apiName, setApiName] = useState("");
  const [description, setDescription] = useState("");

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
      await createObjectType.mutateAsync({
        name: name.trim(),
        api_name: apiName.trim().toLowerCase(),
        description: description.trim() || null,
        is_system: false,
      });

      setName("");
      setApiName("");
      setDescription("");

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
