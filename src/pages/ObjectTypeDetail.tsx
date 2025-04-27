
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
import { toast } from "sonner";
import { usePicklistCreation } from "@/hooks/usePicklistCreation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PicklistValuesManager } from "@/components/settings/PicklistValuesManager";

export default function ObjectTypeDetail() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const { objectTypes, isLoading: isLoadingTypes, updateObjectType } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useObjectFields(objectTypeId);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [showPicklistDialog, setShowPicklistDialog] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  
  // Find account type field if we're on the account object
  useEffect(() => {
    if (objectType?.api_name === "account" && fields) {
      const typeField = fields.find(field => field.api_name === "type");
      if (typeField && typeField.data_type !== "picklist") {
        toast.warning("Account Type field is not a picklist. Consider converting it to use picklist values.");
      }
    }
  }, [objectType, fields]);

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
  
  const handleManagePicklistValues = (fieldId: string) => {
    setSelectedField(fieldId);
    setShowPicklistDialog(true);
  };
  
  // Find if there's a type field that's a picklist
  const accountTypeField = objectType?.api_name === "account" 
    ? fields?.find(f => f.api_name === "type" && f.data_type === "picklist")
    : null;

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
      
      {/* Add special buttons for account object type fields */}
      {objectType.api_name === "account" && (
        <div className="flex flex-wrap gap-2">
          {accountTypeField && (
            <Button 
              variant="outline" 
              onClick={() => handleManagePicklistValues(accountTypeField.id)}
            >
              Manage "Type" Picklist Values
            </Button>
          )}
        </div>
      )}
      
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
      
      {/* Dialog for managing picklist values */}
      <Dialog open={showPicklistDialog && !!selectedField} onOpenChange={(open) => {
        if (!open) setShowPicklistDialog(false);
      }}>
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
              onComplete={() => setShowPicklistDialog(false)}
            />
          )}
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowPicklistDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
