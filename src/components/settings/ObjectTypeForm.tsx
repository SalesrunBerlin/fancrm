
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

  const handleCreateObjectType = async () => {
    if (!name.trim() || !apiName.trim() || !defaultFieldApiName.trim()) {
      toast({
        title: "Fehler",
        description: "Name, API-Name und Bezeichnungsfeld sind erforderlich",
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
        default_field_api_name: defaultFieldApiName.trim(),
        is_system: false,
        is_active: false,
        show_in_navigation: false,
        is_published: false,
        is_template: false,
        source_object_id: null
      });

      setName("");
      setApiName("");
      setDescription("");
      setIcon("building");
      setDefaultFieldApiName("name");

      toast({
        title: "Erfolg",
        description: "Objekttyp wurde erfolgreich erstellt",
      });
    } catch (error) {
      console.error("Error creating object type:", error);
      toast({
        title: "Fehler",
        description: "Objekttyp konnte nicht erstellt werden",
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
          placeholder="Geben Sie den Objektnamen ein"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="api-name">API Name*</Label>
        <Input
          id="api-name"
          placeholder="Klicken Sie hier um den API-Namen zu generieren"
          value={apiName}
          onChange={(e) => setApiName(e.target.value)}
          onClick={generateApiName}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="icon">Icon</Label>
        <Select value={icon} onValueChange={setIcon}>
          <SelectTrigger id="icon">
            <SelectValue placeholder="Wählen Sie ein Icon" />
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
        <Label htmlFor="default-field">Bezeichnungsfeld*</Label>
        <Input
          id="default-field"
          placeholder="Name des Bezeichnungsfeldes"
          value={defaultFieldApiName}
          onChange={(e) => setDefaultFieldApiName(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Dieses Feld wird als Titel in der Detailansicht verwendet
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          placeholder="Geben Sie eine Beschreibung ein"
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
        Objekttyp erstellen
      </Button>
    </div>
  );
}
