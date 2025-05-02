
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, ArrowLeft, Trash } from "lucide-react";
import { useObjectFieldEdit } from "@/hooks/useObjectFieldEdit";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { ObjectFieldEditFields } from "@/components/settings/ObjectFieldEditFields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { PicklistValuesManager } from "@/components/settings/PicklistValuesManager";
import { Separator } from "@/components/ui/separator";

export default function ObjectFieldEditPage() {
  const { objectTypeId, fieldId } = useParams<{
    objectTypeId: string;
    fieldId: string;
  }>();
  const navigate = useNavigate();
  const { field, isLoading, deleteField } = useObjectFieldEdit(fieldId || "");
  const { objectTypes } = useObjectTypes();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const objectType = objectTypes?.find((t) => t.id === objectTypeId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!field) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Field not found"
          description="The requested field could not be found"
        />
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The field you are looking for might have been deleted or does not
            exist.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    await deleteField.mutateAsync();
    navigate(`/settings/objects/${objectTypeId}`);
  };

  const isSystemField = field.is_system === true;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit Field: ${field.name}`}
        description={`Edit the field for ${objectType?.name || "Object Type"}`}
        actions={
          !isSystemField && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Field
            </Button>
          )
        }
        backTo={`/settings/objects/${objectTypeId}`}
      />

      <Card>
        <CardContent className="pt-6">
          <ObjectFieldEditFields field={field} />
        </CardContent>
      </Card>

      {field.data_type === "picklist" && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Picklist Values</h3>
          <Card>
            <CardContent className="pt-6">
              <PicklistValuesManager fieldId={field.id} />
            </CardContent>
          </Card>
        </div>
      )}

      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={`Delete Field: ${field.name}`}
        description="Are you sure you want to delete this field? This action cannot be undone and will remove this field from all records."
        onDelete={handleDelete}
      />
    </div>
  );
}
