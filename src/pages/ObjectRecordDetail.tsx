
import { useParams, useNavigate, Link } from "react-router-dom";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { RecordDetailForm } from "@/components/records/RecordDetailForm";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { RelatedRecordsSection } from "@/components/records/RelatedRecordsSection";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { RecordDeleteDialog } from "@/components/records/RecordDeleteDialog";
import { useState } from "react";
import { ShareButton } from "@/components/sharing/ShareButton";
import { SharedRecordsBadge } from "@/components/sharing/SharedRecordsBadge";
import { useAuth } from "@/contexts/AuthContext";

export default function ObjectRecordDetail() {
  const { objectTypeId, recordId } = useParams<{ objectTypeId: string; recordId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { record, isLoading } = useRecordDetail(objectTypeId, recordId);
  const { objectTypes } = useObjectTypes();
  const { fields, isLoading: fieldsLoading } = useObjectFields(objectTypeId);
  const { deleteRecord } = useObjectRecords(objectTypeId);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  
  const handleDeleteRecord = async () => {
    if (recordId) {
      try {
        await deleteRecord.mutateAsync(recordId);
        navigate(`/objects/${objectTypeId}`);
      } catch (error) {
        console.error("Error deleting record:", error);
      }
    }
  };

  // Check if the current user is the owner of the record
  const isOwner = record && user && record.owner_id === user.id;

  if (isLoading || fieldsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!record || !fields || !objectType) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Record Not Found</h2>
        <p className="mb-4">The record you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button asChild>
          <Link to={`/objects/${objectTypeId}`}>Back to Records</Link>
        </Button>
      </div>
    );
  }

  const displayName = record.displayName || recordId || "Record";

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link to={`/objects/${objectTypeId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to {objectType.name} Records
          </Link>
        </Button>
        
        <div className="flex flex-wrap items-center gap-2">
          {isOwner && (
            <>
              <ShareButton recordId={recordId!} objectTypeId={objectTypeId!} />
              <SharedRecordsBadge recordId={recordId!} />
            </>
          )}
          <Button asChild variant="outline">
            <Link to={`/objects/${objectTypeId}/${recordId}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold">{displayName}</h1>
        <p className="text-muted-foreground mt-2">
          Created {record.created_at && format(new Date(record.created_at), "PPP 'at' p")}
          {record.updated_at && record.updated_at !== record.created_at && (
            <> · Updated {format(new Date(record.updated_at), "PPP 'at' p")}</>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecordDetailForm record={record} fields={fields} objectTypeId={objectTypeId!} />
        </div>
        
        <div className="space-y-6">
          <RelatedRecordsSection objectTypeId={objectTypeId!} recordId={recordId!} />
        </div>
      </div>

      <RecordDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteRecord}
        displayName={displayName}
        objectTypeName={objectType.name}
      />
    </div>
  );
}
