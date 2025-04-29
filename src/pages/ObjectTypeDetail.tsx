
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, User, Building, Briefcase, Calendar, Box } from "lucide-react";
import { ObjectFieldsList } from "@/components/settings/ObjectFieldsList";
import { ObjectFieldForm } from "@/components/settings/ObjectFieldForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { PicklistValuesManager } from "@/components/settings/PicklistValuesManager";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ObjectTypeDetail() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const { objectTypes, isLoading: isLoadingTypes, updateObjectType, publishObjectType, unpublishObjectType } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useObjectFields(objectTypeId);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [showPicklistDialog, setShowPicklistDialog] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [defaultFieldApiName, setDefaultFieldApiName] = useState<string>("name");
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);

  const objectType = objectTypes?.find(type => type.id === objectTypeId);

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
      default: return <Box className="h-5 w-5" />;
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

  const handlePublish = async () => {
    if (!objectType) return;
    
    try {
      await publishObjectType.mutateAsync(objectType.id);
      setShowPublishDialog(false);
    } catch (error) {
      console.error("Error publishing object:", error);
    }
  };

  const handleUnpublish = async () => {
    if (!objectType) return;
    
    try {
      await unpublishObjectType.mutateAsync(objectType.id);
      setShowUnpublishDialog(false);
    } catch (error) {
      console.error("Error unpublishing object:", error);
    }
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
          <Link to="/settings/object-manager">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Object Manager
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

  const headerActions = (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 mr-4">
        <Switch
          id="active-toggle"
          checked={objectType.is_active}
          onCheckedChange={handleActiveToggle}
          disabled={updateObjectType.isPending}
        />
        <Label htmlFor="active-toggle">Active</Label>
      </div>
      {objectType.is_published ? (
        <Button 
          variant="outline" 
          onClick={() => setShowUnpublishDialog(true)}
        >
          Unpublish
        </Button>
      ) : (
        <Button 
          variant="outline" 
          onClick={() => setShowPublishDialog(true)}
        >
          Publish
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title={
          <div className="flex items-center gap-2">
            {getIconComponent(objectType.icon)}
            <span>{objectType.name}</span>
            {objectType.is_template && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                Imported Template
              </span>
            )}
          </div>
        }
        description={objectType.description || `API Name: ${objectType.api_name}`}
        actions={headerActions}
      >
        <Button variant="outline" asChild size="sm" className="mt-2">
          <Link to="/settings/object-manager">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Object Manager
          </Link>
        </Button>
      </PageHeader>
      
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
            {objectType.is_template && objectType.source_object_id && (
              <div>
                <p className="text-sm font-medium">Source Information</p>
                <p className="text-xs text-muted-foreground">
                  This object was imported from another user's published template.
                </p>
              </div>
            )}
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
      
      {/* Picklist Values Dialog */}
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
          </DialogHeader>
          
          {selectedField && (
            <PicklistValuesManager 
              fieldId={selectedField} 
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

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Object Structure</DialogTitle>
            <DialogDescription>
              Publishing this object structure will make it available for other users to import into their account.
              All fields and picklist values will be included.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>Cancel</Button>
            <Button onClick={handlePublish} disabled={publishObjectType.isPending}>
              {publishObjectType.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unpublish Dialog */}
      <Dialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unpublish Object Structure</DialogTitle>
            <DialogDescription>
              Unpublishing this object structure will make it no longer available for other users to import.
              Users who have already imported it will keep their copy.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnpublishDialog(false)}>Cancel</Button>
            <Button onClick={handleUnpublish} disabled={unpublishObjectType.isPending}>
              {unpublishObjectType.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Unpublish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
