
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Globe, Copy, Calendar as CalendarIcon, Trash2, LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePublicRecordShares } from "@/hooks/usePublicRecordShares";
import { ObjectField } from "@/types";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useObjectRelationships } from "@/hooks/useObjectRelationships";

interface PublicShareDialogProps {
  recordId: string;
  objectTypeId: string;
  recordName?: string;
}

export function PublicShareDialog({ recordId, objectTypeId, recordName }: PublicShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("new");
  const [shareName, setShareName] = useState("");
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined);
  const [allowEdit, setAllowEdit] = useState(false);
  const [selectedFields, setSelectedFields] = useState<{ [key: string]: boolean }>({});
  const [selectedRelatedObjects, setSelectedRelatedObjects] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeShareId, setActiveShareId] = useState<string | null>(null);

  const { fields } = useObjectFields(objectTypeId);
  const { relationships } = useObjectRelationships(objectTypeId);
  const { 
    shares, 
    isLoading, 
    createShare, 
    updateShare, 
    deleteShare, 
    getShareFields,
    getShareRelatedObjects,
    updateFieldVisibility,
    updateRelatedObjectsVisibility
  } = usePublicRecordShares(recordId);

  // Initialize selected fields when fields are loaded
  useEffect(() => {
    if (fields && fields.length > 0) {
      const initialSelection = fields.reduce((acc: { [key: string]: boolean }, field) => {
        // By default, select common fields like name, email, etc.
        const isCommonField = [
          "name", "email", "phone", "title", "description"
        ].some(common => field.api_name.toLowerCase().includes(common));
        
        acc[field.api_name] = isCommonField;
        return acc;
      }, {});
      setSelectedFields(initialSelection);
    }
  }, [fields]);

  // Initialize selected related objects when relationships are loaded
  useEffect(() => {
    if (relationships && relationships.length > 0) {
      const initialSelection = relationships.reduce((acc: { [key: string]: boolean }, rel) => {
        // By default, don't select any related objects
        acc[rel.id] = false;
        return acc;
      }, {});
      setSelectedRelatedObjects(initialSelection);
    }
  }, [relationships]);

  // Load fields and related objects when selecting an existing share
  const loadShareDetails = async (shareId: string) => {
    try {
      setActiveShareId(shareId);
      
      // Get the share details from the list
      const share = shares?.find(s => s.id === shareId);
      if (!share) return;
      
      setShareName(share.name || "");
      setExpirationDate(share.expires_at ? new Date(share.expires_at) : undefined);
      setAllowEdit(share.allow_edit);
      
      // Get fields visibility
      const fields = await getShareFields(shareId);
      const fieldsVisibility = fields.reduce((acc: { [key: string]: boolean }, field) => {
        acc[field.field_api_name] = field.is_visible;
        return acc;
      }, {});
      setSelectedFields(fieldsVisibility);
      
      // Get related objects visibility
      const relatedObjects = await getShareRelatedObjects(shareId);
      const relatedVisibility = relatedObjects.reduce((acc: { [key: string]: boolean }, obj) => {
        acc[obj.relationship_id] = obj.is_visible;
        return acc;
      }, {});
      setSelectedRelatedObjects(relatedVisibility);
    } catch (error) {
      console.error("Error loading share details:", error);
      toast.error("Failed to load share details");
    }
  };

  const handleToggleField = (fieldApiName: string) => {
    setSelectedFields(prev => ({
      ...prev,
      [fieldApiName]: !prev[fieldApiName]
    }));
  };

  const handleToggleRelatedObject = (relationshipId: string) => {
    setSelectedRelatedObjects(prev => ({
      ...prev,
      [relationshipId]: !prev[relationshipId]
    }));
  };

  const handleSelectAllFields = (value: boolean) => {
    const updatedFields = { ...selectedFields };
    Object.keys(updatedFields).forEach(key => {
      updatedFields[key] = value;
    });
    setSelectedFields(updatedFields);
  };

  const handleSelectAllRelatedObjects = (value: boolean) => {
    const updatedObjects = { ...selectedRelatedObjects };
    Object.keys(updatedObjects).forEach(key => {
      updatedObjects[key] = value;
    });
    setSelectedRelatedObjects(updatedObjects);
  };

  const handleCreateShare = async () => {
    try {
      setIsSubmitting(true);
      
      // Format fields for API
      const fieldsArray = Object.entries(selectedFields).map(([field_api_name, is_visible]) => ({
        field_api_name,
        is_visible
      }));
      
      // Format related objects for API
      const relatedObjectsArray = Object.entries(selectedRelatedObjects)
        .map(([relationship_id, is_visible]) => {
          const relationship = relationships?.find(r => r.id === relationship_id);
          if (!relationship) return null;
          
          return {
            relationship_id,
            related_object_type_id: relationship.to_object_id,
            is_visible
          };
        })
        .filter(Boolean) as { relationship_id: string; related_object_type_id: string; is_visible: boolean }[];
      
      // Create new share or update existing share
      if (activeShareId) {
        // Update share basic info
        await updateShare.mutateAsync({
          shareId: activeShareId,
          name: shareName || undefined,
          expiresAt: expirationDate,
          allowEdit: allowEdit
        });
        
        // Update fields visibility
        await updateFieldVisibility.mutateAsync({
          shareId: activeShareId,
          fields: fieldsArray
        });
        
        // Update related objects visibility
        await updateRelatedObjectsVisibility.mutateAsync({
          shareId: activeShareId,
          relatedObjects: relatedObjectsArray
        });
        
        toast.success("Public share updated successfully");
      } else {
        // Create new share with all settings
        await createShare.mutateAsync({
          recordId,
          objectTypeId,
          name: shareName || undefined,
          expiresAt: expirationDate,
          allowEdit,
          fields: fieldsArray,
          relatedObjects: relatedObjectsArray
        });
        
        toast.success("Public share created successfully");
        
        // Reset form after successful creation
        setShareName("");
        setExpirationDate(undefined);
        setAllowEdit(false);
      }
      
      // Switch to existing shares tab
      setActiveTab("existing");
    } catch (error) {
      console.error("Error creating/updating public share:", error);
      toast.error("Failed to save public share");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/public-record/${token}`;
    
    navigator.clipboard.writeText(url)
      .then(() => toast.success("Link copied to clipboard"))
      .catch(() => toast.error("Failed to copy link"));
  };

  const handleDeleteShare = async (shareId: string) => {
    if (!confirm("Are you sure you want to delete this public share? This action cannot be undone.")) {
      return;
    }
    
    try {
      await deleteShare.mutateAsync(shareId);
      
      // Reset active share if we just deleted it
      if (activeShareId === shareId) {
        setActiveShareId(null);
        setActiveTab("new");
      }
    } catch (error) {
      console.error("Error deleting public share:", error);
      toast.error("Failed to delete public share");
    }
  };

  const handleEditShare = (shareId: string) => {
    loadShareDetails(shareId);
    setActiveTab("new");
  };

  const handleDialogOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      // Reset state when dialog closes
      setShareName("");
      setExpirationDate(undefined);
      setAllowEdit(false);
      setActiveShareId(null);
      setActiveTab("new");
    }
  };

  const selectedFieldsCount = Object.values(selectedFields).filter(Boolean).length;
  const selectedRelatedCount = Object.values(selectedRelatedObjects).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Globe className="h-4 w-4 mr-2" />
          Public Sharing
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Public Record Sharing</DialogTitle>
          <DialogDescription>
            Create a public link to share this {recordName || "record"} without requiring authentication.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="new" className="flex items-center">
              {activeShareId ? "Edit Share" : "New Share"}
              {activeShareId && <Badge variant="outline" className="ml-2">Editing</Badge>}
            </TabsTrigger>
            <TabsTrigger value="existing">
              Existing Shares
              {shares && shares.length > 0 && <Badge className="ml-2">{shares.length}</Badge>}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="new" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shareName">Share Name (Optional)</Label>
                <Input
                  id="shareName"
                  placeholder="E.g. Client View"
                  value={shareName}
                  onChange={(e) => setShareName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expiration Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expirationDate ? format(expirationDate, "PPP") : <span>No expiration</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={expirationDate}
                        onSelect={setExpirationDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Allow Editing</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      checked={allowEdit}
                      onCheckedChange={setAllowEdit}
                      id="allow-edit"
                    />
                    <Label htmlFor="allow-edit" className="cursor-pointer">
                      {allowEdit ? "Editable" : "Read-only"}
                    </Label>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    <span>Visible Fields</span>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAllFields(true)}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAllFields(false)}
                      >
                        Clear All
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Select which fields to include in the public view ({selectedFieldsCount}/{fields?.length || 0} selected)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {fields?.map((field) => (
                      <div key={field.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`field-${field.api_name}`}
                          checked={selectedFields[field.api_name] || false}
                          onCheckedChange={() => handleToggleField(field.api_name)}
                        />
                        <Label
                          htmlFor={`field-${field.api_name}`}
                          className="cursor-pointer"
                        >
                          {field.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    <span>Related Objects</span>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAllRelatedObjects(true)}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAllRelatedObjects(false)}
                      >
                        Clear All
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Select which related objects to include in the public view ({selectedRelatedCount}/{relationships?.length || 0} selected)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {relationships?.map((relationship) => (
                      <div key={relationship.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`rel-${relationship.id}`}
                          checked={selectedRelatedObjects[relationship.id] || false}
                          onCheckedChange={() => handleToggleRelatedObject(relationship.id)}
                        />
                        <Label
                          htmlFor={`rel-${relationship.id}`}
                          className="cursor-pointer"
                        >
                          {relationship.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreateShare}
                disabled={isSubmitting || selectedFieldsCount === 0}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {activeShareId ? "Update Share" : "Create Share"}
              </Button>
            </DialogFooter>
          </TabsContent>
          
          <TabsContent value="existing">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : shares && shares.length > 0 ? (
              <div className="space-y-3">
                {shares.map((share) => (
                  <Card key={share.id}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2" />
                          {share.name || "Unnamed share"}
                        </div>
                        <Badge variant={share.is_active ? "default" : "outline"}>
                          {share.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Created: {new Date(share.created_at).toLocaleString()}
                        {share.expires_at && (
                          <> · Expires: {new Date(share.expires_at).toLocaleString()}</>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between">
                      <div>
                        <Badge variant={share.allow_edit ? "outline" : "secondary"} className="mr-2">
                          {share.allow_edit ? "Editable" : "Read-only"}
                        </Badge>
                      </div>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditShare(share.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(share.token)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteShare(share.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No public shares have been created yet.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
