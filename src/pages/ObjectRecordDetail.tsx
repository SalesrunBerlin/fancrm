
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { useRecordFields } from "@/hooks/useRecordFields";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { toast } from "sonner";

export default function ObjectRecordDetail() {
  const navigate = useNavigate();
  const { objectTypeId, recordId } = useParams<{ objectTypeId: string, recordId: string }>();
  const { objectTypes } = useObjectTypes();
  const { record, isLoading } = useRecordDetail(objectTypeId, recordId);
  const { fields } = useRecordFields(objectTypeId);
  const { deleteRecord } = useObjectRecords(objectTypeId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  
  const handleDelete = async () => {
    if (!recordId) return;
    try {
      await deleteRecord.mutateAsync(recordId);
      toast.success("Record deleted successfully");
      navigate(`/objects/${objectTypeId}`);
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
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
    <div className="space-y-6">
      <PageHeader
        title={recordName}
        actions={
          <div className="flex items-center space-x-2">
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

      <Card>
        <CardContent className="pt-6 divide-y">
          {fields
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map((field) => {
              const value = record.fieldValues[field.api_name];
              return (
                <div key={field.id} className="py-3 grid grid-cols-3">
                  <div className="font-medium text-muted-foreground">
                    {field.name}
                  </div>
                  <div className="col-span-2">
                    {value !== null && value !== undefined ? String(value) : "—"}
                  </div>
                </div>
              );
            })}
        </CardContent>
      </Card>

      <DeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${objectType.name}`}
        description={`Are you sure you want to delete this ${objectType.name.toLowerCase()}? This action cannot be undone.`}
      />
    </div>
  );
}
