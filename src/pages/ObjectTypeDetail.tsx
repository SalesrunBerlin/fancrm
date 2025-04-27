
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, User, Building, Briefcase, Calendar } from "lucide-react";
import { ObjectFieldsList } from "@/components/settings/ObjectFieldsList";
import { ObjectFieldForm } from "@/components/settings/ObjectFieldForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PicklistValuesManager } from "@/components/settings/PicklistValuesManager";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ObjectTypeDetail() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const { objectTypes, isLoading: isLoadingTypes, updateObjectType } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useObjectFields(objectTypeId);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [showPicklistDialog, setShowPicklistDialog] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [defaultFieldApiName, setDefaultFieldApiName] = useState<string>("name");

  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  
  const accountTypeField = objectType?.api_name === "account" 
    ? fields?.find(f => f.api_name === "type" && f.data_type === "picklist")
    : null;

  // Initialize default field value from object type
  useEffect(() => {
    if (objectType?.default_field_api_name) {
      setDefaultFieldApiName(objectType.default_field_api_name);
    } else {
      setDefaultFieldApiName("name"); // Default to "name" if not set
    }
  }, [objectType]);

  const getIconComponent = (iconName: string | null) => {
    switch(iconName) {
      case 'user': return <User className="h-5 w-5" />;
      case 'building': return <Building className="h-5 w-5" />;
      case 'briefcase': return <Briefcase className="h-5 w-5" />;
      case 'calendar': return <Calendar className="h-5 w-5" />;
      default: return <Building className="h-5 w-5" />;
    }
  };

  const handleActiveToggle = async (checked: boolean) => {
    if (!objectType) return;
    
    try {
      await updateObjectType.mutateAsync({
        id: objectType.id,
        is_active: checked
      });
      
      toast.success(checked ? "Object activated" : "Object deactivated");
    } catch (error) {
      console.error("Error updating object status:", error);
      toast.error("Failed to update object status");
    }
  };

  const handleDefaultFieldChange = async (value: string) => {
    if (!objectType) return;
    
    setDefaultFieldApiName(value);
    
    try {
      await updateObjectType.mutateAsync({
        id: objectType.id,
        default_field_api_name: value
      });
      
      toast.success("Default display field updated");
    } catch (error) {
      console.error("Error updating default field:", error);
      toast.error("Failed to update default field");
    }
  };
  
  const handleManagePicklistValues = (fieldId: string) => {
    setSelectedField(fieldId);
    setShowPicklistDialog(true);
  };

  if (isLoadingTypes) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!objectType) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link to="/settings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Object type not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link to="/settings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Settings
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {getIconComponent(objectType.icon)}
            {objectType.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="active-toggle"
            checked={objectType.is_active}
            onCheckedChange={handleActiveToggle}
            disabled={updateObjectType.isPending}
          />
          <Label htmlFor="active-toggle">Active</Label>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Object Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default-field">Default Display Field</Label>
              <Select value={defaultFieldApiName} onValueChange={handleDefaultFieldChange}>
                <SelectTrigger id="default-field">
                  <SelectValue placeholder="Select default display field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="record_id">Record ID</SelectItem>
                  {fields?.filter(f => !f.is_system && f.data_type === "text").map(field => (
                    <SelectItem key={field.api_name} value={field.api_name}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This field will be used as the title when viewing records
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Fields</CardTitle>
          <Button onClick={() => setShowFieldForm(!showFieldForm)}>
            {showFieldForm ? 'Cancel' : 'Add Field'}
          </Button>
        </CardHeader>
        <CardContent>
          {showFieldForm && (
            <div className="mb-6 border rounded-lg p-4 bg-background/50">
              <ObjectFieldForm 
                objectTypeId={objectTypeId!} 
                onComplete={() => setShowFieldForm(false)}
              />
            </div>
          )}
          <ObjectFieldsList 
            fields={fields || []} 
            isLoading={isLoadingFields} 
            objectTypeId={objectTypeId!} 
            onManagePicklistValues={handleManagePicklistValues}
          />
        </CardContent>
      </Card>
      
      <Dialog 
        open={showPicklistDialog && !!selectedField} 
        onOpenChange={(open) => {
          if (!open) {
            setShowPicklistDialog(false);
            setSelectedField(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Picklist Values</DialogTitle>
            <DialogDescription>
              {accountTypeField && selectedField === accountTypeField.id && 
                "Add or remove values for the Account Type field."}
            </DialogDescription>
          </DialogHeader>
          
          {selectedField && (
            <PicklistValuesManager 
              fieldId={selectedField} 
              initialValues={
                accountTypeField && selectedField === accountTypeField.id 
                  ? ["Kunde", "Potenzial"] 
                  : undefined
              }
              onComplete={() => {
                setShowPicklistDialog(false);
                setSelectedField(null);
              }}
            />
          )}
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => {
              setShowPicklistDialog(false);
              setSelectedField(null);
            }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
