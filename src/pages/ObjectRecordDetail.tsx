import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { useRecordFields } from "@/hooks/useRecordFields";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, ArrowLeft, Edit, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RelatedRecordsList } from "@/components/records/RelatedRecordsList";
import { LookupValueDisplay } from "@/components/records/LookupValueDisplay";

export default function ObjectRecordDetail() {
  const navigate = useNavigate();
  const { objectTypeId, recordId } = useParams<{ objectTypeId: string, recordId: string }>();
  const { objectTypes } = useObjectTypes();
  const { record, isLoading } = useRecordDetail(objectTypeId, recordId);
  const { fields } = useRecordFields(objectTypeId);
  const { updateRecord } = useObjectRecords(objectTypeId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  // Star functionality states
  const [starModeActive, setStarModeActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  
  const handleDelete = async () => {
    if (!recordId) return;
    try {
      // Direct API call to delete the record since we're not exposing this in the hook
      const { data, error } = await fetch(`/api/records/${recordId}`, {
        method: 'DELETE'
      }).then(res => res.json());
      
      if (error) throw new Error(error.message);
      
      toast.success("Record deleted successfully");
      navigate(`/objects/${objectTypeId}`);
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }
  };

  const toggleStarMode = () => {
    setStarModeActive(!starModeActive);
    if (starModeActive) {
      toast.info("Star mode deactivated");
    } else {
      toast.info("Star mode activated! Click on star next to a text field to analyze unique values.");
    }
  };

  const handleFieldStarClick = (fieldName: string, fieldApiName: string) => {
    if (!objectTypeId) return;
    
    setIsProcessing(true);
    
    try {
      // Navigate to the new page with field information
      navigate(`/objects/${objectTypeId}/create-object-from-field/${fieldApiName}/${encodeURIComponent(fieldName)}`);
    } catch (error) {
      console.error("Error navigating:", error);
      toast.error("Failed to analyze field values");
      setIsProcessing(false);
    }
  };

  if (isLoading || !objectType) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link to={`/objects/${objectTypeId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {objectType.name} List
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Record not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recordName = record.displayName || `${objectType.name} Record`;

  return (
    <div className="container mx-auto px-2 md:px-0 space-y-6 max-w-5xl">
      <PageHeader
        title={recordName}
        actions={
          <div className="flex items-center space-x-2">
            <Button 
              variant={starModeActive ? "secondary" : "outline"}
              onClick={toggleStarMode}
              title={starModeActive ? "Deactivate Star Mode" : "Activate Star Mode"}
            >
              <Star className={`mr-2 h-4 w-4 ${starModeActive ? "fill-yellow-400 text-yellow-500" : ""}`} />
              {starModeActive ? "Exit Star Mode" : "Star Mode"}
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/objects/${objectTypeId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/objects/${objectTypeId}/${recordId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button 
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="related">Related Records</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="pt-6 divide-y">
              {fields
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                .map((field) => {
                  const value = record.fieldValues[field.api_name];
                  const isTextField = field.data_type === "text" || field.data_type === "textarea";
                  
                  return (
                    <div key={field.id} className="py-3 grid grid-cols-3">
                      <div className="font-medium text-muted-foreground">
                        {field.name}
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        {field.data_type === "lookup" && field.options ? (
                          <LookupValueDisplay
                            value={value}
                            fieldOptions={{
                              target_object_type_id: (field.options as { target_object_type_id?: string })?.target_object_type_id || ''
                            }}
                          />
                        ) : field.data_type === "picklist" && value ? (
                          <span>{value}</span>
                        ) : (
                          <span>
                            {value !== null && value !== undefined ? String(value) : "—"}
                          </span>
                        )}
                        
                        {/* Star icon for text fields when star mode is active */}
                        {starModeActive && isTextField && value && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleFieldStarClick(field.name, field.api_name)}
                            disabled={isProcessing}
                          >
                            <Star className="h-4 w-4 text-yellow-500 hover:fill-yellow-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="related" className="mt-4">
          {objectTypeId && recordId && (
            <RelatedRecordsList 
              objectTypeId={objectTypeId} 
              recordId={recordId} 
            />
          )}
        </TabsContent>
      </Tabs>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title={`Delete ${objectType.name}`}
        description={`Are you sure you want to delete this ${objectType.name.toLowerCase()}? This action cannot be undone.`}
      />
    </div>
  );
}
